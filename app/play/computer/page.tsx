'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from '@/components/chess/Chessboard';
import { PlayerCard } from '@/components/chess/PlayerCard';
import { GameOverModal } from '@/components/chess/GameOverModal';
import { ChessGame } from '@/lib/chess/chess-rules';
import { StockfishEngine } from '@/lib/chess/stockfish-engine';
import { soundManager } from '@/lib/chess/audio';
import {
  Square,
  MoveAttempt,
  PieceColor,
  EngineDifficulty,
  GameResult,
  TerminationReason,
  TIME_CONTROLS,
  BOARD_THEMES,
} from '@/lib/chess/types';
import {
  RotateCcw,
  Undo2,
  Flag,
  Rotate3d,
  Loader2,
  Bot,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

export default function PlayComputerPage() {
  const [game, setGame] = useState(() => new ChessGame());
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [difficulty, setDifficulty] = useState<EngineDifficulty>('medium');
  const [timeControlKey, setTimeControlKey] = useState<string>('5+0');
  const [theme, setTheme] = useState(BOARD_THEMES[0]);
  const [isMuted, setIsMuted] = useState(false);

  // Game active states
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [lastMoveBadge, setLastMoveBadge] = useState<{
    square: Square;
    label?: string;
    type?: 'brilliant' | 'great' | 'best' | 'blunder' | 'mistake' | 'book';
  } | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [previewMoveIndex, setPreviewMoveIndex] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState<{
    isOpen: boolean;
    result: GameResult;
    reason: TerminationReason;
  }>({
    isOpen: false,
    result: '*',
    reason: 'active',
  });

  // Clocks in milliseconds
  const [whiteTime, setWhiteTime] = useState(300000);
  const [blackTime, setBlackTime] = useState(300000);
  const [orientation, setOrientation] = useState<PieceColor>('w');

  // References
  const engineRef = useRef<StockfishEngine | null>(null);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAiTurnActiveRef = useRef(false);

  // Initialize engine lazily
  useEffect(() => {
    setIsMuted(soundManager.getMuted());
    const engine = new StockfishEngine();
    engineRef.current = engine;
    engine.init();

    return () => {
      engine.terminate();
    };
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  // Clock countdown timer
  useEffect(() => {
    const tc = TIME_CONTROLS[timeControlKey];
    if (tc.baseSeconds === 0 || !isGameStarted || gameOver.isOpen) {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      return;
    }

    clockIntervalRef.current = setInterval(() => {
      const turn = game.turn;
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 100) {
            handleTimeout('w');
            return 0;
          }
          return prev - 100;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 100) {
            handleTimeout('b');
            return 0;
          }
          return prev - 100;
        });
      }
    }, 100);

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, [game.turn, isGameStarted, gameOver.isOpen, timeControlKey]);

  const handleTimeout = (timedOutColor: PieceColor) => {
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    soundManager.playTimeout();
    const result = timedOutColor === 'w' ? '0-1' : '1-0';
    setGameOver({
      isOpen: true,
      result,
      reason: 'timeout',
    });
  };

  const checkGameEnd = (status = game.getStatus()) => {
    if (status.isOver) {
      if (status.reason === 'checkmate') {
        soundManager.playCheckmate();
        // Give 1.5s for the dramatic on-board checkmate animation, toppled king & shockwave
        setTimeout(() => {
          setGameOver({
            isOpen: true,
            result: status.result,
            reason: status.reason,
          });
        }, 1500);
      } else {
        setGameOver({
          isOpen: true,
          result: status.result,
          reason: status.reason,
        });
      }
      return true;
    }
    return false;
  };

  // Trigger AI move
  const triggerAiMove = useCallback(
    async (currentGame: ChessGame) => {
      if (currentGame.getStatus().isOver || isAiTurnActiveRef.current) return;
      isAiTurnActiveRef.current = true;
      setIsAiThinking(true);

      const aiMove = await engineRef.current?.getBestMove(currentGame.fen, difficulty);
      setIsAiThinking(false);
      isAiTurnActiveRef.current = false;

      if (!aiMove || currentGame.getStatus().isOver) return;

      const res = currentGame.makeMove(aiMove);
      if (res.success && res.move) {
        if (res.move.captured) soundManager.playCapture();
        else if (currentGame.inCheck()) soundManager.playCheck();
        else soundManager.playMove();

        // Increment clock
        const tc = TIME_CONTROLS[timeControlKey];
        if (tc.incrementSeconds > 0) {
          const aiColor = playerColor === 'w' ? 'b' : 'w';
          if (aiColor === 'w') setWhiteTime((t) => t + tc.incrementSeconds * 1000);
          else setBlackTime((t) => t + tc.incrementSeconds * 1000);
        }

        setLastMove({ from: res.move.from, to: res.move.to });
        if (currentGame.isCheckmate() || res.move.san.includes('#')) {
          setLastMoveBadge({ square: res.move.to, label: '!!', type: 'brilliant' });
        } else if (currentGame.inCheck()) {
          setLastMoveBadge({ square: res.move.to, label: '!', type: 'great' });
        } else {
          setLastMoveBadge(null);
        }
        setCurrentMoveIndex(currentGame.getHistory().length - 1);
        setGame(new ChessGame(currentGame.fen));
        checkGameEnd(currentGame.getStatus());
      }
    },
    [difficulty, playerColor, timeControlKey]
  );

  const startNewGame = (
    chosenColor: PieceColor | 'random' = playerColor,
    chosenDiff: EngineDifficulty = difficulty,
    chosenTcKey: string = timeControlKey
  ) => {
    const assignedColor: PieceColor =
      chosenColor === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : chosenColor;

    const newG = new ChessGame();
    setGame(newG);
    setPlayerColor(assignedColor);
    setOrientation(assignedColor);
    setDifficulty(chosenDiff);
    setTimeControlKey(chosenTcKey);
    setLastMove(null);
    setLastMoveBadge(null);
    setCurrentMoveIndex(-1);
    setIsAiThinking(false);
    isAiTurnActiveRef.current = false;

    const tc = TIME_CONTROLS[chosenTcKey];
    const ms = tc.baseSeconds * 1000;
    setWhiteTime(ms);
    setBlackTime(ms);

    setGameOver({ isOpen: false, result: '*', reason: 'active' });
    setPreviewMoveIndex(null);
    setIsGameStarted(true);
    soundManager.playGameStart();

    // If player is Black, Computer makes first move as White
    if (assignedColor === 'b') {
      setTimeout(() => {
        triggerAiMove(newG);
      }, 400);
    }
  };

  const handlePlayerMove = (move: MoveAttempt) => {
    if (isAiThinking || gameOver.isOpen) return;

    // Verify it's player's turn
    if (game.turn !== playerColor) return;

    const res = game.makeMove(move);
    if (!res.success || !res.move) return;

    setPreviewMoveIndex(null);

    if (res.move.captured) soundManager.playCapture();
    else if (game.inCheck()) soundManager.playCheck();
    else soundManager.playMove();

    // Add increment to player
    const tc = TIME_CONTROLS[timeControlKey];
    if (tc.incrementSeconds > 0) {
      if (playerColor === 'w') setWhiteTime((t) => t + tc.incrementSeconds * 1000);
      else setBlackTime((t) => t + tc.incrementSeconds * 1000);
    }

    setLastMove({ from: res.move.from, to: res.move.to });
    const updatedGame = new ChessGame(game.fen);
    if (updatedGame.isCheckmate() || res.move.san.includes('#')) {
      setLastMoveBadge({ square: res.move.to, label: '!!', type: 'brilliant' });
    } else if (res.move.captured === 'q' || (res.move.captured && ['r', 'b', 'n'].includes(res.move.captured) && res.move.piece === 'p')) {
      setLastMoveBadge({ square: res.move.to, label: '!!', type: 'brilliant' });
    } else if (res.move.san.includes('+')) {
      setLastMoveBadge({ square: res.move.to, label: '!', type: 'great' });
    } else {
      setLastMoveBadge(null);
    }
    setCurrentMoveIndex(game.getHistory().length - 1);
    setGame(updatedGame);

    const isEnded = checkGameEnd(updatedGame.getStatus());
    if (!isEnded) {
      setTimeout(() => {
        triggerAiMove(updatedGame);
      }, 300);
    }
  };

  const handleUndo = () => {
    if (isAiThinking || game.getHistory().length === 0) return;
    engineRef.current?.stop();

    // Undo 2 plies (computer's move + human's move) or 1 ply if it was human's first move
    game.undo();
    if (game.turn !== playerColor) {
      game.undo();
    }

    const history = game.getHistory();
    const latestMove = history[history.length - 1];
    setLastMove(latestMove ? { from: latestMove.from, to: latestMove.to } : null);
    setLastMoveBadge(null);
    setCurrentMoveIndex(history.length - 1);
    setGame(new ChessGame(game.fen));
  };

  const handleResign = () => {
    if (gameOver.isOpen) return;
    const confirmResign = window.confirm('Are you sure you want to resign?');
    if (!confirmResign) return;

    const result = playerColor === 'w' ? '0-1' : '1-0';
    setGameOver({
      isOpen: true,
      result,
      reason: 'resignation',
    });
  };

  const handleFlipBoard = () => {
    setOrientation((o) => (o === 'w' ? 'b' : 'w'));
  };

  const handleSelectHistoryMove = (idx: number) => {
    const hist = game.getHistory();
    if (idx === hist.length - 1 || idx >= hist.length) {
      setPreviewMoveIndex(null);
    } else {
      setPreviewMoveIndex(idx);
    }
  };

  const captured = game.getCapturedPieces();
  const material = game.getMaterialCount();

  const whitePlayerCaptured = playerColor === 'w' ? captured.blackCaptured : captured.whiteCaptured;
  const blackPlayerCaptured = playerColor === 'w' ? captured.whiteCaptured : captured.blackCaptured;

  const history = game.getHistory();
  const isPreviewing = previewMoveIndex !== null && previewMoveIndex < history.length - 1;
  const displayGame = isPreviewing
    ? (previewMoveIndex === -1 ? new ChessGame() : new ChessGame(history[previewMoveIndex]?.after || game.fen))
    : game;
  const displayLastMove = isPreviewing
    ? (previewMoveIndex >= 0 && history[previewMoveIndex] ? { from: history[previewMoveIndex].from, to: history[previewMoveIndex].to } : null)
    : lastMove;

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-4 md:py-6 w-full">
      {/* Setup screen if game not started */}
      {!isGameStarted ? (
        <div className="max-w-lg mx-auto py-8 sm:py-12">
          <div className="bg-[#FFFFFF] dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-[#F1F0EB] dark:bg-[#252C27] text-[#557F39] dark:text-[#81B64C]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1C201D] dark:text-[#F4F3EA]">Play Stockfish AI</h1>
                <p className="text-xs text-[#626B64] dark:text-[#A5ADA5]">Calibrated engine running directly in your browser</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Play As */}
              <div>
                <label className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider block mb-1.5">
                  Play As
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPlayerColor('w')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      playerColor === 'w'
                        ? 'bg-[#EFEFEA] dark:bg-[#252C27] border-[#557F39] dark:border-[#81B64C] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-2xs'
                        : 'bg-[#F7F6F2] dark:bg-[#111412] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#E8E4D8] border border-[#D6D3D1]" />
                    <span>White</span>
                  </button>
                  <button
                    onClick={() => setPlayerColor('b')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      playerColor === 'b'
                        ? 'bg-[#EFEFEA] dark:bg-[#252C27] border-[#557F39] dark:border-[#81B64C] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-2xs'
                        : 'bg-[#F7F6F2] dark:bg-[#111412] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#20251F] border border-gray-600" />
                    <span>Black</span>
                  </button>
                  <button
                    onClick={() => setPlayerColor(Math.random() > 0.5 ? 'w' : 'b')}
                    className="py-2.5 px-3 rounded-xl border border-[#E2E2D9] dark:border-[#303831] bg-[#F7F6F2] dark:bg-[#111412] text-xs font-semibold text-[#626B64] dark:text-[#A5ADA5] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#557F39] dark:text-[#81B64C]" />
                    <span>Random</span>
                  </button>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider block mb-1.5">
                  Engine Difficulty
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['beginner', 'easy', 'medium', 'hard', 'expert'] as EngineDifficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-2 px-1 rounded-xl border text-[11px] font-semibold capitalize transition-all ${
                        difficulty === d
                          ? 'bg-[#557F39] dark:bg-[#81B64C] text-white dark:text-[#101311] border-[#557F39] dark:border-[#81B64C] font-bold shadow-2xs'
                          : 'bg-[#F7F6F2] dark:bg-[#252C27] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Control */}
              <div>
                <label className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider block mb-1.5">
                  Time Control
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {Object.entries(TIME_CONTROLS).map(([key, tc]) => (
                    <button
                      key={key}
                      onClick={() => setTimeControlKey(key)}
                      className={`py-1.5 px-1 rounded-xl border text-[11px] font-semibold transition-all ${
                        timeControlKey === key
                          ? 'bg-[#557F39] dark:bg-[#81B64C] text-white dark:text-[#101311] border-[#557F39] dark:border-[#81B64C] font-bold shadow-2xs'
                          : 'bg-[#F7F6F2] dark:bg-[#252C27] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
                      }`}
                    >
                      {tc.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => startNewGame(playerColor, difficulty, timeControlKey)}
                className="chess-btn-green w-full mt-4 py-4 px-6 text-base font-extrabold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Start Game vs Stockfish</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Active Game Arena - Mobile First Focus (matching screenshot shape) */
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto w-full px-1 animate-in fade-in duration-150">
          <div className="w-full space-y-1.5 sm:space-y-2">
            {/* Opponent Card (Top) - Exactly like user's screenshot */}
            <PlayerCard
              name={`Stockfish (${difficulty})`}
              color={playerColor === 'w' ? 'b' : 'w'}
              isAi={true}
              timeRemainingMs={playerColor === 'w' ? blackTime : whiteTime}
              showTimer={timeControlKey !== 'unlimited'}
              isActiveTurn={game.turn !== playerColor}
              capturedPieces={playerColor === 'w' ? captured.whiteCaptured : captured.blackCaptured}
              materialAdvantage={
                playerColor === 'w' ? Math.max(0, -material.advantage) : Math.max(0, material.advantage)
              }
            />

            {/* Board Container */}
            <div className="relative w-full aspect-square">
              <Chessboard
                game={game}
                orientation={orientation}
                theme={theme}
                interactive={!gameOver.isOpen && game.turn === playerColor && !isAiThinking}
                playerColor={playerColor}
                lastMove={lastMove}
                moveBadge={lastMoveBadge}
                onMove={handlePlayerMove}
                showCoordinates={false}
              />

              {isAiThinking && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/85 border border-[#81B64C]/70 px-3 py-1 rounded-full text-xs font-black text-[#81B64C] shadow-lg animate-pulse backdrop-blur-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Player Card (Bottom) - Exactly like user's screenshot */}
            <PlayerCard
              name="You"
              color={playerColor}
              isAi={false}
              timeRemainingMs={playerColor === 'w' ? whiteTime : blackTime}
              showTimer={timeControlKey !== 'unlimited'}
              isActiveTurn={game.turn === playerColor}
              capturedPieces={playerColor === 'w' ? captured.blackCaptured : captured.whiteCaptured}
              materialAdvantage={
                playerColor === 'w' ? Math.max(0, material.advantage) : Math.max(0, -material.advantage)
              }
            />

            {/* Action Bar (Replaces Move List with clean horizontal strip) */}
            <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-white/5 dark:bg-[#1E1D1A] rounded-2xl border border-[#E2E2D9] dark:border-[#272522] shadow-xs">
              <button
                onClick={handleUndo}
                title="Undo last move"
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-black/10 dark:hover:bg-[#312E2B] text-[11px] font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Undo2 className="w-4 h-4 text-[#7A857D] dark:text-[#8E9790]" />
                <span>Undo</span>
              </button>

              <button
                onClick={handleFlipBoard}
                title="Flip board orientation"
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-black/10 dark:hover:bg-[#312E2B] text-[11px] font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Rotate3d className="w-4 h-4 text-[#7A857D] dark:text-[#8E9790]" />
                <span>Flip</span>
              </button>

              <button
                onClick={toggleSound}
                title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-black/10 dark:hover:bg-[#312E2B] text-[11px] font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-amber-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#81B64C]" />
                )}
                <span>Sound</span>
              </button>

              <button
                onClick={() => startNewGame()}
                title="Restart game"
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-black/10 dark:hover:bg-[#312E2B] text-[11px] font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-[#7A857D] dark:text-[#8E9790]" />
                <span>Restart</span>
              </button>

              <button
                onClick={handleResign}
                disabled={gameOver.isOpen}
                title="Resign game"
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-red-500/10 text-[11px] font-bold text-red-500 disabled:opacity-30 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Flag className="w-4 h-4 text-red-500" />
                <span>Resign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOver.isOpen}
        result={gameOver.result}
        reason={gameOver.reason}
        userColor={playerColor}
        onRematch={() => startNewGame(playerColor, difficulty, timeControlKey)}
        onNewGame={() => setIsGameStarted(false)}
        pgn={game.pgn}
      />
    </div>
  );
}


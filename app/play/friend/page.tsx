'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from '@/components/chess/Chessboard';
import { PlayerCard } from '@/components/chess/PlayerCard';
import { GameOverModal } from '@/components/chess/GameOverModal';
import { ChessGame } from '@/lib/chess/chess-rules';
import { soundManager } from '@/lib/chess/audio';
import {
  Square,
  MoveAttempt,
  PieceColor,
  GameResult,
  TerminationReason,
  TIME_CONTROLS,
  BOARD_THEMES,
} from '@/lib/chess/types';
import {
  Users,
  RotateCcw,
  Rotate3d,
  Flag,
  Handshake,
  Volume2,
  VolumeX,
  ArrowRight,
  Settings,
} from 'lucide-react';

export default function PlayFriendDirectPage() {
  // Setup configuration state
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [colorChoice, setColorChoice] = useState<'p1_white' | 'p1_black' | 'random'>('p1_white');
  const [timeControlKey, setTimeControlKey] = useState<string>('5+0');
  const [autoFlip, setAutoFlip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Active game arena state
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [game, setGame] = useState(() => new ChessGame());
  const [orientation, setOrientation] = useState<PieceColor>('w');
  const [theme] = useState(BOARD_THEMES[0]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [lastMoveBadge, setLastMoveBadge] = useState<{
    square: Square;
    label?: string;
    type?: 'brilliant' | 'great' | 'best' | 'blunder' | 'mistake' | 'book';
  } | null>(null);
  const [previewMoveIndex, setPreviewMoveIndex] = useState<number | null>(null);

  // Resolved player roles
  const [whitePlayer, setWhitePlayer] = useState('Player 1');
  const [blackPlayer, setBlackPlayer] = useState('Player 2');

  // Clocks in milliseconds
  const [whiteTime, setWhiteTime] = useState(300000);
  const [blackTime, setBlackTime] = useState(300000);

  // Game over state
  const [gameOver, setGameOver] = useState<{
    isOpen: boolean;
    result: GameResult;
    reason: TerminationReason;
  }>({
    isOpen: false,
    result: '*',
    reason: 'active',
  });

  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMuted(soundManager.getMuted());
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  // Clock countdown timer
  useEffect(() => {
    const tc = TIME_CONTROLS[timeControlKey];
    if (!isGameStarted || tc?.baseSeconds === 0 || gameOver.isOpen) {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      return;
    }

    clockIntervalRef.current = setInterval(() => {
      if (game.turn === 'w') {
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
    setGameOver({
      isOpen: true,
      result: timedOutColor === 'w' ? '0-1' : '1-0',
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

  const startNewMatch = (
    p1 = player1Name.trim() || 'Player 1',
    p2 = player2Name.trim() || 'Player 2',
    colorPref = colorChoice,
    tcKey = timeControlKey
  ) => {
    let p1Color: PieceColor = 'w';
    if (colorPref === 'p1_black') p1Color = 'b';
    else if (colorPref === 'random') p1Color = Math.random() > 0.5 ? 'w' : 'b';

    const wName = p1Color === 'w' ? p1 : p2;
    const bName = p1Color === 'w' ? p2 : p1;

    setWhitePlayer(wName);
    setBlackPlayer(bName);

    const newG = new ChessGame();
    setGame(newG);
    setOrientation(p1Color === 'w' ? 'w' : 'b');
    setLastMove(null);
    setLastMoveBadge(null);
    setPreviewMoveIndex(null);

    const tc = TIME_CONTROLS[tcKey];
    const ms = (tc?.baseSeconds || 300) * 1000;
    setWhiteTime(ms);
    setBlackTime(ms);

    setGameOver({ isOpen: false, result: '*', reason: 'active' });
    setIsGameStarted(true);
    soundManager.playGameStart();
  };

  const handleMove = (move: MoveAttempt) => {
    if (gameOver.isOpen) return;

    const res = game.makeMove(move);
    if (!res.success || !res.move) return;

    setPreviewMoveIndex(null);

    if (res.move.captured) soundManager.playCapture();
    else if (game.inCheck()) soundManager.playCheck();
    else soundManager.playMove();

    // Time increment
    const tc = TIME_CONTROLS[timeControlKey];
    if (tc?.incrementSeconds > 0) {
      const incMs = tc.incrementSeconds * 1000;
      if (game.turn === 'b') {
        // White just moved
        setWhiteTime((t) => t + incMs);
      } else {
        // Black just moved
        setBlackTime((t) => t + incMs);
      }
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
    setGame(updatedGame);

    // Auto-flip orientation for Pass & Play if toggled
    if (autoFlip) {
      setOrientation((prev) => (prev === 'w' ? 'b' : 'w'));
    }

    checkGameEnd(updatedGame.getStatus());
  };

  const handleSelectHistoryMove = (idx: number) => {
    const hist = game.getHistory();
    if (idx === hist.length - 1 || idx >= hist.length) {
      setPreviewMoveIndex(null);
    } else {
      setPreviewMoveIndex(idx);
    }
  };

  const handleFlipBoard = () => {
    setOrientation((o) => (o === 'w' ? 'b' : 'w'));
  };

  const handleOfferDraw = () => {
    if (gameOver.isOpen) return;
    const currentName = game.turn === 'w' ? whitePlayer : blackPlayer;
    const opponentName = game.turn === 'w' ? blackPlayer : whitePlayer;
    const accept = window.confirm(`${currentName} offers a draw. Does ${opponentName} accept?`);
    if (accept) {
      setGameOver({
        isOpen: true,
        result: '1/2-1/2',
        reason: 'agreement',
      });
    }
  };

  const handleResign = () => {
    if (gameOver.isOpen) return;
    const currentName = game.turn === 'w' ? whitePlayer : blackPlayer;
    const confirmResign = window.confirm(`Is ${currentName} sure they want to resign?`);
    if (!confirmResign) return;

    const result = game.turn === 'w' ? '0-1' : '1-0';
    setGameOver({
      isOpen: true,
      result,
      reason: 'resignation',
    });
  };

  const handleRematch = () => {
    // Alternate colors on rematch!
    const nextChoice = colorChoice === 'p1_white' ? 'p1_black' : 'p1_white';
    setColorChoice(nextChoice);
    startNewMatch(player1Name, player2Name, nextChoice, timeControlKey);
  };

  const captured = game.getCapturedPieces();
  const material = game.getMaterialCount();

  const history = game.getHistory();
  const isPreviewing = previewMoveIndex !== null && previewMoveIndex < history.length - 1;
  const displayGame = isPreviewing
    ? previewMoveIndex === -1
      ? new ChessGame()
      : new ChessGame(history[previewMoveIndex]?.after || game.fen)
    : game;
  const displayLastMove = isPreviewing
    ? previewMoveIndex >= 0 && history[previewMoveIndex]
      ? { from: history[previewMoveIndex].from, to: history[previewMoveIndex].to }
      : null
    : lastMove;

  // Winner name for modal
  const winnerName =
    gameOver.result === '1-0' ? whitePlayer : gameOver.result === '0-1' ? blackPlayer : undefined;

  return (
    <div className="flex-1 max-w-6xl mx-auto px-0 sm:px-4 py-0 sm:py-4 md:py-8 w-full flex flex-col justify-center">
      {!isGameStarted ? (
        /* ==================== CLEAN MATCH SETUP VIEW ==================== */
        <div className="max-w-xl mx-auto w-full py-4 sm:py-8 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#E2E2D9] dark:border-[#303831]">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#81B64C]/20 to-[#557F39]/20 text-[#557F39] dark:text-[#81B64C] border border-[#557F39]/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#1C201D] dark:text-[#F4F3EA] tracking-tight">
                  Play with a Friend
                </h1>
                <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] mt-0.5">
                  Direct 2-Player match on one board. Enter names and start playing instantly.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Player Names Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400 inline-block shadow-2xs" />
                    <span>Player 1 Name</span>
                  </label>
                  <input
                    type="text"
                    value={player1Name}
                    maxLength={20}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    placeholder="e.g. Deepanshu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#111412] border border-[#E2E2D9] dark:border-[#303831] focus:border-[#557F39] dark:focus:border-[#81B64C] focus:outline-hidden text-xs font-semibold text-[#1C201D] dark:text-[#F4F3EA] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700 inline-block shadow-2xs" />
                    <span>Player 2 Name</span>
                  </label>
                  <input
                    type="text"
                    value={player2Name}
                    maxLength={20}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    placeholder="e.g. Rahul / Friend"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#111412] border border-[#E2E2D9] dark:border-[#303831] focus:border-[#557F39] dark:focus:border-[#81B64C] focus:outline-hidden text-xs font-semibold text-[#1C201D] dark:text-[#F4F3EA] transition-colors"
                  />
                </div>
              </div>

              {/* Color Assignment */}
              <div>
                <label className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider block mb-1.5">
                  Color Assignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorChoice('p1_white')}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      colorChoice === 'p1_white'
                        ? 'bg-[#EFEFEA] dark:bg-[#252C27] border-[#557F39] dark:border-[#81B64C] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-2xs'
                        : 'bg-[#F7F6F2] dark:bg-[#111412] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-gray-400" />
                    <span className="truncate">P1 White</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColorChoice('p1_black')}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      colorChoice === 'p1_black'
                        ? 'bg-[#EFEFEA] dark:bg-[#252C27] border-[#557F39] dark:border-[#81B64C] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-2xs'
                        : 'bg-[#F7F6F2] dark:bg-[#111412] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700" />
                    <span className="truncate">P1 Black</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColorChoice('random')}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      colorChoice === 'random'
                        ? 'bg-[#EFEFEA] dark:bg-[#252C27] border-[#557F39] dark:border-[#81B64C] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-2xs'
                        : 'bg-[#F7F6F2] dark:bg-[#111412] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
                    }`}
                  >
                    <span>🎲</span>
                    <span>Random</span>
                  </button>
                </div>
              </div>

              {/* Time Control Options */}
              <div>
                <label className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider block mb-1.5">
                  Time Control
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {Object.entries(TIME_CONTROLS).map(([key, tc]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTimeControlKey(key)}
                      className={`py-2 px-1 rounded-xl border text-[11px] font-semibold transition-all ${
                        timeControlKey === key
                          ? 'bg-[#557F39] dark:bg-[#81B64C] text-white dark:text-[#101311] border-[#557F39] dark:border-[#81B64C] font-bold shadow-2xs'
                          : 'bg-[#F7F6F2] dark:bg-[#252C27] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5] hover:border-[#557F39]/40'
                      }`}
                    >
                      {tc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Gameplay Options */}
              <div className="pt-2 border-t border-[#E2E2D9] dark:border-[#303831] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#626B64] dark:text-[#A5ADA5]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoFlip}
                    onChange={(e) => setAutoFlip(e.target.checked)}
                    className="w-4 h-4 rounded text-[#557F39] focus:ring-0 cursor-pointer"
                  />
                  <span>Auto-flip board each turn (Pass & Play)</span>
                </label>
              </div>

              {/* Start Match CTA */}
              <button
                type="button"
                onClick={() => startNewMatch()}
                className="chess-btn-green w-full mt-4 py-4 px-6 text-base font-extrabold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Start Direct Match</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== ACTIVE GAME ARENA (Mobile First Focus with extended phone length) ==================== */
        <div className="flex flex-col items-center justify-center max-w-full sm:max-w-[580px] mx-auto w-full px-0 sm:px-1 animate-in fade-in duration-150">
          <div className="w-full space-y-1 sm:space-y-2">
            {/* Top Player Card (Black or Opponent) - Exactly like user's screenshot */}
            <PlayerCard
              name={orientation === 'w' ? blackPlayer : whitePlayer}
              color={orientation === 'w' ? 'b' : 'w'}
              isAi={false}
              timeRemainingMs={orientation === 'w' ? blackTime : whiteTime}
              showTimer={timeControlKey !== 'unlimited'}
              isActiveTurn={game.turn === (orientation === 'w' ? 'b' : 'w')}
              capturedPieces={orientation === 'w' ? captured.whiteCaptured : captured.blackCaptured}
              materialAdvantage={
                orientation === 'w' ? Math.max(0, -material.advantage) : Math.max(0, material.advantage)
              }
            />

            {/* Chessboard Container - Extended length on phone */}
            <div className="relative w-full aspect-[8/8.8] sm:aspect-square">
              <Chessboard
                game={game}
                orientation={orientation}
                theme={theme}
                interactive={!gameOver.isOpen}
                playerColor="both"
                lastMove={lastMove}
                moveBadge={lastMoveBadge}
                onMove={handleMove}
                showCoordinates={true}
              />
            </div>

            {/* Bottom Player Card (White or Perspective Player) - Exactly like user's screenshot */}
            <PlayerCard
              name={orientation === 'w' ? whitePlayer : blackPlayer}
              color={orientation === 'w' ? 'w' : 'b'}
              isAi={false}
              timeRemainingMs={orientation === 'w' ? whiteTime : blackTime}
              showTimer={timeControlKey !== 'unlimited'}
              isActiveTurn={game.turn === (orientation === 'w' ? 'w' : 'b')}
              capturedPieces={orientation === 'w' ? captured.blackCaptured : captured.whiteCaptured}
              materialAdvantage={
                orientation === 'w' ? Math.max(0, material.advantage) : Math.max(0, -material.advantage)
              }
            />

            {/* Compact Action Bar (Replaces Move List with clean horizontal strip) */}
            <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-white/5 dark:bg-[#1E1D1A] rounded-2xl border border-[#E2E2D9] dark:border-[#272522] shadow-xs">
              <button
                onClick={handleFlipBoard}
                title="Flip board orientation"
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-black/10 dark:hover:bg-[#312E2B] text-[11px] font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Rotate3d className="w-4 h-4 text-[#7A857D] dark:text-[#8E9790]" />
                <span>Flip</span>
              </button>

              <button
                onClick={handleOfferDraw}
                disabled={gameOver.isOpen}
                title="Offer draw"
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-black/10 dark:hover:bg-[#312E2B] text-[11px] font-bold text-[#1C201D] dark:text-[#F4F3EA] disabled:opacity-30 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Handshake className="w-4 h-4 text-[#557F39] dark:text-[#81B64C]" />
                <span>Draw</span>
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
                onClick={() => handleRematch()}
                title="Rematch"
                className="py-2.5 rounded-xl bg-black/5 dark:bg-[#262421] hover:bg-black/10 dark:hover:bg-[#312E2B] text-[11px] font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-[#7A857D] dark:text-[#8E9790]" />
                <span>Rematch</span>
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

            {/* Match Setup Link */}
            <div className="text-center pt-1">
              <button
                onClick={() => setIsGameStarted(false)}
                className="text-xs font-semibold text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] transition-colors"
              >
                ← Back to Match Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal with Celebrations & Confetti */}
      <GameOverModal
        isOpen={gameOver.isOpen}
        result={gameOver.result}
        reason={gameOver.reason}
        whitePlayerName={whitePlayer}
        blackPlayerName={blackPlayer}
        onRematch={handleRematch}
        onNewGame={() => setIsGameStarted(false)}
        pgn={game.pgn}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from '@/components/chess/Chessboard';
import { MoveHistory } from '@/components/chess/MoveHistory';
import { EvaluationBar } from '@/components/chess/EvaluationBar';
import { ChessGame } from '@/lib/chess/chess-rules';
import { StockfishEngine, EngineEvaluation } from '@/lib/chess/stockfish-engine';
import { soundManager } from '@/lib/chess/audio';
import { Square, MoveAttempt, PieceColor, BOARD_THEMES } from '@/lib/chess/types';
import {
  Rotate3d,
  RotateCcw,
  Copy,
  Upload,
  Cpu,
  Sparkles,
  Navigation,
  FileText,
  Check,
  FileUp,
} from 'lucide-react';

export default function AnalysisPage() {
  const [game, setGame] = useState(() => new ChessGame());
  const [orientation, setOrientation] = useState<PieceColor>('w');
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [theme] = useState(BOARD_THEMES[0]);

  // Engine evaluation state
  const [isEngineActive, setIsEngineActive] = useState(true);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState(true);
  const [evaluation, setEvaluation] = useState<EngineEvaluation>({
    depth: 0,
    score: 0,
    isMate: false,
  });

  // FEN / PGN input modal & drag drop
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [fenOrPgnInput, setFenOrPgnInput] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const engineRef = useRef<StockfishEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize engine
  useEffect(() => {
    const engine = new StockfishEngine();
    engineRef.current = engine;
    engine.init();

    return () => {
      engine.terminate();
    };
  }, []);

  // Run engine analysis whenever position updates
  const analyzeCurrentPosition = useCallback(
    (fen: string) => {
      if (!isEngineActive || !engineRef.current) return;
      engineRef.current.analyzePosition(fen, 18, (ev) => {
        setEvaluation(ev);
      });
    },
    [isEngineActive]
  );

  useEffect(() => {
    analyzeCurrentPosition(game.fen);
  }, [game.fen, analyzeCurrentPosition]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleMove = (move: MoveAttempt) => {
    const res = game.makeMove(move);
    if (!res.success || !res.move) return;

    if (res.move.captured) soundManager.playCapture();
    else if (game.inCheck()) soundManager.playCheck();
    else soundManager.playMove();

    setLastMove({ from: res.move.from, to: res.move.to });
    setCurrentMoveIndex(game.getHistory().length - 1);
    const updatedGame = new ChessGame(game.fen);
    setGame(updatedGame);
  };

  const handleReset = () => {
    game.reset();
    setLastMove(null);
    setCurrentMoveIndex(-1);
    setGame(new ChessGame());
    showToast('Board reset to starting position');
  };

  const handleFlip = () => {
    setOrientation((o) => (o === 'w' ? 'b' : 'w'));
  };

  const handleToggleEngine = () => {
    if (isEngineActive) {
      engineRef.current?.stop();
      setIsEngineActive(false);
    } else {
      setIsEngineActive(true);
      analyzeCurrentPosition(game.fen);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // Helper to load raw PGN or FEN text
  const processTextLoad = (rawText: string, sourceName?: string): boolean => {
    const trimmed = rawText.trim();
    if (!trimmed) return false;

    const newG = new ChessGame();
    // Try FEN first
    if (newG.load(trimmed)) {
      setGame(newG);
      setLastMove(null);
      setCurrentMoveIndex(-1);
      setLoadModalOpen(false);
      setFenOrPgnInput('');
      setLoadError(null);
      showToast(sourceName ? `Loaded FEN from ${sourceName}` : 'Loaded FEN position');
      return true;
    }

    // Try PGN
    if (newG.loadPgn(trimmed)) {
      setGame(newG);
      const hist = newG.getHistory();
      const last = hist[hist.length - 1];
      setLastMove(last ? { from: last.from, to: last.to } : null);
      setCurrentMoveIndex(hist.length - 1);
      setLoadModalOpen(false);
      setFenOrPgnInput('');
      setLoadError(null);
      showToast(
        sourceName
          ? `Loaded PGN: ${sourceName} (${hist.length} moves)`
          : `Loaded PGN game (${hist.length} moves)`
      );
      return true;
    }

    return false;
  };

  const handleLoadCustom = () => {
    setLoadError(null);
    const success = processTextLoad(fenOrPgnInput);
    if (!success) {
      setLoadError('Invalid FEN or PGN string. Please check formatting.');
    }
  };

  // Drag-and-drop file processing
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const ok = processTextLoad(content, file.name);
          if (!ok) {
            setLoadError(`Could not parse valid PGN or FEN from ${file.name}`);
            setLoadModalOpen(true);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const ok = processTextLoad(content, file.name);
          if (!ok) {
            setLoadError(`Could not parse valid PGN or FEN from ${file.name}`);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSelectHistoryMove = (idx: number) => {
    const hist = game.getHistory();
    if (idx === -1) {
      const g = new ChessGame();
      setGame(g);
      setLastMove(null);
      setCurrentMoveIndex(-1);
    } else if (hist[idx]) {
      const g = new ChessGame(hist[idx].after);
      setGame(g);
      setLastMove({ from: hist[idx].from, to: hist[idx].to });
      setCurrentMoveIndex(idx);
    }
  };

  // Best Move Arrow Coordinates
  const bestMoveArrow: { from: Square; to: Square } | null =
    showBestMoveArrow && isEngineActive && evaluation.bestMove && evaluation.bestMove.length >= 4
      ? {
          from: evaluation.bestMove.slice(0, 2) as Square,
          to: evaluation.bestMove.slice(2, 4) as Square,
        }
      : null;

  return (
    <div
      className="flex-1 max-w-7xl mx-auto px-1 sm:px-4 py-3 sm:py-6 w-full relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDraggingFile(false);
        }
      }}
      onDrop={handleFileDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 border-4 border-dashed border-[#81B64C] animate-in fade-in duration-150">
          <div className="w-24 h-24 rounded-3xl bg-[#81B64C]/20 border-2 border-[#81B64C] flex items-center justify-center text-[#81B64C] mb-4 animate-bounce">
            <FileUp className="w-12 h-12" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Drop PGN File Here
          </h2>
          <p className="text-sm text-[#A5ADA5] mt-1.5 font-medium">
            Instantly load game moves, variations, and engine evaluation
          </p>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1E1D1A] border border-[#81B64C] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-[#81B64C]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2E2D9] dark:border-[#303831]">
        <div>
          <h1 className="text-2xl font-black text-[#1C201D] dark:text-[#F4F3EA] tracking-tight">
            Analysis Board
          </h1>
          <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] mt-0.5">
            Engine evaluation, best move arrow, and PGN drag-and-drop
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Best Move Arrow Toggle */}
          <button
            onClick={() => setShowBestMoveArrow(!showBestMoveArrow)}
            title="Toggle Engine Best Move Arrow"
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showBestMoveArrow
                ? 'bg-[#81B64C]/15 border-[#81B64C] text-[#557F39] dark:text-[#81B64C] shadow-2xs'
                : 'bg-white dark:bg-[#1E1D1A] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Arrow: {showBestMoveArrow ? 'ON' : 'OFF'}</span>
          </button>

          {/* Load FEN / PGN Button */}
          <button
            onClick={() => setLoadModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1E1D1A] hover:bg-[#EFEFEA] dark:hover:bg-[#2B2926] border border-[#E2E2D9] dark:border-[#303831] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#557F39] dark:text-[#81B64C]" />
            <span>Import PGN / FEN</span>
          </button>

          {/* Engine ON/OFF Toggle */}
          <button
            onClick={handleToggleEngine}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isEngineActive
                ? 'chess-btn-green py-1.5 px-3.5 text-xs text-white'
                : 'bg-[#F1F0EB] dark:bg-[#252C27] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isEngineActive ? 'Engine: ON' : 'Engine: OFF'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Board with Evaluation Bar */}
        <div className="lg:col-span-8 flex justify-center">
          <div className="flex gap-3 w-full max-w-[660px]">
            {/* Live Vertical Evaluation Bar */}
            {isEngineActive && (
              <EvaluationBar
                score={evaluation.score}
                isMate={evaluation.isMate}
                mateIn={evaluation.mateIn}
                orientation={orientation}
              />
            )}

            {/* Chessboard with Visual Arrow */}
            <div className="flex-1">
              <Chessboard
                game={game}
                orientation={orientation}
                theme={theme}
                interactive={true}
                playerColor="both"
                lastMove={lastMove}
                bestMoveArrow={bestMoveArrow}
                onMove={handleMove}
              />
            </div>
          </div>
        </div>

        {/* Side Panel: Engine Details & Navigation */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-[620px]">
          {/* Engine Info Box (Chess.com Styled) */}
          <div className="bg-white dark:bg-[#1E1D1A] border border-[#E2E2D9] dark:border-[#272522] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#81B64C]/20 flex items-center justify-center text-[#81B64C]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black text-[#1C201D] dark:text-[#F4F3EA] uppercase tracking-wider">
                  Chess Engine
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#626B64] dark:text-[#A5ADA5]">
                Depth {evaluation.depth}/20
              </span>
            </div>

            {/* Evaluation Score Pill */}
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F7F6F2] dark:bg-[#161512] border border-[#E2E2D9] dark:border-[#272522] font-mono text-sm mb-3">
              <span className="text-xs font-semibold text-[#626B64] dark:text-[#A5ADA5]">Score:</span>
              <span className="font-extrabold text-[#557F39] dark:text-[#81B64C]">
                {evaluation.isMate
                  ? `Checkmate in ${Math.abs(evaluation.mateIn || 0)}`
                  : `${evaluation.score > 0 ? '+' : ''}${evaluation.score.toFixed(2)}`}
              </span>
            </div>

            {/* Recommended Move Indicator */}
            {bestMoveArrow && (
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#81B64C]/10 border border-[#81B64C]/30 text-xs font-bold text-[#557F39] dark:text-[#81B64C] mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3 h-3 text-[#81B64C]" />
                  <span>Best Move:</span>
                </span>
                <span className="font-mono text-sm uppercase tracking-wide">
                  {bestMoveArrow.from} ➔ {bestMoveArrow.to}
                </span>
              </div>
            )}

            {evaluation.pv && (
              <div className="text-xs">
                <span className="text-[#626B64] dark:text-[#A5ADA5] font-bold block mb-1">
                  Engine Line (PV):
                </span>
                <span className="font-mono text-[11px] text-[#1C201D] dark:text-[#F4F3EA] bg-[#F7F6F2] dark:bg-[#161512] p-2.5 rounded-xl block break-all border border-[#E2E2D9] dark:border-[#272522]">
                  {evaluation.pv}
                </span>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="grid grid-cols-4 gap-2 bg-white dark:bg-[#1E1D1A] p-2.5 rounded-2xl border border-[#E2E2D9] dark:border-[#272522] shadow-sm">
            <button
              onClick={handleFlip}
              title="Flip board orientation"
              className="py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#262421] hover:bg-[#EFEFEA] dark:hover:bg-[#312E2B] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Rotate3d className="w-4 h-4 text-[#626B64] dark:text-[#A5ADA5]" />
              Flip
            </button>

            <button
              onClick={handleReset}
              title="Reset position"
              className="py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#262421] hover:bg-[#EFEFEA] dark:hover:bg-[#312E2B] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-[#626B64] dark:text-[#A5ADA5]" />
              Reset
            </button>

            <button
              onClick={() => handleCopy(game.fen, 'FEN')}
              title="Copy current FEN"
              className="py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#262421] hover:bg-[#EFEFEA] dark:hover:bg-[#312E2B] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-colors relative"
            >
              <Copy className="w-4 h-4 text-[#626B64] dark:text-[#A5ADA5]" />
              {copiedLabel === 'FEN' ? 'Copied' : 'FEN'}
            </button>

            <button
              onClick={() => handleCopy(game.pgn, 'PGN')}
              title="Copy current PGN"
              className="py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#262421] hover:bg-[#EFEFEA] dark:hover:bg-[#312E2B] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-colors relative"
            >
              <Copy className="w-4 h-4 text-[#626B64] dark:text-[#A5ADA5]" />
              {copiedLabel === 'PGN' ? 'Copied' : 'PGN'}
            </button>
          </div>

          {/* Move History */}
          <div className="flex-1 min-h-0">
            <MoveHistory
              history={game.getHistory()}
              currentMoveIndex={currentMoveIndex}
              onSelectMove={handleSelectHistoryMove}
              pgn={game.pgn}
              fen={game.fen}
            />
          </div>
        </div>
      </div>

      {/* Load FEN / PGN Modal with Drag & Drop */}
      {loadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E1D1A] border border-[#E2E2D9] dark:border-[#272522] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <h3 className="text-xl font-black text-[#1C201D] dark:text-[#F4F3EA] tracking-tight mb-1">
              Import Position or Game
            </h3>
            <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] mb-4">
              Drop a .pgn file, or paste raw FEN / PGN text below
            </p>

            {/* Drag & Drop File Tile */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mb-4 p-5 rounded-2xl border-2 border-dashed border-[#81B64C]/50 hover:border-[#81B64C] bg-[#81B64C]/5 dark:bg-[#81B64C]/10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
            >
              <FileText className="w-8 h-8 text-[#557F39] dark:text-[#81B64C] mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA]">
                Click to browse or drop .pgn file here
              </div>
              <div className="text-[11px] text-[#626B64] dark:text-[#A5ADA5] mt-0.5">
                Supports standard .pgn and .txt files
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pgn,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {loadError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-400/50 dark:border-red-500/50 text-xs text-red-700 dark:text-red-300 font-semibold">
                {loadError}
              </div>
            )}

            <div className="mb-2 text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider">
              Or paste text directly:
            </div>
            <textarea
              rows={4}
              value={fenOrPgnInput}
              onChange={(e) => setFenOrPgnInput(e.target.value)}
              placeholder="e.g. 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
              className="w-full p-3.5 rounded-2xl bg-[#F7F6F2] dark:bg-[#161512] border border-[#E2E2D9] dark:border-[#272522] focus:border-[#81B64C] focus:outline-hidden font-mono text-xs text-[#1C201D] dark:text-[#F4F3EA] mb-4"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setLoadModalOpen(false);
                  setLoadError(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadCustom}
                className="chess-btn-green py-2.5 px-5 text-xs font-black"
              >
                Load Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

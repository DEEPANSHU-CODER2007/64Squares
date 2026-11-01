'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard } from '@/components/chess/Chessboard';
import { ChessGame } from '@/lib/chess/chess-rules';
import { PUZZLES_COLLECTION, PuzzleData } from '@/lib/puzzles/puzzles-data';
import { soundManager } from '@/lib/chess/audio';
import { MoveAttempt, Square } from '@/lib/chess/types';
import { Confetti } from '@/components/chess/Confetti';
import {
  Puzzle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  Trophy,
  Flame,
  Star,
  Sparkles,
} from 'lucide-react';

export default function PuzzlesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPuzzle: PuzzleData = PUZZLES_COLLECTION[currentIndex] || PUZZLES_COLLECTION[0];

  const [game, setGame] = useState(() => new ChessGame(currentPuzzle.fen));
  const [status, setStatus] = useState<'idle' | 'solved' | 'failed'>('idle');
  const [hintActive, setHintActive] = useState(false);
  const [score, setScore] = useState(1200);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [winningSquare, setWinningSquare] = useState<Square | null>(null);

  useEffect(() => {
    const g = new ChessGame(currentPuzzle.fen);
    setGame(g);
    setStatus('idle');
    setHintActive(false);
    setWinningSquare(null);
  }, [currentIndex, currentPuzzle.fen]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PUZZLES_COLLECTION.length);
  }, []);

  // Keyboard shortcut: Press Enter or Space to go to next puzzle when solved
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'solved' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleNext]);

  const handleMove = (move: MoveAttempt) => {
    if (status === 'solved') return;

    const expectedMove = currentPuzzle.solution[0];
    const isCorrect =
      move.from === expectedMove.from &&
      move.to === expectedMove.to &&
      (!expectedMove.promotion || move.promotion === expectedMove.promotion);

    const res = game.makeMove(move);
    if (!res.success) return;

    if (isCorrect) {
      if (res.move?.captured) soundManager.playCapture();
      else soundManager.playMove();

      soundManager.playPuzzleSuccess();
      setStatus('solved');
      setWinningSquare(expectedMove.to);
      setScore((s) => s + 15);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      setGame(new ChessGame(game.fen));
    } else {
      soundManager.playPuzzleFail();
      setStatus('failed');
      setStreak(0);
      setGame(new ChessGame(game.fen));

      // Revert after 1.1s
      setTimeout(() => {
        setGame(new ChessGame(currentPuzzle.fen));
        setStatus('idle');
      }, 1100);
    }
  };

  const handleReset = () => {
    setGame(new ChessGame(currentPuzzle.fen));
    setStatus('idle');
    setHintActive(false);
    setWinningSquare(null);
  };

  const customStyles: Record<string, string> = {};
  if (hintActive && currentPuzzle.solution[0]) {
    customStyles[currentPuzzle.solution[0].from] = 'ring-4 ring-amber-400 ring-inset shadow-md';
  }
  if (winningSquare && status === 'solved') {
    customStyles[winningSquare] = 'bg-emerald-500/40 ring-4 ring-emerald-400 ring-inset shadow-lg';
  }

  return (
    <>
      {/* Confetti burst on solve */}
      <Confetti active={status === 'solved'} durationMs={3500} />

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F0EB] dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold text-[#557F39] dark:text-[#81B64C] mb-2 shadow-2xs">
            <Puzzle className="w-3.5 h-3.5" />
            <span>Tactics & Puzzle Trainer</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1C201D] dark:text-[#F4F3EA] tracking-tight">
            Chess Tactics
          </h1>
          <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] mt-1">
            Find the strongest tactical continuation to gain decisive advantage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
          {/* Main Board */}
          <div className="lg:col-span-8 flex justify-center">
            <div className="w-full max-w-[600px]">
              <Chessboard
                game={game}
                orientation={currentPuzzle.turn}
                interactive={status !== 'solved'}
                playerColor={currentPuzzle.turn}
                onMove={handleMove}
                customSquareStyles={customStyles}
                moveBadge={
                  status === 'solved' && winningSquare
                    ? { square: winningSquare, label: '!!', type: 'brilliant' }
                    : null
                }
              />
            </div>
          </div>

          {/* Puzzle Info & Performance Panel */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Main Details Card */}
            <div className="bg-white dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#303831] rounded-3xl p-6 shadow-sm space-y-5">
              {/* Header: Title + Rating + Streak */}
              <div className="flex items-start justify-between border-b border-[#E2E2D9] dark:border-[#303831] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#557F39] dark:text-[#81B64C] block mb-1">
                    Puzzle #{currentIndex + 1} • {currentPuzzle.theme.toUpperCase()}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#1C201D] dark:text-[#F4F3EA] leading-tight">
                    {currentPuzzle.title}
                  </h2>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F1F0EB] dark:bg-[#252C27] border border-[#E2E2D9] dark:border-[#303831] text-xs font-mono font-bold text-[#557F39] dark:text-[#81B64C]">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{currentPuzzle.rating}</span>
                  </div>

                  {streak > 1 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{streak} Streak!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Puzzle Description */}
              <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] leading-relaxed">
                {currentPuzzle.description}
              </p>

              {/* Turn Prompt */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F6F2] dark:bg-[#101311] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold text-[#1C201D] dark:text-[#F4F3EA]">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full border shadow-2xs ${
                      currentPuzzle.turn === 'w' ? 'bg-white border-gray-400' : 'bg-zinc-900 border-zinc-600'
                    }`}
                  />
                  <span>{currentPuzzle.turn === 'w' ? 'White to move' : 'Black to move'}</span>
                </div>
                <span className="text-[11px] font-mono text-[#626B64] dark:text-[#A5ADA5]">
                  Score: <strong className="text-[#557F39] dark:text-[#81B64C]">{score}</strong>
                </span>
              </div>

              {/* Celebratory Solved Banner */}
              {status === 'solved' && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-500/60 dark:border-[#81B64C] text-emerald-900 dark:text-emerald-200 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <span>Brilliant! Puzzle Solved</span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          +15 points earned • Tactics rating updated
                        </div>
                      </div>
                    </div>

                    {/* 3 Stars */}
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce" />
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce delay-100" />
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce delay-200" />
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full py-3 px-4 rounded-xl bg-[#557F39] hover:bg-[#486E30] dark:bg-[#81B64C] dark:hover:bg-[#91C85A] text-white dark:text-[#101311] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <span>Next Puzzle</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-[10px] opacity-70 font-mono ml-1">(Enter ↵)</span>
                  </button>
                </div>
              )}

              {/* Failed Move Alert */}
              {status === 'failed' && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-400/50 dark:border-red-500/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 animate-shake shadow-xs">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Not the best move.</span>
                    <span className="text-[11px] text-red-600 dark:text-red-400">Position resetting in a second...</span>
                  </div>
                </div>
              )}

              {/* Controls (Hint & Reset) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => setHintActive(true)}
                  disabled={status === 'solved'}
                  className="py-2.5 px-3 rounded-2xl bg-[#F1F0EB] dark:bg-[#252C27] hover:bg-[#E5E4DE] dark:hover:bg-[#303831] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold text-[#1C201D] dark:text-[#F4F3EA] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Show Hint</span>
                </button>

                <button
                  onClick={handleReset}
                  className="py-2.5 px-3 rounded-2xl bg-[#F1F0EB] dark:bg-[#252C27] hover:bg-[#E5E4DE] dark:hover:bg-[#303831] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold text-[#1C201D] dark:text-[#F4F3EA] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-[#626B64] dark:text-[#A5ADA5]" />
                  <span>Reset Board</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

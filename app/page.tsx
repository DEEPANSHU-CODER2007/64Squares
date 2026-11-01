'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Chessboard } from '@/components/chess/Chessboard';
import { ChessGame } from '@/lib/chess/chess-rules';
import { MoveAttempt, Square } from '@/lib/chess/types';
import { soundManager } from '@/lib/chess/audio';
import {
  Bot,
  Users,
  Puzzle,
  GraduationCap,
  Search,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const [previewGame, setPreviewGame] = useState(() => new ChessGame());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const handlePreviewMove = (move: MoveAttempt) => {
    const res = previewGame.makeMove(move);
    if (res.success && res.move) {
      if (res.move.captured) soundManager.playCapture();
      else soundManager.playMove();

      setLastMove({ from: move.from, to: move.to });
      setPreviewGame(new ChessGame(previewGame.fen));

      // Automated polite computer counter-move after 400ms if game not over
      if (!previewGame.getStatus().isOver) {
        setTimeout(() => {
          const legalMoves = previewGame.getLegalMoves();
          if (legalMoves.length > 0) {
            const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            const aiRes = previewGame.makeMove({
              from: randomMove.from,
              to: randomMove.to,
              promotion: randomMove.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
            });
            if (aiRes.success && aiRes.move) {
              if (aiRes.move.captured) soundManager.playCapture();
              else soundManager.playMove();
              setLastMove({ from: randomMove.from, to: randomMove.to });
              setPreviewGame(new ChessGame(previewGame.fen));
            }
          }
        }, 400);
      }
    }
  };

  const handleResetPreview = () => {
    previewGame.reset();
    setLastMove(null);
    setPreviewGame(new ChessGame());
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-6xl mx-auto px-1.5 sm:px-6 py-3 sm:py-8 w-full">
      {/* Chess.com Inspired Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">
        {/* Left Column: Centerpiece Chessboard Preview (Top on Phone, Left on Desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center order-1 lg:order-1 w-full">
          <div className="w-full max-w-full sm:max-w-[580px] lg:max-w-[620px] mx-auto">
            {/* Top Bar for Board Preview */}
            <div className="flex items-center justify-between px-1.5 mb-2 text-xs text-[#626B64] dark:text-[#A5ADA5]">
              <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-[#557F39] dark:text-[#81B64C]">
                <span className="w-2 h-2 rounded-full bg-[#81B64C] animate-pulse" />
                <span>Interactive Board (Move White)</span>
              </div>
              <button
                onClick={handleResetPreview}
                className="flex items-center gap-1 text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] transition-colors text-[11px] font-semibold px-2 py-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                title="Reset board position"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Chessboard Container - Edge to Edge on Mobile */}
            <div className="w-full aspect-square">
              <Chessboard
                game={previewGame}
                onMove={handlePreviewMove}
                lastMove={lastMove}
                interactive={true}
                playerColor="w"
                showCoordinates={true}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Action Column */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-6 text-center lg:text-left order-2 lg:order-2">
          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#1C201D] dark:text-[#F4F3EA] leading-tight">
              Play Chess on 64Squares
            </h1>
            <p className="text-sm sm:text-base text-[#626B64] dark:text-[#A5ADA5] max-w-md mx-auto lg:mx-0 font-medium leading-relaxed">
              Think Ahead. Play Smart. Instant games against the engine or challenge a friend directly.
            </p>
          </div>

          {/* Primary Action Buttons (Chess.com 3D Tactile Buttons) */}
          <div className="flex flex-col gap-3.5 w-full max-w-md mx-auto lg:mx-0">
            {/* Action 1: Play Computer (Big 3D Green Button) */}
            <Link
              href="/play/computer"
              className="chess-btn-green py-4 px-5 flex items-center justify-between group shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-black/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-white leading-tight">
                    Play Computer
                  </div>
                  <div className="text-xs text-white/80 font-semibold mt-0.5">
                    Stockfish AI Engine • 5 Difficulty Tiers
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-1.5 transition-transform" />
            </Link>

            {/* Action 2: Play a Friend (Big 3D Dark Button) */}
            <Link
              href="/play/friend"
              className="chess-btn-dark py-4 px-5 flex items-center justify-between group shadow-lg border border-white/5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#81B64C]">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-white leading-tight">
                    Play a Friend
                  </div>
                  <div className="text-xs text-white/70 font-semibold mt-0.5">
                    Direct 2-Player Match • Custom Names
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

          {/* Secondary Quick Access Links (Chess.com Clean Cards) */}
          <div className="pt-1 max-w-md mx-auto lg:mx-0 w-full">
            <div className="text-[11px] font-bold text-[#7A857D] dark:text-[#8E9790] uppercase tracking-wider mb-2.5">
              Practice & Analysis
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <Link
                href="/puzzles"
                className="py-3 px-3 rounded-2xl bg-white dark:bg-[#1E1D1A] border border-[#E2E2D9] dark:border-[#272522] hover:border-[#81B64C] dark:hover:border-[#81B64C] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all shadow-xs hover:-translate-y-0.5"
              >
                <Puzzle className="w-4 h-4 text-amber-500" />
                <span>Puzzles</span>
              </Link>
              <Link
                href="/learn"
                className="py-3 px-3 rounded-2xl bg-white dark:bg-[#1E1D1A] border border-[#E2E2D9] dark:border-[#272522] hover:border-[#81B64C] dark:hover:border-[#81B64C] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all shadow-xs hover:-translate-y-0.5"
              >
                <GraduationCap className="w-4 h-4 text-[#81B64C]" />
                <span>Learn</span>
              </Link>
              <Link
                href="/analysis"
                className="py-3 px-3 rounded-2xl bg-white dark:bg-[#1E1D1A] border border-[#E2E2D9] dark:border-[#272522] hover:border-[#81B64C] dark:hover:border-[#81B64C] text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] flex flex-col items-center justify-center gap-1 transition-all shadow-xs hover:-translate-y-0.5"
              >
                <Search className="w-4 h-4 text-sky-500" />
                <span>Analysis</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

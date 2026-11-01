'use client';

import React, { useState } from 'react';
import { Chessboard } from '@/components/chess/Chessboard';
import { ChessGame } from '@/lib/chess/chess-rules';
import { MoveAttempt, Square } from '@/lib/chess/types';
import { soundManager } from '@/lib/chess/audio';
import { GraduationCap, Check, ArrowRight, Zap } from 'lucide-react';

interface Lesson {
  id: string;
  category: 'Basics' | 'Special Rules' | 'Tactics';
  title: string;
  description: string;
  fen: string;
  instructions: string;
  expectedMove?: { from: Square; to: Square };
}

const LESSONS: Lesson[] = [
  {
    id: 'pawn-move',
    category: 'Basics',
    title: 'The Pawn',
    description: 'Pawns move straight forward one square, but capture diagonally. On their very first move, they may advance two squares forward.',
    fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
    instructions: 'Advance your pawn two squares from e2 to e4!',
    expectedMove: { from: 'e2', to: 'e4' },
  },
  {
    id: 'knight-move',
    category: 'Basics',
    title: 'The Knight',
    description: 'The knight is the only piece that can jump over other pieces! It moves in an "L-shape": two squares in one cardinal direction, then one square perpendicular.',
    fen: '4k3/8/8/8/8/8/8/4N2K w - - 0 1',
    instructions: 'Jump your knight from e1 to f3.',
    expectedMove: { from: 'e1', to: 'f3' },
  },
  {
    id: 'castling',
    category: 'Special Rules',
    title: 'Castling',
    description: 'Castling is the only move where you move two pieces in one turn! The king moves two squares toward a rook, and that rook hops over the king to the adjacent square.',
    fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
    instructions: 'Castle kingside by moving your king from e1 to g1!',
    expectedMove: { from: 'e1', to: 'g1' },
  },
  {
    id: 'en-passant',
    category: 'Special Rules',
    title: 'En Passant',
    description: 'If an enemy pawn leaps two squares past your pawn, you can capture it diagonally "in passing" as if it had only moved one square.',
    fen: '8/8/8/3Pp3/8/8/8/4K2k w - e6 0 1',
    instructions: 'Capture the black pawn en passant by moving your pawn from d5 to e6!',
    expectedMove: { from: 'd5', to: 'e6' },
  },
  {
    id: 'promotion',
    category: 'Special Rules',
    title: 'Pawn Promotion',
    description: 'When your pawn battles its way to the opposite end of the board (8th rank for White), it instantly transforms into a Queen, Rook, Bishop, or Knight.',
    fen: '8/4P3/8/8/8/8/8/4K2k w - - 0 1',
    instructions: 'Move your pawn from e7 to e8 to promote to a Queen!',
    expectedMove: { from: 'e7', to: 'e8' },
  },
  {
    id: 'the-fork',
    category: 'Tactics',
    title: 'The Fork',
    description: 'A tactical double-attack where a single piece simultaneously attacks two or more enemy pieces, forcing the opponent to lose material.',
    fen: 'r3k3/8/8/4N3/8/8/8/4K3 w - - 0 1',
    instructions: 'Move knight from e5 to c6 to fork both the King on e8 and the Rook on a8!',
    expectedMove: { from: 'e5', to: 'c6' },
  },
];

export default function LearnPage() {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const currentLesson = LESSONS[activeLessonIndex];

  const [game, setGame] = useState(() => new ChessGame(currentLesson.fen));
  const [completed, setCompleted] = useState(false);

  const handleSelectLesson = (idx: number) => {
    setActiveLessonIndex(idx);
    setGame(new ChessGame(LESSONS[idx].fen));
    setCompleted(false);
  };

  const handleMove = (move: MoveAttempt) => {
    const res = game.makeMove(move);
    if (!res.success) return;

    if (res.move?.captured) soundManager.playCapture();
    else soundManager.playMove();

    setGame(new ChessGame(game.fen));

    if (
      currentLesson.expectedMove &&
      move.from === currentLesson.expectedMove.from &&
      move.to === currentLesson.expectedMove.to
    ) {
      soundManager.playCheckmate();
      setCompleted(true);
    }
  };

  const handleNext = () => {
    if (activeLessonIndex + 1 < LESSONS.length) {
      handleSelectLesson(activeLessonIndex + 1);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F0EB] dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold text-[#557F39] dark:text-[#81B64C] mb-2">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Interactive Chess Academy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C201D] dark:text-[#F4F3EA] tracking-tight">
          Learn Rules & Tactics
        </h1>
        <p className="text-sm text-[#626B64] dark:text-[#A5ADA5] mt-1">
          Master the movement, special rules, and tactical motifs with hands-on practice
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lesson List Navigation (Left) */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-xs font-bold text-[#626B64] dark:text-[#A5ADA5] uppercase tracking-wider px-2 mb-3">
            Lessons Catalog
          </h2>
          {LESSONS.map((lesson, idx) => (
            <button
              key={lesson.id}
              onClick={() => handleSelectLesson(idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                activeLessonIndex === idx
                  ? 'bg-white dark:bg-[#1D231F] border-[#557F39] dark:border-[#81B64C] text-[#1C201D] dark:text-[#F4F3EA] shadow-xs'
                  : 'bg-white/60 dark:bg-[#171B18] border-[#E2E2D9] dark:border-[#303831] text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] hover:bg-white dark:hover:bg-[#1D231F]/50'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-[#557F39] dark:text-[#81B64C] uppercase tracking-wider block mb-1">
                  {lesson.category}
                </span>
                <span className="text-sm font-bold text-[#1C201D] dark:text-[#F4F3EA]">{lesson.title}</span>
              </div>
              <ArrowRight
                className={`w-4 h-4 ${activeLessonIndex === idx ? 'text-[#557F39] dark:text-[#81B64C]' : 'opacity-30'}`}
              />
            </button>
          ))}
        </div>

        {/* Interactive Classroom Area (Right) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full max-w-[600px] space-y-4">
            {/* Lesson Header Card */}
            <div className="bg-white dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-[#F1F0EB] dark:bg-[#252C27] text-[10px] font-bold text-[#557F39] dark:text-[#81B64C] uppercase tracking-wider">
                  {currentLesson.category}
                </span>
                <span className="text-xs text-[#626B64] dark:text-[#A5ADA5]">
                  Lesson {activeLessonIndex + 1} of {LESSONS.length}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#1C201D] dark:text-[#F4F3EA]">{currentLesson.title}</h3>
              <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] leading-relaxed">
                {currentLesson.description}
              </p>

              <div className="p-3 rounded-xl bg-[#F7F6F2] dark:bg-[#101311] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold text-[#557F39] dark:text-[#81B64C] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#557F39] dark:text-[#81B64C]" />
                <span>{currentLesson.instructions}</span>
              </div>

              {completed && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/50 dark:border-[#81B64C] text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 text-[#557F39] dark:text-[#81B64C]" />
                    <span>Completed! Excellent move.</span>
                  </div>
                  {activeLessonIndex + 1 < LESSONS.length && (
                    <button
                      onClick={handleNext}
                      className="px-3 py-1 rounded-lg bg-[#557F39] dark:bg-[#81B64C] text-white dark:text-[#101311] font-bold text-xs hover:opacity-90 transition-opacity"
                    >
                      Next Lesson
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Board */}
            <Chessboard
              game={game}
              orientation="w"
              interactive={true}
              playerColor="w"
              onMove={handleMove}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

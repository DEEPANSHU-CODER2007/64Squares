import React from 'react';
import Link from 'next/link';
import { Home, Bot, Users, Sparkles, Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#81B64C]/10 dark:bg-[#81B64C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E35D5B]/10 dark:bg-[#E35D5B]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center flex flex-col items-center">
        {/* Chessboard Out-of-Bounds Illustration */}
        <div className="relative mb-6">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] shadow-xl flex items-center justify-center relative overflow-hidden group">
            {/* 4x4 Mini Chessboard Grid pattern */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-30 dark:opacity-20">
              <div className="bg-[#779866]" />
              <div className="bg-transparent" />
              <div className="bg-[#779866]" />
              <div className="bg-transparent" />
              <div className="bg-transparent" />
              <div className="bg-[#779866]" />
              <div className="bg-transparent" />
              <div className="bg-[#779866]" />
              <div className="bg-[#779866]" />
              <div className="bg-transparent" />
              <div className="bg-[#779866]" />
              <div className="bg-transparent" />
              <div className="bg-transparent" />
              <div className="bg-[#779866]" />
              <div className="bg-transparent" />
              <div className="bg-[#779866]" />
            </div>

            {/* Fallen King SVG with Toppled Angle */}
            <div className="relative z-10 transform -rotate-45 translate-x-1 translate-y-1 transition-transform group-hover:-rotate-90 duration-300">
              <svg viewBox="0 0 45 45" className="w-16 h-16 text-[#E35D5B] drop-shadow-md">
                {/* Stylized King Piece */}
                <path
                  d="M22.5 4v5M20 6.5h5M18 10h9l-1 4H19l-1-4zm-4 5h17l1.5 5h-20L14 15zm-2 6h21l-2 11H14l-2-11zm-2 12h25v4H10v-4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Chess Blunder Badge "?? 404" */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#E35D5B] text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 animate-pulse">
              <span>??</span>
              <span>404</span>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E35D5B]/10 dark:bg-[#E35D5B]/15 border border-[#E35D5B]/30 text-[#E35D5B] text-xs font-bold uppercase tracking-wider mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E35D5B] animate-ping" />
          <span>Square Out of Bounds</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-black text-[#1C201D] dark:text-[#F4F3EA] tracking-tight mb-3">
          Blunder on the Board
        </h1>

        {/* Description */}
        <p className="text-[#626B64] dark:text-[#A5ADA5] text-sm md:text-base leading-relaxed max-w-md mb-8">
          The square or position you navigated to does not exist on this 64-square grid. Perhaps a piece moved off the board or the page has been captured.
        </p>

        {/* Direct Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-6">
          <Link
            href="/play/computer"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-[#557F39] to-[#81B64C] text-white font-bold shadow-md hover:brightness-105 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black">Play Computer</div>
              <div className="text-xs text-white/80 font-medium truncate">Stockfish AI • All Levels</div>
            </div>
          </Link>

          <Link
            href="/play/friend"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-sm hover:border-[#81B64C] dark:hover:border-[#81B64C] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#557F39]/10 dark:bg-[#81B64C]/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#557F39] dark:text-[#81B64C]">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black">Play a Friend</div>
              <div className="text-xs text-[#626B64] dark:text-[#A5ADA5] font-medium truncate">Direct match • Custom names</div>
            </div>
          </Link>

          <Link
            href="/puzzles"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-sm hover:border-[#81B64C] dark:hover:border-[#81B64C] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black">Daily Puzzles</div>
              <div className="text-xs text-[#626B64] dark:text-[#A5ADA5] font-medium truncate">Tactics & Checkmates</div>
            </div>
          </Link>

          <Link
            href="/analysis"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] text-[#1C201D] dark:text-[#F4F3EA] font-bold shadow-sm hover:border-[#81B64C] dark:hover:border-[#81B64C] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-sky-500">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black">Analysis Board</div>
              <div className="text-xs text-[#626B64] dark:text-[#A5ADA5] font-medium truncate">Explore moves & FEN</div>
            </div>
          </Link>
        </div>

        {/* Back to Home Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
}


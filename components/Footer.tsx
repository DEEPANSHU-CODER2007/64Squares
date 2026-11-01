'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // In match (Play Computer or Play Friend), remove footer completely
  const isMatch = pathname.startsWith('/play/computer') || pathname.startsWith('/play/friend');
  if (isMatch) return null;

  return (
    <footer className="border-t border-[#E2E2D9] dark:border-[#303831] bg-[#F1F0EB] dark:bg-[#111412] py-8 text-[#626B64] dark:text-[#A5ADA5] text-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#E2E2D9] dark:border-[#303831]">
          <div className="flex flex-col items-center md:items-start gap-1">
            <Logo size="sm" showTagline={true} />
            <p className="text-[11px] text-[#7A857D] dark:text-[#8E9790] pt-1">
              A clean, modern chess platform. Play Stockfish AI or challenge friends with direct 2-player matches.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
            <Link href="/play/computer" className="hover:text-[#557F39] dark:hover:text-[#81B64C] transition-colors">
              Play Computer
            </Link>
            <Link href="/play/friend" className="hover:text-[#557F39] dark:hover:text-[#81B64C] transition-colors">
              Play a Friend
            </Link>
            <Link href="/puzzles" className="hover:text-[#557F39] dark:hover:text-[#81B64C] transition-colors">
              Puzzles
            </Link>
            <Link href="/learn" className="hover:text-[#557F39] dark:hover:text-[#81B64C] transition-colors">
              Learn
            </Link>
            <Link href="/analysis" className="hover:text-[#557F39] dark:hover:text-[#81B64C] transition-colors">
              Analysis
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-3 text-[#7A857D] dark:text-[#8E9790]">
          <p>© {new Date().getFullYear()} 64Squares. All chess rules authoritative via chess.js.</p>
          <p>64 squares. Infinite possibilities.</p>
        </div>
      </div>
    </footer>
  );
};

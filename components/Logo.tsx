'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showTagline = false, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 md:w-9 md:h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg md:text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* 10/10 Modern Chess Knight Emblem inspired by Google & Chess.com */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#81B64C] to-[#557F39] p-0.5 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200`}
      >
        <div className="w-full h-full rounded-[10px] bg-[#111412] flex items-center justify-center overflow-hidden relative">
          {/* Subtle geometric chessboard backdrop grid */}
          <div className="absolute inset-0 opacity-15 grid grid-cols-2 grid-rows-2">
            <div className="bg-white" />
            <div className="bg-transparent" />
            <div className="bg-transparent" />
            <div className="bg-white" />
          </div>

          <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4/5 h-4/5 text-[#81B64C] relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5"
          >
            <defs>
              <linearGradient id="knightGrad" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9DE45C" />
                <stop offset="0.6" stopColor="#81B64C" />
                <stop offset="1" stopColor="#557F39" />
              </linearGradient>
            </defs>

            {/* Base platform */}
            <rect x="7" y="27" width="22" height="3" rx="1.5" fill="url(#knightGrad)" />

            {/* Stylized Modern Knight Silhouette */}
            <path
              d="M10 27V23.5C10 21 12 19.5 13 18C10.5 17 9.5 14.5 9 12C8.5 9 10.5 6 15 5C19 4 23 5.5 25 8C27 10.5 27 13.5 25.5 17.5C24.5 20 26 23 26 27H10Z"
              fill="url(#knightGrad)"
            />

            {/* Mane precision cutout */}
            <path
              d="M19 6.5C18 9 18.5 12 21 14C23 15.5 24 17 24.5 19.5"
              stroke="#111412"
              strokeWidth="1.75"
              strokeLinecap="round"
            />

            {/* Modern angled snout cut */}
            <path
              d="M10 13.5L14 14"
              stroke="#111412"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Knight eye */}
            <circle cx="15.5" cy="9.5" r="1.3" fill="#111412" />
          </svg>
        </div>
      </div>

      {/* Brand Wordmark */}
      <div className="flex flex-col">
        <span className={`font-black tracking-tight text-[#1C201D] dark:text-[#F4F3EA] ${textSizes[size]} leading-none`}>
          64<span className="text-[#557F39] dark:text-[#81B64C] group-hover:text-[#44662d] dark:group-hover:text-[#97d057] transition-colors">Squares</span>
        </span>
        {showTagline && (
          <span className="text-[9px] text-[#626B64] dark:text-[#A5ADA5] tracking-widest uppercase mt-0.5 font-bold">
            Think Ahead. Play Smart.
          </span>
        )}
      </div>
    </Link>
  );
};

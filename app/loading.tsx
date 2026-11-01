import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] px-4 py-12 relative overflow-hidden select-none">
      {/* Background ambient pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#81B64C]/10 dark:bg-[#81B64C]/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Knight Logo Container */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 mb-5 flex items-center justify-center">
          {/* Subtle Outer Radar Rings */}
          <div className="absolute inset-0 rounded-2xl border-2 border-[#81B64C]/30 dark:border-[#81B64C]/30 animate-ping opacity-30" />
          <div className="absolute -inset-1 rounded-2xl border border-[#81B64C]/20 dark:border-[#81B64C]/20" />

          {/* Logo Box */}
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#81B64C] to-[#557F39] p-0.5 shadow-lg">
            <div className="w-full h-full rounded-[14px] bg-[#111412] flex items-center justify-center relative overflow-hidden">
              {/* Mini 2x2 grid */}
              <div className="absolute inset-0 opacity-15 grid grid-cols-2 grid-rows-2">
                <div className="bg-white" />
                <div className="bg-transparent" />
                <div className="bg-transparent" />
                <div className="bg-white" />
              </div>

              {/* Animated Knight Silhouette */}
              <svg
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 md:w-12 md:h-12 text-[#81B64C] animate-pulse"
              >
                <defs>
                  <linearGradient id="loadKnightGrad" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9DE45C" />
                    <stop offset="0.6" stopColor="#81B64C" />
                    <stop offset="1" stopColor="#557F39" />
                  </linearGradient>
                </defs>
                <rect x="7" y="27" width="22" height="3" rx="1.5" fill="url(#loadKnightGrad)" />
                <path
                  d="M10 27V23.5C10 21 12 19.5 13 18C10.5 17 9.5 14.5 9 12C8.5 9 10.5 6 15 5C19 4 23 5.5 25 8C27 10.5 27 13.5 25.5 17.5C24.5 20 26 23 26 27H10Z"
                  fill="url(#loadKnightGrad)"
                />
                <path
                  d="M19 6.5C18 9 18.5 12 21 14C23 15.5 24 17 24.5 19.5"
                  stroke="#111412"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <circle cx="15.5" cy="9.5" r="1.3" fill="#111412" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading text with animated bar */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#1C201D] dark:text-[#F4F3EA] tracking-wide">
            <span>Setting up the board</span>
            <span className="flex items-center">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </div>

          <div className="w-32 h-1 bg-[#E2E2D9] dark:bg-[#303831] rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-[#557F39] via-[#81B64C] to-[#9DE45C] rounded-full origin-left animate-[shimmer_1.5s_infinite_linear]" />
          </div>
        </div>
      </div>
    </div>
  );
}


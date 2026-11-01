'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, Bot, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log the error to console for debugging
    console.error('64Squares Caught Unhandled Application Error:', error);
  }, [error]);

  const handleCopy = () => {
    const errorText = `Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack || 'N/A'}`;
    navigator.clipboard?.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#E8B45B]/10 dark:bg-[#E8B45B]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E35D5B]/10 dark:bg-[#E35D5B]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center flex flex-col items-center">
        {/* Error Shield Graphic */}
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-6 relative shadow-lg">
          <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-[#E8B45B]" />
          <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded bg-[#E35D5B] text-white text-[10px] font-black uppercase tracking-wider">
            Alert
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E8B45B] text-xs font-bold uppercase tracking-wider mb-3">
          <span>Stalemate Encountered</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl md:text-3xl font-black text-[#1C201D] dark:text-[#F4F3EA] tracking-tight mb-3">
          Unexpected Blunder
        </h1>

        {/* Description */}
        <p className="text-[#626B64] dark:text-[#A5ADA5] text-sm md:text-base leading-relaxed max-w-md mb-6">
          An unexpected error interrupted this move. Your settings and current session are safe. Let&apos;s reset the board or return to safety.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm mb-6">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#557F39] to-[#81B64C] hover:brightness-105 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-white dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] hover:bg-black/5 dark:hover:bg-white/5 text-[#1C201D] dark:text-[#F4F3EA] font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4 text-[#626B64] dark:text-[#A5ADA5]" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Secondary link */}
        <Link
          href="/play/computer"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#557F39] dark:text-[#81B64C] hover:underline mb-6"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Launch fresh game against Stockfish AI</span>
        </Link>

        {/* Collapsible Error Debug Details */}
        <div className="w-full text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs font-semibold text-[#626B64] dark:text-[#A5ADA5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <span className="font-mono">Error Details {error.digest && `(Digest: ${error.digest.slice(0, 8)})`}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-[#E2E2D9] dark:border-[#303831] text-xs font-mono text-[#626B64] dark:text-[#A5ADA5] overflow-x-auto relative">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E2E2D9]/50 dark:border-[#303831]/50">
                <span className="text-[11px] font-bold text-[#E35D5B] uppercase">Diagnostic Log</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-[#557F39] dark:text-[#81B64C] hover:underline"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-bold text-[#1C201D] dark:text-[#F4F3EA] break-words mb-1">
                {error.message || 'Unknown runtime error'}
              </p>
              {error.digest && (
                <p className="text-[11px] opacity-75">Next.js digest: {error.digest}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


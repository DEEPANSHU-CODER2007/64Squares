'use client';

import React, { useEffect, useState } from 'react';
import { GameResult, TerminationReason, PieceColor } from '@/lib/chess/types';
import { Trophy, RotateCcw, Search, Copy, Check, Home, Award, Sparkles, Handshake, AlertOctagon } from 'lucide-react';
import Link from 'next/link';
import { Confetti } from './Confetti';
import { soundManager } from '@/lib/chess/audio';

interface GameOverModalProps {
  isOpen: boolean;
  result: GameResult;
  reason: TerminationReason;
  userColor?: PieceColor;
  whitePlayerName?: string;
  blackPlayerName?: string;
  onRematch?: () => void;
  onNewGame?: () => void;
  pgn: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  result,
  reason,
  userColor,
  whitePlayerName,
  blackPlayerName,
  onRematch,
  onNewGame,
  pgn,
}) => {
  const [copied, setCopied] = useState(false);

  const hasSpecificWinner = (result === '1-0' || result === '0-1');
  const isWinner = userColor
    ? (result === '1-0' && userColor === 'w') || (result === '0-1' && userColor === 'b')
    : hasSpecificWinner;
  const isLoser = userColor
    ? (result === '1-0' && userColor === 'b') || (result === '0-1' && userColor === 'w')
    : false;
  const isDraw = result === '1/2-1/2';

  // Play audio upon modal open
  useEffect(() => {
    if (!isOpen) return;

    if (isWinner) {
      soundManager.playVictory();
    } else if (reason === 'checkmate') {
      soundManager.playCheckmate();
    }
  }, [isOpen, isWinner, reason]);

  if (!isOpen) return null;

  // Calculate move count from PGN
  const moveMatches = pgn.match(/\b\d+\./g);
  const totalMoves = moveMatches ? moveMatches.length : 0;

  let title = 'Game Finished';
  let subtitle = '';

  if (userColor) {
    if (isWinner) {
      title = reason === 'checkmate' ? 'Checkmate — Victory!' : 'Brilliant Victory!';
      subtitle = reason === 'checkmate' 
        ? 'Flawless execution! You delivered checkmate.' 
        : `Opponent surrendered by ${reason}. Well played!`;
    } else if (isLoser) {
      title = reason === 'checkmate' ? 'Checkmate' : 'Defeat';
      subtitle = reason === 'checkmate'
        ? 'Defeated by checkmate. Review the game to find counter-play!'
        : `Game ended by ${reason}. Better luck next game!`;
    } else if (isDraw) {
      title = 'Drawn Match';
      subtitle = reason === 'stalemate' 
        ? 'Stalemate — no legal moves remaining.' 
        : `Drawn by ${reason.replace('_', ' ')}.`;
    }
  } else {
    const wLabel = whitePlayerName || 'White';
    const bLabel = blackPlayerName || 'Black';
    if (result === '1-0') {
      title = reason === 'checkmate' ? `${wLabel} Delivers Checkmate!` : `${wLabel} Wins!`;
      subtitle = `Decisive victory for ${wLabel} by ${reason.replace('_', ' ')}. Well played!`;
    } else if (result === '0-1') {
      title = reason === 'checkmate' ? `${bLabel} Delivers Checkmate!` : `${bLabel} Wins!`;
      subtitle = `Decisive victory for ${bLabel} by ${reason.replace('_', ' ')}. Well played!`;
    } else {
      title = 'Drawn Match';
      subtitle = `Game concluded in a draw (${reason.replace('_', ' ')}).`;
    }
  }

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(pgn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Confetti celebration for victory */}
      <Confetti active={isWinner} durationMs={4000} />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
          {/* Radiant glow accent */}
          <div
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
              isWinner
                ? 'bg-gradient-to-b from-[#9DE45C]/35 via-[#81B64C]/30 to-transparent'
                : isLoser
                ? 'bg-gradient-to-b from-red-600/30 via-red-800/20 to-transparent'
                : 'bg-gradient-to-b from-sky-400/25 to-transparent'
            }`}
          />

          {/* Celebratory Icon with halo */}
          <div className="relative mx-auto mb-4 w-22 h-22 flex items-center justify-center">
            {isWinner && (
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#81B64C] to-amber-400 opacity-20 blur-md animate-pulse" />
            )}
            <div
              className={`absolute inset-0 rounded-3xl animate-ping opacity-25 ${
                isWinner
                  ? 'bg-[#81B64C]'
                  : isLoser
                  ? 'bg-red-500'
                  : 'bg-amber-500'
              }`}
            />
            <div
              className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border shadow-xl ${
                isWinner
                  ? 'bg-gradient-to-br from-[#81B64C]/15 to-amber-400/20 border-[#81B64C] text-[#81B64C] shadow-[#81B64C]/20'
                  : isLoser
                  ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-red-500/10'
                  : 'bg-[#F1F0EB] dark:bg-[#252C27] border-[#E2E2D9] dark:border-[#303831] text-[#557F39] dark:text-[#81B64C]'
              }`}
            >
              {isWinner ? (
                <div className="relative flex items-center justify-center">
                  <Trophy className="w-11 h-11 text-amber-500 dark:text-[#9DE45C] filter drop-shadow-md animate-bounce duration-1000" />
                  <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-2 animate-spin" />
                </div>
              ) : isLoser ? (
                <AlertOctagon className="w-10 h-10 text-red-500" />
              ) : (
                <Handshake className="w-10 h-10 text-[#557F39] dark:text-[#81B64C]" />
              )}
            </div>
          </div>

          {/* Category Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2 ${
              isWinner
                ? 'bg-gradient-to-r from-[#81B64C]/20 to-amber-400/20 text-[#557F39] dark:text-[#9DE45C] border border-[#81B64C]/30 shadow-xs'
                : isLoser
                ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                : 'bg-[#F1F0EB] dark:bg-[#252C27] text-[#557F39] dark:text-[#81B64C] border border-[#E2E2D9] dark:border-[#303831]'
            }`}
          >
            {isWinner && <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
            <span>
              {isWinner ? '★ Victory Achieved ★' : isLoser ? 'Defeat' : 'Drawn Game'}
            </span>
          </div>

          {/* Main Title & Description */}
          <h2 className="text-2xl sm:text-3xl font-black text-[#1C201D] dark:text-[#F4F3EA] tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-[#626B64] dark:text-[#A5ADA5] mt-1.5 max-w-sm mx-auto leading-relaxed font-medium">
            {subtitle}
          </p>

          {/* Winner Performance Ribbon */}
          {isWinner && (
            <div className="mt-3 px-3 py-1.5 rounded-xl bg-[#81B64C]/10 border border-[#81B64C]/20 flex items-center justify-center gap-2 text-xs font-bold text-[#557F39] dark:text-[#9DE45C]">
              <span>👑</span>
              <span>Decisive Victory</span>
            </div>
          )}

          {/* Match Quick Stats Strip */}
          <div className="my-5 p-3 rounded-2xl bg-[#F7F6F2] dark:bg-[#101311] border border-[#E2E2D9] dark:border-[#303831] flex items-center justify-around font-mono text-xs">
            <div>
              <span className="text-[10px] text-[#626B64] dark:text-[#A5ADA5] uppercase block font-sans">
                Result
              </span>
              <span className="font-bold text-[#1C201D] dark:text-[#F4F3EA] text-sm">
                {result}
              </span>
            </div>
            <div className="h-6 w-px bg-[#E2E2D9] dark:bg-[#303831]" />
            <div>
              <span className="text-[10px] text-[#626B64] dark:text-[#A5ADA5] uppercase block font-sans">
                Reason
              </span>
              <span className="font-bold text-[#557F39] dark:text-[#81B64C] capitalize">
                {reason.replace('_', ' ')}
              </span>
            </div>
            {totalMoves > 0 && (
              <>
                <div className="h-6 w-px bg-[#E2E2D9] dark:bg-[#303831]" />
                <div>
                  <span className="text-[10px] text-[#626B64] dark:text-[#A5ADA5] uppercase block font-sans">
                    Moves
                  </span>
                  <span className="font-bold text-[#1C201D] dark:text-[#F4F3EA] text-sm">
                    {totalMoves}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5">
            {onRematch && (
              <button
                onClick={onRematch}
                className="chess-btn-green w-full py-3.5 px-4 font-black text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again (Rematch)</span>
              </button>
            )}

            {onNewGame && (
              <button
                onClick={onNewGame}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1F0EB] hover:bg-[#E5E4DE] dark:bg-[#252C27] dark:hover:bg-[#303831] text-[#1C201D] dark:text-[#F4F3EA] font-semibold text-xs border border-[#E2E2D9] dark:border-[#303831] flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>New Match Setup</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleCopyPgn}
                className="py-2.5 px-3 rounded-xl bg-[#F1F0EB] hover:bg-[#E5E4DE] dark:bg-[#252C27] dark:hover:bg-[#303831] text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#557F39] dark:text-[#81B64C]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied PGN' : 'Copy PGN'}</span>
              </button>

              <Link
                href="/analysis"
                className="py-2.5 px-3 rounded-xl bg-[#F1F0EB] hover:bg-[#E5E4DE] dark:bg-[#252C27] dark:hover:bg-[#303831] text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] border border-[#E2E2D9] dark:border-[#303831] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#557F39] dark:text-[#81B64C]" />
                <span>Analyze Game</span>
              </Link>
            </div>

            <Link
              href="/"
              className="text-xs text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] pt-2 flex items-center justify-center gap-1 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

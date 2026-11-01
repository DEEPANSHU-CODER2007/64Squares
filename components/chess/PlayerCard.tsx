'use client';

import React from 'react';
import { PieceColor, PieceType } from '@/lib/chess/types';
import { Piece } from './Piece';
import { Bot, User, Clock } from 'lucide-react';

interface PlayerCardProps {
  name: string;
  rating?: number;
  color: PieceColor;
  isAi?: boolean;
  timeRemainingMs: number;
  showTimer?: boolean;
  isActiveTurn: boolean;
  connected?: boolean;
  capturedPieces: PieceType[];
  materialAdvantage?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  rating,
  color,
  isAi = false,
  timeRemainingMs,
  showTimer = true,
  isActiveTurn,
  connected = true,
  capturedPieces,
  materialAdvantage = 0,
}) => {
  // Format clock time
  const formatTime = (ms: number) => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Tenths of second when under 10 seconds
    if (totalSeconds < 10) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `${seconds}.${tenths}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingMs > 0 && timeRemainingMs <= 30000;
  const isCriticalTime = timeRemainingMs > 0 && timeRemainingMs <= 10000;

  // Group captured pieces
  const pieceCounts: Record<PieceType, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  capturedPieces.forEach((p) => {
    pieceCounts[p] = (pieceCounts[p] || 0) + 1;
  });

  const capturedOpponentColor = color === 'w' ? 'b' : 'w';

  return (
    <div
      className={`flex items-center justify-between px-2 sm:px-3 py-1.5 rounded-xl transition-all w-full select-none ${
        isActiveTurn
          ? 'bg-black/5 dark:bg-[#262421]/90 border border-[#557F39]/50 dark:border-[#81B64C]/50 shadow-xs'
          : 'bg-transparent border border-transparent'
      }`}
    >
      {/* Player info: Avatar + Name + Captures */}
      <div className="flex items-center gap-2.5">
        {/* Avatar Square matching user's screenshot */}
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs transition-colors ${
              color === 'w'
                ? 'bg-[#E8E4D8] border-[#D6D3D1] text-[#20251F]'
                : 'bg-[#312E2B] border-[#44403C] text-[#E8E4D8]'
            }`}
          >
            {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#161512] ${
              connected ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            title={connected ? 'Connected' : 'Disconnected'}
          />
        </div>

        {/* Player Name and Captured Pieces Strip */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-xs sm:text-sm text-[#1C201D] dark:text-[#F4F3EA] max-w-[120px] sm:max-w-[180px] truncate">
              {name}
            </span>
            {rating && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/5 dark:bg-[#312E2B] text-[#626B64] dark:text-[#A5ADA5] font-mono">
                {rating}
              </span>
            )}
          </div>

          {/* Captured pieces */}
          <div className="flex items-center gap-0.5 mt-1 min-h-[14px]">
            {(['p', 'n', 'b', 'r', 'q'] as PieceType[]).map((pt) => {
              const count = pieceCounts[pt];
              if (!count) return null;
              return (
                <div key={pt} className="flex items-center -space-x-1">
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <Piece type={pt} color={capturedOpponentColor} size={12} />
                  </div>
                  {count > 1 && (
                    <span className="text-[9px] text-[#626B64] dark:text-[#A5ADA5] font-bold pl-0.5">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
            {materialAdvantage > 0 && (
              <span className="text-[10px] font-black text-[#557F39] dark:text-[#81B64C] ml-1">
                +{materialAdvantage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* High-visibility Digital Clock (Hidden in Unlimited mode) */}
      {showTimer && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-black transition-all ${
            isCriticalTime
              ? 'bg-red-950/90 border border-red-500 text-red-400 animate-pulse shadow-md'
              : isLowTime
              ? 'bg-amber-950/70 border border-amber-500 text-amber-300'
              : isActiveTurn
              ? 'bg-[#E8E4D8] dark:bg-[#312E2B] border border-[#557F39] dark:border-[#81B64C] text-[#20251F] dark:text-white shadow-xs'
              : 'bg-black/5 dark:bg-[#21201D] border border-[#E2E2D9] dark:border-[#312E2B] text-[#626B64] dark:text-[#A5ADA5]'
          }`}
        >
          <Clock className={`w-3 h-3 ${isActiveTurn ? 'text-[#557F39] dark:text-[#81B64C]' : 'text-[#7A857D] dark:text-[#8E9790]'}`} />
          <span>{formatTime(timeRemainingMs)}</span>
        </div>
      )}
    </div>
  );
};

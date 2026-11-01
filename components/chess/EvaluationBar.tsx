'use client';

import React from 'react';

interface EvaluationBarProps {
  score: number; // centipawns in pawns (e.g. +1.5, -2.4)
  isMate?: boolean;
  mateIn?: number;
  orientation?: 'w' | 'b';
  height?: number | string;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  score,
  isMate = false,
  mateIn,
  orientation = 'w',
  height = '100%',
}) => {
  // Convert score into percentage (0 to 100%)
  // Score clamped between -10 and +10
  let whitePercentage = 50;

  if (isMate && mateIn !== undefined) {
    whitePercentage = mateIn > 0 ? 100 : 0;
  } else {
    // Sigmoid compression: 1 / (1 + 10^(-score / 4))
    const clamped = Math.max(-15, Math.min(15, score));
    whitePercentage = 50 + (clamped / 15) * 50;
  }

  // Text display
  let label = '0.0';
  if (isMate && mateIn !== undefined) {
    label = `M${Math.abs(mateIn)}`;
  } else {
    const sign = score > 0 ? '+' : '';
    label = `${sign}${score.toFixed(1)}`;
  }

  const whiteHeight = orientation === 'w' ? `${whitePercentage}%` : `${100 - whitePercentage}%`;

  return (
    <div
      style={{ height }}
      className="w-7 md:w-8 rounded-lg overflow-hidden flex flex-col justify-end bg-[#20251F] border border-[#303831] relative shadow-inner select-none font-mono"
      title={`Evaluation: ${label}`}
    >
      {/* White advantage bar */}
      <div
        style={{ height: whiteHeight }}
        className="w-full bg-[#E8E4D8] transition-all duration-300 ease-out"
      />

      {/* Eval score badge inside */}
      <div className="absolute inset-0 flex flex-col justify-between items-center py-2 text-[10px] md:text-xs font-bold pointer-events-none">
        {whitePercentage < 50 ? (
          <span className="text-[#F4F3EA] drop-shadow-sm">{label}</span>
        ) : (
          <span />
        )}
        {whitePercentage >= 50 ? (
          <span className="text-[#101311] drop-shadow-sm">{label}</span>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};


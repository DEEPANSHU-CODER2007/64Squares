'use client';

import React, { useRef, useEffect } from 'react';
import { DetailedMove } from '@/lib/chess/types';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Copy, Download } from 'lucide-react';

interface MoveHistoryProps {
  history: DetailedMove[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
  pgn: string;
  fen: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentMoveIndex,
  onSelectMove,
  pgn,
  fen,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  // Group moves into pairs: [White, Black]
  const movePairs: { moveNumber: number; white: DetailedMove; whiteIdx: number; black?: DetailedMove; blackIdx?: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIdx: i,
      black: history[i + 1],
      blackIdx: i + 1 < history.length ? i + 1 : undefined,
    });
  }

  // Auto-scroll to active move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadPgn = () => {
    const blob = new Blob([pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `64squares-game-${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] dark:bg-[#171B18] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl overflow-hidden shadow-xs">
      <div className="px-4 py-2.5 border-b border-[#E2E2D9] dark:border-[#303831] flex items-center justify-between bg-[#F7F6F2] dark:bg-[#1D231F]">
        <h3 className="text-xs font-bold text-[#1C201D] dark:text-[#F4F3EA] uppercase tracking-wider">Move List</h3>
        <div className="text-[11px] font-mono text-[#626B64] dark:text-[#A5ADA5]">
          {history.length} {history.length === 1 ? 'ply' : 'plies'}
        </div>
      </div>

      {/* Move table */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-0.5">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#7A857D] dark:text-[#8E9790] italic p-6 text-center">
            Moves will appear here as the game progresses.
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.moveNumber}
              className="grid grid-cols-12 items-center py-0.5 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs"
            >
              <span className="col-span-2 text-[#7A857D] dark:text-[#8E9790] font-sans font-medium text-[11px]">
                {pair.moveNumber}.
              </span>
              <button
                onClick={() => onSelectMove(pair.whiteIdx)}
                className={`col-span-5 text-left px-2 py-0.5 rounded-md transition-colors ${
                  currentMoveIndex === pair.whiteIdx
                    ? 'bg-[#557F39] dark:bg-[#81B64C] text-white dark:text-[#101311] font-bold shadow-2xs'
                    : 'text-[#1C201D] dark:text-[#F4F3EA] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {pair.white.san}
              </button>
              {pair.black && pair.blackIdx !== undefined && (
                <button
                  onClick={() => onSelectMove(pair.blackIdx!)}
                  className={`col-span-5 text-left px-2 py-0.5 rounded-md transition-colors ${
                    currentMoveIndex === pair.blackIdx
                      ? 'bg-[#557F39] dark:bg-[#81B64C] text-white dark:text-[#101311] font-bold shadow-2xs'
                      : 'text-[#1C201D] dark:text-[#F4F3EA] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {pair.black.san}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Navigation controls */}
      <div className="p-2 border-t border-[#E2E2D9] dark:border-[#303831] bg-[#F7F6F2] dark:bg-[#1D231F] flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onSelectMove(-1)}
            disabled={history.length === 0 || currentMoveIndex === -1}
            title="Start"
            className="p-1.5 rounded-lg text-[#626B64] dark:text-[#A5ADA5] hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectMove(Math.max(-1, currentMoveIndex - 1))}
            disabled={history.length === 0 || currentMoveIndex === -1}
            title="Previous move"
            className="p-1.5 rounded-lg text-[#626B64] dark:text-[#A5ADA5] hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectMove(Math.min(history.length - 1, currentMoveIndex + 1))}
            disabled={history.length === 0 || currentMoveIndex === history.length - 1}
            title="Next move"
            className="p-1.5 rounded-lg text-[#626B64] dark:text-[#A5ADA5] hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectMove(history.length - 1)}
            disabled={history.length === 0 || currentMoveIndex === history.length - 1}
            title="Latest move"
            className="p-1.5 rounded-lg text-[#626B64] dark:text-[#A5ADA5] hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCopy(pgn, 'PGN')}
            title="Copy PGN"
            className="p-1.5 rounded-lg text-[#626B64] dark:text-[#A5ADA5] hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative"
          >
            <Copy className="w-4 h-4" />
            {copied === 'PGN' && (
              <span className="absolute -top-7 right-0 text-[10px] bg-[#557F39] dark:bg-[#81B64C] text-white dark:text-[#101311] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                Copied!
              </span>
            )}
          </button>
          <button
            onClick={handleDownloadPgn}
            title="Download PGN"
            className="p-1.5 rounded-lg text-[#626B64] dark:text-[#A5ADA5] hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

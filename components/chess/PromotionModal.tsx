import React from 'react';
import { PieceColor } from '@/lib/chess/types';
import { Piece } from './Piece';

interface PromotionModalProps {
  isOpen: boolean;
  color: PieceColor;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, color, onSelect, onCancel }) => {
  if (!isOpen) return null;

  const pieces: ('q' | 'r' | 'b' | 'n')[] = ['q', 'r', 'b', 'n'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1D231F] border border-[#E2E2D9] dark:border-[#303831] rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
        <h3 className="text-xl font-semibold text-[#1C201D] dark:text-[#F4F3EA] mb-1">Promote Pawn</h3>
        <p className="text-sm text-[#626B64] dark:text-[#A5ADA5] mb-5">Select a piece to promote your pawn to</p>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {pieces.map((pieceType) => {
            const names: Record<string, string> = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };
            return (
              <button
                key={pieceType}
                onClick={() => onSelect(pieceType)}
                className="group flex flex-col items-center justify-center p-3 rounded-xl bg-[#F1F0EB] dark:bg-[#252C27] hover:bg-[#557F39]/10 dark:hover:bg-[#81B64C]/20 border border-[#E2E2D9] dark:border-[#303831] hover:border-[#557F39] dark:hover:border-[#81B64C] transition-all transform hover:scale-105 focus:outline-hidden focus:ring-2 focus:ring-[#557F39] dark:focus:ring-[#81B64C]"
                title={names[pieceType]}
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Piece type={pieceType} color={color} size={44} />
                </div>
                <span className="text-xs text-[#626B64] dark:text-[#A5ADA5] group-hover:text-[#1C201D] dark:group-hover:text-[#F4F3EA] mt-1 font-medium">
                  {names[pieceType]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-[#626B64] dark:text-[#A5ADA5] hover:text-[#1C201D] dark:hover:text-[#F4F3EA] transition-colors py-1.5 px-3 rounded-md hover:bg-[#F1F0EB] dark:hover:bg-[#252C27]"
        >
          Cancel move
        </button>
      </div>
    </div>
  );
};

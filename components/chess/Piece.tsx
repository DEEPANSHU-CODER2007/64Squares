import React from 'react';
import { PieceType, PieceColor } from '@/lib/chess/types';

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
  size?: number | string;
}

export const Piece: React.FC<PieceProps> = ({ type, color, className = '', size = '100%' }) => {
  const pieceKey = `${color}${type}`;
  const altText = `${color === 'w' ? 'White' : 'Black'} ${
    type === 'p' ? 'Pawn' :
    type === 'n' ? 'Knight' :
    type === 'b' ? 'Bishop' :
    type === 'r' ? 'Rook' :
    type === 'q' ? 'Queen' : 'King'
  }`;

  return (
    <img
      src={`/pieces/neo/${pieceKey}.png`}
      alt={altText}
      width={300}
      height={300}
      draggable={false}
      style={size !== '100%' ? { width: size, height: size } : undefined}
      className={`w-full h-full object-contain pointer-events-none select-none transition-transform ${className}`}
      loading="eager"
      decoding="async"
    />
  );
};

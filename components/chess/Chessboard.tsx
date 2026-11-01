'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Square, MoveAttempt, PieceColor, PieceType, DetailedMove, BoardTheme, BOARD_THEMES } from '@/lib/chess/types';
import { ChessGame } from '@/lib/chess/chess-rules';
import { Piece } from './Piece';
import { PromotionModal } from './PromotionModal';

interface ChessboardProps {
  game: ChessGame;
  orientation?: PieceColor;
  theme?: BoardTheme;
  interactive?: boolean;
  playerColor?: PieceColor | 'both';
  lastMove?: { from: Square; to: Square } | null;
  bestMoveArrow?: { from: Square; to: Square } | null;
  moveBadge?: {
    square: Square;
    label?: string;
    type?: 'brilliant' | 'great' | 'best' | 'blunder' | 'mistake' | 'book';
  } | null;
  onMove?: (move: MoveAttempt) => void;
  showCoordinates?: boolean;
  showLegalMoves?: boolean;
  customSquareStyles?: Record<string, string>;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  game,
  orientation = 'w',
  theme = BOARD_THEMES[0],
  interactive = true,
  playerColor = 'both',
  lastMove = null,
  bestMoveArrow = null,
  moveBadge = null,
  onMove,
  showCoordinates = true,
  showLegalMoves = true,
  customSquareStyles = {},
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<DetailedMove[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  // Clear selection if turn changes or board resets
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [game.fen]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!interactive) return;

      const piece = game.get(square);
      const isPlayerTurn = playerColor === 'both' || playerColor === game.turn;

      if (!isPlayerTurn) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // If a square is already selected
      if (selectedSquare) {
        // If clicking the same square, deselect
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        // Check if clicking a legal move destination
        const move = legalMoves.find((m) => m.to === square);
        if (move) {
          // Check for pawn promotion
          const selectedPiece = game.get(selectedSquare);
          const isPawn = selectedPiece && selectedPiece.type === 'p';
          const isPromotionRank = (selectedPiece?.color === 'w' && square[1] === '8') ||
                                  (selectedPiece?.color === 'b' && square[1] === '1');

          if (isPawn && isPromotionRank) {
            setPendingPromotion({ from: selectedSquare, to: square });
            return;
          }

          // Execute regular move
          setSelectedSquare(null);
          setLegalMoves([]);
          onMove?.({ from: selectedSquare, to: square });
          return;
        }

        // If clicking another piece belonging to the active player
        if (piece && piece.color === game.turn && (playerColor === 'both' || piece.color === playerColor)) {
          setSelectedSquare(square);
          setLegalMoves(game.getLegalMoves(square));
          return;
        }

        // Clicked invalid square, deselect
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // No square selected yet: select if it's the moving player's piece
      if (piece && piece.color === game.turn && (playerColor === 'both' || piece.color === playerColor)) {
        setSelectedSquare(square);
        setLegalMoves(game.getLegalMoves(square));
      }
    },
    [game, interactive, legalMoves, onMove, playerColor, selectedSquare]
  );

  const handlePromotionSelect = (promotedPiece: 'q' | 'r' | 'b' | 'n') => {
    if (pendingPromotion) {
      onMove?.({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: promotedPiece,
      });
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!interactive) return;
    const piece = game.get(square);
    const isPlayerTurn = playerColor === 'both' || playerColor === game.turn;
    if (!isPlayerTurn || !piece || piece.color !== game.turn) {
      e.preventDefault();
      return;
    }

    setDraggedSquare(square);
    setSelectedSquare(square);
    setLegalMoves(game.getLegalMoves(square));
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const sourceSquare = draggedSquare || (e.dataTransfer.getData('text/plain') as Square);
    setDraggedSquare(null);

    if (!sourceSquare || sourceSquare === targetSquare) return;

    const move = game.getLegalMoves(sourceSquare).find((m) => m.to === targetSquare);
    if (!move) return;

    const piece = game.get(sourceSquare);
    const isPawn = piece && piece.type === 'p';
    const isPromotionRank = (piece?.color === 'w' && targetSquare[1] === '8') ||
                            (piece?.color === 'b' && targetSquare[1] === '1');

    if (isPawn && isPromotionRank) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return;
    }

    setSelectedSquare(null);
    setLegalMoves([]);
    onMove?.({ from: sourceSquare, to: targetSquare });
  };

  // Generate ranks and files based on orientation
  const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  const isCheckmate = game.isCheckmate();
  const kingInCheckSquare = (game.inCheck() || isCheckmate) ? game.getKingSquare(game.turn) : null;

  return (
    <div
      className={`relative select-none w-full aspect-[8/8.8] sm:aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isCheckmate
          ? 'ring-4 ring-red-600 shadow-[0_0_50px_rgba(220,38,38,0.7)] animate-board-shake bg-[#1a0a0a]'
          : 'border border-black/15 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.25)]'
      }`}
    >
      {/* Lethal Checkmate Perimeter Danger Vignette */}
      {isCheckmate && (
        <div className="absolute inset-0 pointer-events-none ring-4 sm:ring-8 ring-red-600/70 shadow-[inset_0_0_80px_rgba(220,38,38,0.65)] animate-pulse z-30" />
      )}

      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank, rankIdx) =>
          files.map((file, fileIdx) => {
            const square = `${file}${rank}` as Square;
            const piece = game.get(square);
            const isLightSquare = (fileIdx + rankIdx) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isKingInCheck = kingInCheckSquare === square;
            const isLegalDestination = showLegalMoves && legalMoves.some((m) => m.to === square);
            const isCapture = isLegalDestination && piece !== null;

            // Coordinates placement
            const showRankCoord = showCoordinates && fileIdx === 0;
            const showFileCoord = showCoordinates && rankIdx === 7;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                style={{
                  backgroundColor: isLightSquare ? theme.lightSquare : theme.darkSquare,
                }}
                className={`relative flex items-center justify-center cursor-pointer select-none transition-colors duration-75 ${
                  customSquareStyles[square] || ''
                }`}
                data-square={square}
              >
                {/* Last move highlight (Chess.com Signature Olive-Yellow) */}
                {isLastMove && (
                  <div
                    className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
                      isLightSquare ? 'bg-[#F5F682]/60' : 'bg-[#BACA44]/70'
                    }`}
                  />
                )}

                {/* Selected square highlight */}
                {isSelected && (
                  <div
                    className={`absolute inset-0 pointer-events-none ${
                      isLightSquare ? 'bg-[#F5F682]/85' : 'bg-[#BACA44]/90'
                    }`}
                  />
                )}

                {/* King in Check / Checkmate: Menacing Red Dangerous Glow around King */}
                {isKingInCheck && (
                  <div
                    className={`absolute inset-0 pointer-events-none z-10 overflow-hidden ${
                      isCheckmate ? 'animate-pulse' : ''
                    }`}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: isCheckmate
                          ? 'radial-gradient(circle at 50% 50%, #FF0000 0%, #D80000 32%, rgba(180, 0, 0, 0.75) 65%, transparent 88%)'
                          : 'radial-gradient(circle at 50% 50%, #FF1A1A 0%, #C80000 28%, rgba(160, 0, 0, 0.5) 60%, transparent 82%)',
                        boxShadow: isCheckmate
                          ? 'inset 0 0 16px rgba(255, 0, 0, 0.9), 0 0 24px rgba(255, 0, 0, 0.7)'
                          : undefined,
                      }}
                    />
                  </div>
                )}

                {/* Rank coordinate (top-left of square) */}
                {showRankCoord && (
                  <span
                    className={`absolute top-0.5 left-0.5 sm:left-1 text-[9px] sm:text-[11px] md:text-xs font-black leading-none pointer-events-none select-none z-20 ${
                      isLightSquare ? 'text-[#769656]' : 'text-[#EEEED2]'
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* File coordinate (bottom-right of square) */}
                {showFileCoord && (
                  <span
                    className={`absolute bottom-0.5 right-0.5 sm:right-1 text-[9px] sm:text-[11px] md:text-xs font-black leading-none pointer-events-none select-none z-20 ${
                      isLightSquare ? 'text-[#769656]' : 'text-[#EEEED2]'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Legal destination indicators */}
                {isLegalDestination && !isCapture && (
                  <div className="absolute w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-black/25 dark:bg-black/30 pointer-events-none" />
                )}
                {isLegalDestination && isCapture && (
                  <div className="absolute inset-1 rounded-full border-4 border-black/25 dark:border-black/30 pointer-events-none" />
                )}

                {/* Move Quality Badge (Brilliant !!, Great !, Blunder ??, etc.) */}
                {moveBadge && moveBadge.square === square && (
                  <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 z-30 pointer-events-none animate-in zoom-in-75 duration-200">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] sm:text-xs shadow-md border-2 border-white select-none ${
                        moveBadge.type === 'brilliant' || moveBadge.label === '!!'
                          ? 'bg-[#1BAFA0]'
                          : moveBadge.type === 'great' || moveBadge.label === '!'
                          ? 'bg-[#5C8BB0]'
                          : moveBadge.type === 'best'
                          ? 'bg-[#81B64C]'
                          : moveBadge.type === 'blunder' || moveBadge.label === '??'
                          ? 'bg-[#FA412D]'
                          : 'bg-[#E58F2A]'
                      }`}
                    >
                      {moveBadge.label || (moveBadge.type === 'brilliant' ? '!!' : moveBadge.type === 'blunder' ? '??' : '!')}
                    </div>
                  </div>
                )}

                {/* Chess piece */}
                {piece && (
                  <div
                    draggable={interactive && (playerColor === 'both' || playerColor === piece.color)}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-full h-full p-0 sm:p-0.5 md:p-1 flex items-center justify-center z-10 transition-transform active:scale-95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                  >
                    <Piece type={piece.type as PieceType} color={piece.color as PieceColor} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Visual Best Move Arrow Overlay */}
      {bestMoveArrow && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 800 800"
        >
          <defs>
            <marker
              id="bestMoveArrowHead"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#81B64C" />
            </marker>
            <marker
              id="bestMoveArrowHeadShadow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(0,0,0,0.5)" />
            </marker>
          </defs>
          {(() => {
            const getSquareCenter = (sq: Square) => {
              const file = sq[0];
              const rank = parseInt(sq[1], 10);
              const fileIdx = orientation === 'w' ? file.charCodeAt(0) - 97 : 104 - file.charCodeAt(0);
              const rankIdx = orientation === 'w' ? 8 - rank : rank - 1;
              return { x: fileIdx * 100 + 50, y: rankIdx * 100 + 50 };
            };

            const start = getSquareCenter(bestMoveArrow.from);
            const end = getSquareCenter(bestMoveArrow.to);
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;
            const ux = dx / dist;
            const uy = dy / dist;
            const sx = start.x + ux * 14;
            const sy = start.y + uy * 14;
            const ex = end.x - ux * 20;
            const ey = end.y - uy * 20;

            return (
              <g className="animate-in fade-in duration-150">
                {/* Contrast Shadow line */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="15"
                  strokeLinecap="round"
                  markerEnd="url(#bestMoveArrowHeadShadow)"
                />
                {/* Vibrant Emerald Arrow */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke="#81B64C"
                  strokeWidth="11"
                  strokeLinecap="round"
                  markerEnd="url(#bestMoveArrowHead)"
                  className="filter drop-shadow-[0_0_8px_rgba(129,182,76,0.7)]"
                />
                {/* Start Square Anchor Circle */}
                <circle cx={start.x} cy={start.y} r="10" fill="#81B64C" opacity="0.9" />
              </g>
            );
          })()}
        </svg>
      )}

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={pendingPromotion !== null}
        color={game.turn}
        onSelect={handlePromotionSelect}
        onCancel={() => setPendingPromotion(null)}
      />
    </div>
  );
};


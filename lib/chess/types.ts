export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface PieceInfo {
  type: PieceType;
  color: PieceColor;
}

export interface SquareCoordinates {
  file: number; // 0 to 7 (a to h)
  rank: number; // 0 to 7 (1 to 8)
}

export type Square =
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

export interface MoveAttempt {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface DetailedMove {
  from: Square;
  to: Square;
  san: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
  before: string; // FEN before move
  after: string; // FEN after move
}

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*';

export type TerminationReason =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'fifty_moves'
  | 'resignation'
  | 'timeout'
  | 'agreement'
  | 'abandoned'
  | 'active';

export type EngineDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export interface TimeControl {
  name: string;
  baseSeconds: number;
  incrementSeconds: number;
  category: 'bullet' | 'blitz' | 'rapid' | 'unlimited';
}

export const TIME_CONTROLS: Record<string, TimeControl> = {
  'unlimited': { name: 'Unlimited', baseSeconds: 0, incrementSeconds: 0, category: 'unlimited' },
  '1+0': { name: '1 min', baseSeconds: 60, incrementSeconds: 0, category: 'bullet' },
  '3+0': { name: '3 min', baseSeconds: 180, incrementSeconds: 0, category: 'blitz' },
  '3+2': { name: '3 | 2', baseSeconds: 180, incrementSeconds: 2, category: 'blitz' },
  '5+0': { name: '5 min', baseSeconds: 300, incrementSeconds: 0, category: 'blitz' },
  '10+0': { name: '10 min', baseSeconds: 600, incrementSeconds: 0, category: 'rapid' },
  '15+10': { name: '15 | 10', baseSeconds: 900, incrementSeconds: 10, category: 'rapid' },
};

export interface PlayerState {
  id: string;
  name: string;
  isAi?: boolean;
  isGuest?: boolean;
  color: PieceColor;
  timeRemainingMs: number;
  connected?: boolean;
}

export interface BoardTheme {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'emerald', name: 'Emerald (Chess.com)', lightSquare: '#EEEED2', darkSquare: '#769656' },
  { id: 'classic', name: 'Classic Wood', lightSquare: '#F0D9B5', darkSquare: '#B58863' },
  { id: 'charcoal', name: 'Charcoal', lightSquare: '#D1D5DB', darkSquare: '#4B5563' },
  { id: 'ocean', name: 'Ocean Blue', lightSquare: '#DEE3E6', darkSquare: '#8CA2AD' },
  { id: 'sand', name: 'Sandcastle', lightSquare: '#EFEFEF', darkSquare: '#C0A080' },
];


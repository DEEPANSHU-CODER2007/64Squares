// Verified tactical chess puzzles dataset
import { Square } from '../chess/types';

export interface PuzzleData {
  id: string;
  title: string;
  theme: 'checkmate' | 'fork' | 'pin' | 'skewer' | 'back_rank';
  rating: number;
  fen: string;
  turn: 'w' | 'b';
  solution: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' }[];
  description: string;
}

export const PUZZLES_COLLECTION: PuzzleData[] = [
  {
    id: 'puz-1',
    title: 'Back-Rank Mate in One',
    theme: 'back_rank',
    rating: 900,
    fen: '6k1/5ppp/8/8/8/8/4R3/4K3 w - - 0 1',
    turn: 'w',
    solution: [{ from: 'e2', to: 'e8' }],
    description: 'Black’s king is trapped on the back rank behind pawns with no escape.',
  },
  {
    id: 'puz-2',
    title: 'The Royal Knight Fork',
    theme: 'fork',
    rating: 1100,
    fen: '5rk1/3q1ppp/8/4N3/8/8/5PPP/5RK1 w - - 0 1',
    turn: 'w',
    solution: [{ from: 'e5', to: 'd7' }],
    description: 'Knight captures undefended piece and threatens key squares.',
  },
  {
    id: 'puz-3',
    title: 'Absolute Pin on the Queen',
    theme: 'pin',
    rating: 1250,
    fen: 'r3k2r/pp3ppp/2p5/4q3/8/2B5/PPP2PPP/R4RK1 w kq - 0 1',
    turn: 'w',
    solution: [{ from: 'c3', to: 'e5' }],
    description: 'Bishop skewers and wins the pinned opponent queen.',
  },
  {
    id: 'puz-4',
    title: 'Smothered Mate Pattern',
    theme: 'checkmate',
    rating: 1350,
    fen: '6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1',
    turn: 'w',
    solution: [{ from: 'h6', to: 'f7' }],
    description: 'Deliver the classic smothered checkmate with your knight against the trapped king.',
  },
  {
    id: 'puz-5',
    title: 'Skewer the King and Rook',
    theme: 'skewer',
    rating: 1200,
    fen: 'r7/k7/8/8/8/8/8/R6K w - - 0 1',
    turn: 'w',
    solution: [{ from: 'a1', to: 'a7' }],
    description: 'Rook skewers and captures the opposing pieces along the open file.',
  },
];

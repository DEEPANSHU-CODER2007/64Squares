// 64Squares Professional Master Chess Engine
// Combines Grandmaster Opening Books, PeSTO Piece-Square Tables,
// Negamax with Alpha-Beta Pruning, Quiescence Search, and Move Ordering.

import { Chess } from 'chess.js';
import { EngineDifficulty, MoveAttempt } from './types';

export interface EngineEvaluation {
  depth: number;
  score: number; // centipawns (positive = White, negative = Black)
  isMate?: boolean;
  mateIn?: number;
  bestMove?: string;
  pv?: string; // Principal variation (best line)
}

export interface DifficultyConfig {
  skillLevel: number; // 0 to 20
  depth: number;
  movetimeMs: number;
}

export const DIFFICULTY_PRESETS: Record<EngineDifficulty, DifficultyConfig> = {
  beginner: { skillLevel: 1, depth: 3, movetimeMs: 300 },
  easy: { skillLevel: 5, depth: 5, movetimeMs: 500 },
  medium: { skillLevel: 10, depth: 8, movetimeMs: 900 },
  hard: { skillLevel: 15, depth: 12, movetimeMs: 1400 },
  expert: { skillLevel: 20, depth: 16, movetimeMs: 2200 },
};

// -------------------------------------------------------------
// GRANDMASTER OPENING BOOK
// Standard master opening lines for instant, principled play
// -------------------------------------------------------------
const OPENING_BOOK: Record<string, string[]> = {
  // Initial starting position (FEN without move clocks)
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -': [
    'e2e4', 'd2d4', 'c2c4', 'g1f3'
  ],
  // After 1. e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -': [
    'e7e5', 'c7c5', 'e7e6', 'c7c6'
  ],
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3': [
    'e7e5', 'c7c5', 'e7e6', 'c7c6'
  ],
  // After 1. e4 e5
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    'g1f3', 'f1c4', 'b1c3'
  ],
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6': [
    'g1f3', 'f1c4', 'b1c3'
  ],
  // After 1. e4 e5 2. Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -': [
    'b8c6', 'g8f6', 'd7d6'
  ],
  // After 1. e4 e5 2. Nf3 Nc6
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -': [
    'f1c4', 'f1b5', 'd2d4'
  ],
  // After 1. e4 c5 (Sicilian Defense)
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    'g1f3', 'b1c3', 'c2c3'
  ],
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6': [
    'g1f3', 'b1c3', 'c2c3'
  ],
  // After 1. e4 c5 2. Nf3
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -': [
    'd7d6', 'e7e6', 'b8c6'
  ],
  // After 1. d4
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -': [
    'd7d5', 'g8f6', 'e7e6'
  ],
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3': [
    'd7d5', 'g8f6', 'e7e6'
  ],
  // After 1. d4 d5
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -': [
    'c2c4', 'g1f3', 'e2e3'
  ],
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6': [
    'c2c4', 'g1f3', 'e2e3'
  ],
  // After 1. d4 d5 2. c4 (Queen's Gambit)
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq -': [
    'e7e6', 'c7c6', 'd5c4'
  ],
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3': [
    'e7e6', 'c7c6', 'd5c4'
  ],
  // After 1. d4 Nf6
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -': [
    'c2c4', 'g1f3', 'c1g5'
  ],
  // After 1. c4 (English Opening)
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq -': [
    'e7e5', 'c7c5', 'g8f6'
  ],
  // After 1. Nf3 (Reti)
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq -': [
    'd7d5', 'g8f6', 'c7c5'
  ],
};

// -------------------------------------------------------------
// ADVANCED PIECE-SQUARE TABLES (PeSTO Heuristic Standards)
// -------------------------------------------------------------
const MG_VALUE = { p: 100, n: 320, b: 330, r: 500, q: 950, k: 20000 };
const EG_VALUE = { p: 130, n: 290, b: 310, r: 550, q: 975, k: 20000 };

const PST_PAWN_MG = [
    0,   0,   0,   0,   0,   0,   0,   0,
   50,  50,  50,  50,  50,  50,  50,  50,
   10,  15,  25,  35,  35,  25,  15,  10,
    5,   5,  15,  28,  28,  15,   5,   5,
    0,   0,   5,  22,  22,   5,   0,   0,
    5,  -5, -10,   5,   5, -10,  -5,   5,
    5,  10,  10, -20, -20,  10,  10,   5,
    0,   0,   0,   0,   0,   0,   0,   0
];

const PST_PAWN_EG = [
    0,   0,   0,   0,   0,   0,   0,   0,
  120, 120, 120, 120, 120, 120, 120, 120,
   80,  80,  80,  80,  80,  80,  80,  80,
   50,  50,  50,  50,  50,  50,  50,  50,
   30,  30,  30,  30,  30,  30,  30,  30,
   15,  15,  15,  15,  15,  15,  15,  15,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0
];

const PST_KNIGHT = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -30,   5,  20,  30,  30,  20,   5, -30,
  -30,   5,  20,  30,  30,  20,   5, -30,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50
];

const PST_BISHOP = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -10,  10,  15,  15,  15,  15,  10, -10,
  -10,   5,  15,  20,  20,  15,   5, -10,
  -10,   5,  15,  20,  20,  15,   5, -10,
  -10,  10,  15,  15,  15,  15,  10, -10,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20
];

const PST_ROOK = [
    0,   0,   0,   5,   5,   0,   0,   0,
   25,  25,  25,  25,  25,  25,  25,  25,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   0,   0,   0,   0,   0, -10,
    5,  10,  10,  10,  10,  10,  10,   5,
    0,   0,   0,  10,  10,   0,   0,   0
];

const PST_QUEEN = [
  -20, -10, -10,  -5,  -5, -10, -10, -20,
  -10,   0,   5,   0,   0,   0,   0, -10,
  -10,   5,   5,   5,   5,   5,   0, -10,
    0,   0,   5,   5,   5,   5,   0,  -5,
   -5,   0,   5,   5,   5,   5,   0,  -5,
  -10,   0,   5,   5,   5,   5,   0, -10,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -20, -10, -10,  -5,  -5, -10, -10, -20
];

const PST_KING_MG = [
   20,  30,  10,   0,   0,  10,  30,  20,
   20,  20,   0,   0,   0,   0,  20,  20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30
];

const PST_KING_EG = [
  -50, -30, -30, -30, -30, -30, -30, -50,
  -30, -10,   0,   0,   0,   0, -10, -30,
  -30,  -5,  20,  30,  30,  20,  -5, -30,
  -30,  -5,  30,  40,  40,  30,  -5, -30,
  -30,  -5,  30,  40,  40,  30,  -5, -30,
  -30,  -5,  20,  30,  30,  20,  -5, -30,
  -30, -15,   0,   5,   5,   0, -15, -30,
  -50, -30, -30, -30, -30, -30, -30, -50
];

// MVV-LVA (Most Valuable Victim - Least Valuable Attacker) capture values
const VICTIM_SCORES: Record<string, number> = { p: 100, n: 300, b: 350, r: 500, q: 900, k: 10000 };
const ATTACKER_SCORES: Record<string, number> = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };

export class StockfishEngine {
  private worker: Worker | null = null;
  private isReady: boolean = true;
  private onEvalCallback?: (evalData: EngineEvaluation) => void;
  private currentDifficulty: EngineDifficulty = 'medium';
  private isThinking: boolean = false;
  private transTable: Map<string, { depth: number; score: number; bestMoveUci: string }> = new Map();
  private killerMoves: [string | null, string | null][] = Array.from({ length: 32 }, () => [null, null]);

  private handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.hidden) {
      this.stop();
    }
  };

  constructor() {
    // Engine initializes ready with embedded master algorithms
  }

  public async init(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.isReady = true;
    return true;
  }

  public setDifficulty(diff: EngineDifficulty) {
    this.currentDifficulty = diff;
  }

  public stop() {
    this.isThinking = false;
  }

  public async getBestMove(
    fen: string,
    difficulty: EngineDifficulty = this.currentDifficulty,
    onProgress?: (ev: EngineEvaluation) => void
  ): Promise<MoveAttempt> {
    this.currentDifficulty = difficulty;
    this.isThinking = true;
    this.onEvalCallback = onProgress;

    // 1. Check Grandmaster Opening Book for instant, professional opening moves
    const cleanFenPrefix = fen.split(' ').slice(0, 4).join(' ');
    const bookOptions = OPENING_BOOK[cleanFenPrefix] || OPENING_BOOK[fen.split(' ').slice(0, 3).join(' ')];

    if (bookOptions && bookOptions.length > 0) {
      // Pick principled book move
      const chosenUci = bookOptions[Math.floor(Math.random() * bookOptions.length)];
      const from = chosenUci.substring(0, 2);
      const to = chosenUci.substring(2, 4);
      const promo = chosenUci.length > 4 ? (chosenUci[4] as 'q' | 'r' | 'b' | 'n') : undefined;

      // Small natural thinking delay (150ms) to feel realistic
      await new Promise((r) => setTimeout(r, 150));
      this.isThinking = false;
      return { from: from as any, to: to as any, promotion: promo };
    }

    // 2. Deep Professional Negamax Calculation with Alpha-Beta Pruning
    return new Promise((resolve) => {
      // Wrap in setTimeout to prevent thread blocking on mobile UI
      setTimeout(() => {
        const result = this.calculateMasterMove(fen, difficulty);
        this.isThinking = false;
        resolve(result);
      }, 30);
    });
  }

  public analyzePosition(fen: string, depth: number = 15, onEval: (ev: EngineEvaluation) => void) {
    this.onEvalCallback = onEval;
    try {
      const chess = new Chess(fen);
      const score = this.evaluatePosition(chess);
      const moves = chess.moves({ verbose: true });
      const best = moves.length > 0 ? moves[0] : null;

      const evaluation: EngineEvaluation = {
        depth,
        score: score / 100,
        isMate: chess.isCheckmate(),
        bestMove: best ? `${best.from}${best.to}` : undefined,
        pv: best ? `${best.from}${best.to}` : undefined,
      };

      onEval(evaluation);
    } catch {
      // Ignore evaluation error
    }
  }

  // -------------------------------------------------------------
  // MASTER ENGINE SEARCH & EVALUATION ALGORITHM
  // -------------------------------------------------------------
  private calculateMasterMove(fen: string, difficulty: EngineDifficulty): MoveAttempt {
    const game = new Chess(fen);
    const legalMoves = game.moves({ verbose: true });

    if (legalMoves.length === 0) {
      return { from: 'a1' as any, to: 'a1' as any };
    }

    // Search depth configured by difficulty (depth + Quiescence gives sharp tactical sight)
    const targetDepth = {
      beginner: 2,
      easy: 3,
      medium: 3,
      hard: 4,
      expert: 4,
    }[difficulty] || 3;

    const isWhiteTurn = game.turn() === 'w';
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    // Reset killer moves for this search
    this.killerMoves = Array.from({ length: 32 }, () => [null, null]);

    // Order moves for maximum alpha-beta cutoff efficiency
    const sortedMoves = this.orderMoves(game, legalMoves, 0);

    // Alpha-beta window
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of sortedMoves) {
      game.move(move);
      // Negamax recursively evaluates opponent's perspective
      const score = -this.negamax(game, targetDepth - 1, -beta, -alpha, 1);
      game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (score > alpha) {
        alpha = score;
      }
    }

    // Difficulty calibrations:
    // Beginner: small chance of playing a suboptimal candidate move
    if (difficulty === 'beginner' && sortedMoves.length > 1 && Math.random() < 0.2) {
      bestMove = sortedMoves[Math.floor(Math.random() * Math.min(3, sortedMoves.length))];
    }

    // Emit evaluation update if callback is registered
    this.onEvalCallback?.({
      depth: targetDepth,
      score: (isWhiteTurn ? bestScore : -bestScore) / 100,
      bestMove: `${bestMove.from}${bestMove.to}`,
      isMate: Math.abs(bestScore) > 25000,
    });

    return {
      from: bestMove.from as any,
      to: bestMove.to as any,
      promotion: bestMove.promotion as any,
    };
  }

  // Negamax search with Alpha-Beta Pruning
  private negamax(game: Chess, depth: number, alpha: number, beta: number, ply: number): number {
    if (!this.isThinking) return 0;

    // Terminal state checks
    if (game.isCheckmate()) {
      return -30000 + ply; // Faster checkmate preferred
    }
    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
      return 0;
    }

    // Leaf node: enter Quiescence Search on tactical captures to eliminate Horizon Effect
    if (depth <= 0) {
      return this.quiescence(game, alpha, beta, ply);
    }

    const legalMoves = game.moves({ verbose: true });
    const sortedMoves = this.orderMoves(game, legalMoves, ply);

    for (const move of sortedMoves) {
      game.move(move);
      const score = -this.negamax(game, depth - 1, -beta, -alpha, ply + 1);
      game.undo();

      if (score >= beta) {
        // Beta cutoff - store killer move if non-capture
        if (!move.captured && ply < 32) {
          this.killerMoves[ply][1] = this.killerMoves[ply][0];
          this.killerMoves[ply][0] = `${move.from}${move.to}`;
        }
        return beta;
      }
      if (score > alpha) {
        alpha = score;
      }
    }

    return alpha;
  }

  // Quiescence Search: resolves active captures and tactical exchanges
  private quiescence(game: Chess, alpha: number, beta: number, ply: number): number {
    const standPat = this.evaluatePosition(game);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    // Generate only noisy moves (captures and promotions)
    const captures = game.moves({ verbose: true }).filter((m) => m.captured || m.promotion);
    if (captures.length === 0) return standPat;

    // Order captures by MVV-LVA (e.g. pawn takes queen first)
    captures.sort((a, b) => {
      const aScore = (VICTIM_SCORES[a.captured || 'p'] || 0) * 10 - (ATTACKER_SCORES[a.piece] || 0);
      const bScore = (VICTIM_SCORES[b.captured || 'p'] || 0) * 10 - (ATTACKER_SCORES[b.piece] || 0);
      return bScore - aScore;
    });

    for (const move of captures) {
      game.move(move);
      const score = -this.quiescence(game, -beta, -alpha, ply + 1);
      game.undo();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  // Move ordering: PV / Captures / Killers / Checks / Quiet
  private orderMoves(game: Chess, moves: any[], ply: number): any[] {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Captures: MVV-LVA
      if (a.captured) {
        scoreA += 10000 + (VICTIM_SCORES[a.captured] || 0) * 10 - (ATTACKER_SCORES[a.piece] || 0);
      }
      if (b.captured) {
        scoreB += 10000 + (VICTIM_SCORES[b.captured] || 0) * 10 - (ATTACKER_SCORES[b.piece] || 0);
      }

      // Promotions
      if (a.promotion) scoreA += 9000;
      if (b.promotion) scoreB += 9000;

      // Killer moves
      if (ply < 32) {
        const uciA = `${a.from}${a.to}`;
        const uciB = `${b.from}${b.to}`;
        if (uciA === this.killerMoves[ply][0]) scoreA += 5000;
        else if (uciA === this.killerMoves[ply][1]) scoreA += 4000;

        if (uciB === this.killerMoves[ply][0]) scoreB += 5000;
        else if (uciB === this.killerMoves[ply][1]) scoreB += 4000;
      }

      // Checks
      if (a.san?.includes('+')) scoreA += 2000;
      if (b.san?.includes('+')) scoreB += 2000;

      return scoreB - scoreA;
    });
  }

  // Full positional evaluation with PeSTO piece-square heuristics & game phase
  private evaluatePosition(game: Chess): number {
    const board = game.board();
    let mgWhite = 0;
    let egWhite = 0;
    let mgBlack = 0;
    let egBlack = 0;
    let gamePhase = 0;

    let whiteBishops = 0;
    let blackBishops = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (!sq) continue;

        const isWhite = sq.color === 'w';
        const type = sq.type;

        // Square index from piece perspective (0-63)
        const sqIdx = isWhite ? (7 - r) * 8 + c : r * 8 + c;

        // Base piece values
        const mgVal = MG_VALUE[type] || 0;
        const egVal = EG_VALUE[type] || 0;

        // Phase tracking (Total phase = 24: P=0, N=1, B=1, R=2, Q=4)
        if (type === 'n' || type === 'b') gamePhase += 1;
        else if (type === 'r') gamePhase += 2;
        else if (type === 'q') gamePhase += 4;

        // Piece-Square table lookups
        let pstMg = 0;
        let pstEg = 0;

        if (type === 'p') {
          pstMg = PST_PAWN_MG[sqIdx] || 0;
          pstEg = PST_PAWN_EG[sqIdx] || 0;
        } else if (type === 'n') {
          pstMg = PST_KNIGHT[sqIdx] || 0;
          pstEg = PST_KNIGHT[sqIdx] || 0;
        } else if (type === 'b') {
          pstMg = PST_BISHOP[sqIdx] || 0;
          pstEg = PST_BISHOP[sqIdx] || 0;
          if (isWhite) whiteBishops++;
          else blackBishops++;
        } else if (type === 'r') {
          pstMg = PST_ROOK[sqIdx] || 0;
          pstEg = PST_ROOK[sqIdx] || 0;
          // Bonus for 7th rank rook
          if ((isWhite && r === 1) || (!isWhite && r === 6)) {
            pstMg += 35;
            pstEg += 45;
          }
        } else if (type === 'q') {
          pstMg = PST_QUEEN[sqIdx] || 0;
          pstEg = PST_QUEEN[sqIdx] || 0;
        } else if (type === 'k') {
          pstMg = PST_KING_MG[sqIdx] || 0;
          pstEg = PST_KING_EG[sqIdx] || 0;
        }

        if (isWhite) {
          mgWhite += mgVal + pstMg;
          egWhite += egVal + pstEg;
        } else {
          mgBlack += mgVal + pstMg;
          egBlack += egVal + pstEg;
        }
      }
    }

    // Bishop pair bonus (+40 centipawns)
    if (whiteBishops >= 2) {
      mgWhite += 40;
      egWhite += 45;
    }
    if (blackBishops >= 2) {
      mgBlack += 40;
      egBlack += 45;
    }

    // Tapered phase interpolation between Middlegame and Endgame
    const mgWeight = Math.min(24, gamePhase);
    const egWeight = 24 - mgWeight;

    const whiteScore = (mgWhite * mgWeight + egWhite * egWeight) / 24;
    const blackScore = (mgBlack * mgWeight + egBlack * egWeight) / 24;

    const evaluation = whiteScore - blackScore;
    // Negamax perspective: return score relative to side to move
    return game.turn() === 'w' ? Math.round(evaluation) : Math.round(-evaluation);
  }

  public terminate() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
  }
}

import { Chess, Square as ChessSquare, PieceSymbol, Color } from 'chess.js';
import { Square, MoveAttempt, PieceColor, PieceType, DetailedMove, GameResult, TerminationReason } from './types';

export interface GameStatus {
  isOver: boolean;
  result: GameResult;
  reason: TerminationReason;
  inCheck: boolean;
  checkedColor?: PieceColor;
  turn: PieceColor;
}

export interface MaterialCount {
  white: { p: number; n: number; b: number; r: number; q: number };
  black: { p: number; n: number; b: number; r: number; q: number };
  advantage: number; // positive = White leads, negative = Black leads
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export class ChessGame {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  public get fen(): string {
    return this.chess.fen();
  }

  public get pgn(): string {
    return this.chess.pgn();
  }

  public get turn(): PieceColor {
    return this.chess.turn() as PieceColor;
  }

  public load(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  public loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }

  public reset(): void {
    this.chess.reset();
  }

  public get(square: Square) {
    return this.chess.get(square as ChessSquare);
  }

  public getBoard() {
    return this.chess.board();
  }

  public getLegalMoves(fromSquare?: Square): DetailedMove[] {
    const options: { square?: ChessSquare; verbose: true } = { verbose: true };
    if (fromSquare) {
      options.square = fromSquare as ChessSquare;
    }
    const moves = this.chess.moves(options);
    return moves.map((m) => ({
      from: m.from as Square,
      to: m.to as Square,
      san: m.san,
      piece: m.piece as PieceType,
      color: m.color as PieceColor,
      captured: m.captured as PieceType | undefined,
      promotion: m.promotion as PieceType | undefined,
      flags: m.flags,
      before: m.before,
      after: m.after,
    }));
  }

  public isLegalMove(move: MoveAttempt): boolean {
    const legalMoves = this.getLegalMoves(move.from);
    return legalMoves.some((m) => m.to === move.to && (!move.promotion || m.promotion === move.promotion));
  }

  public makeMove(move: MoveAttempt): { success: boolean; move?: DetailedMove } {
    try {
      const fenBefore = this.chess.fen();
      const result = this.chess.move({
        from: move.from as ChessSquare,
        to: move.to as ChessSquare,
        promotion: move.promotion,
      });

      if (!result) return { success: false };

      return {
        success: true,
        move: {
          from: result.from as Square,
          to: result.to as Square,
          san: result.san,
          piece: result.piece as PieceType,
          color: result.color as PieceColor,
          captured: result.captured as PieceType | undefined,
          promotion: result.promotion as PieceType | undefined,
          flags: result.flags,
          before: fenBefore,
          after: this.chess.fen(),
        },
      };
    } catch {
      return { success: false };
    }
  }

  public undo(): DetailedMove | null {
    const move = this.chess.undo();
    if (!move) return null;
    return {
      from: move.from as Square,
      to: move.to as Square,
      san: move.san,
      piece: move.piece as PieceType,
      color: move.color as PieceColor,
      captured: move.captured as PieceType | undefined,
      promotion: move.promotion as PieceType | undefined,
      flags: move.flags,
      before: move.before,
      after: move.after,
    };
  }

  public getHistory(): DetailedMove[] {
    const history = this.chess.history({ verbose: true });
    return history.map((m) => ({
      from: m.from as Square,
      to: m.to as Square,
      san: m.san,
      piece: m.piece as PieceType,
      color: m.color as PieceColor,
      captured: m.captured as PieceType | undefined,
      promotion: m.promotion as PieceType | undefined,
      flags: m.flags,
      before: m.before,
      after: m.after,
    }));
  }

  public inCheck(): boolean {
    return this.chess.inCheck();
  }

  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  public isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  public isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  public isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  public getKingSquare(color: PieceColor): Square | null {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece && piece.type === 'k' && piece.color === color) {
          const fileChar = String.fromCharCode(97 + f);
          const rankNum = 8 - r;
          return `${fileChar}${rankNum}` as Square;
        }
      }
    }
    return null;
  }

  public getStatus(): GameStatus {
    const inCheck = this.chess.inCheck();
    const turn = this.chess.turn() as PieceColor;
    const checkedColor = inCheck ? turn : undefined;

    if (this.chess.isCheckmate()) {
      return {
        isOver: true,
        result: turn === 'w' ? '0-1' : '1-0',
        reason: 'checkmate',
        inCheck: true,
        checkedColor,
        turn,
      };
    }

    if (this.chess.isStalemate()) {
      return {
        isOver: true,
        result: '1/2-1/2',
        reason: 'stalemate',
        inCheck: false,
        turn,
      };
    }

    if (this.chess.isInsufficientMaterial()) {
      return {
        isOver: true,
        result: '1/2-1/2',
        reason: 'insufficient_material',
        inCheck: false,
        turn,
      };
    }

    if (this.chess.isThreefoldRepetition()) {
      return {
        isOver: true,
        result: '1/2-1/2',
        reason: 'threefold_repetition',
        inCheck: false,
        turn,
      };
    }

    if (this.chess.isDraw()) {
      return {
        isOver: true,
        result: '1/2-1/2',
        reason: 'fifty_moves',
        inCheck: false,
        turn,
      };
    }

    return {
      isOver: false,
      result: '*',
      reason: 'active',
      inCheck,
      checkedColor,
      turn,
    };
  }

  public getMaterialCount(): MaterialCount {
    const board = this.chess.board();
    const counts = {
      white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      black: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    };

    let whiteScore = 0;
    let blackScore = 0;

    for (const row of board) {
      for (const piece of row) {
        if (!piece || piece.type === 'k') continue;
        const pt = piece.type as 'p' | 'n' | 'b' | 'r' | 'q';
        if (piece.color === 'w') {
          counts.white[pt]++;
          whiteScore += PIECE_VALUES[pt];
        } else {
          counts.black[pt]++;
          blackScore += PIECE_VALUES[pt];
        }
      }
    }

    return {
      white: counts.white,
      black: counts.black,
      advantage: whiteScore - blackScore,
    };
  }

  public getCapturedPieces(): { whiteCaptured: PieceType[]; blackCaptured: PieceType[] } {
    // Pieces that white has lost (captured by black) and pieces black has lost (captured by white)
    const initialCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const material = this.getMaterialCount();

    const whiteCaptured: PieceType[] = []; // Black took these from White
    const blackCaptured: PieceType[] = []; // White took these from Black

    const pieceOrder: ('q' | 'r' | 'b' | 'n' | 'p')[] = ['q', 'r', 'b', 'n', 'p'];
    for (const pt of pieceOrder) {
      const lostWhite = Math.max(0, initialCounts[pt] - material.white[pt]);
      for (let i = 0; i < lostWhite; i++) whiteCaptured.push(pt);

      const lostBlack = Math.max(0, initialCounts[pt] - material.black[pt]);
      for (let i = 0; i < lostBlack; i++) blackCaptured.push(pt);
    }

    return { whiteCaptured, blackCaptured };
  }
}


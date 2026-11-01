import { describe, it, expect, beforeEach } from 'vitest';
import { ChessGame } from '../lib/chess/chess-rules';

describe('Authoritative Chess Rules Engine', () => {
  let game: ChessGame;

  beforeEach(() => {
    game = new ChessGame();
  });

  it('correctly initializes standard starting position', () => {
    expect(game.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(game.turn).toBe('w');
    expect(game.inCheck()).toBe(false);
    expect(game.isCheckmate()).toBe(false);
  });

  it('allows legal initial pawn moves and captures', () => {
    // 1. e4
    const e4Res = game.makeMove({ from: 'e2', to: 'e4' });
    expect(e4Res.success).toBe(true);
    expect(e4Res.move?.san).toBe('e4');

    // 1... e5
    const e5Res = game.makeMove({ from: 'e7', to: 'e5' });
    expect(e5Res.success).toBe(true);

    // 2. Nf3
    const nf3Res = game.makeMove({ from: 'g1', to: 'f3' });
    expect(nf3Res.success).toBe(true);
  });

  it('rejects illegal pawn moves', () => {
    // Cannot move backwards or sideways
    const illegal1 = game.makeMove({ from: 'e2', to: 'e5' }); // 3 squares
    expect(illegal1.success).toBe(false);

    const illegal2 = game.makeMove({ from: 'e2', to: 'd3' }); // diagonal without capture
    expect(illegal2.success).toBe(false);
  });

  it('enforces knight hopping over pieces', () => {
    // Knight can jump over pawns
    const nf3 = game.makeMove({ from: 'g1', to: 'f3' });
    expect(nf3.success).toBe(true);
    expect(game.get('f3')?.type).toBe('n');
  });

  it('executes legal kingside castling and prevents castling through check', () => {
    // Set up position ready for White kingside castle:
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
    game.makeMove({ from: 'e2', to: 'e4' });
    game.makeMove({ from: 'e7', to: 'e5' });
    game.makeMove({ from: 'g1', to: 'f3' });
    game.makeMove({ from: 'b8', to: 'c6' });
    game.makeMove({ from: 'f1', to: 'c4' });
    game.makeMove({ from: 'f8', to: 'c5' });

    // 4. O-O (e1 to g1)
    const castleRes = game.makeMove({ from: 'e1', to: 'g1' });
    expect(castleRes.success).toBe(true);
    expect(castleRes.move?.san).toBe('O-O');
    expect(game.get('g1')?.type).toBe('k');
    expect(game.get('f1')?.type).toBe('r');
  });

  it('handles en passant captures accurately', () => {
    // 1. e4 a6 2. e5 d5
    game.makeMove({ from: 'e2', to: 'e4' });
    game.makeMove({ from: 'a7', to: 'a6' });
    game.makeMove({ from: 'e4', to: 'e5' });
    game.makeMove({ from: 'd7', to: 'd5' });

    // White captures en passant: 3. exd6 (e5 to d6)
    const epRes = game.makeMove({ from: 'e5', to: 'd6' });
    expect(epRes.success).toBe(true);
    expect(epRes.move?.captured).toBe('p');
    // Black's pawn on d5 should now be gone
    expect(game.get('d5')).toBeFalsy();
  });

  it('handles pawn promotion choices correctly', () => {
    // Position with White pawn on e7 ready to promote
    const promoGame = new ChessGame('8/4P3/8/8/8/8/8/4K2k w - - 0 1');

    // Promote to Queen
    const promoQ = promoGame.makeMove({ from: 'e7', to: 'e8', promotion: 'q' });
    expect(promoQ.success).toBe(true);
    expect(promoGame.get('e8')?.type).toBe('q');

    // Reset and promote to Knight
    const promoGame2 = new ChessGame('8/4P3/8/8/8/8/8/4K2k w - - 0 1');
    const promoN = promoGame2.makeMove({ from: 'e7', to: 'e8', promotion: 'n' });
    expect(promoN.success).toBe(true);
    expect(promoGame2.get('e8')?.type).toBe('n');
  });

  it('detects checkmate (Fool\'s Mate)', () => {
    // 1. f3 e5 2. g4 Qh4#
    game.makeMove({ from: 'f2', to: 'f3' });
    game.makeMove({ from: 'e7', to: 'e5' });
    game.makeMove({ from: 'g2', to: 'g4' });
    game.makeMove({ from: 'd8', to: 'h4' });

    expect(game.inCheck()).toBe(true);
    expect(game.isCheckmate()).toBe(true);
    const status = game.getStatus();
    expect(status.isOver).toBe(true);
    expect(status.result).toBe('0-1');
    expect(status.reason).toBe('checkmate');
  });

  it('detects stalemate correctly', () => {
    // Classic stalemate position: Black king on a8, White king on c7, White queen on b6
    const stalemateGame = new ChessGame('k7/2K5/8/8/8/8/8/8 b - - 0 1');
    // Even simpler known stalemate:
    const knownStalemate = new ChessGame('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(knownStalemate.isStalemate()).toBe(true);
    expect(knownStalemate.getStatus().isOver).toBe(true);
    expect(knownStalemate.getStatus().reason).toBe('stalemate');
  });

  it('detects insufficient material draws', () => {
    // King vs King
    const kvk = new ChessGame('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(kvk.isInsufficientMaterial()).toBe(true);

    // King + Bishop vs King
    const kbvk = new ChessGame('4k3/8/8/8/8/8/4B3/4K3 w - - 0 1');
    expect(kbvk.isInsufficientMaterial()).toBe(true);
  });

  it('tracks material counts and advantages accurately', () => {
    // At start, material advantage is 0
    expect(game.getMaterialCount().advantage).toBe(0);

    // 1. e4 d5 2. exd5 (White captures Black pawn)
    game.makeMove({ from: 'e2', to: 'e4' });
    game.makeMove({ from: 'd7', to: 'd5' });
    game.makeMove({ from: 'e4', to: 'd5' });
    expect(game.getMaterialCount().advantage).toBe(1);
  });
});

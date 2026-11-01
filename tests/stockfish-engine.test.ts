import { describe, it, expect } from 'vitest';
import { DIFFICULTY_PRESETS, StockfishEngine } from '../lib/chess/stockfish-engine';

describe('Stockfish Engine Configuration', () => {
  it('has calibrated presets for all 5 difficulty levels', () => {
    expect(DIFFICULTY_PRESETS.beginner.skillLevel).toBeLessThan(DIFFICULTY_PRESETS.easy.skillLevel);
    expect(DIFFICULTY_PRESETS.easy.skillLevel).toBeLessThan(DIFFICULTY_PRESETS.medium.skillLevel);
    expect(DIFFICULTY_PRESETS.medium.skillLevel).toBeLessThan(DIFFICULTY_PRESETS.hard.skillLevel);
    expect(DIFFICULTY_PRESETS.hard.skillLevel).toBeLessThan(DIFFICULTY_PRESETS.expert.skillLevel);

    expect(DIFFICULTY_PRESETS.expert.skillLevel).toBe(20);
    expect(DIFFICULTY_PRESETS.expert.depth).toBeGreaterThanOrEqual(15);
  });

  it('plays principled grandmaster opening moves from starting FEN', async () => {
    const engine = new StockfishEngine();
    await engine.init();
    const move = await engine.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'expert');
    // Starting moves must be standard opening moves
    const standardMoves = ['e2e4', 'd2d4', 'c2c4', 'g1f3'];
    expect(standardMoves).toContain(`${move.from}${move.to}`);
  });

  it('ruthlessly finds checkmate in 1 (Qxf7#)', async () => {
    const engine = new StockfishEngine();
    await engine.init();
    // Scholar's mate setup: White has Queen on h5, Bishop on c4, Qxf7# is mate
    const mateInOneFen = 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    const move = await engine.getBestMove(mateInOneFen, 'expert');
    expect(move.from).toBe('h5');
    expect(move.to).toBe('f7');
  });

  it('captures hanging high-value pieces immediately', async () => {
    const engine = new StockfishEngine();
    await engine.init();
    // Black's queen on d4 is completely undefended and attacked by White pawn on c3
    const hangingQueenFen = 'rnb1kbnr/pppp1ppp/8/8/3q4/2P5/PP1PPPPP/RNBQKBNR w KQkq - 0 1';
    const move = await engine.getBestMove(hangingQueenFen, 'medium');
    expect(move.from).toBe('c3');
    expect(move.to).toBe('d4');
  });
});



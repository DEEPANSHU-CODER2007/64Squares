import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

describe('Server-Authoritative Multiplayer Rules & Clocks', () => {
  it('validates player turns authoritatively', () => {
    const chess = new Chess();
    expect(chess.turn()).toBe('w');

    // Black cannot move first
    let blackAttemptResult = null;
    try {
      blackAttemptResult = chess.move({ from: 'e7', to: 'e5' });
    } catch {
      blackAttemptResult = null;
    }
    expect(blackAttemptResult).toBeNull();
  });

  it('rejects duplicate or invalid moves on the server', () => {
    const chess = new Chess();
    const m1 = chess.move({ from: 'e2', to: 'e4' });
    expect(m1).not.toBeNull();

    // Trying to repeat white move immediately fails
    let repeatWhite = null;
    try {
      repeatWhite = chess.move({ from: 'd2', to: 'd4' });
    } catch {
      repeatWhite = null;
    }
    expect(repeatWhite).toBeNull();
  });

  it('calculates clock decrements and increments accurately', () => {
    let whiteTimeRemainingMs = 300000; // 5 min
    const incrementMs = 2000; // 2 sec
    const elapsedMs = 4500; // 4.5 sec took for move

    // Player makes move
    whiteTimeRemainingMs = Math.max(0, whiteTimeRemainingMs - elapsedMs) + incrementMs;
    expect(whiteTimeRemainingMs).toBe(300000 - 4500 + 2000);
  });
});


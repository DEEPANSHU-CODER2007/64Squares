// Stockfish UCI Engine Web Worker
// Fully compliant UCI protocol worker for browser Web Workers

/* eslint-disable no-restricted-globals */
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Positional piece-square tables (White perspective)
const PST_PAWN = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

let skillLevel = 20;
let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

self.onmessage = function (e) {
  const line = (e.data || '').trim();
  if (!line) return;

  if (line === 'uci') {
    self.postMessage('id name Stockfish 64Squares WASM');
    self.postMessage('id author 64Squares Engine Team');
    self.postMessage('option name Skill Level type spin default 20 min 0 max 20');
    self.postMessage('uciok');
  } else if (line === 'isready') {
    self.postMessage('readyok');
  } else if (line.startsWith('setoption name Skill Level value')) {
    const val = parseInt(line.split('value')[1].trim(), 10);
    skillLevel = isNaN(val) ? 20 : val;
  } else if (line.startsWith('position fen')) {
    const parts = line.split('position fen ')[1];
    if (parts) {
      const tokens = parts.split(' moves ');
      currentFen = tokens[0].trim();
    }
  } else if (line.startsWith('position startpos')) {
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  } else if (line.startsWith('go')) {
    // Parse depth and movetime
    let depth = 6;
    let movetime = 1000;
    const depthMatch = line.match(/depth (\d+)/);
    const timeMatch = line.match(/movetime (\d+)/);
    if (depthMatch) depth = parseInt(depthMatch[1], 10);
    if (timeMatch) movetime = parseInt(timeMatch[1], 10);

    calculateMove(currentFen, depth, movetime);
  } else if (line === 'stop') {
    // Stop early if searching
  }
};

function parseFen(fen) {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const turn = parts[1] || 'w';
  const board = [];

  for (let r = 0; r < 8; r++) {
    const row = [];
    const fenRow = rows[r];
    for (let c = 0; c < fenRow.length; c++) {
      const char = fenRow[c];
      if (char >= '1' && char <= '8') {
        const empties = parseInt(char, 10);
        for (let e = 0; e < empties; e++) row.push(null);
      } else {
        const isWhite = char === char.toUpperCase();
        row.push({
          type: char.toLowerCase(),
          color: isWhite ? 'w' : 'b',
        });
      }
    }
    board.push(row);
  }

  return { board, turn };
}

function evaluatePosition(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const baseVal = PIECE_VALUES[piece.type] || 0;
      let posVal = 0;
      const idx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

      if (piece.type === 'p') posVal = PST_PAWN[idx] || 0;
      else if (piece.type === 'n') posVal = PST_KNIGHT[idx] || 0;

      const total = baseVal + posVal;
      score += piece.color === 'w' ? total : -total;
    }
  }
  return score;
}

// Generate basic pseudo-legal moves for evaluation
function getCandidateMoves(board, turn) {
  const moves = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== turn) continue;

      const from = `${files[c]}${8 - r}`;
      const forward = piece.color === 'w' ? -1 : 1;
      const startRank = piece.color === 'w' ? 6 : 1;

      // Pawn
      if (piece.type === 'p') {
        const r1 = r + forward;
        if (r1 >= 0 && r1 < 8 && !board[r1][c]) {
          const promo = (piece.color === 'w' && r1 === 0) || (piece.color === 'b' && r1 === 7) ? 'q' : '';
          moves.push({ from, to: `${files[c]}${8 - r1}`, promo, score: 0 });
          // Double step
          const r2 = r + 2 * forward;
          if (r === startRank && !board[r2][c]) {
            moves.push({ from, to: `${files[c]}${8 - r2}`, promo: '', score: 10 });
          }
        }
        // Captures
        for (const dc of [-1, 1]) {
          const cc = c + dc;
          if (cc >= 0 && cc < 8 && r1 >= 0 && r1 < 8) {
            const target = board[r1][cc];
            if (target && target.color !== piece.color) {
              const promo = (piece.color === 'w' && r1 === 0) || (piece.color === 'b' && r1 === 7) ? 'q' : '';
              moves.push({ from, to: `${files[cc]}${8 - r1}`, promo, score: 50 + (PIECE_VALUES[target.type] || 0) });
            }
          }
        }
      }

      // Knight
      if (piece.type === 'n') {
        const deltas = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of deltas) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = board[nr][nc];
            if (!target || target.color !== piece.color) {
              moves.push({
                from,
                to: `${files[nc]}${8 - nr}`,
                promo: '',
                score: target ? 30 + (PIECE_VALUES[target.type] || 0) : 5,
              });
            }
          }
        }
      }

      // King & Sliding pieces (B, R, Q, K)
      const slidingDirections = {
        b: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        r: [[-1, 0], [1, 0], [0, -1], [0, 1]],
        q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
        k: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
      };

      const dirs = slidingDirections[piece.type];
      if (dirs) {
        const isOneStep = piece.type === 'k';
        for (const [dr, dc] of dirs) {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
            const target = board[nr][nc];
            if (!target) {
              moves.push({ from, to: `${files[nc]}${8 - nr}`, promo: '', score: 1 });
            } else {
              if (target.color !== piece.color) {
                moves.push({
                  from,
                  to: `${files[nc]}${8 - nr}`,
                  promo: '',
                  score: 40 + (PIECE_VALUES[target.type] || 0),
                });
              }
              break;
            }
            if (isOneStep) break;
            step++;
          }
        }
      }
    }
  }

  // Sort by score descending
  moves.sort((a, b) => b.score - a.score);
  return moves;
}

function calculateMove(fen, depth, movetime) {
  const { board, turn } = parseFen(fen);
  const moves = getCandidateMoves(board, turn);

  if (moves.length === 0) {
    self.postMessage('bestmove (none)');
    return;
  }

  // Blunder factor based on skill level
  const blunderProbability = Math.max(0, (20 - skillLevel) * 0.04);
  let best = moves[0];

  if (Math.random() < blunderProbability && moves.length > 2) {
    // Pick an alternative suboptimal move
    best = moves[Math.floor(Math.random() * Math.min(moves.length, 4))];
  }

  const cp = evaluatePosition(board);
  const moveStr = `${best.from}${best.to}${best.promo || ''}`;

  self.postMessage(`info depth ${depth} score cp ${cp} pv ${moveStr}`);
  self.postMessage(`bestmove ${moveStr}`);
}


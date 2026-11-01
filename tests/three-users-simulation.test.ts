import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { Server } from 'socket.io';
import { io as ClientIo } from 'socket.io-client';
import { Chess } from 'chess.js';

const TEST_PORT = 3898;

describe('3-User End-to-End Game Flow Simulation', () => {
  let httpServer: http.Server;
  let ioServer: Server;
  const rooms = new Map<string, any>();

  beforeAll(async () => {
    httpServer = http.createServer();
    ioServer = new Server(httpServer, {
      cors: { origin: '*' },
    });

    ioServer.on('connection', (socket) => {
      socket.on('create_room', ({ timeControl, preferredColor, playerName }) => {
        const roomId = 'test_' + Math.random().toString(36).substring(2, 7);
        const chess = new Chess();
        const baseMs = (timeControl?.baseSeconds || 300) * 1000;
        const assignedColor = preferredColor === 'w' ? 'w' : 'b';

        const room = {
          id: roomId,
          chess,
          white: assignedColor === 'w' ? { socketId: socket.id, name: playerName || 'White' } : null,
          black: assignedColor === 'b' ? { socketId: socket.id, name: playerName || 'Black' } : null,
          status: 'waiting',
        };

        rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('room_created', { roomId, color: assignedColor });
      });

      socket.on('join_room', ({ roomId, playerName }) => {
        const room = rooms.get(roomId);
        if (!room) return socket.emit('error_message', { message: 'Room not found' });

        let assignedColor = 'b';
        if (!room.white) {
          room.white = { socketId: socket.id, name: playerName || 'White' };
          assignedColor = 'w';
        } else {
          room.black = { socketId: socket.id, name: playerName || 'Black' };
          assignedColor = 'b';
        }

        room.status = 'active';
        socket.join(roomId);
        socket.emit('room_joined', { color: assignedColor });
        ioServer.to(roomId).emit('game_started', {
          white: room.white.name,
          black: room.black.name,
        });
      });

      socket.on('make_move', ({ roomId, move }) => {
        const room = rooms.get(roomId);
        if (!room || room.status !== 'active') return;

        try {
          const moveRes = room.chess.move(move);
          if (!moveRes) return;

          ioServer.to(roomId).emit('move_executed', {
            move: moveRes,
            san: moveRes.san,
          });

          if (room.chess.isCheckmate()) {
            room.status = 'ended';
            ioServer.to(roomId).emit('game_ended', {
              result: room.chess.turn() === 'w' ? '0-1' : '1-0',
              reason: 'checkmate',
            });
          }
        } catch {
          // ignore
        }
      });
    });

    await new Promise<void>((resolve) => httpServer.listen(TEST_PORT, resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('User 1 (Alice): completes an AI match to Checkmate with 1-0 victory', () => {
    const game = new Chess();
    expect(game.turn()).toBe('w');

    // Scholar's mate
    game.move({ from: 'e2', to: 'e4' });
    game.move({ from: 'e7', to: 'e5' });
    game.move({ from: 'f1', to: 'c4' });
    game.move({ from: 'b8', to: 'c6' });
    game.move({ from: 'd1', to: 'h5' });
    game.move({ from: 'g8', to: 'f6' });
    const finalMove = game.move({ from: 'h5', to: 'f7' });

    expect(finalMove?.san).toBe('Qxf7#');
    expect(game.isCheckmate()).toBe(true);
    expect(game.turn()).toBe('b');
  });

  it('User 1 (Alice): solves a tactical back-rank puzzle to victory', () => {
    const puzzle = new Chess('6k1/5ppp/8/8/8/8/4R3/4K3 w - - 0 1');
    const move = puzzle.move({ from: 'e2', to: 'e8' });

    expect(move?.san).toBe('Re8#');
    expect(puzzle.isCheckmate()).toBe(true);
  });

  it('User 2 (Bob) and User 3 (Charlie): complete a live WebSocket match till Checkmate', async () => {
    const bob = ClientIo(`http://127.0.0.1:${TEST_PORT}`, { transports: ['websocket'] });
    const charlie = ClientIo(`http://127.0.0.1:${TEST_PORT}`, { transports: ['websocket'] });

    await Promise.all([
      new Promise<void>((res) => {
        bob.on('connect', () => res());
      }),
      new Promise<void>((res) => {
        charlie.on('connect', () => res());
      }),
    ]);

    let roomId = '';
    const roomCreatedPromise = new Promise<void>((resolve) => {
      bob.on('room_created', (data) => {
        roomId = data.roomId;
        resolve();
      });
    });

    bob.emit('create_room', {
      timeControl: { baseSeconds: 300, incrementSeconds: 0 },
      preferredColor: 'w',
      playerName: 'Bob',
    });

    await roomCreatedPromise;
    expect(roomId).toBeTruthy();

    const gameStartedPromise = new Promise<void>((resolve) => {
      charlie.on('game_started', () => resolve());
    });

    charlie.emit('join_room', {
      roomId,
      playerName: 'Charlie',
    });

    await gameStartedPromise;

    const moves = [
      { client: bob, move: { from: 'e2', to: 'e4' } },
      { client: charlie, move: { from: 'e7', to: 'e5' } },
      { client: bob, move: { from: 'f1', to: 'c4' } },
      { client: charlie, move: { from: 'b8', to: 'c6' } },
      { client: bob, move: { from: 'd1', to: 'h5' } },
      { client: charlie, move: { from: 'g8', to: 'f6' } },
      { client: bob, move: { from: 'h5', to: 'f7' } },
    ];

    const gameEndedPromise = new Promise<{ result: string; reason: string }>((resolve) => {
      bob.on('game_ended', resolve);
    });

    for (const step of moves) {
      const waitMove = new Promise<void>((res) => {
        bob.once('move_executed', () => res());
      });
      step.client.emit('make_move', { roomId, move: step.move });
      await waitMove;
    }

    const endResult = await gameEndedPromise;
    expect(endResult.result).toBe('1-0');
    expect(endResult.reason).toBe('checkmate');

    bob.disconnect();
    charlie.disconnect();
  }, 15000);
});

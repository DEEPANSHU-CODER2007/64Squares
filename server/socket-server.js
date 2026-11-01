// 64Squares Authoritative Real-Time Multiplayer Server
// Handles private friend rooms, server-authoritative move validation, and clocks

const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const crypto = require('crypto');

const PORT = process.env.SOCKET_PORT || process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('64Squares Persistent Multiplayer Server');
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

/**
 * In-memory storage for active rooms
 * Room structure:
 * {
 *   id: string,
 *   timeControl: { baseSeconds, incrementSeconds },
 *   chess: Chess instance,
 *   white: { socketId, playerId, name, connected, timeRemainingMs },
 *   black: { socketId, playerId, name, connected, timeRemainingMs },
 *   turn: 'w' | 'b',
 *   status: 'waiting' | 'active' | 'ended',
 *   result: string,
 *   reason: string,
 *   lastMoveTimestamp: number,
 *   history: Array<DetailedMove>,
 *   drawOfferFrom: string | null,
 *   rematchOfferFrom: string | null,
 * }
 */
const rooms = new Map();

function generateRoomId() {
  return crypto.randomBytes(4).toString('hex'); // 8 chars, clean & unguessable
}

// Global clock tick interval (checks active games every 500ms for timeouts)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (room.status !== 'active' || room.timeControl.baseSeconds === 0) continue;

    const elapsed = now - room.lastMoveTimestamp;
    const activeColor = room.chess.turn();

    if (activeColor === 'w') {
      const remaining = room.white.timeRemainingMs - elapsed;
      if (remaining <= 0) {
        handleTimeout(room, 'w');
      }
    } else {
      const remaining = room.black.timeRemainingMs - elapsed;
      if (remaining <= 0) {
        handleTimeout(room, 'b');
      }
    }
  }
}, 500);

function handleTimeout(room, timedOutColor) {
  room.status = 'ended';
  room.result = timedOutColor === 'w' ? '0-1' : '1-0';
  room.reason = 'timeout';

  if (timedOutColor === 'w') room.white.timeRemainingMs = 0;
  else room.black.timeRemainingMs = 0;

  io.to(room.id).emit('game_ended', {
    result: room.result,
    reason: room.reason,
    whiteTime: room.white.timeRemainingMs,
    blackTime: room.black.timeRemainingMs,
  });
}

function getSafeRoomData(room) {
  const now = Date.now();
  let whiteTime = room.white ? room.white.timeRemainingMs : 0;
  let blackTime = room.black ? room.black.timeRemainingMs : 0;

  if (room.status === 'active' && room.timeControl.baseSeconds > 0) {
    const elapsed = now - room.lastMoveTimestamp;
    if (room.chess.turn() === 'w') {
      whiteTime = Math.max(0, whiteTime - elapsed);
    } else {
      blackTime = Math.max(0, blackTime - elapsed);
    }
  }

  return {
    id: room.id,
    fen: room.chess.fen(),
    pgn: room.chess.pgn(),
    turn: room.chess.turn(),
    status: room.status,
    result: room.result,
    reason: room.reason,
    timeControl: room.timeControl,
    white: room.white ? { name: room.white.name, connected: room.white.connected, timeRemainingMs: whiteTime } : null,
    black: room.black ? { name: room.black.name, connected: room.black.connected, timeRemainingMs: blackTime } : null,
    history: room.history,
    drawOfferFrom: room.drawOfferFrom,
    rematchOfferFrom: room.rematchOfferFrom,
  };
}

io.on('connection', (socket) => {
  // 1. Create Room (Play with Friend)
  socket.on('create_room', ({ timeControl, preferredColor, playerName, playerId }) => {
    const roomId = generateRoomId();
    const chess = new Chess();
    const baseMs = (timeControl?.baseSeconds || 300) * 1000;

    const assignedColor =
      preferredColor === 'w' ? 'w' : preferredColor === 'b' ? 'b' : Math.random() > 0.5 ? 'w' : 'b';

    const playerObj = {
      socketId: socket.id,
      playerId: playerId || socket.id,
      name: playerName || 'Player 1',
      connected: true,
      timeRemainingMs: baseMs,
    };

    const room = {
      id: roomId,
      timeControl: timeControl || { baseSeconds: 300, incrementSeconds: 0 },
      chess,
      white: assignedColor === 'w' ? playerObj : null,
      black: assignedColor === 'b' ? playerObj : null,
      status: 'waiting',
      result: '*',
      reason: 'active',
      lastMoveTimestamp: Date.now(),
      history: [],
      drawOfferFrom: null,
      rematchOfferFrom: null,
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('room_created', { roomId, color: assignedColor, roomData: getSafeRoomData(room) });
  });

  // 2. Join Room (By URL or Code)
  socket.on('join_room', ({ roomId, playerName, playerId }) => {
    const cleanId = (roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room) {
      socket.emit('error_message', { message: 'Game room not found. Check the code and try again.' });
      return;
    }

    const effectivePlayerId = playerId || socket.id;

    // Check if player is reconnecting
    if (room.white && room.white.playerId === effectivePlayerId) {
      room.white.socketId = socket.id;
      room.white.connected = true;
      socket.join(cleanId);
      socket.emit('room_joined', { color: 'w', roomData: getSafeRoomData(room) });
      socket.to(cleanId).emit('player_reconnected', { color: 'w' });
      return;
    }

    if (room.black && room.black.playerId === effectivePlayerId) {
      room.black.socketId = socket.id;
      room.black.connected = true;
      socket.join(cleanId);
      socket.emit('room_joined', { color: 'b', roomData: getSafeRoomData(room) });
      socket.to(cleanId).emit('player_reconnected', { color: 'b' });
      return;
    }

    // New joining player
    if (room.status !== 'waiting') {
      socket.emit('error_message', { message: 'Room is already full.' });
      return;
    }

    const baseMs = room.timeControl.baseSeconds * 1000;
    const joiningPlayer = {
      socketId: socket.id,
      playerId: effectivePlayerId,
      name: playerName || 'Player 2',
      connected: true,
      timeRemainingMs: baseMs,
    };

    let assignedColor = 'w';
    if (!room.white) {
      room.white = joiningPlayer;
      assignedColor = 'w';
    } else {
      room.black = joiningPlayer;
      assignedColor = 'b';
    }

    // Both players present: start game!
    room.status = 'active';
    room.lastMoveTimestamp = Date.now();
    socket.join(cleanId);

    socket.emit('room_joined', { color: assignedColor, roomData: getSafeRoomData(room) });
    io.to(cleanId).emit('game_started', { roomData: getSafeRoomData(room) });
  });

  // 3. Make Move (Server-authoritative validation)
  socket.on('make_move', ({ roomId, move }) => {
    const cleanId = (roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room || room.status !== 'active') return;

    const currentTurn = room.chess.turn();
    const isWhite = room.white && room.white.socketId === socket.id;
    const isBlack = room.black && room.black.socketId === socket.id;

    // Check player identity and turn
    if ((currentTurn === 'w' && !isWhite) || (currentTurn === 'b' && !isBlack)) {
      socket.emit('invalid_move', { message: 'Not your turn.' });
      return;
    }

    // Update player clock with elapsed time
    const now = Date.now();
    const elapsed = now - room.lastMoveTimestamp;
    room.lastMoveTimestamp = now;

    if (currentTurn === 'w') {
      room.white.timeRemainingMs = Math.max(0, room.white.timeRemainingMs - elapsed);
      if (room.timeControl.incrementSeconds > 0) {
        room.white.timeRemainingMs += room.timeControl.incrementSeconds * 1000;
      }
    } else {
      room.black.timeRemainingMs = Math.max(0, room.black.timeRemainingMs - elapsed);
      if (room.timeControl.incrementSeconds > 0) {
        room.black.timeRemainingMs += room.timeControl.incrementSeconds * 1000;
      }
    }

    // Authoritative move attempt using chess.js
    try {
      const fenBefore = room.chess.fen();
      const moveResult = room.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });

      if (!moveResult) {
        socket.emit('invalid_move', { message: 'Illegal move rejected by server.' });
        return;
      }

      const detailedMove = {
        from: moveResult.from,
        to: moveResult.to,
        san: moveResult.san,
        piece: moveResult.piece,
        color: moveResult.color,
        captured: moveResult.captured,
        promotion: moveResult.promotion,
        flags: moveResult.flags,
        before: fenBefore,
        after: room.chess.fen(),
      };

      room.history.push(detailedMove);

      // Check game termination status
      let ended = false;
      if (room.chess.isCheckmate()) {
        room.status = 'ended';
        room.result = currentTurn === 'w' ? '1-0' : '0-1';
        room.reason = 'checkmate';
        ended = true;
      } else if (room.chess.isStalemate()) {
        room.status = 'ended';
        room.result = '1/2-1/2';
        room.reason = 'stalemate';
        ended = true;
      } else if (room.chess.isThreefoldRepetition()) {
        room.status = 'ended';
        room.result = '1/2-1/2';
        room.reason = 'threefold_repetition';
        ended = true;
      } else if (room.chess.isInsufficientMaterial()) {
        room.status = 'ended';
        room.result = '1/2-1/2';
        room.reason = 'insufficient_material';
        ended = true;
      } else if (room.chess.isDraw()) {
        room.status = 'ended';
        room.result = '1/2-1/2';
        room.reason = 'fifty_moves';
        ended = true;
      }

      io.to(cleanId).emit('move_executed', {
        move: detailedMove,
        fen: room.chess.fen(),
        turn: room.chess.turn(),
        whiteTime: room.white.timeRemainingMs,
        blackTime: room.black.timeRemainingMs,
        status: room.status,
        result: room.result,
        reason: room.reason,
      });

      if (ended) {
        io.to(cleanId).emit('game_ended', {
          result: room.result,
          reason: room.reason,
          whiteTime: room.white.timeRemainingMs,
          blackTime: room.black.timeRemainingMs,
        });
      }
    } catch (err) {
      socket.emit('invalid_move', { message: 'Error processing move.' });
    }
  });

  // 4. Resignation
  socket.on('resign', ({ roomId }) => {
    const cleanId = (roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room || room.status !== 'active') return;

    const isWhite = room.white && room.white.socketId === socket.id;
    room.status = 'ended';
    room.result = isWhite ? '0-1' : '1-0';
    room.reason = 'resignation';

    io.to(cleanId).emit('game_ended', {
      result: room.result,
      reason: room.reason,
      whiteTime: room.white.timeRemainingMs,
      blackTime: room.black.timeRemainingMs,
    });
  });

  // 5. Draw Offers
  socket.on('offer_draw', ({ roomId }) => {
    const cleanId = (roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room || room.status !== 'active') return;

    const isWhite = room.white && room.white.socketId === socket.id;
    const offeringColor = isWhite ? 'w' : 'b';
    room.drawOfferFrom = offeringColor;

    socket.to(cleanId).emit('draw_offered', { from: offeringColor });
  });

  socket.on('accept_draw', ({ roomId }) => {
    const cleanId = (roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room || room.status !== 'active' || !room.drawOfferFrom) return;

    room.status = 'ended';
    room.result = '1/2-1/2';
    room.reason = 'agreement';

    io.to(cleanId).emit('game_ended', {
      result: room.result,
      reason: room.reason,
      whiteTime: room.white.timeRemainingMs,
      blackTime: room.black.timeRemainingMs,
    });
  });

  // 6. Rematch Request
  socket.on('request_rematch', ({ roomId }) => {
    const cleanId = (roomId || '').trim().toLowerCase();
    const room = rooms.get(cleanId);
    if (!room || room.status !== 'ended') return;

    const isWhite = room.white && room.white.socketId === socket.id;
    const color = isWhite ? 'w' : 'b';

    if (room.rematchOfferFrom && room.rematchOfferFrom !== color) {
      // Both accepted rematch: swap colors and reset board!
      const oldWhite = room.white;
      const oldBlack = room.black;
      const baseMs = room.timeControl.baseSeconds * 1000;

      room.white = { ...oldBlack, timeRemainingMs: baseMs };
      room.black = { ...oldWhite, timeRemainingMs: baseMs };
      room.chess = new Chess();
      room.status = 'active';
      room.result = '*';
      room.reason = 'active';
      room.history = [];
      room.drawOfferFrom = null;
      room.rematchOfferFrom = null;
      room.lastMoveTimestamp = Date.now();

      io.to(cleanId).emit('rematch_started', { roomData: getSafeRoomData(room) });
    } else {
      room.rematchOfferFrom = color;
      socket.to(cleanId).emit('rematch_requested', { from: color });
    }
  });

  // 7. Disconnect Handling
  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.white && room.white.socketId === socket.id) {
        room.white.connected = false;
        io.to(roomId).emit('player_disconnected', { color: 'w' });
      }
      if (room.black && room.black.socketId === socket.id) {
        room.black.connected = false;
        io.to(roomId).emit('player_disconnected', { color: 'b' });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[64Squares Socket Server] listening on port ${PORT}`);
});

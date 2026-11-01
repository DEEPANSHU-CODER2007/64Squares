# 64Squares — Think Ahead. Play Smart.

"64 squares. Infinite possibilities."

**64Squares** is a modern, high-performance online chess platform built with Next.js (App Router), TypeScript, Tailwind CSS, Stockfish WebAssembly, Socket.IO, and Prisma.

---

## ♟️ Key Features

- **Genuine Stockfish AI Opponent**: Web Worker-powered UCI Stockfish engine with 5 calibrated skill levels (Beginner to Expert), real-time evaluation, undo moves, and time controls.
- **Private Multiplayer with Friends**: Create unguessable private rooms with shareable invitation links (`/play/friend/[roomId]`), room codes, draw offers, rematching, and reconnect support.
- **Online Matchmaking**: Real-time matchmaking queues for Bullet (`1+0`), Blitz (`3+0`, `3+2`, `5+0`), and Rapid (`10+0`, `15+10`).
- **Server-Authoritative Move Validation**: Every ply is validated on the backend via `chess.js`. Browser clients submit move intents; the server enforces legality, turns, and authoritative clock ticks.
- **High-Performance Staunton Board**: Drag-and-drop, click-to-select, touch support, coordinates, legal move hints, check glow, last move highlight, pawn promotion dialog, and board flipping.
- **Web Audio Sound Effects**: Zero-dependency, low-latency audio synthesizer (moves, captures, checks, checkmates, timeouts).
- **Deep Engine Analysis**: Live evaluation bar, principal variation (PV), best move recommendation, and FEN/PGN import/export.
- **Tactics & Puzzles**: Hand-crafted tactical puzzles (Forks, Pins, Skewers, Back-Rank Mates, Smothered Mates) with interactive solution verification.
- **Interactive Academy**: Visual, hands-on chess lessons for basic movements, special rules (Castling, En Passant, Promotion), and tactical motifs.
- **Accounts & Ratings**: Optional authentication with password hashing, persistent match histories, provisional ratings, and global leaderboards.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 2. Installation
```bash
git clone <repo-url>
cd 64squares
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root (see `.env.example`):
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
SOCKET_PORT=3001
JWT_SECRET="your-secure-jwt-secret"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Running the Application
To run both the Next.js frontend and the persistent Socket.IO multiplayer server simultaneously:
```bash
npm run dev:all
```
Or in two separate terminals:
```bash
# Terminal 1: Next.js Frontend (port 3000)
npm run dev

# Terminal 2: Socket.IO Server (port 3001)
npm run server
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run automated tests via Vitest:
```bash
npm test
```
Tests cover:
- Standard chess rules (Pawn double steps, Knight jumps, Castling, En Passant, Promotion, Check, Checkmate, Stalemate, Insufficient material, Material advantage).
- Server-authoritative multiplayer validation (Turn enforcement, duplicate move rejection, clock decrements & increments).
- Stockfish difficulty calibration and Web Worker interface.

---

## 📦 Production Deployment

### Frontend (e.g., Vercel / Netlify / Cloudflare Pages)
1. Push codebase to GitHub.
2. Link repository to Vercel.
3. Configure environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SOCKET_URL`: URL of your deployed Socket.IO server (e.g. `https://socket.yourdomain.com` or `https://64squares-socket.onrender.com`).
   - `DATABASE_URL`: Managed PostgreSQL connection string (e.g. Supabase, Neon, AWS RDS).
   - `JWT_SECRET`: Random 64-char secret string.
4. Build command: `npm run build`.

### Multiplayer Server (e.g., Railway / Render / Fly.io / DigitalOcean)
Socket.IO requires a persistent Node.js process (serverless functions cannot hold persistent WebSockets):
1. Deploy `server/socket-server.js` on a persistent host (e.g., Railway or Render Web Service).
2. Start command: `node server/socket-server.js`.
3. Set environment variables:
   - `PORT`: 3001 (or host-assigned port).
   - `CORS_ORIGIN`: Your production frontend domain.

### Database Migration (PostgreSQL)
In production with PostgreSQL, update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
Run:
```bash
npx prisma db push
```

---

## 📁 Project Architecture

```
64squares/
├── app/
│   ├── api/
│   │   ├── auth/          # Registration & Login endpoints (JWT, bcrypt)
│   │   └── games/         # Saved match records
│   ├── play/
│   │   ├── computer/      # Play against Stockfish AI
│   │   ├── friend/        # Create/join private multiplayer rooms
│   │   │   └── [roomId]/  # Real-time private match arena
│   │   └── online/        # Online matchmaking queue
│   ├── analysis/          # Engine analysis board & evaluation bar
│   ├── puzzles/           # Tactical puzzles trainer
│   ├── learn/             # Interactive chess academy
│   ├── leaderboard/       # Ranked player leaderboards
│   ├── profile/[username] # Player statistics & ratings
│   ├── history/           # Saved match history & PGN export
│   ├── settings/          # Themes, coordinates, sounds
│   ├── login/ & register/ # Authentication pages
│   ├── layout.tsx         # Root layout with responsive Navbar & Footer
│   └── page.tsx           # Landing page with interactive preview board
├── components/
│   ├── chess/
│   │   ├── Chessboard.tsx     # 8x8 interactive board
│   │   ├── Piece.tsx          # Staunton SVG pieces
│   │   ├── MoveHistory.tsx    # Move history list & navigation
│   │   ├── PlayerCard.tsx     # Clocks, material advantage, badges
│   │   ├── EvaluationBar.tsx  # Vertical evaluation meter
│   │   ├── GameOverModal.tsx  # Termination reason & rematch modal
│   │   └── PromotionModal.tsx # Pawn promotion dialog
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Logo.tsx
├── lib/
│   ├── chess/
│   │   ├── types.ts            # Chess interfaces & presets
│   │   ├── chess-rules.ts      # Authoritative chess.js wrapper
│   │   ├── audio.ts            # Web Audio API sound generator
│   │   └── stockfish-engine.ts # Stockfish Web Worker manager
│   ├── socket/
│   │   └── socket-client.ts    # Socket.IO client singleton
│   └── db.ts                   # Prisma client singleton
├── public/
│   └── stockfish.js       # Stockfish WASM/UCI Web Worker
├── server/
│   └── socket-server.js   # Persistent Socket.IO multiplayer server
├── tests/
│   ├── chess-rules.test.ts
│   ├── multiplayer.test.ts
│   └── stockfish-engine.test.ts
└── scripts/
    └── dev.js             # Dual dev server runner
```

---

## 🛡️ License & Attributions
- Built for **64Squares**.
- Chess engine powered by **Stockfish** (GPL-3.0).
- Standard chess rules verified with **chess.js**.


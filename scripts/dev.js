const { spawn } = require('child_process');

console.log('[64Squares] Starting Next.js frontend and persistent Socket.IO server...');

const nextProc = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

const socketProc = spawn('node', ['server/socket-server.js'], {
  stdio: 'inherit',
  shell: true,
});

function handleExit() {
  nextProc.kill();
  socketProc.kill();
  process.exit();
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);


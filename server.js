const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });

  ptyProcess.on("data", data => {
    socket.emit("terminal.incomingData", data);
  });

  socket.on("terminal.keystroke", data => {
    ptyProcess.write(data);
  });

  socket.on("resize", size => {
    ptyProcess.resize(size.cols, size.rows);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    ptyProcess.kill();
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Web Terminal running at http://localhost:${PORT}`));
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Rooms = require('./rooms');
const State = require('./drawing_state');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/health', (_req, res) => res.json({ ok: true }));

const rooms = new Rooms();
const states = new Map();
function getState(roomId) {
  if (!states.has(roomId)) states.set(roomId, new State(roomId));
  return states.get(roomId);
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let user = null;

  socket.on('room:join', ({ roomId, profile }) => {
    if (currentRoom) { socket.leave(currentRoom); rooms.removeUser(currentRoom, socket.id); }
    currentRoom = roomId || 'lobby';
    user = rooms.addUser(currentRoom, socket.id, profile);
    socket.join(currentRoom);
    const snapshot = getState(currentRoom).snapshot();
    socket.emit('session:init', { profile: user, snapshot, users: rooms.listUsers(currentRoom) });
    io.to(currentRoom).emit('presence:update', rooms.listUsers(currentRoom));
  });

  socket.on('room:leave', ({ roomId }) => {
    const r = roomId === '*' ? currentRoom : roomId;
    if (r && rooms.has(r, socket.id)) {
      rooms.removeUser(r, socket.id);
      socket.leave(r);
      io.to(r).emit('presence:update', rooms.listUsers(r));
      io.to(r).emit('presence:left', { userId: socket.id });
      if (r === currentRoom) currentRoom = null;
    }
  });

  socket.on('cursor:move', ({ x, y }) => {
    if (!currentRoom || !user) return;
    socket.to(currentRoom).emit('cursor:move', { userId: socket.id, name: user.name, color: user.color, x, y });
  });

  socket.on('stroke:start', (meta) => {
    if (!currentRoom || !user) return;
    const state = getState(currentRoom);
    const op = state.beginStroke(socket.id, meta);
    io.to(currentRoom).emit('stroke:apply', op);
  });

  socket.on('stroke:points', ({ opId, points }) => {
    if (!currentRoom || !user) return;
    const state = getState(currentRoom);
    const op = state.appendPoints(opId, points);
    if (op) io.to(currentRoom).emit('stroke:apply', { ...op, points });
  });

  socket.on('stroke:end', ({ opId, stats }) => {
    if (!currentRoom || !user) return;
    const state = getState(currentRoom);
    state.endStroke(opId, stats);
  });

  socket.on('op:undo', () => {
    if (!currentRoom) return;
    const state = getState(currentRoom);
    state.undo();
    io.to(currentRoom).emit('state:snapshot', state.snapshot());
  });

  socket.on('op:redo', () => {
    if (!currentRoom) return;
    const state = getState(currentRoom);
    state.redo();
    io.to(currentRoom).emit('state:snapshot', state.snapshot());
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      rooms.removeUser(currentRoom, socket.id);
      io.to(currentRoom).emit('presence:update', rooms.listUsers(currentRoom));
      io.to(currentRoom).emit('presence:left', { userId: socket.id });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Server listening on http://localhost:${PORT}`); });

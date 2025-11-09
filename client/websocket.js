// Networking wrapper around Socket.IO client
const socket = io(window.location.origin, {
  autoConnect: false,
  transports: ["websocket"], // Force websocket (avoid long polling)
});
const Net = {
  join(roomId, profile) { socket.emit('room:join', { roomId, profile }); },
  leave(roomId) { socket.emit('room:leave', { roomId }); },
  sendCursor(payload) { socket.emit('cursor:move', payload); },
  beginStroke(op) { socket.emit('stroke:start', op); },
  streamPoints(opId, batch) { socket.emit('stroke:points', { opId, points: batch }); },
  endStroke(opId, stats) { socket.emit('stroke:end', { opId, stats }); },
  undo() { socket.emit('op:undo'); },
  redo() { socket.emit('op:redo'); },
  on(event, handler) { socket.on(event, handler); },
  connect() { socket.connect(); },
  disconnect() { socket.disconnect(); }
};
window.Net = Net;

const PALETTE = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#E56B6F',
  '#7B2CBF', '#00C2A8', '#F8961E', '#00B4D8', '#EF476F'
];

class Rooms {
  constructor() { this.map = new Map(); } // roomId -> { users: Map, nextColor }

  ensure(roomId) {
    if (!this.map.has(roomId)) this.map.set(roomId, { users: new Map(), nextColor: 0 });
    return this.map.get(roomId);
  }

  addUser(roomId, socketId, profile) {
    const room = this.ensure(roomId);
    const color = PALETTE[room.nextColor % PALETTE.length];
    room.nextColor++;
    const cleanName = (profile && profile.name) ? String(profile.name).slice(0,24) : `user-${socketId.slice(0,4)}`;
    const user = { id: socketId, name: cleanName, color };
    room.users.set(socketId, user);
    return user;
  }

  removeUser(roomId, socketId) {
    const room = this.ensure(roomId);
    room.users.delete(socketId);
  }

  listUsers(roomId) {
    const room = this.ensure(roomId);
    return Array.from(room.users.values());
  }

  has(roomId, socketId) {
    const room = this.ensure(roomId);
    return room.users.has(socketId);
  }
}

module.exports = Rooms;

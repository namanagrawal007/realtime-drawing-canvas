const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        drawingState: new DrawingState(),
        users: new Map()
      });
    }
    return this.rooms.get(roomId);
  }

  addUser(roomId, socketId, userData) {
    const room = this.getOrCreateRoom(roomId);
    room.users.set(socketId, userData);
    return room;
  }

  removeUser(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(socketId);
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }
}

module.exports = RoomManager;

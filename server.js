const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./rooms');

const app = express();
const server = http.createServer(app);

// --- ENABLE CORS FOR EXPRESS ---
app.use(cors());

// --- ENABLE CORS FOR SOCKET.IO ---
const io = new Server(server, {
  cors: {
    origin: "*",         // Or set your frontend URL here
    methods: ["GET", "POST"]
  }
});

const roomManager = new RoomManager();

// Static files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join-room', (data) => {
    const { roomId, username, color } = data;
    currentRoom = roomId;
    currentUser = { id: socket.id, username, color };

    socket.join(roomId);
    const room = roomManager.addUser(roomId, socket.id, currentUser);

    socket.emit('init-canvas', {
      strokes: room.drawingState.getStrokes(),
      users: roomManager.getRoomUsers(roomId)
    });

    socket.to(roomId).emit('user-joined', currentUser);
    io.to(roomId).emit('users-update', roomManager.getRoomUsers(roomId));
  });

  socket.on('draw-stroke', (strokeData) => {
    if (!currentRoom) return;

    const room = roomManager.getRoom(currentRoom);
    if (room) {
      const strokeIndex = room.drawingState.addStroke(strokeData);
      socket.to(currentRoom).emit('draw-stroke', { ...strokeData, strokeIndex });
    }
  });

  socket.on('cursor-move', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('cursor-move', {
      userId: socket.id,
      ...data
    });
  });

  socket.on('undo', () => {
    if (!currentRoom) return;

    const room = roomManager.getRoom(currentRoom);
    if (room) {
      const result = room.drawingState.undo();
      if (result.success) {
        io.to(currentRoom).emit('undo', result.strokeIndex);
      }
    }
  });

  socket.on('redo', () => {
    if (!currentRoom) return;

    const room = roomManager.getRoom(currentRoom);
    if (room) {
      const result = room.drawingState.redo();
      if (result.success) {
        io.to(currentRoom).emit('redo', { stroke: result.stroke, strokeIndex: result.strokeIndex });
      }
    }
  });

  socket.on('clear-canvas', () => {
    if (!currentRoom) return;

    const room = roomManager.getRoom(currentRoom);
    if (room) {
      room.drawingState.clear();
      io.to(currentRoom).emit('clear-canvas');
    }
  });

  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });

  socket.on('disconnect', () => {
    if (currentRoom && currentUser) {
      roomManager.removeUser(currentRoom, socket.id);
      socket.to(currentRoom).emit('user-left', socket.id);
      io.to(currentRoom).emit('users-update', roomManager.getRoomUsers(currentRoom));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

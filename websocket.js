class WebSocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.currentUser = null;
    this.users = [];
    this.latency = 0;

    this.onInitCanvas = null;
    this.onDrawStroke = null;
    this.onCursorMove = null;
    this.onUsersUpdate = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onUndo = null;
    this.onRedo = null;
    this.onClearCanvas = null;
  }

  connect(roomId, username, color) {
    return new Promise((resolve, reject) => {
      this.socket = io('https://realtime-drawing-canvas-backend-frmq.onrender.com');

      this.socket.on('connect', () => {
        this.connected = true;
        this.currentUser = { username, color };

        this.socket.emit('join-room', { roomId, username, color });

        this.startLatencyCheck();
      });

      this.socket.on('init-canvas', (data) => {
        this.users = data.users;
        if (this.onInitCanvas) {
          this.onInitCanvas(data.strokes, data.users);
        }
        resolve();
      });

      this.socket.on('draw-stroke', (data) => {
        if (this.onDrawStroke) {
          this.onDrawStroke(data);
        }
      });

      this.socket.on('cursor-move', (data) => {
        if (this.onCursorMove) {
          this.onCursorMove(data);
        }
      });

      this.socket.on('users-update', (users) => {
        this.users = users;
        if (this.onUsersUpdate) {
          this.onUsersUpdate(users);
        }
      });

      this.socket.on('user-joined', (user) => {
        if (this.onUserJoined) {
          this.onUserJoined(user);
        }
      });

      this.socket.on('user-left', (userId) => {
        if (this.onUserLeft) {
          this.onUserLeft(userId);
        }
      });

      this.socket.on('undo', (strokeIndex) => {
        if (this.onUndo) {
          this.onUndo(strokeIndex);
        }
      });

      this.socket.on('redo', (data) => {
        if (this.onRedo) {
          this.onRedo(data.stroke, data.strokeIndex);
        }
      });

      this.socket.on('clear-canvas', () => {
        if (this.onClearCanvas) {
          this.onClearCanvas();
        }
      });

      this.socket.on('pong', (timestamp) => {
        this.latency = Date.now() - timestamp;
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });
    });
  }

  emitStroke(stroke) {
    if (this.connected) {
      this.socket.emit('draw-stroke', stroke);
    }
  }

  emitCursorMove(x, y) {
    if (this.connected) {
      this.socket.emit('cursor-move', { x, y });
    }
  }

  emitUndo() {
    if (this.connected) {
      this.socket.emit('undo');
    }
  }

  emitRedo() {
    if (this.connected) {
      this.socket.emit('redo');
    }
  }

  emitClear() {
    if (this.connected) {
      this.socket.emit('clear-canvas');
    }
  }

  startLatencyCheck() {
    setInterval(() => {
      if (this.connected) {
        this.socket.emit('ping', Date.now());
      }
    }, 2000);
  }

  getLatency() {
    return this.latency;
  }

  getCurrentUserId() {
    return this.socket ? this.socket.id : null;
  }

  getUsers() {
    return this.users;
  }
}

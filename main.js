let canvasManager;
let wsManager;

function generateRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}

function showJoinModal() {
  const modal = document.getElementById('joinModal');
  const form = document.getElementById('joinForm');

  modal.classList.remove('hidden');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const roomId = document.getElementById('roomId').value.trim() || 'default';
    const color = generateRandomColor();

    modal.classList.add('hidden');

    await initializeApp(roomId, username, color);
  });
}

async function initializeApp(roomId, username, color) {
  const drawingCanvas = document.getElementById('drawingCanvas');
  const cursorCanvas = document.getElementById('cursorCanvas');

  canvasManager = new CanvasManager(drawingCanvas, cursorCanvas);
  wsManager = new WebSocketManager();

  setupWebSocketCallbacks();
  setupUIControls();
  setupStatsDisplay();

  try {
    await wsManager.connect(roomId, username, color);
  } catch (error) {
    console.error('Connection failed:', error);
    alert('Failed to connect to server. Please try again.');
  }
}

function setupWebSocketCallbacks() {
  wsManager.onInitCanvas = (strokes, users) => {
    canvasManager.loadStrokes(strokes);
    updateUsersList(users);
  };

  wsManager.onDrawStroke = (strokeData) => {
    canvasManager.addRemoteStroke(strokeData);
  };

  wsManager.onCursorMove = (data) => {
    const user = wsManager.getUsers().find(u => u.id === data.userId);
    if (user) {
      canvasManager.updateOtherCursor(data.userId, user.username, user.color, data.x, data.y);
    }
  };

  wsManager.onUsersUpdate = (users) => {
    updateUsersList(users);
  };

  wsManager.onUserJoined = (user) => {
    console.log('User joined:', user.username);
  };

  wsManager.onUserLeft = (userId) => {
    canvasManager.removeOtherCursor(userId);
  };

  wsManager.onUndo = (strokeIndex) => {
    canvasManager.removeLastStroke();
  };

  wsManager.onRedo = (stroke, strokeIndex) => {
    canvasManager.addStrokeAtIndex(stroke, strokeIndex);
  };

  wsManager.onClearCanvas = () => {
    canvasManager.clearCanvas();
  };

  canvasManager.onStrokeComplete = (stroke) => {
    wsManager.emitStroke(stroke);
  };

  canvasManager.onCursorMove = (pos) => {
    wsManager.emitCursorMove(pos.x, pos.y);
  };
}

function setupUIControls() {
  const brushTool = document.getElementById('brushTool');
  const eraserTool = document.getElementById('eraserTool');
  const colorPicker = document.getElementById('colorPicker');
  const colorPreview = document.querySelector('.color-preview');
  const strokeWidth = document.getElementById('strokeWidth');
  const strokeWidthValue = document.getElementById('strokeWidthValue');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearBtn = document.getElementById('clearBtn');

  brushTool.addEventListener('click', () => {
    canvasManager.setTool('brush');
    brushTool.classList.add('active');
    eraserTool.classList.remove('active');
  });

  eraserTool.addEventListener('click', () => {
    canvasManager.setTool('eraser');
    eraserTool.classList.add('active');
    brushTool.classList.remove('active');
  });

  colorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    canvasManager.setColor(color);
    colorPreview.style.background = color;
  });

  strokeWidth.addEventListener('input', (e) => {
    const width = parseInt(e.target.value);
    canvasManager.setStrokeWidth(width);
    strokeWidthValue.textContent = width;
  });

  undoBtn.addEventListener('click', () => {
    wsManager.emitUndo();
    canvasManager.removeLastStroke();
  });

  redoBtn.addEventListener('click', () => {
    wsManager.emitRedo();
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas for everyone?')) {
      wsManager.emitClear();
      canvasManager.clearCanvas();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoBtn.click();
      } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
        e.preventDefault();
        redoBtn.click();
      }
    }
  });
}

function setupStatsDisplay() {
  const fpsCounter = document.getElementById('fpsCounter');
  const latencyCounter = document.getElementById('latencyCounter');
  const userCount = document.getElementById('userCount');

  setInterval(() => {
    fpsCounter.textContent = canvasManager.getFPS();
    latencyCounter.textContent = `${wsManager.getLatency()}ms`;
    userCount.textContent = wsManager.getUsers().length;
  }, 100);
}

function updateUsersList(users) {
  const usersList = document.getElementById('usersList');
  const currentUserId = wsManager.getCurrentUserId();

  usersList.innerHTML = '';

  users.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    if (user.id === currentUserId) {
      userItem.classList.add('current-user');
    }

    const colorDot = document.createElement('div');
    colorDot.className = 'user-color';
    colorDot.style.background = user.color;

    const userName = document.createElement('span');
    userName.className = 'user-name';
    userName.textContent = user.username + (user.id === currentUserId ? ' (You)' : '');

    userItem.appendChild(colorDot);
    userItem.appendChild(userName);
    usersList.appendChild(userItem);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  showJoinModal();
});

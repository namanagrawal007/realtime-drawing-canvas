class CanvasManager {
  constructor(drawingCanvas, cursorCanvas) {
    this.drawingCanvas = drawingCanvas;
    this.cursorCanvas = cursorCanvas;
    this.drawingCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });
    this.cursorCtx = cursorCanvas.getContext('2d');

    this.isDrawing = false;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.currentStrokeWidth = 3;

    this.currentStroke = null;
    this.strokes = [];

    this.onStrokeComplete = null;
    this.onCursorMove = null;

    this.otherCursors = new Map();
    this.fpsCounter = 0;
    this.lastFrameTime = performance.now();

    this.setupCanvas();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  setupCanvas() {
    const container = this.drawingCanvas.parentElement;
    this.resizeCanvas(container.clientWidth, container.clientHeight);

    window.addEventListener('resize', () => {
      const savedStrokes = this.strokes;
      this.resizeCanvas(container.clientWidth, container.clientHeight);
      this.redrawAll();
    });
  }

  resizeCanvas(width, height) {
    this.drawingCanvas.width = width;
    this.drawingCanvas.height = height;
    this.cursorCanvas.width = width;
    this.cursorCanvas.height = height;
  }

  setupEventListeners() {
    this.drawingCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.drawingCanvas.addEventListener('mousemove', (e) => this.draw(e));
    this.drawingCanvas.addEventListener('mouseup', () => this.stopDrawing());
    this.drawingCanvas.addEventListener('mouseout', () => this.stopDrawing());

    this.drawingCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.startDrawing(mouseEvent);
    });

    this.drawingCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.draw(mouseEvent);
    });

    this.drawingCanvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopDrawing();
    });
  }

  getMousePos(e) {
    const rect = this.drawingCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  startDrawing(e) {
    this.isDrawing = true;
    const pos = this.getMousePos(e);

    this.currentStroke = {
      tool: this.currentTool,
      color: this.currentColor,
      width: this.currentStrokeWidth,
      points: [pos]
    };
  }

  draw(e) {
    const pos = this.getMousePos(e);

    if (this.onCursorMove) {
      this.onCursorMove(pos);
    }

    if (!this.isDrawing) return;

    this.currentStroke.points.push(pos);
    this.drawStroke(this.currentStroke, this.currentStroke.points.length - 2);
  }

  stopDrawing() {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    if (this.currentStroke && this.currentStroke.points.length > 1) {
      this.strokes.push(this.currentStroke);

      if (this.onStrokeComplete) {
        this.onStrokeComplete(this.currentStroke);
      }
    }

    this.currentStroke = null;
  }

  drawStroke(stroke, startIndex = 0) {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;

    const ctx = this.drawingCtx;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();

    const start = Math.max(0, startIndex);
    if (start === 0) {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    } else {
      ctx.moveTo(stroke.points[start].x, stroke.points[start].y);
    }

    for (let i = start + 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  redrawAll() {
    this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
    this.strokes.forEach(stroke => this.drawStroke(stroke));
  }

  addRemoteStroke(stroke) {
    this.strokes.push(stroke);
    this.drawStroke(stroke);
  }

  removeLastStroke() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.redrawAll();
    }
  }

  addStrokeAtIndex(stroke, index) {
    this.strokes.push(stroke);
    this.drawStroke(stroke);
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setStrokeWidth(width) {
    this.currentStrokeWidth = width;
  }

  clearCanvas() {
    this.strokes = [];
    this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
  }

  loadStrokes(strokes) {
    this.strokes = strokes;
    this.redrawAll();
  }

  updateOtherCursor(userId, username, color, x, y) {
    this.otherCursors.set(userId, { username, color, x, y });
  }

  removeOtherCursor(userId) {
    this.otherCursors.delete(userId);
  }

  startAnimationLoop() {
    const animate = () => {
      this.drawCursors();
      this.updateFPS();
      requestAnimationFrame(animate);
    };
    animate();
  }

  drawCursors() {
    this.cursorCtx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);

    this.otherCursors.forEach((cursor) => {
      this.cursorCtx.fillStyle = cursor.color;
      this.cursorCtx.strokeStyle = '#ffffff';
      this.cursorCtx.lineWidth = 2;

      this.cursorCtx.beginPath();
      this.cursorCtx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
      this.cursorCtx.fill();
      this.cursorCtx.stroke();

      this.cursorCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.cursorCtx.fillRect(cursor.x + 12, cursor.y + 12,
        cursor.username.length * 7 + 12, 20);

      this.cursorCtx.fillStyle = '#ffffff';
      this.cursorCtx.font = '11px sans-serif';
      this.cursorCtx.fillText(cursor.username, cursor.x + 18, cursor.y + 26);
    });
  }

  updateFPS() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.fpsCounter = Math.round(1000 / delta);
    this.lastFrameTime = now;
  }

  getFPS() {
    return this.fpsCounter;
  }
}

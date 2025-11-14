class DrawingState {
  constructor() {
    this.strokes = [];
    this.undoneStrokes = [];
  }

  addStroke(stroke) {
    this.strokes.push(stroke);
    this.undoneStrokes = [];
    return this.strokes.length - 1;
  }

  undo() {
    if (this.strokes.length > 0) {
      const stroke = this.strokes.pop();
      this.undoneStrokes.push(stroke);
      return { success: true, strokeIndex: this.strokes.length };
    }
    return { success: false };
  }

  redo() {
    if (this.undoneStrokes.length > 0) {
      const stroke = this.undoneStrokes.pop();
      this.strokes.push(stroke);
      return { success: true, stroke, strokeIndex: this.strokes.length - 1 };
    }
    return { success: false };
  }

  getStrokes() {
    return this.strokes;
  }

  clear() {
    this.strokes = [];
    this.undoneStrokes = [];
  }
}

module.exports = DrawingState;

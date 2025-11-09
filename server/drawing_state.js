class DrawingState {
  constructor(roomId) {
    this.roomId = roomId;
    this.applied = [];
    this.undone = [];
    this.live = new Map(); // opId -> op in progress
  }

  beginStroke(authorSocketId, meta) {
    const op = {
      id: meta.id,
      type: 'stroke',
      tool: meta.tool,
      color: meta.color,
      width: meta.width,
      points: [],
      author: authorSocketId,
      ts: Date.now()
    };
    this.applied.push(op);
    this.live.set(op.id, op);
    return op;
  }

  appendPoints(opId, points) {
    const op = this.live.get(opId);
    if (!op || !Array.isArray(points) || points.length === 0) return null;
    for (const p of points) {
      const x = Number(p.x), y = Number(p.y), pr = Number(p.p || 1);
      if (Number.isFinite(x) && Number.isFinite(y)) op.points.push({ x, y, p: pr });
    }
    return op;
  }

  endStroke(opId, stats) {
    const op = this.live.get(opId);
    if (!op) return;
    op.stats = stats || null;
    this.live.delete(opId);
  }

  undo() {
    if (this.applied.length === 0) return;
    const last = this.applied[this.applied.length - 1];
    if (this.live.has(last.id)) this.live.delete(last.id);
    this.undone.push(this.applied.pop());
  }

  redo() {
    if (this.undone.length === 0) return;
    const op = this.undone.pop();
    this.applied.push(op);
  }

  snapshot() {
    return this.applied.map(op => ({
      id: op.id, type: op.type, tool: op.tool, color: op.color, width: op.width,
      points: op.points.slice(),
      user: op.author
    }));
    // (Undone ops are not included)
  }
}

module.exports = DrawingState;

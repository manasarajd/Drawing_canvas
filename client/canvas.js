const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const off = document.createElement('canvas');
const offCtx = off.getContext('2d');

let dpi = Math.max(1, window.devicePixelRatio || 1);
const appliedOps = [];

function clear(ctx2d) {
  ctx2d.save();
  ctx2d.setTransform(1,0,0,1,0,0);
  ctx2d.fillStyle = '#0a0d1a';
  ctx2d.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx2d.restore();
}

function drawOp(ctx2d, op) {
  ctx2d.save();
  ctx2d.globalCompositeOperation = op.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx2d.lineCap = 'round';
  ctx2d.lineJoin = 'round';
  ctx2d.strokeStyle = op.color;
  ctx2d.lineWidth = op.width;

  const pts = op.points;
  if (!pts || pts.length === 0) { ctx2d.restore(); return; }

  ctx2d.beginPath();
  ctx2d.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i+1];
    const mx = (p0.x + p1.x)/2, my = (p0.y + p1.y)/2;
    if (p0.p) ctx2d.lineWidth = Math.max(0.5, op.width * p0.p);
    ctx2d.quadraticCurveTo(p0.x, p0.y, mx, my);
  }
  ctx2d.stroke();
  ctx2d.restore();
}

function redrawFull() {
  clear(offCtx);
  for (const op of appliedOps) drawOp(offCtx, op);
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpi);
  canvas.height = Math.floor(rect.height * dpi);
  off.width = canvas.width;
  off.height = canvas.height;
  ctx.setTransform(dpi,0,0,dpi,0,0);
  offCtx.setTransform(dpi,0,0,dpi,0,0);
  redrawFull();
}

function applyOp(op) {
  appliedOps.push(op);
  drawOp(ctx, op);
}

function loadSnapshot(ops) {
  appliedOps.length = 0;
  for (const op of ops) appliedOps.push(op);
  redrawFull();
}

window.CanvasEngine = { resize, applyOp, loadSnapshot, redrawFull, drawOp, ctx };

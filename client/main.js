const toolBrushBtn = document.getElementById('tool-brush');
const toolEraserBtn = document.getElementById('tool-eraser');
const colorInput = document.getElementById('color');
const widthInput = document.getElementById('width');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const roomSelect = document.getElementById('room');
const statusEl = document.getElementById('status');
const cursorsEl = document.getElementById('cursors');
const usersEl = document.getElementById('users');

let tool = 'brush';
let color = colorInput.value;
let width = parseInt(widthInput.value, 10);
let currentOp = null;
let pointBatch = [];
let lastSent = 0;

const profile = { name: `user-${Math.floor(Math.random()*1000)}`, color: null };

function setTool(next) {
  tool = next;
  toolBrushBtn.classList.toggle('active', tool === 'brush');
  toolEraserBtn.classList.toggle('active', tool === 'eraser');
}
toolBrushBtn.addEventListener('click', () => setTool('brush'));
toolEraserBtn.addEventListener('click', () => setTool('eraser'));
colorInput.addEventListener('input', (e) => { color = e.target.value; });
widthInput.addEventListener('input', (e) => { width = parseInt(e.target.value, 10); });

window.addEventListener('resize', CanvasEngine.resize);
CanvasEngine.resize();

const canvasEl = document.getElementById('canvas');
let drawing = false;

function toCanvasCoords(evt) {
  const rect = canvasEl.getBoundingClientRect();
  return { x: (evt.clientX - rect.left), y: (evt.clientY - rect.top) };
}

canvasEl.addEventListener('pointerdown', (evt) => {
  evt.preventDefault();
  canvasEl.setPointerCapture(evt.pointerId);
  drawing = true;
  const { x, y } = toCanvasCoords(evt);
  const opId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  currentOp = {
    id: opId, type: 'stroke', tool,
    color: tool === 'eraser' ? '#000000' : color,
    width, points: [{ x, y, p: evt.pressure || 1 }], user: profile.name
  };
  CanvasEngine.applyOp(currentOp);
  Net.beginStroke({ id: currentOp.id, type: currentOp.type, tool: currentOp.tool, color: currentOp.color, width: currentOp.width });
  pointBatch.length = 0;
  pointBatch.push(currentOp.points[0]);
});

canvasEl.addEventListener('pointermove', (evt) => {
  const { x, y } = toCanvasCoords(evt);
  sendCursorThrottled(x, y);
  if (!drawing || !currentOp) return;
  evt.preventDefault();
  const p = { x, y, p: evt.pressure || 1 };
  currentOp.points.push(p);
  CanvasEngine.drawOp(CanvasEngine.ctx, { ...currentOp, points: currentOp.points.slice(-2) });
  pointBatch.push(p);
  maybeFlushPoints();
});

function endStroke(evt) {
  if (!drawing) return;
  drawing = false;
  canvasEl.releasePointerCapture(evt.pointerId);
  const stats = summarizeStroke(currentOp.points);
  Net.endStroke(currentOp.id, stats);
  currentOp = null;
  flushPoints(true);
}
canvasEl.addEventListener('pointerup', endStroke);
canvasEl.addEventListener('pointercancel', endStroke);

function summarizeStroke(pts) {
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,len=0;
  for (let i=0;i<pts.length;i++){
    const p=pts[i];
    if (p.x<minX) minX=p.x; if (p.y<minY) minY=p.y;
    if (p.x>maxX) maxX=p.x; if (p.y>maxY) maxY=p.y;
    if (i>0){ const dx=p.x-pts[i-1].x, dy=p.y-pts[i-1].y; len += Math.hypot(dx,dy); }
  }
  return { bbox:[minX,minY,maxX,maxY], length:Math.round(len) };
}

const remoteCursors = new Map();
function upsertCursor(userId, name, color, x, y) {
  let el = remoteCursors.get(userId);
  if (!el) {
    el = document.createElement('div');
    el.className = 'cursor';
    el.style.borderColor = '#fff';
    el.style.color = '#fff';
    cursorsEl.appendChild(el);
    remoteCursors.set(userId, el);
  }
  el.textContent = name;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.boxShadow = `0 0 0 3px ${color}66`;
}
function removeCursor(userId) {
  const el = remoteCursors.get(userId);
  if (el) { el.remove(); remoteCursors.delete(userId); }
}

function renderUsers(list) {
  usersEl.innerHTML = '';
  for (const u of list) {
    const pill = document.createElement('div');
    pill.className = 'user-pill';
    pill.style.boxShadow = `inset 0 0 0 2px ${u.color}`;
    pill.textContent = u.name;
    usersEl.appendChild(pill);
  }
}

Net.on('connect', () => { statusEl.textContent = '✅ connected'; });
Net.on('disconnect', () => { statusEl.textContent = '⚠️ disconnected'; });
Net.on('session:init', (payload) => {
  profile.name = payload.profile.name;
  profile.color = payload.profile.color;
  CanvasEngine.loadSnapshot(payload.snapshot);
  renderUsers(payload.users);
});
Net.on('stroke:apply', (op) => { CanvasEngine.applyOp(op); });
Net.on('state:snapshot', (ops) => { CanvasEngine.loadSnapshot(ops); });
Net.on('presence:update', (users) => { renderUsers(users); });
Net.on('cursor:move', ({ userId, name, color, x, y }) => { upsertCursor(userId, name, color, x, y); });
Net.on('presence:left', ({ userId }) => { removeCursor(userId); });

Net.connect();
Net.join(roomSelect.value, profile);

roomSelect.addEventListener('change', () => {
  Net.leave('*');
  CanvasEngine.loadSnapshot([]);
  Net.join(roomSelect.value, profile);
});
undoBtn.addEventListener('click', () => Net.undo());
redoBtn.addEventListener('click', () => Net.redo());
window.addEventListener('keydown', (e) => {
  const z = e.key.toLowerCase() === 'z';
  if ((e.ctrlKey || e.metaKey) && z && !e.shiftKey) { e.preventDefault(); Net.undo(); }
  if ((e.ctrlKey || e.metaKey) && z && e.shiftKey) { e.preventDefault(); Net.redo(); }
  if (e.key.toLowerCase() === 'b') setTool('brush');
  if (e.key.toLowerCase() === 'e') setTool('eraser');
});

function sendCursorThrottled(x, y) {
  const now = performance.now();
  if (now - lastSent > 60) { lastSent = now; Net.sendCursor({ x, y }); }
}
function maybeFlushPoints() {
  const now = performance.now();
  if (pointBatch.length >= 8 || now - (maybeFlushPoints.last || 0) > 16) {
    maybeFlushPoints.last = now;
    flushPoints(false);
  }
}
function flushPoints(force) {
  if (pointBatch.length === 0 && !force) return;
  const batch = pointBatch.splice(0, pointBatch.length);
  Net.streamPoints(currentOp ? currentOp.id : null, batch);
}

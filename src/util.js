// Crimson Harbor — small helpers: math, input, and canvas drawing primitives.
// Written for this entry; no library, no copied code.
export const TAU = Math.PI * 2;

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
export function angTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
export function angDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
export function fmtMoney(n) { return '$' + Math.floor(n).toLocaleString('en-US'); }
export function fmtTime(h) {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

// Deterministic RNG (mulberry32) so the city is the same every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- input ---------------------------------------------------------------
export const keys = {};
export const mouse = { x: 0, y: 0, down: false, clicked: false };

export function bindInput(canvas) {
  addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true;
    if (e.key === ' ') keys[' '] = true;
  });
  addEventListener('keyup', (e) => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
    if (e.key === ' ') keys[' '] = false;
  });
  addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    mouse.down = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
  });
  canvas.addEventListener('mousedown', () => { mouse.down = true; mouse.clicked = true; });
  addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
export const pressed = (k) => !!keys[k];

// ---- canvas helpers ------------------------------------------------------
export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function panel(ctx, x, y, w, h, fill = 'rgba(12,14,24,0.82)', stroke = 'rgba(255,255,255,0.10)') {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}
export function text(ctx, s, x, y, size, color, weight = 700, align = 'left', font = 'Arial') {
  ctx.font = weight + ' ' + size + 'px ' + font;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
export function star(ctx, cx, cy, r, filled, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// A small canvas-drawn face portrait (dialog boxes and the menu roster).
// The portrait spec is { bg, shirt, skin, hair, hat, shades }.
export function drawPortrait(ctx, x, y, size, c) {
  const s = size;
  rr(ctx, x, y, s, s, 8);
  ctx.fillStyle = c.bg;
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, s, s, 8);
  ctx.clip();
  // shoulders
  ctx.fillStyle = c.shirt;
  ctx.beginPath();
  ctx.ellipse(x + s / 2, y + s * 1.05, s * 0.42, s * 0.34, 0, 0, TAU);
  ctx.fill();
  // head
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(x + s / 2, y + s * 0.48, s * 0.24, s * 0.27, 0, 0, TAU);
  ctx.fill();
  // hair
  ctx.fillStyle = c.hair;
  ctx.beginPath();
  ctx.ellipse(x + s / 2, y + s * 0.30, s * 0.25, s * 0.16, 0, Math.PI, 0);
  ctx.fill();
  if (c.hat) {
    ctx.fillStyle = c.hat;
    ctx.fillRect(x + s * 0.22, y + s * 0.20, s * 0.56, s * 0.10);
  }
  // eyes, or shades
  if (c.shades) {
    ctx.fillStyle = '#111';
    rr(ctx, x + s * 0.30, y + s * 0.44, s * 0.40, s * 0.10, 3);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1c1c22';
    ctx.beginPath();
    ctx.arc(x + s * 0.42, y + s * 0.48, s * 0.028, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + s * 0.58, y + s * 0.48, s * 0.028, 0, TAU);
    ctx.fill();
  }
  // mouth
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(1, s * 0.02);
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s * 0.60, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  rr(ctx, x, y, s, s, 8);
  ctx.stroke();
}

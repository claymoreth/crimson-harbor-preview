// Crimson Harbor — the city: deterministic layout, collision, world + minimap drawing.
import { WORLD_W, WORLD_H, ROAD_STEP, ROAD_W, DISTRICTS, districtAt } from './data.js';
import { mulberry32, clamp } from './util.js';

export const CITY = buildCity();

function buildCity() {
  const rnd = mulberry32(20261118);
  const buildings = [];
  const palms = [];
  const neon = [];
  const palette = ['#6a5a72', '#7d6a5a', '#5a6a7d', '#8c6a5a', '#6a7d6a', '#a07d5a', '#5a5a6a'];
  const neonColors = ['#ff5ad8', '#4be8ff', '#ffb04b', '#7dff5a'];
  const neonWords = ['CLUB', 'BAR', 'NEON', '24H'];
  // Blocks sit between roads: roads run at 150 + k*300 (width 64), so each
  // block spans [182 + k*300, 418 + k*300] and its centre is 300 + k*300.
  for (let bx = 0; bx < 10; bx++) {
    for (let by = 0; by < 7; by++) {
      const cx = bx * ROAD_STEP + ROAD_STEP;
      const cy = by * ROAD_STEP + ROAD_STEP;
      if (cx > 3300 || cy > 2250) continue; // water strips
      const d = districtAt(cx, cy);
      const n = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const w = 90 + rnd() * 110;
        const h = 90 + rnd() * 110;
        buildings.push({
          x: cx + (rnd() - 0.5) * (236 - w),
          y: cy + (rnd() - 0.5) * (236 - h),
          w, h,
          color: palette[Math.floor(rnd() * palette.length)],
          tall: rnd() > 0.75,
          district: d.name,
        });
      }
      if (rnd() > 0.45) {
        palms.push({ x: cx + (rnd() - 0.5) * 200, y: cy + (rnd() - 0.5) * 200, s: 0.8 + rnd() * 0.5 });
      }
      if (d.name === 'CORAL ROW' || d.name === 'SUNSET STRIP') {
        neon.push({
          x: cx + (rnd() - 0.5) * 180,
          y: cy + (rnd() - 0.5) * 180,
          color: neonColors[Math.floor(rnd() * neonColors.length)],
          text: neonWords[Math.floor(rnd() * neonWords.length)],
        });
      }
    }
  }
  // Beach palms along the south shore.
  for (let i = 0; i < 26; i++) {
    palms.push({ x: 120 + i * 130 + rnd() * 40, y: 2330 + rnd() * 60, s: 0.9 + rnd() * 0.5 });
  }
  return { buildings, palms, neon };
}

export function isWater(x, y) {
  return y >= 2400 || x >= 3300;
}
export function onRoad(x, y) {
  // Road centrelines sit at 150 + k*300 (half-width 32); a point is on a road
  // when it is within ~36 of a centreline, vertically or horizontally.
  const mx = (((x - 150) % ROAD_STEP) + ROAD_STEP) % ROAD_STEP;
  const my = (((y - 150) % ROAD_STEP) + ROAD_STEP) % ROAD_STEP;
  return (mx < 36 || mx > ROAD_STEP - 36) || (my < 36 || my > ROAD_STEP - 36);
}
function hitBuilding(x, y, r) {
  for (const b of CITY.buildings) {
    if (x + r > b.x - b.w / 2 && x - r < b.x + b.w / 2 && y + r > b.y - b.h / 2 && y - r < b.y + b.h / 2) return b;
  }
  return null;
}
// Move a circle, sliding along buildings; returns the building hit (or null).
export function moveCircle(e, dx, dy, r) {
  let hit = null;
  const nx = e.x + dx;
  if (!hitBuilding(nx, e.y, r) && nx > 24 && nx < WORLD_W - 24 && !isWater(nx, e.y)) e.x = nx;
  else hit = hitBuilding(nx, e.y, r) || hit;
  const ny = e.y + dy;
  if (!hitBuilding(e.x, ny, r) && ny > 24 && ny < WORLD_H - 24 && !isWater(e.x, ny)) e.y = ny;
  else hit = hitBuilding(e.x, ny, r) || hit;
  return hit;
}
export function lineBlocked(x1, y1, x2, y2) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 24);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (hitBuilding(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 2)) return true;
  }
  return false;
}

// ---- world drawing --------------------------------------------------------
export function drawWorld(ctx, cam, game) {
  const { x: vx, y: vy, w: vw, h: vh } = cam;
  const night = game.hour >= 21 || game.hour < 6;
  const sunset = game.hour >= 17 && game.hour < 21;
  // ground
  ctx.fillStyle = sunset ? '#8a6a52' : night ? '#2a2f3a' : '#7d8a6a';
  ctx.fillRect(vx, vy, vw, vh);
  // district tint
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.tint + '55';
    const rx = Math.max(d.x, vx);
    const ry = Math.max(d.y, vy);
    ctx.fillRect(rx, ry, Math.min(d.x + d.w, vx + vw) - rx, Math.min(d.y + d.h, vy + vh) - ry);
  }
  // water (south + east)
  ctx.fillStyle = night ? '#0e2a4a' : '#2a7da8';
  ctx.fillRect(Math.max(0, vx), Math.max(2400, vy), Math.min(WORLD_W, vx + vw) - Math.max(0, vx), Math.min(WORLD_H, vy + vh) - Math.max(2400, vy));
  ctx.fillRect(Math.max(3300, vx), Math.max(0, vy), Math.min(WORLD_W, vx + vw) - Math.max(3300, vx), Math.min(WORLD_H, vy + vh) - Math.max(0, vy));
  // animated water shimmer
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  const t = game.time;
  for (let i = 0; i < 8; i++) {
    const wy = 2430 + i * 32 + Math.sin(t * 0.7 + i) * 4;
    if (wy < vy || wy > vy + vh) continue;
    ctx.beginPath();
    for (let x = Math.max(0, vx); x < Math.min(WORLD_W, vx + vw); x += 60) {
      ctx.moveTo(x, wy + Math.sin(x * 0.02 + t + i) * 3);
      ctx.lineTo(x + 34, wy + Math.sin(x * 0.02 + t + i) * 3);
    }
    ctx.stroke();
  }
  // beach
  ctx.fillStyle = '#d8c08a';
  ctx.fillRect(Math.max(0, vx), Math.max(2340, vy), Math.min(3300, vx + vw) - Math.max(0, vx), Math.min(2400, vy + vh) - Math.max(2340, vy));
  // roads
  ctx.fillStyle = night ? '#23262e' : '#3a3f4a';
  for (let k = 0; k <= 11; k++) {
    const x = 150 + k * ROAD_STEP;
    if (x + ROAD_W / 2 > vx && x - ROAD_W / 2 < vx + vw) {
      ctx.fillRect(x - ROAD_W / 2, Math.max(0, vy), ROAD_W, Math.min(2400, vy + vh) - Math.max(0, vy));
    }
  }
  for (let k = 0; k <= 8; k++) {
    const y = 150 + k * ROAD_STEP;
    if (y + ROAD_W / 2 > vy && y - ROAD_W / 2 < vy + vh) {
      ctx.fillRect(Math.max(0, vx), y - ROAD_W / 2, Math.min(3300, vx + vw) - Math.max(0, vx), ROAD_W);
    }
  }
  // road center dashes
  ctx.strokeStyle = night ? 'rgba(255,220,120,0.5)' : 'rgba(255,220,120,0.75)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 22]);
  for (let k = 0; k <= 11; k++) {
    const x = 150 + k * ROAD_STEP;
    if (x > vx && x < vx + vw) {
      ctx.beginPath();
      ctx.moveTo(x, Math.max(0, vy));
      ctx.lineTo(x, Math.min(2400, vy + vh));
      ctx.stroke();
    }
  }
  for (let k = 0; k <= 8; k++) {
    const y = 150 + k * ROAD_STEP;
    if (y > vy && y < vy + vh) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, vx), y);
      ctx.lineTo(Math.min(3300, vx + vw), y);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  // buildings
  for (const b of CITY.buildings) {
    if (b.x + b.w / 2 < vx || b.x - b.w / 2 > vx + vw || b.y + b.h / 2 < vy || b.y - b.h / 2 > vy + vh) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(b.x - b.w / 2 + 6, b.y - b.h / 2 + 8, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, 8);
    // rooftop detail
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(b.x - b.w / 4, b.y - b.h / 4, b.w / 2, b.h / 2);
    if (night) {
      ctx.fillStyle = '#ffd76a';
      for (let i = 0; i < 4; i++) {
        const wx = b.x - b.w / 2 + 14 + (i % 2) * (b.w - 28);
        const wy = b.y - b.h / 2 + 14 + Math.floor(i / 2) * (b.h - 28);
        ctx.fillRect(wx, wy, 8, 6);
      }
    }
  }
  // neon signs
  for (const n of CITY.neon) {
    if (n.x < vx || n.x > vx + vw || n.y < vy || n.y > vy + vh) continue;
    ctx.save();
    ctx.globalAlpha = night ? 1 : 0.55;
    ctx.fillStyle = n.color;
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = n.color;
    ctx.shadowBlur = 12;
    ctx.fillText(n.text, n.x, n.y);
    ctx.restore();
  }
  // palms
  for (const p of CITY.palms) {
    if (p.x < vx - 30 || p.x > vx + vw + 30 || p.y < vy - 30 || p.y > vy + vh + 30) continue;
    ctx.strokeStyle = '#5a3a22';
    ctx.lineWidth = 4 * p.s;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 4 * p.s, p.y - 16 * p.s);
    ctx.stroke();
    ctx.fillStyle = night ? '#1f4a2a' : '#2f7d3a';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.ellipse(p.x + 4 * p.s + Math.cos(a) * 12 * p.s, p.y - 16 * p.s + Math.sin(a) * 7 * p.s, 12 * p.s, 4 * p.s, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // night / sunset tint
  if (night) {
    ctx.fillStyle = 'rgba(8,12,40,0.34)';
    ctx.fillRect(vx, vy, vw, vh);
  } else if (sunset) {
    ctx.fillStyle = 'rgba(255,120,40,0.08)';
    ctx.fillRect(vx, vy, vw, vh);
  }
}

// ---- minimap (circular, FIXED whole-city view) ---------------------------
// The map itself NEVER moves, pans, or rotates: the entire city (3600x2700)
// is drawn once, in fixed screen coordinates, inside the circle. Only the
// player arrow (position + heading) and the markers / dots move. That is
// what keeps the minimap dead still while the car turns.
export function drawMinimap(ctx, cx, cy, r, game, opts = {}) {
  const scale = (r * 2) / WORLD_W;
  // Fixed origin: the whole city is centred in the circle, independent of
  // where the player is. Nothing here depends on the player position.
  const ox = cx - (WORLD_W * scale) / 2;
  const oy = cy - (WORLD_H * scale) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  // water + ground (land is x < 3300, y < 2400)
  ctx.fillStyle = '#2a7da8';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = '#5a6a52';
  ctx.fillRect(ox, oy, 3300 * scale, 2400 * scale);
  // roads (fixed positions, same as the world)
  ctx.fillStyle = '#3a3f4a';
  for (let k = 0; k <= 11; k++) ctx.fillRect(ox + (150 + k * ROAD_STEP) * scale - 2, oy, 4, 2400 * scale);
  for (let k = 0; k <= 8; k++) ctx.fillRect(ox, oy + (150 + k * ROAD_STEP) * scale - 2, 3300 * scale, 4);
  // POI markers
  for (const m of game.mapMarkers || []) {
    const mx = ox + m.x * scale;
    const my = oy + m.y * scale;
    if (mx < cx - r || mx > cx + r || my < cy - r || my > cy + r) continue;
    ctx.fillStyle = m.color || '#ffd24b';
    ctx.beginPath();
    ctx.arc(mx, my, m.big ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    if (m.ring) {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // enemies as red dots
  for (const e of game.enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath();
    ctx.arc(ox + e.x * scale, oy + e.y * scale, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // police as blue dots
  for (const p of game.police) {
    ctx.fillStyle = '#4ba8ff';
    ctx.beginPath();
    ctx.arc(ox + p.x * scale, oy + p.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // GPS route from the player to the objective (both move; the map does not)
  const pwx = ox + game.player.x * scale;
  const pwy = oy + game.player.y * scale;
  if (game.objective) {
    ctx.strokeStyle = '#ffd24b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pwx, pwy);
    ctx.lineTo(ox + game.objective.x * scale, oy + game.objective.y * scale);
    ctx.stroke();
    ctx.fillStyle = '#ffd24b';
    ctx.beginPath();
    ctx.arc(ox + game.objective.x * scale, oy + game.objective.y * scale, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // player arrow — the ONLY map element that rotates; its position follows
  // the player, its heading follows the car / the player's aim.
  ctx.save();
  ctx.translate(pwx, pwy);
  ctx.rotate(game.player.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -6);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // ring + north tick
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy - r - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - r - 8);
  if (opts.label) {
    ctx.fillStyle = 'rgba(10,10,16,0.85)';
    const w = ctx.measureText(opts.label).width + 18;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy + r + 4, w, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd24b';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(opts.label, cx, cy + r + 18);
  }
}

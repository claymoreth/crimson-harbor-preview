// Crimson Harbor — all screens drawn with the 2D canvas: HUD, main menu,
// city map, pause, controls, settings, wasted, victory, and the dialog bar.
// One shared text helper keeps the HUD readable over the game world.
import { WORLD_W, WORLD_H, CHARACTERS, MISSIONS, WEAPONS, CARS, RADIOS, POIS, DISTRICTS, GANGS, MARA, LEGEND, districtAt } from './data.js';
import { fmtMoney, fmtTime, clamp, dist } from './util.js';
import { drawWorld, drawMinimap, isWater } from './world.js';

export function text(ctx, s, x, y, size, color, align = 'left', weight = 700) {
  ctx.font = weight + ' ' + size + 'px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}
export function shadowText(ctx, s, x, y, size, color, align = 'left', weight = 800) {
  ctx.font = weight + ' ' + size + 'px Arial';
  ctx.textAlign = align;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(s, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function panel(ctx, x, y, w, h, alpha = 0.6) {
  ctx.fillStyle = 'rgba(12,10,24,' + alpha + ')';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}
function chip(ctx, s, x, y, w, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = '#0c0a18';
  ctx.font = '800 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(s, x + w / 2, y + 15);
}
export function drawPortrait(ctx, charDef, x, y, size, selected, label) {
  ctx.save();
  ctx.translate(x, y);
  if (charDef.bg) {
    ctx.fillStyle = charDef.bg;
  } else if (charDef.role) {
    ctx.fillStyle = '#3a2333';
  } else {
    ctx.fillStyle = '#2a2438';
  }
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, 10);
  ctx.fill();
  ctx.strokeStyle = selected ? '#ffd24b' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = selected ? 3 : 1;
  ctx.stroke();
  // Head.
  ctx.fillStyle = charDef.skin;
  ctx.beginPath();
  ctx.arc(0, -size * 0.14, size * 0.21, 0, Math.PI * 2);
  ctx.fill();
  // Hair.
  ctx.fillStyle = charDef.hair;
  ctx.beginPath();
  ctx.arc(0, -size * 0.28, size * 0.20, Math.PI, 0);
  ctx.fill();
  if (charDef.hat) {
    ctx.fillStyle = '#14101c';
    ctx.beginPath();
    ctx.roundRect(-size * 0.24, -size * 0.44, size * 0.48, size * 0.1, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-size * 0.30, -size * 0.36, size * 0.60, size * 0.06, 3);
    ctx.fill();
  }
  // Sunglasses / shades.
  if (charDef.shades) {
    ctx.fillStyle = '#14101c';
    ctx.beginPath();
    ctx.roundRect(-size * 0.16, -size * 0.18, size * 0.32, size * 0.08, 3);
    ctx.fill();
  }
  // Shoulders.
  ctx.fillStyle = charDef.shirt;
  ctx.beginPath();
  ctx.roundRect(-size * 0.30, size * 0.10, size * 0.60, size * 0.42, 8);
  ctx.fill();
  ctx.restore();
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '700 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + size / 2 + 16);
  }
}

// ---- HUD --------------------------------------------------------------------
export function drawHUD(ctx, g) {
  const p = g.player;
  const m = g.missions.current;
  const w = 1280;
  const h = 720;
  // Mission block, top left.
  if (m) {
    const s = g.missions.stage;
    panel(ctx, 16, 14, 390, 108, 0.55);
    text(ctx, 'CH ' + m.ch + '  ' + m.title.toUpperCase(), 28, 40, 17, '#ff7a6a', 'left', 900);
    text(ctx, m.brief, 28, 66, 14, '#fff', 'left', 600);
    text(ctx, (s ? s.text : ''), 28, 88, 13, '#ffd24b', 'left', 700);
    // Kill counter on shoot / boss stages — top right of the panel, clear of
    // the STAGE line below.
    if (s && (s.type === 'shoot' || s.type === 'boss')) {
      text(ctx, g.missions.kills + ' / ' + g.missions.killsNeed + ' down', 394, 40, 16, '#ff5a4b', 'right', 900);
    }
    text(ctx, 'STAGE ' + g.missions.stageNum + '/' + g.missions.stageTotal, 28, 110, 12, '#bdb8d6', 'left', 700);
    text(ctx, 'NEXT  ' + (s && s.next ? s.next : '—'), 260, 110, 12, '#bdb8d6', 'left', 700);
  } else {
    panel(ctx, 16, 14, 340, 60, 0.55);
    text(ctx, 'FREE ROAM — PORT VALEN', 28, 38, 16, '#fff', 'left', 900);
    text(ctx, 'Visit Mara at the safehouse for your next job', 28, 62, 13, '#ffd24b', 'left', 600);
  }
  // Timer on timed stages.
  if (m && g.missions.stage && g.missions.stage.type === 'deliver') {
    text(ctx, 'TIME  ' + Math.max(0, Math.ceil(g.stageTimer)) + 's', 406, 66, 18, '#ffd24b', 'left', 900);
  }
  // Wanted stars + sight, top right.
  const sx = w - 290;
  for (let i = 0; i < 5; i++) {
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = i < g.wanted ? '#ffd24b' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', sx + i * 30, 46);
  }
  text(ctx, g.wanted > 0 ? (g.inSight ? 'IN SIGHT' : 'HIDDEN  ' + Math.ceil(g.hiddenT) + 's') : '', sx, 68, 13, g.inSight ? '#ff5a4b' : '#7ddb8a', 'left', 900);
  text(ctx, 'DAY ' + g.day + '  ' + fmtTime(g.hour), w - 16, 96, 15, '#fff', 'right', 700);
  text(ctx, fmtMoney(g.cash), w - 16, 120, 20, '#ffd24b', 'right', 900);
  // Police panel, under the stars.
  if (g.wanted > 0 && g.police.length) {
    panel(ctx, w - 310, 132, 294, 34 + g.police.length * 24, 0.62);
    text(ctx, 'PVPD RESPONSE · ' + g.police.length + ' UNITS', w - 298, 156, 13, '#fff', 'left', 900);
    const shown = g.police.slice(0, 7);
    shown.forEach((u, i) => {
      const y = 176 + i * 24;
      text(ctx, (u.name || 'PVPD-' + i), w - 298, y, 12, '#fff', 'left', 700);
      text(ctx, Math.round(u.dist || 0) + 'm', w - 150, y, 12, '#ffd24b', 'left', 700);
      const modeColor = u.mode === 'RAMMING' ? '#ff5a4b' : u.mode === 'ROADBLOCK' ? '#ffd24b' : '#4be8ff';
      text(ctx, u.mode, w - 78, y, 11, modeColor, 'left', 900);
    });
  }
  // Bottom right — the two modes look NOTHING alike.
  if (p.inCar && p.car) {
    // MODE NYETIR: speed, car name, condition, radio.
    const sp = Math.abs(p.car.speed) * 0.36;
    text(ctx, Math.round(sp) + ' KM/H', w - 16, h - 84, 30, '#fff', 'right', 900);
    text(ctx, (p.car.def.name || 'CAR') + ' · CONDITION ' + Math.round(p.car.cond) + '%', w - 16, h - 58, 13, '#bdb8d6', 'right', 700);
    text(ctx, 'RADIO  ' + RADIOS[g.radio].name, w - 16, h - 36, 12, '#ff7ad8', 'right', 700);
  } else {
    // MODE JALAN KAKI: no speed, no car, no radio — a clear ON FOOT panel
    // with the weapon and ammo big, and HP.
    panel(ctx, w - 310, h - 118, 294, 82, 0.72);
    text(ctx, 'ON FOOT — LEO MARLOW', w - 298, h - 90, 15, '#ffd24b', 'left', 900);
    const wp = WEAPONS[p.weapon];
    const ammoTxt = wp.ammo === Infinity ? '∞' : (p.ammo[p.weapon] || 0) + ' / ' + (p.reserve[p.weapon] || 0);
    text(ctx, wp.name + '   ' + ammoTxt, w - 298, h - 62, 19, '#fff', 'left', 900);
    text(ctx, 'HP ' + Math.round(p.hp) + ' / ' + p.maxHp + '   ·   F — get back in a car', w - 298, h - 40, 12, '#7ddb8a', 'left', 700);
  }
  // Weapon slots — bottom left.
  const wx = 16;
  const wy = h - 66;
  WEAPONS.forEach((wp, i) => {
    const owned = g.save.weapons[i];
    const x = wx + i * 72;
    const sel = p.weapon === i;
    ctx.fillStyle = sel ? 'rgba(255,210,75,0.9)' : 'rgba(12,10,24,0.6)';
    ctx.beginPath();
    ctx.roundRect(x, wy, 64, 46, 6);
    ctx.fill();
    ctx.strokeStyle = sel ? '#ffd24b' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.stroke();
    text(ctx, wp.name, x + 32, wy + 15, 11, sel ? '#0c0a18' : '#fff', 'center', 900);
    text(ctx, owned ? (wp.ammo === Infinity ? '∞' : (p.ammo[i] || 0) + '/' + (p.reserve[i] || 0)) : 'LOCKED', x + 32, wy + 33, 11, owned ? (sel ? '#0c0a18' : '#ffd24b') : '#888', 'center', 700);
    text(ctx, (i + 1), x + 6, wy + 15, 10, '#bdb8d6', 'left', 700);
  });
  // HP bar.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(16, h - 84, 170, 8);
  ctx.fillStyle = p.hp > 50 ? '#7ddb8a' : p.hp > 25 ? '#ffd24b' : '#ff5a4b';
  ctx.fillRect(16, h - 84, 170 * clamp(p.hp / p.maxHp, 0, 1), 8);
  text(ctx, 'HP ' + Math.round(p.hp), 16, h - 92, 12, '#fff', 'left', 800);
  // Minimap, bottom right above the speed readout. Centered high enough that
  // the district + RESPECT lines below it clear the speed text.
  const mx = w - 150;
  const my = h - 280;
  drawMinimap(ctx, mx, my, 118, g);
  text(ctx, districtAt(g.player.x, g.player.y).name, mx, my + 138, 12, '#fff', 'center', 800);
  text(ctx, 'RESPECT ' + g.respectLevel, mx, my + 156, 12, '#ffd24b', 'center', 800);
  // Dialog bar.
  if (g.dialog) drawDialog(ctx, g);
  // Interact hint, center bottom.
  if (g.interactHint) {
    const s = g.interactHint;
    ctx.font = '700 15px Arial';
    const tw = ctx.measureText(s).width + 30;
    panel(ctx, (w - tw) / 2, h - 118, tw, 32, 0.7);
    text(ctx, s, w / 2, h - 97, 15, '#fff', 'center', 700);
  }
  // Crosshair on foot.
  if (!p.inCar) {
    const cx = g.mouseX;
    const cy = g.mouseY;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy);
    ctx.lineTo(cx - 6, cy);
    ctx.moveTo(cx + 6, cy);
    ctx.lineTo(cx + 18, cy);
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy - 6);
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx, cy + 18);
    ctx.stroke();
  }
  // Mission complete flash.
  if (g.missionCompleteFlash > 0) {
    ctx.fillStyle = 'rgba(255,210,75,' + Math.min(0.25, g.missionCompleteFlash * 0.12) + ')';
    ctx.fillRect(0, 0, w, h);
    shadowText(ctx, 'JOB COMPLETE', w / 2, h / 2 - 40, 52, '#ffd24b', 'center', 900);
  }
  // Busted timer while a cop is touching the player on foot.
  if (!p.inCar && p.bustT > 0) {
    text(ctx, 'THE PVPD IS GRABBING YOU — ' + (2.5 - p.bustT).toFixed(1) + 's', w / 2, 170, 18, '#ff5a4b', 'center', 900);
  }
  // Reloading.
  if (p.reloadCd > 0) {
    text(ctx, 'RELOADING…', w / 2, h - 130, 15, '#ffd24b', 'center', 800);
  }
}

// ---- dialog bar ---------------------------------------------------------------
export function drawDialog(ctx, g) {
  const d = g.dialog;
  if (!d) return;
  const w = 1280;
  const h = 720;
  panel(ctx, 160, h - 168, 960, 92, 0.78);
  ctx.strokeStyle = 'rgba(255,122,216,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(160, h - 168, 960, 92, 8);
  ctx.stroke();
  drawPortrait(ctx, d.portrait, 200, h - 122, 64, false, null);
  text(ctx, d.name + ' · ' + d.role, 246, h - 142, 15, d.nameColor || '#ff7ad8', 'left', 900);
  // Wrap the line to fit the bar.
  ctx.font = '600 15px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  const words = d.line.split(' ');
  let line = '';
  let y = h - 118;
  for (const wd of words) {
    if (ctx.measureText(line + wd + ' ').width > 840) {
      ctx.fillText(line, 246, y);
      line = '';
      y += 19;
    }
    line += wd + ' ';
  }
  ctx.fillText(line, 246, y);
}

// ---- main menu -------------------------------------------------------------------
export function drawMenu(ctx, g, mouse) {
  const w = 1280;
  const h = 720;
  // Sunset backdrop (drawn, no image asset).
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b1b4d');
  sky.addColorStop(0.42, '#c94b6e');
  sky.addColorStop(0.62, '#ff8a5c');
  sky.addColorStop(0.8, '#2a2a4a');
  sky.addColorStop(1, '#14101c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Sun.
  ctx.fillStyle = '#ffd24b';
  ctx.beginPath();
  ctx.arc(930, 300, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb04b';
  ctx.beginPath();
  ctx.arc(930, 300, 70, 0, Math.PI * 2);
  ctx.fill();
  // Sea + horizon.
  ctx.fillStyle = '#1c3a5c';
  ctx.fillRect(0, 380, w, 130);
  ctx.fillStyle = 'rgba(255,210,75,0.35)';
  ctx.fillRect(880, 380, 100, 130);
  // Distant buildings.
  ctx.fillStyle = '#241a38';
  for (let i = 0; i < 14; i++) {
    const bx = 40 + i * 88;
    const bh = 70 + ((i * 37) % 90);
    ctx.fillRect(bx, 380 - bh, 62, bh);
    ctx.fillStyle = 'rgba(255,210,75,0.5)';
    for (let wy = 0; wy < 3; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        if ((i + wy + wx) % 2 === 0) ctx.fillRect(bx + 8 + wx * 18, 380 - bh + 10 + wy * 22, 8, 10);
      }
    }
    ctx.fillStyle = '#241a38';
  }
  // Road + car.
  ctx.fillStyle = '#1a1626';
  ctx.fillRect(0, 510, w, 210);
  // Pink convertible on the road.
  ctx.fillStyle = '#e84b6a';
  ctx.beginPath();
  ctx.roundRect(930, 560, 220, 44, 12);
  ctx.fill();
  ctx.fillStyle = '#14101c';
  ctx.beginPath();
  ctx.roundRect(980, 540, 90, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(965, 606, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1110, 606, 18, 0, Math.PI * 2);
  ctx.fill();
  // Palms.
  ctx.strokeStyle = '#0f2a1a';
  ctx.lineWidth = 7;
  for (const px of [120, 240, 700, 820]) {
    ctx.beginPath();
    ctx.moveTo(px, 510);
    ctx.quadraticCurveTo(px + 14, 440, px + 30, 410);
    ctx.stroke();
    ctx.fillStyle = '#1d5c33';
    for (let a = 0; a < 5; a++) {
      const ang = Math.PI + (a / 5) * Math.PI;
      ctx.beginPath();
      ctx.ellipse(px + 30 + Math.cos(ang) * 26, 410 + Math.sin(ang) * 12, 26, 7, ang, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Character on the road.
  drawPortrait(ctx, CHARACTERS[g.charSel], 880, 560, 76, true, null);
  // Title — sized to fit the canvas (92px overflows past the right edge).
  const titleGrad = ctx.createLinearGradient(80, 120, 80, 210);
  titleGrad.addColorStop(0, '#ffd24b');
  titleGrad.addColorStop(0.55, '#ff5a6a');
  titleGrad.addColorStop(1, '#ff7ad8');
  let titleSize = 92;
  ctx.font = '900 ' + titleSize + 'px Arial';
  const titleW = ctx.measureText('CRIMSON HARBOR').width;
  if (titleW > 1140) titleSize = Math.floor(titleSize * 1140 / titleW);
  ctx.font = '900 ' + titleSize + 'px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText('CRIMSON HARBOR', 84, 194);
  ctx.fillStyle = titleGrad;
  ctx.fillText('CRIMSON HARBOR', 80, 190);
  text(ctx, 'PORT VALEN  ·  A GETAWAY DRIVER COMES HOME', 82, 222, 16, '#ffd24b', 'left', 800);
  // Menu items.
  const items = [
    { id: 'continue', label: 'CONTINUE', sub: g.save.hasSave ? 'Chapter ' + g.save.chapter + '  ·  ' + fmtMoney(g.save.cash) + '  ·  Day ' + g.save.day : 'No save yet', enabled: g.save.hasSave },
    { id: 'new', label: 'NEW GAME', sub: 'Start over as Leo Marlow', enabled: true },
    { id: 'controls', label: 'CONTROLS', sub: 'Keys, mouse and driving', enabled: true },
    { id: 'settings', label: 'SETTINGS', sub: 'Audio, shake, FPS', enabled: true },
  ];
  g.menuItems = [];
  items.forEach((it, i) => {
    const y = 280 + i * 66;
    const sel = g.menuSel === i;
    const x = 80;
    if (sel) {
      ctx.fillStyle = 'rgba(255,210,75,0.9)';
      ctx.beginPath();
      ctx.roundRect(x - 14, y - 28, 360, 64, 8);
      ctx.fill();
      text(ctx, it.label, x, y + 5, 22, '#0c0a18', 'left', 900);
      text(ctx, it.sub, x, y + 26, 12, '#3a2a10', 'left', 600);
    } else {
      text(ctx, it.label, x, y + 5, 22, it.enabled ? '#fff' : 'rgba(255,255,255,0.35)', 'left', 900);
      text(ctx, it.sub, x, y + 26, 12, it.enabled ? '#bdb8d6' : 'rgba(255,255,255,0.25)', 'left', 600);
    }
    g.menuItems.push({ id: it.id, x, y: y - 28, w: 360, h: 64, enabled: it.enabled });
  });
  // Story hook.
  text(ctx, 'Four years upstate for a job that went sideways. Leo Marlow is back in Port Valen —', 82, 566, 15, '#fff', 'left', 600);
  text(ctx, 'and the Harbor Kings own the tide.', 82, 588, 15, '#fff', 'left', 600);
  text(ctx, 'Enter to select · arrows to move · left / right to change character', 82, 616, 13, '#bdb8d6', 'left', 600);
  // How to play, right.
  panel(ctx, 900, 40, 340, 300, 0.6);
  text(ctx, 'HOW TO PLAY', 924, 70, 16, '#ffd24b', 'left', 900);
  const rows = [
    ['WASD', 'Drive / walk'], ['Mouse', 'Aim · click to shoot'], ['Shift', 'Sprint'],
    ['Space', 'Drift'], ['F', 'Enter / steal car'], ['E', 'Interact / pick up'],
    ['Q', 'Radio'], ['R', 'Reload'], ['M', 'City map'], ['Esc', 'Pause'],
  ];
  rows.forEach((r, i) => {
    text(ctx, r[0], 924, 98 + i * 22, 13, '#fff', 'left', 800);
    text(ctx, r[1], 1010, 98 + i * 22, 13, '#bdb8d6', 'left', 600);
  });
  // Character select.
  text(ctx, 'CHOOSE YOUR DRIVER', 82, 636, 13, '#ffd24b', 'left', 900);
  g.charSlots = [];
  CHARACTERS.forEach((c, i) => {
    const x = 100 + i * 110;
    drawPortrait(ctx, c, x, 668, 48, g.charSel === i, c.name.split(' ')[0].toUpperCase());
    g.charSlots.push({ i, x: x - 24, y: 644, w: 48, h: 48 });
  });
  text(ctx, CHARACTERS[g.charSel].name + ' · ' + CHARACTERS[g.charSel].role, 700, 668, 14, '#fff', 'left', 800);
  text(ctx, CHARACTERS[g.charSel].blurb, 700, 690, 12, '#bdb8d6', 'left', 600);
  text(ctx, 'v1.0 · Crimson Harbor · Port Valen', 1240, 706, 11, 'rgba(255,255,255,0.4)', 'right', 600);
}

// ---- city map ------------------------------------------------------------------
export function drawMap(ctx, g) {
  const w = 1280;
  const h = 720;
  // Dim the world behind.
  ctx.fillStyle = 'rgba(10,8,20,0.78)';
  ctx.fillRect(0, 0, w, h);
  text(ctx, 'CRIMSON HARBOR CITY MAP', 40, 52, 30, '#ffd24b', 'left', 900);
  text(ctx, 'PORT VALEN  ·  M — close map', 40, 74, 13, '#bdb8d6', 'left', 600);
  const mapX = 320;
  const mapY = 96;
  const mapW = 640;
  const mapH = 500;
  const sx = mapW / WORLD_W;
  const sy = mapH / WORLD_H;
  // Map panel.
  ctx.fillStyle = '#131b28';
  ctx.beginPath();
  ctx.roundRect(mapX - 10, mapY - 10, mapW + 20, mapH + 20, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Water + land.
  ctx.fillStyle = '#1a3a5c';
  ctx.fillRect(mapX, mapY, mapW, mapH);
  ctx.fillStyle = '#24303e';
  ctx.fillRect(mapX, mapY + 40, mapW, mapH - 40);
  ctx.save();
  ctx.beginPath();
  ctx.rect(mapX, mapY, mapW, mapH);
  ctx.clip();
  // Districts.
  for (const d of DISTRICTS) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(mapX + d.x * sx, mapY + d.y * sy, d.w * sx, d.h * sy);
    text(ctx, d.name, mapX + (d.x + d.w / 2) * sx, mapY + (d.y + d.h / 2) * sy, 12, 'rgba(255,255,255,0.75)', 'center', 800);
  }
  // Roads.
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(mapX + 150 * sx, mapY + (150 + i * 330) * sy, mapW, 10);
    ctx.fillRect(mapX + (150 + i * 330) * sx, mapY + 40 * sy, 10, mapH - 40 * sy);
  }
  // POI markers.
  for (const poi of POIS) {
    const color = poi.type === 'safehouse' ? '#4be8ff'
      : poi.type === 'weapons' ? '#ff7ad8'
      : poi.type === 'respray' ? '#7ddb8a'
      : poi.type === 'hospital' ? '#ff5a4b'
      : poi.type === 'race' ? '#ffd24b'
      : poi.type === 'property' ? '#c98ae8' : '#fff';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mapX + poi.x * sx, mapY + poi.y * sy, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Collectibles.
  for (const c of g.collectibles) {
    if (c.got) continue;
    ctx.fillStyle = '#ff9a4b';
    ctx.beginPath();
    ctx.arc(mapX + c.x * sx, mapY + c.y * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // GPS route from the player to the objective.
  if (g.objective) {
    ctx.strokeStyle = '#ffd24b';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(mapX + g.player.x * sx, mapY + g.player.y * sy);
    ctx.lineTo(mapX + g.objective.x * sx, mapY + g.objective.y * sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd24b';
    ctx.beginPath();
    ctx.arc(mapX + g.objective.x * sx, mapY + g.objective.y * sy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14101c';
    ctx.font = '900 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('!', mapX + g.objective.x * sx, mapY + g.objective.y * sy + 4);
  }
  // You are here.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(mapX + g.player.x * sx, mapY + g.player.y * sy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff5a4b';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  // Story list, left.
  panel(ctx, 20, 96, 280, 500, 0.6);
  text(ctx, 'STORY — ' + MISSIONS.filter((m) => m.id < g.save.chapter).length + '/7 COMPLETE', 34, 124, 14, '#ffd24b', 'left', 900);
  MISSIONS.forEach((m, i) => {
    const y = 156 + i * 60;
    const done = m.id < g.save.chapter;
    const current = m.id === g.save.chapter;
    text(ctx, m.ch + '. ' + m.title, 34, y, 14, current ? '#ffd24b' : done ? '#7ddb8a' : '#fff', 'left', 800);
    text(ctx, fmtMoney(m.reward) + '  ·  ' + (done ? 'Complete' : current ? 'In progress' : 'Locked'), 34, y + 20, 12, '#bdb8d6', 'left', 600);
    ctx.fillStyle = current ? '#ffd24b' : done ? '#7ddb8a' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(288, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  // Current job.
  const cm = MISSIONS[g.save.chapter - 1];
  if (cm) {
    text(ctx, 'CURRENT JOB', 34, 560, 12, '#ff7ad8', 'left', 900);
    text(ctx, 'CH ' + cm.ch + ' ' + cm.title.toUpperCase(), 34, 580, 13, '#fff', 'left', 800);
    // GPS distance computed live — g.gpsDist is only updated while playing,
    // and it is 0 when the map opens from a staged shot.
    if (g.objective) text(ctx, 'GPS ' + Math.round(dist(g.player.x, g.player.y, g.objective.x, g.objective.y)) + ' m', 34, 600, 13, '#ffd24b', 'left', 700);
  }
  // Legend, right.
  panel(ctx, 980, 96, 280, 500, 0.6);
  text(ctx, 'LEGEND', 994, 124, 14, '#ffd24b', 'left', 900);
  const LEGEND_COLORS = { you: '#ffffff', contact: '#ff7ad8', objective: '#ffd24b', safehouse: '#4be8ff', weapons: '#ff7ad8', respray: '#7ddb8a', race: '#ffd24b', property: '#c98ae8', hospital: '#ff5a4b', police: '#4ba8ff', collectible: '#ff9a4b' };
  LEGEND.forEach((l, i) => {
    const y = 152 + i * 36;
    ctx.fillStyle = LEGEND_COLORS[l.icon] || '#ffffff';
    ctx.beginPath();
    ctx.arc(1006, y - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, l.label, 1022, y, 13, '#fff', 'left', 600);
  });
  // Stats, bottom.
  panel(ctx, 20, 616, 1240, 60, 0.6);
  const stats = [
    'CASH  ' + fmtMoney(g.cash),
    'RESPECT LEVEL ' + g.respectLevel,
    'COLLECTIBLE ' + g.collectibles.filter((c) => c.got).length + '/20',
    'PROPERTIES ' + g.save.properties.length + '/2',
    'DAY ' + g.day + '  ' + fmtTime(g.hour),
    'WANTED ' + g.wanted + '★',
  ];
  stats.forEach((s, i) => {
    text(ctx, s, 40 + i * 210, 652, 14, i === 0 ? '#ffd24b' : '#fff', 'left', 800);
  });
}

// ---- pause / controls / settings / endings ----------------------------------
export function drawPause(ctx, g) {
  ctx.fillStyle = 'rgba(10,8,20,0.7)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'PAUSED', 640, 260, 52, '#ffd24b', 'center', 900);
  const items = ['RESUME', 'RESTART MISSION', 'QUIT TO MENU'];
  g.pauseItems = [];
  items.forEach((label, i) => {
    const y = 330 + i * 56;
    const sel = g.pauseSel === i;
    if (sel) {
      ctx.fillStyle = 'rgba(255,210,75,0.9)';
      ctx.beginPath();
      ctx.roundRect(520, y - 28, 240, 44, 8);
      ctx.fill();
      text(ctx, label, 640, y + 2, 20, '#0c0a18', 'center', 900);
    } else {
      text(ctx, label, 640, y + 2, 20, '#fff', 'center', 800);
    }
    g.pauseItems.push({ id: label, x: 520, y: y - 28, w: 240, h: 44 });
  });
  text(ctx, 'Esc — resume', 640, 520, 13, '#bdb8d6', 'center', 600);
}
export function drawControls(ctx) {
  ctx.fillStyle = 'rgba(10,8,20,0.85)';
  ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, 340, 100, 600, 520, 0.9);
  text(ctx, 'CONTROLS', 640, 150, 30, '#ffd24b', 'center', 900);
  const rows = [
    ['W A S D', 'Drive / walk'], ['Mouse', 'Aim — click to shoot'], ['Shift', 'Sprint (on foot)'],
    ['Space', 'Drift the car'], ['F', 'Enter / steal car'], ['E', 'Interact / pick up'],
    ['Q', 'Change radio'], ['R', 'Reload'], ['1–5', 'Switch weapon'],
    ['M', 'City map'], ['Esc / P', 'Pause'],
  ];
  rows.forEach((r, i) => {
    text(ctx, r[0], 420, 196 + i * 36, 16, '#fff', 'left', 800);
    text(ctx, r[1], 620, 196 + i * 36, 16, '#bdb8d6', 'left', 600);
  });
  text(ctx, 'Esc — back to menu', 640, 590, 13, '#bdb8d6', 'center', 600);
}
export function drawSettings(ctx, g) {
  ctx.fillStyle = 'rgba(10,8,20,0.85)';
  ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, 340, 140, 600, 380, 0.9);
  text(ctx, 'SETTINGS', 640, 190, 30, '#ffd24b', 'center', 900);
  const rows = [
    { key: 'sfx', label: 'Sound effects' },
    { key: 'music', label: 'Radio music' },
    { key: 'shake', label: 'Screen shake' },
    { key: 'showFps', label: 'Show FPS' },
  ];
  g.settingsRows = [];
  rows.forEach((r, i) => {
    const y = 250 + i * 56;
    const on = g.save.settings[r.key];
    text(ctx, r.label, 420, y, 18, '#fff', 'left', 800);
    ctx.fillStyle = on ? '#7ddb8a' : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(760, y - 20, 90, 32, 16);
    ctx.fill();
    text(ctx, on ? 'ON' : 'OFF', 805, y + 2, 14, '#0c0a18', 'center', 900);
    g.settingsRows.push({ key: r.key, x: 760, y: y - 20, w: 90, h: 32 });
  });
  text(ctx, 'Click a row to toggle · Esc — back to menu', 640, 500, 13, '#bdb8d6', 'center', 600);
}
export function drawWasted(ctx, g) {
  ctx.fillStyle = 'rgba(20,4,4,0.75)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, g.endTitle || 'WASTED', 640, 300, 64, '#ff5a4b', 'center', 900);
  text(ctx, g.endSub || '', 640, 350, 16, '#fff', 'center', 600);
  text(ctx, 'Press Enter — back to the streets', 640, 400, 14, '#bdb8d6', 'center', 600);
}
export function drawVictory(ctx, g) {
  ctx.fillStyle = 'rgba(10,8,20,0.8)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'PORT VALEN IS YOURS', 640, 280, 52, '#ffd24b', 'center', 900);
  text(ctx, 'Leo Marlow finished all 7 jobs. The harbor, the debt, the truth — settled.', 640, 330, 16, '#fff', 'center', 600);
  text(ctx, 'Final cash: ' + fmtMoney(g.cash) + '  ·  Respect level ' + g.respectLevel, 640, 366, 16, '#ffd24b', 'center', 700);
  text(ctx, 'Press Enter — free roam', 640, 420, 14, '#bdb8d6', 'center', 600);
}

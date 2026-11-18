// Crimson Harbor — entities: the player (foot + car), traffic, pedestrians,
// police, gang enemies and bosses, bullets, particles. Everything the HUD
// shows reads from here.
import { WORLD_W, WORLD_H, ROAD_STEP, WEAPONS, CARS, POLICE_NAMES, GANGS, BOSSES } from './data.js';
import { clamp, dist, angTo, angDiff, TAU, rr } from './util.js';
import { moveCircle, isWater, onRoad, lineBlocked } from './world.js';
import { sfx } from './audio.js';

export const bullets = [];
export const particles = [];
export const floaters = []; // floating "+$800" / damage texts

export function makePlayer(x, y, charIndex) {
  return {
    x, y,
    angle: -Math.PI / 2,
    hp: 100, maxHp: 100,
    inCar: false, car: null,
    speed: 0, charIndex, walkPhase: 0,
    weapon: 1, ammo: {}, reserve: {},
    fireCd: 0, reloadCd: 0, sprint: false, dead: false, bustT: 0,
  };
}
export function giveWeapons(p, owned) {
  WEAPONS.forEach((w, i) => {
    if (owned[i]) {
      p.ammo[i] = w.ammo;
      p.reserve[i] = w.reserve;
    }
  });
  if (!owned[p.weapon]) p.weapon = 1;
}
export function makeCar(x, y, angle, def, isPolice = false, name = '') {
  return {
    x, y, angle,
    speed: 0, cond: 100,
    def, isPolice, name,
    steer: 0, smoke: 0, brakeLight: false, siren: isPolice, dead: false,
    target: null, ramCd: 0, stuckT: 0,
  };
}

// --- car physics (arcade, top-down) ----------------------------------------
export function driveCar(car, input, dt, topMul = 1) {
  const top = 520 * topMul * (car.def.top || 1);
  const accel = 340 * (car.def.accel || 1);
  if (input.up) car.speed += accel * dt;
  if (input.down) car.speed -= (car.speed > 0 ? 520 : 260) * dt;
  if (!input.up && !input.down) car.speed -= Math.sign(car.speed) * 120 * dt;
  if (Math.abs(car.speed) < 4 && !input.up && !input.down) car.speed = 0;
  car.speed = clamp(car.speed, -160, top);
  const steerAmt = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dir = car.speed >= 0 ? 1 : -1;
  const drift = input.drift ? 1.9 : 1;
  car.angle += steerAmt * 2.6 * drift * (Math.min(Math.abs(car.speed), 300) / 300) * dir * dt;
  if (input.drift && Math.abs(car.speed) > 200) {
    car.speed *= (1 - 0.4 * dt);
    if (Math.random() < 0.5) {
      particles.push({
        x: car.x - Math.cos(car.angle) * 18, y: car.y - Math.sin(car.angle) * 18,
        vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
        life: 0.5, max: 0.5, color: 'rgba(200,200,200,0.5)', size: 5,
      });
    }
  }
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const before = { x: car.x, y: car.y };
  moveCircle(car, nx - car.x, ny - car.y, 20);
  const moved = dist(before.x, before.y, car.x, car.y);
  const expected = Math.abs(car.speed) * dt;
  if (expected > 4 && moved < expected * 0.25) {
    // Hit something: scrape speed + damage + sparks.
    if (Math.abs(car.speed) > 120) {
      car.cond = Math.max(0, car.cond - Math.abs(car.speed) * 0.02);
      car.speed *= 0.35;
      sfx.crash();
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: car.x, y: car.y,
          vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160,
          life: 0.4, max: 0.4, color: '#ffd24b', size: 3,
        });
      }
      if (car.isPolice) car.speed = 0;
    } else {
      car.speed *= 0.6;
    }
  }
  car.brakeLight = !!input.down;
  if (car.cond < 35) car.smoke += dt;
  if (car.smoke > 0.15) {
    car.smoke = 0;
    particles.push({
      x: car.x, y: car.y - 8,
      vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 20,
      life: 0.9, max: 0.9, color: 'rgba(80,80,80,0.6)', size: 7,
    });
  }
}

// --- traffic ----------------------------------------------------------------
export function makeTraffic(n) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const x = 150 + Math.floor(Math.random() * 11) * ROAD_STEP;
    const y = 150 + Math.floor(Math.random() * 8) * ROAD_STEP;
    const def = CARS[Math.floor(Math.random() * CARS.length)];
    const car = makeCar(x, y, (Math.floor(Math.random() * 4) * Math.PI) / 2, { name: def.name, color: def.color, top: 0.55 });
    car.target = pickRoadPoint(x, y);
    car.cruise = 130 + Math.random() * 60;
    list.push(car);
  }
  return list;
}
function pickRoadPoint(x, y) {
  if (Math.random() > 0.5) return { x: 150 + Math.floor(Math.random() * 11) * ROAD_STEP, y };
  return { x, y: 150 + Math.floor(Math.random() * 8) * ROAD_STEP };
}
export function updateTraffic(list, dt, player) {
  for (const c of list) {
    if (!c.target) c.target = pickRoadPoint(c.x, c.y);
    const d = dist(c.x, c.y, c.target.x, c.target.y);
    if (d < 40) {
      c.target = pickRoadPoint(c.x, c.y);
      continue;
    }
    const want = angTo(c.x, c.y, c.target.x, c.target.y);
    const diff = angDiff(c.angle, want);
    const input = { up: true, down: false, left: diff < -0.12, right: diff > 0.12, drift: false };
    // Slow down for the player / other cars ahead.
    const ahead = dist(c.x + Math.cos(c.angle) * 70, c.y + Math.sin(c.angle) * 70, player.x, player.y);
    if (ahead < 60) input.up = false;
    driveCar(c, input, dt, 0.55);
    // Keep traffic on roads: if pushed off, nudge back.
    if (!onRoad(c.x, c.y) && Math.random() < 0.02) c.target = pickRoadPoint(c.x, c.y);
  }
}

// --- pedestrians -------------------------------------------------------------
export function makePeds(n) {
  const list = [];
  const shirtColors = ['#e8b04b', '#5aa8e8', '#e86aa8', '#7ddb8a', '#e8e8e8'];
  for (let i = 0; i < n; i++) {
    // Spawn on sidewalks beside a road, never inside a building.
    const vertical = Math.random() > 0.5;
    const x = vertical ? 150 + Math.floor(Math.random() * 11) * ROAD_STEP + (Math.random() - 0.5) * 70 : 200 + Math.random() * 3000;
    const y = vertical ? 200 + Math.random() * 2000 : 150 + Math.floor(Math.random() * 8) * ROAD_STEP + (Math.random() - 0.5) * 70;
    list.push({
      x, y,
      angle: Math.random() * TAU,
      speed: 22 + Math.random() * 18,
      color: shirtColors[i % shirtColors.length],
      panic: 0,
      wanderT: 1 + Math.random() * 3,
    });
  }
  return list;
}
export function updatePeds(list, dt, player, danger) {
  for (const p of list) {
    p.wanderT -= dt;
    const d = dist(p.x, p.y, player.x, player.y);
    if (danger && d < 260) p.panic = 2.5;
    if (p.panic > 0) {
      p.panic -= dt;
      p.angle = angTo(player.x, player.y, p.x, p.y);
      moveCircle(p, Math.cos(p.angle) * 90 * dt, Math.sin(p.angle) * 90 * dt, 8);
      p.walkPhase = (p.walkPhase || 0) + dt * 11;
    } else if (p.wanderT <= 0) {
      p.wanderT = 2 + Math.random() * 4;
      p.angle = Math.random() * TAU;
    } else {
      moveCircle(p, Math.cos(p.angle) * p.speed * dt, Math.sin(p.angle) * p.speed * dt, 8);
      p.walkPhase = (p.walkPhase || 0) + dt * 9;
    }
  }
}

// --- police ------------------------------------------------------------------
export function makePolice(n, player, startIdx = 0) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = clamp(player.x + Math.cos(a) * 700, 100, WORLD_W - 100);
    const y = clamp(player.y + Math.sin(a) * 700, 100, WORLD_H - 100);
    const car = makeCar(x, y, angTo(x, y, player.x, player.y), { name: 'PVPD INTERCEPTOR', color: '#1f2a44', top: 1.02 }, true, POLICE_NAMES[(startIdx + i) % POLICE_NAMES.length]);
    car.mode = 'PURSUIT';
    list.push(car);
  }
  return list;
}
export function updatePolice(list, dt, game) {
  const p = game.player;
  const px = p.inCar ? p.car.x : p.x;
  const py = p.inCar ? p.car.y : p.y;
  for (const c of list) {
    const d = dist(c.x, c.y, px, py);
    c.dist = d;
    // Mode: RAMMING when close, ROADBLOCK when far and ahead, else PURSUIT.
    if (d < 130) c.mode = 'RAMMING';
    else if (d > 520 && Math.random() < 0.002) c.mode = 'ROADBLOCK';
    else if (c.mode === 'ROADBLOCK' && d < 260) c.mode = 'PURSUIT';
    else if (c.mode !== 'ROADBLOCK') c.mode = 'PURSUIT';
    let input;
    if (c.mode === 'ROADBLOCK') {
      // Park ahead of the player, across the road.
      const tx = px + Math.cos(p.angle || 0) * 260;
      const ty = py + Math.sin(p.angle || 0) * 260;
      const want = angTo(c.x, c.y, tx, ty);
      const diff = angDiff(c.angle, want);
      input = { up: d > 60, down: false, left: diff < -0.15, right: diff > 0.15, drift: false };
      if (dist(c.x, c.y, tx, ty) < 70) input.up = false;
    } else {
      const want = angTo(c.x, c.y, px, py);
      const diff = angDiff(c.angle, want);
      input = { up: true, down: false, left: diff < -0.1, right: diff > 0.1, drift: false };
    }
    const topMul = game.wanted >= 4 ? 1.06 : game.wanted >= 3 ? 1.0 : 0.94;
    driveCar(c, input, dt, topMul);
    // Ram: when touching the player's car, damage + shove.
    if (p.inCar && d < 52 && c.ramCd <= 0) {
      c.ramCd = 0.8;
      p.car.cond = Math.max(0, p.car.cond - 6);
      p.car.speed *= 0.7;
      const a = angTo(c.x, c.y, p.car.x, p.car.y);
      moveCircle(p.car, Math.cos(a) * 26, Math.sin(a) * 26, 20);
      sfx.crash();
      game.shake = 0.35;
    }
    c.ramCd -= dt;
    // Busted: on foot, police touching the player for a while.
    if (!p.inCar && d < 34) {
      p.bustT += dt;
      if (p.bustT > 2.5) game.busted();
    } else {
      p.bustT = Math.max(0, p.bustT - dt * 2);
    }
  }
}

// --- gang enemies + bosses ----------------------------------------------------
export function spawnCrew(x, y, count, gang, hpMul = 1) {
  const list = [];
  const g = GANGS[gang];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU;
    list.push({
      x: x + Math.cos(a) * (70 + (i % 3) * 50),
      y: y + Math.sin(a) * (70 + (i % 3) * 50),
      hp: 70 * hpMul, maxHp: 70 * hpMul,
      alive: true, gang,
      color: g.color,
      fireCd: 1 + Math.random() * 2,
      angle: 0, down: 0,
    });
  }
  return list;
}
export function spawnBoss(missionId, x, y) {
  const b = BOSSES[missionId];
  // Copy the portrait fields onto the entity so drawPortrait never gets
  // undefined (a missing field used to render the boss portrait black).
  return {
    x, y,
    hp: b.hp, maxHp: b.hp,
    alive: true, isBoss: true,
    name: b.name, role: b.role, line: b.line, color: b.color,
    bg: b.bg, shirt: b.shirt, skin: b.skin, hair: b.hair, shades: b.shades, hat: b.hat,
    fireCd: 2, angle: 0, down: 0,
    guardCount: b.guards,
  };
}
export function updateEnemies(list, dt, game) {
  const p = game.player;
  for (const e of list) {
    if (!e.alive) {
      e.down += dt;
      continue;
    }
    const d = dist(e.x, e.y, p.x, p.y);
    e.angle = angTo(e.x, e.y, p.x, p.y);
    e.fireCd -= dt;
    // Close in a little, keep some distance, strafe.
    if (d > 320) {
      moveCircle(e, Math.cos(e.angle) * 70 * dt, Math.sin(e.angle) * 70 * dt, 10);
      e.walkPhase = (e.walkPhase || 0) + dt * 10;
    } else if (d < 130) {
      moveCircle(e, -Math.cos(e.angle) * 40 * dt, -Math.sin(e.angle) * 40 * dt, 10);
      e.walkPhase = (e.walkPhase || 0) + dt * 10;
    }
    if (e.fireCd <= 0 && d < 520 && !lineBlocked(e.x, e.y, p.x, p.y)) {
      e.fireCd = e.isBoss ? 1.1 : 1.6 + Math.random();
      const spread = (Math.random() - 0.5) * 0.22;
      bullets.push({ x: e.x, y: e.y, angle: e.angle + spread, speed: 620, from: 'enemy', dmg: e.isBoss ? 14 : 8, life: 1.2 });
      sfx.enemyShoot();
      particles.push({ x: e.x + Math.cos(e.angle) * 14, y: e.y + Math.sin(e.angle) * 14, vx: 0, vy: 0, life: 0.08, max: 0.08, color: '#ffd24b', size: 9 });
    }
  }
}

// --- bullets + particles -------------------------------------------------------
export function updateBullets(dt, game) {
  const p = game.player;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life -= dt;
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    let dead = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > WORLD_W || b.y > WORLD_H;
    if (!dead && b.from === 'player') {
      for (const e of game.enemies) {
        if (e.alive && dist(b.x, b.y, e.x, e.y) < 16) {
          e.hp -= b.dmg;
          sfx.hit();
          blood(b.x, b.y);
          if (e.hp <= 0) {
            e.alive = false;
            e.down = 0;
            game.onEnemyDown(e);
          }
          dead = true;
          break;
        }
      }
      if (!dead) {
        for (const t of game.traffic) {
          if (dist(b.x, b.y, t.x, t.y) < 22) {
            t.cond = Math.max(0, t.cond - 12);
            dead = true;
            break;
          }
        }
      }
    } else if (!dead && b.from === 'enemy') {
      const px = p.inCar ? p.car.x : p.x;
      const py = p.inCar ? p.car.y : p.y;
      if (dist(b.x, b.y, px, py) < (p.inCar ? 24 : 13)) {
        if (p.inCar) p.car.cond = Math.max(0, p.car.cond - 3);
        else {
          p.hp -= b.dmg;
          game.shake = 0.25;
        }
        blood(b.x, b.y);
        dead = true;
      }
    }
    if (dead) bullets.splice(i, 1);
  }
}
export function blood(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 140, vy: (Math.random() - 0.5) * 140,
      life: 0.4, max: 0.4, color: '#c22a2a', size: 3,
    });
  }
}
export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    if (pt.life <= 0) particles.splice(i, 1);
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt;
    f.y -= 26 * dt;
    if (f.life <= 0) floaters.splice(i, 1);
  }
}

// --- drawing entities -----------------------------------------------------------
export function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fillRect(-20, -11, 44, 26);
  if (car.isPolice) {
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(-22, -13, 44, 26);
    ctx.fillStyle = '#1f2a44';
    ctx.fillRect(-22, -13, 44, 10);
    ctx.fillStyle = '#c22a2a';
    ctx.fillRect(-4, -13, 8, 26);
    // Light bar flashing.
    const on = Math.floor(performance.now() / 180) % 2 === 0;
    ctx.fillStyle = on ? '#ff2a2a' : '#2a6aff';
    ctx.fillRect(-6, -15, 12, 4);
    ctx.fillStyle = on ? '#2a6aff' : '#ff2a2a';
    ctx.fillRect(-6, 11, 12, 4);
  } else {
    ctx.fillStyle = car.def.color;
    ctx.fillRect(-22, -13, 44, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-22, -13, 44, 6);
    ctx.fillStyle = '#1c2433';
    ctx.fillRect(-4, -11, 16, 22);
    ctx.fillStyle = '#d8e8f0';
    ctx.fillRect(2, -11, 4, 22);
    // Headlights.
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(20, -11, 3, 5);
    ctx.fillRect(20, 6, 3, 5);
  }
  // Wheels.
  ctx.fillStyle = '#111';
  ctx.fillRect(-15, -15, 10, 4);
  ctx.fillRect(-15, 11, 10, 4);
  ctx.fillRect(8, -15, 10, 4);
  ctx.fillRect(8, 11, 10, 4);
  if (car.brakeLight) {
    ctx.fillStyle = '#ff2a2a';
    ctx.fillRect(-24, -10, 3, 5);
    ctx.fillRect(-24, 5, 3, 5);
  }
  ctx.restore();
  if (car.cond < 100 && car.cond > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(car.x - 20, car.y - 30, 40, 5);
    ctx.fillStyle = car.cond > 50 ? '#7ddb8a' : car.cond > 25 ? '#ffd24b' : '#ff5a4b';
    ctx.fillRect(car.x - 20, car.y - 30, 40 * (car.cond / 100), 5);
  }
}
// A person, drawn BIG and unmistakable: a wide torso, shoulders, a head
// facing the aim direction, and a long gun barrel when aiming. The player
// is larger still, with a white ring and a LEO label, so on foot the player
// can never be mistaken for a car.
export function drawPerson(ctx, x, y, angle, color, isPlayer, aimAngle, walkPhase = 0) {
  // Top-down HUMAN, drawn as separate parts with visible gaps — never one
  // solid oval. (Mana, 19 Nov: the old big gold ellipse + tiny head read as
  // a TURTLE: oval = shell, small head = turtle head.) So: narrow torso
  // (rounded rect, NOT an ellipse), a BIG head clearly out in front, arms
  // and legs as separate capsules with daylight between them and the torso,
  // dark trousers, jacket details so the torso reads as CLOTHING.
  // Rotated frame: +x = facing direction, y = lateral.
  const R = isPlayer ? 17 : 12;
  ctx.save();
  ctx.translate(x, y);
  // Shadow — small and soft, never wider than the figure.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(2, 4, R * 0.95, R * 0.75, 0, 0, TAU);
  ctx.fill();
  ctx.rotate(angle);
  // --- Legs: two dark trouser capsules BEHIND the torso, clearly separated
  // by a gap in the middle, swinging alternately while walking. They stick
  // out well past the torso so the figure has visible legs, not a shell.
  const swing = Math.sin(walkPhase) * R * 0.30;
  ctx.fillStyle = '#23232e';
  ctx.beginPath();
  ctx.ellipse(-R * 0.95 + swing, -R * 0.38, R * 0.45, R * 0.20, 0, 0, TAU);
  ctx.ellipse(-R * 0.95 - swing, R * 0.38, R * 0.45, R * 0.20, 0, 0, TAU);
  ctx.fill();
  // Shoe tips, slightly lighter than the trousers.
  ctx.fillStyle = '#3d3d4a';
  ctx.beginPath();
  ctx.ellipse(-R * 1.36 + swing, -R * 0.38, R * 0.15, R * 0.20, 0, 0, TAU);
  ctx.ellipse(-R * 1.36 - swing, R * 0.38, R * 0.15, R * 0.20, 0, 0, TAU);
  ctx.fill();
  // --- Torso: a NARROW rounded rect (flat sides, clearly longer than wide),
  // shirt colour. Deliberately NOT an ellipse and NOT as wide as the old
  // blob — the old ellipse + same-colour shoulders merged into one oval.
  ctx.fillStyle = color;
  rr(ctx, -R * 0.55, -R * 0.48, R * 1.10, R * 0.96, R * 0.30);
  ctx.fill();
  // Jacket details so the torso reads as CLOTHING, not a shell: zipper line
  // down the middle, chest band near the shoulders, belt at the waist.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-R * 0.45, -R * 0.03, R * 0.85, R * 0.06);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(R * 0.28, -R * 0.48, R * 0.14, R * 0.96);
  ctx.fillRect(-R * 0.55, -R * 0.48, R * 0.10, R * 0.96);
  // Light shirt V at the chest (front of the jacket).
  ctx.fillStyle = 'rgba(232,232,232,0.85)';
  ctx.beginPath();
  ctx.moveTo(R * 0.55, -R * 0.16);
  ctx.lineTo(R * 0.55, R * 0.16);
  ctx.lineTo(R * 0.30, 0);
  ctx.closePath();
  ctx.fill();
  // --- Arms: two thin capsules at the SIDES, clearly separated from the
  // torso by a visible gap (road shows through). Sleeves a shade darker
  // than the torso so they read as separate limbs, not part of the blob.
  for (const side of [-1, 1]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(R * 0.05, side * R * 0.75, R * 0.55, R * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(R * 0.05, side * R * 0.75, R * 0.55, R * 0.16, 0, 0, TAU);
    ctx.fill();
  }
  // --- Gun, held BESIDE the head (offset so it never crosses the face):
  // dark barrel + yellow muzzle tip. The forward arm reaches from the
  // shoulder to the grip, and the HAND (skin) circles the grip — the
  // pistol is visibly HELD, not floating out of the middle of a circle.
  if (aimAngle !== undefined) {
    ctx.strokeStyle = '#14141c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(R * 0.55, R * 0.62);
    ctx.lineTo(R + 20, R * 0.62);
    ctx.stroke();
    ctx.fillStyle = '#ffd24b';
    ctx.fillRect(R + 18, R * 0.62 - 2, 5, 4);
    // Forward arm: shoulder -> grip.
    ctx.strokeStyle = color;
    ctx.lineWidth = R * 0.28;
    ctx.beginPath();
    ctx.moveTo(R * 0.25, R * 0.70);
    ctx.lineTo(R * 0.75, R * 0.62);
    ctx.stroke();
    // Hand gripping the pistol.
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(R * 0.75, R * 0.62, R * 0.19, 0, TAU);
    ctx.fill();
  }
  // --- Head: BIG and clearly separate — a skin circle pushed forward so
  // most of it sticks out beyond the torso. A turtle's head is tiny next
  // to its shell; a person's head is big and obvious.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(R * 1.02, 0, R * 0.55, 0, TAU);
  ctx.fill();
  // Hair cap on the back of the head.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(R * 0.80, 0, R * 0.55, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();
  // Eyes, looking where the person faces.
  ctx.fillStyle = '#14141c';
  ctx.beginPath();
  ctx.arc(R * 1.28, -R * 0.18, R * 0.10, 0, TAU);
  ctx.arc(R * 1.28, R * 0.18, R * 0.10, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (isPlayer) {
    // White ring + name label: this is a person on foot, never a car.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, R + 7, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffd24b';
    ctx.font = '900 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEO', x, y - R - 14);
  }
}
export function drawEnemy(ctx, e) {
  if (!e.alive) {
    if (e.down < 2.5) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(1.2);
      ctx.fillStyle = e.color;
      ctx.fillRect(-12, -5, 24, 10);
      ctx.fillStyle = '#e8b98a';
      ctx.beginPath();
      ctx.arc(14, 0, 5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    return;
  }
  drawPerson(ctx, e.x, e.y, e.angle, e.color, false, e.angle, e.walkPhase || 0);
  // Red triangle marker above the head.
  const bob = Math.sin(performance.now() / 200) * 3;
  ctx.fillStyle = '#ff2a2a';
  ctx.beginPath();
  ctx.moveTo(e.x, e.y - 30 + bob);
  ctx.lineTo(e.x - 8, e.y - 42 + bob);
  ctx.lineTo(e.x + 8, e.y - 42 + bob);
  ctx.closePath();
  ctx.fill();
  // HP bar.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(e.x - 16, e.y - 24, 32, 4);
  ctx.fillStyle = e.isBoss ? '#ff2a2a' : '#ff7a4b';
  ctx.fillRect(e.x - 16, e.y - 24, 32 * (e.hp / e.maxHp), 4);
  if (e.isBoss) {
    ctx.fillStyle = '#ffd24b';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(e.name, e.x, e.y - 48 + bob);
  }
}

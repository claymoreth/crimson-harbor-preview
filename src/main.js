// Crimson Harbor — game core: state machine, loop, wanted/heat, save, screenshot hooks.
import { WORLD_W, WORLD_H, CHARACTERS, MISSIONS, RADIOS, WEAPONS, CARS, POIS, MARA, BOSSES } from './data.js';
import { keys, mouse, bindInput, clamp, dist, angTo, fmtMoney } from './util.js';
import { drawWorld, drawMinimap, moveCircle, isWater, lineBlocked } from './world.js';
import { makePlayer, giveWeapons, makeCar, driveCar, makeTraffic, updateTraffic, makePeds, updatePeds, makePolice, updatePolice, updateEnemies, updateBullets, updateParticles, bullets, particles, floaters, drawCar, drawPerson, drawEnemy, blood } from './entities.js';
import { MissionManager } from './missions.js';
import { drawHUD, drawMenu, drawMap, drawPause, drawControls, drawSettings, drawWasted, drawVictory, drawDialog } from './ui.js';
import { loadSave, writeSave, clearSave, defaultSave } from './save.js';
import { initAudio, sfx, setSiren, setEngine, setMuted } from './audio.js';

const W = 1280;
const H = 720;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
bindInput(canvas);

export class Game {
  constructor() {
    this.save = loadSave();
    this.state = 'menu';
    this.menuSel = this.save.hasSave ? 0 : 1;
    this.charSel = this.save.charIndex || 0;
    this.pauseSel = 0;
    this.time = 0;
    this.cash = this.save.cash;
    this.day = this.save.day;
    this.hour = this.save.hour;
    this.respect = this.save.respect;
    this.respectLevel = this.save.respectLevel;
    this.radio = 0;
    this.wanted = 0;
    this.hiddenT = 8;
    this.inSight = false;
    this.heatDrainMul = 1;
    this.shake = 0;
    this.dialog = null;
    this.dialogT = 0;
    this.missionCompleteFlash = 0;
    this.stageTimer = 0;
    this.interactHint = '';
    this.interactPressed = false;
    this.nextMissionT = 0;
    this.gpsDist = 0;
    this.objective = null;
    this.enemies = [];
    this.police = [];
    this.traffic = makeTraffic(14);
    // Cars the player left behind on foot (F exit / dead car) — they stay in
    // the world and can be re-entered with F.
    this.parkedCars = [];
    this.peds = makePeds(18);
    this.collectibles = this.makeCollectibles();
    this.player = makePlayer(1650, 1050, this.charSel);
    giveWeapons(this.player, this.save.weapons);
    this.missions = new MissionManager(this);
    this.cam = { x: 0, y: 0, w: W, h: H };
    this.autoDrive = false; // screenshot hook: hold W so the chase shot shows speed
    this.fps = 0;
    this.fpsT = 0;
    this.fpsN = 0;
    this.mouseX = W / 2;
    this.mouseY = H / 2;
    this.endTitle = '';
    this.endSub = '';
    this.mapMarkers = [];
    this.updateMarkers();
    this.setupShot();
    this.snapCam();
  }

  snapCam() {
    this.cam.x = clamp(this.player.x - W / 2, 0, WORLD_W - W);
    this.cam.y = clamp(this.player.y - H / 2, 0, WORLD_H - H);
  }
  makeCollectibles() {
    const list = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 20; i++) {
      list.push({
        x: 200 + rnd() * 3000,
        y: 200 + rnd() * 2000,
        got: (this.save.collectibles || []).includes(i),
        id: i,
      });
    }
    return list;
  }

  // Screenshot staging: ?shot=menu|chase|foot|map puts the game into a state
  // that shows off a screen (used by shots.json). Never a gameplay path.
  setupShot() {
    const q = new URLSearchParams(location.search);
    const shot = q.get('shot');
    if (!shot) return;
    if (shot === 'menu') {
      this.state = 'menu';
      return;
    }
    if (shot === 'chase') {
      this.newGame(true);
      this.missions.start(MISSIONS[0]);
      // New M1 "GATES OPEN": stage 1 is the escape (break the cordon).
      this.missions.stageIdx = 1;
      this.missions.enterStage();
      this.wanted = 4;
      this.hiddenT = 12;
      this.cash = 2450;
      this.hour = 18.8;
      // On the long north-south road, facing north, already at speed.
      this.player.car = makeCar(1650, 1800, -Math.PI / 2, { name: 'MARLIN GT', color: '#e84b6a', top: 1.0 });
      this.player.car.speed = 380;
      this.player.inCar = true;
      this.player.x = 1650;
      this.player.y = 1800;
      this.autoDrive = true;
      this.traffic = this.traffic.filter((t) => Math.abs(t.x - 1650) > 140);
      this.peds = this.peds.filter((pd) => Math.abs(pd.x - 1650) > 130);
      this.police = makePolice(7, this.player);
      // Stage the units ON the road behind the player (x = 1650 is the road
      // centreline; any sideways offset puts a unit inside a block, where it
      // crashes into a building and never catches up). All already at speed,
      // so they hold formation for the screenshot.
      const spots = [
        { dy: 45, speed: 400, mode: 'RAMMING' },
        { dy: 95, speed: 400, mode: 'RAMMING' },
        { dy: 180, speed: 390, mode: 'PURSUIT' },
        { dy: 280, speed: 390, mode: 'PURSUIT' },
        { dy: 400, speed: 380, mode: 'PURSUIT' },
        { dy: 550, speed: 380, mode: 'ROADBLOCK' },
        { dy: 700, speed: 380, mode: 'ROADBLOCK' },
      ];
      this.police.forEach((c, i) => {
        const s = spots[i];
        c.x = 1650;
        c.y = this.player.y + s.dy;
        c.angle = -Math.PI / 2;
        c.speed = s.speed;
        c.mode = s.mode;
        c.dist = s.dy;
      });
      this.showDialog('MARA VOSS', 'FIXER', 'Alarms are back! You have got the whole department coming — lose them!', 8);
      this.state = 'playing';
      return;
    }
    if (shot === 'foot') {
      this.newGame(true);
      this.save.chapter = 3;
      this.cash = 9850;
      this.hour = 22.2;
      this.day = 1;
      this.missions.start(MISSIONS[2]);
      // New M3 "RAY'S LAST TIDE": stage 1 is the boss (Big Ray + guards).
      this.missions.stageIdx = 1;
      this.missions.enterStage();
      this.wanted = 2;
      // Stand just west of the Kings dock so Big Ray and his guards are in
      // frame, on foot, SMG out.
      this.player.x = 2700;
      this.player.y = 1650;
      this.player.angle = 0;
      this.player.inCar = false;
      this.player.car = null;
      this.player.weapon = 2;
      this.save.weapons[2] = true; // SMG unlocked after mission 2
      this.player.ammo[2] = 90;
      this.player.reserve[2] = 120;
      // Scatter the police at varied distances so the panel reads naturally.
      const pd = [180, 320, 480, 610, 760];
      this.police.forEach((u, i) => {
        const a = (i / Math.max(1, this.police.length)) * Math.PI * 2 + 0.7;
        u.x = this.player.x + Math.cos(a) * pd[i % pd.length];
        u.y = this.player.y + Math.sin(a) * pd[i % pd.length];
      });
      this.state = 'playing';
      return;
    }
    if (shot === 'map') {
      this.newGame(true);
      this.save.chapter = 5;
      this.cash = 41250;
      this.respectLevel = 4;
      this.respect = 1050;
      this.save.collectibles = [0, 1, 2, 3, 4, 5, 6];
      this.collectibles.forEach((c) => {
        if (this.save.collectibles.includes(c.id)) c.got = true;
      });
      this.save.properties = ['Palm Court Flat', 'Foundry Loft'];
      this.missions.start(MISSIONS[4]);
      this.hour = 17.5;
      this.state = 'map';
      return;
    }
  }

  // ---- flow ------------------------------------------------------------------
  newGame(silent) {
    this.save = defaultSave();
    this.save.charIndex = this.charSel;
    this.cash = 500;
    this.day = 1;
    this.hour = 18.0;
    this.respect = 0;
    this.respectLevel = 1;
    this.wanted = 0;
    this.hiddenT = 8;
    this.player = makePlayer(1650, 1050, this.charSel);
    giveWeapons(this.player, this.save.weapons);
    this.player.car = makeCar(1650, 1120, -Math.PI / 2, { name: 'MARLIN GT', color: '#e84b6a', top: 1.0 });
    this.player.inCar = true;
    this.player.x = 1650;
    this.player.y = 1120;
    this.enemies = [];
    this.police = [];
    this.parkedCars = [];
    this.missions.start(MISSIONS[0]);
    this.state = 'playing';
    this.snapCam();
    if (!silent) sfx.mission();
  }
  continueGame() {
    const s = this.save;
    this.charSel = s.charIndex || 0;
    this.cash = s.cash;
    this.day = s.day;
    this.hour = s.hour;
    this.respect = s.respect;
    this.respectLevel = s.respectLevel;
    this.player = makePlayer(1650, 1050, this.charSel);
    giveWeapons(this.player, s.weapons);
    this.player.car = makeCar(1650, 1120, -Math.PI / 2, { name: 'MARLIN GT', color: '#e84b6a', top: 1.0 });
    this.player.inCar = true;
    this.player.x = 1650;
    this.player.y = 1120;
    this.enemies = [];
    this.police = [];
    this.parkedCars = [];
    this.wanted = 0;
    const m = MISSIONS[Math.min(s.chapter, 7) - 1];
    this.missions.start(m);
    this.state = 'playing';
    this.snapCam();
  }
  saveProgress() {
    this.save.chapter = Math.min(7, this.save.chapter);
    this.save.cash = Math.floor(this.cash);
    this.save.day = this.day;
    this.save.hour = this.hour;
    this.save.respect = this.respect;
    this.save.respectLevel = this.respectLevel;
    this.save.collectibles = this.collectibles.filter((c) => c.got).map((c) => c.id);
    this.save.charIndex = this.charSel;
    writeSave(this.save);
  }
  advanceChapter() {
    if (this.save.chapter < 7) {
      this.save.chapter++;
      this.respectLevel = Math.min(5, 1 + Math.floor(this.respect / 300));
      this.saveProgress();
      this.nextMissionT = 2.5;
    }
  }
  showDialog(name, role, line, secs, portraitChar) {
    const who = portraitChar || (name === 'MARA VOSS' ? MARA : null);
    this.dialog = {
      name, role, line,
      portrait: who || MARA,
      nameColor: name === 'MARA VOSS' ? '#ff7ad8' : '#ff5a4b',
    };
    this.dialogT = secs;
  }
  updateMarkers() {
    const m = [];
    for (const poi of POIS) {
      const color = poi.type === 'safehouse' ? '#4be8ff'
        : poi.type === 'weapons' ? '#ff7ad8'
        : poi.type === 'respray' ? '#7ddb8a'
        : poi.type === 'hospital' ? '#ff5a4b'
        : poi.type === 'race' ? '#ffd24b'
        : poi.type === 'property' ? '#c98ae8' : '#fff';
      m.push({ x: poi.x, y: poi.y, color, big: poi.type === 'safehouse' || poi.type === 'contact' });
    }
    for (const c of this.collectibles) {
      if (!c.got) m.push({ x: c.x, y: c.y, color: '#ff9a4b' });
    }
    this.mapMarkers = m;
  }
  spawnPolice() {
    const want = Math.min(2 + this.wanted, 7);
    while (this.police.length < want) {
      const extra = makePolice(1, this.player, this.police.length);
      this.police.push(...extra);
    }
  }
  busted() {
    this.endTitle = 'BUSTED';
    this.endSub = 'The PVPD caught you. $200 bail — and the heat is off, for now.';
    this.cash = Math.max(0, this.cash - 200);
    this.wanted = 0;
    this.police = [];
    this.player.hp = this.player.maxHp;
    this.player.x = 2550;
    this.player.y = 1950;
    this.player.inCar = false;
    this.player.car = null;
    sfx.busted();
    this.state = 'wasted';
    this.saveProgress();
  }
  wasted() {
    this.endTitle = 'WASTED';
    this.endSub = 'You went down in Port Valen. The hospital patched you up — $200.';
    this.cash = Math.max(0, this.cash - 200);
    this.wanted = 0;
    this.police = [];
    this.player.hp = this.player.maxHp;
    this.player.x = 1350;
    this.player.y = 1650;
    this.player.inCar = false;
    this.player.car = null;
    sfx.busted();
    this.state = 'wasted';
    this.saveProgress();
  }
  failMission(reason) {
    this.endTitle = 'JOB FAILED';
    this.endSub = reason + ' Mara is not happy — try the job again.';
    this.state = 'wasted';
  }
  victory() {
    this.state = 'victory';
    this.saveProgress();
  }
  onEnemyDown(e) {
    this.missions.onKill();
    this.respect += 15;
    this.respectLevel = Math.min(5, 1 + Math.floor(this.respect / 300));
    sfx.kill();
    floaters.push({
      x: e.x, y: e.y - 20,
      text: e.isBoss ? 'BOSS DOWN' : '+15 RESPECT',
      life: 1.2, color: '#ffd24b',
    });
  }

  // ---- update -----------------------------------------------------------------
  update(dt) {
    this.time += dt;
    this.mouseX = mouse.x;
    this.mouseY = mouse.y;
    if (this.dialogT > 0) {
      this.dialogT -= dt;
      if (this.dialogT <= 0) this.dialog = null;
    }
    if (this.missionCompleteFlash > 0) this.missionCompleteFlash -= dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.state === 'playing') this.updatePlaying(dt);
    else if (this.state === 'menu') this.updateMenu(dt);
    updateParticles(dt);
  }
  updateMenu(dt) {
    // Menu keys are handled in the keydown listener; nothing to tick here.
  }
  updatePlaying(dt) {
    const p = this.player;
    // Clock: one game hour every 45 real seconds.
    this.hour += dt / 45;
    if (this.hour >= 24) {
      this.hour -= 24;
      this.day++;
    }
    // Next mission auto-starts a few seconds after the last one ends.
    if (!this.missions.current && this.nextMissionT > 0) {
      this.nextMissionT -= dt;
      if (this.nextMissionT <= 0 && this.save.chapter <= 7) {
        this.missions.start(MISSIONS[this.save.chapter - 1]);
      }
    }
    // No mission: the objective is Mara.
    if (!this.missions.current) {
      this.objective = { x: 1650, y: 1050 };
      const d = dist(p.x, p.y, 1650, 1050);
      if (d < 90) {
        this.interactHint = 'Talk to Mara — next job';
        if (this.interactPressed && this.save.chapter <= 7) this.missions.start(MISSIONS[this.save.chapter - 1]);
      } else {
        this.interactHint = '';
      }
    } else {
      this.interactHint = '';
    }
    // Movement + driving.
    const input = {
      up: keys['w'] || keys['ArrowUp'] || this.autoDrive,
      down: keys['s'] || keys['ArrowDown'],
      left: keys['a'] || keys['ArrowLeft'],
      right: keys['d'] || keys['ArrowRight'],
      drift: keys[' '],
    };
    if (p.inCar && p.car) {
      driveCar(p.car, input, dt, CHARACTERS[p.charIndex].top);
      p.x = p.car.x;
      p.y = p.car.y;
      p.angle = p.car.angle;
      if (p.car.cond <= 0) {
        p.inCar = false;
        p.x = p.car.x + 30;
        p.y = p.car.y;
        p.car.speed = 0;
        this.parkedCars.push(p.car);
        p.car = null;
        this.showDialog('MARA VOSS', 'FIXER', 'Your car is dead, Leo. Steal another one.', 4);
      }
      // Car vs traffic / peds — only while still in a car. The block above
      // may have destroyed the car and set p.car = null; without this guard
      // the loops below read p.car.x on a null car (TypeError, main.js:420).
      if (p.car) {
        // Car vs traffic shove.
        for (const t of this.traffic) {
          if (dist(p.car.x, p.car.y, t.x, t.y) < 42) {
            const a = angTo(t.x, t.y, p.car.x, p.car.y);
            moveCircle(p.car, Math.cos(a) * 30 * dt * 10, Math.sin(a) * 30 * dt * 10, 20);
            p.car.speed *= 0.92;
            t.speed *= 0.9;
          }
        }
        // Peds hit by the car.
        for (const ped of this.peds) {
          if (Math.abs(p.car.speed) > 150 && dist(p.car.x, p.car.y, ped.x, ped.y) < 26) {
            ped.x = -9999;
            ped.y = -9999;
            this.wanted = Math.min(5, this.wanted + 1);
            this.spawnPolice();
            floaters.push({ x: p.car.x, y: p.car.y - 30, text: 'PEDESTRIAN HIT — WANTED UP', life: 1.4, color: '#ff5a4b' });
            sfx.crash();
          }
        }
      }
    } else {
      // On foot. Shooting lives ONLY in this branch — while inCar the
      // driving branch above runs instead, so a mouse click in the car can
      // never fire a bullet. Shoot stages must be played on foot.
      const sp = (keys['Shift'] ? 300 : 185) * CHARACTERS[p.charIndex].sprint;
      const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      const len = Math.hypot(mx, my) || 1;
      const moving = (mx || my) ? 1 : 0;
      moveCircle(p, (mx / len) * sp * dt * moving, (my / len) * sp * dt * moving, 11);
      // Walk cycle: legs swing only while actually moving on foot.
      if (moving) p.walkPhase = (p.walkPhase || 0) + dt * 11;
      // Aim at the mouse.
      const sx = p.x - this.cam.x;
      const sy = p.y - this.cam.y;
      p.angle = angTo(sx, sy, this.mouseX, this.mouseY);
      // Shooting.
      p.fireCd -= dt;
      if (p.reloadCd > 0) {
        p.reloadCd -= dt;
        if (p.reloadCd <= 0) {
          const w = WEAPONS[p.weapon];
          const need = w.ammo - (p.ammo[p.weapon] || 0);
          const take = Math.min(need, p.reserve[p.weapon] || 0);
          p.ammo[p.weapon] = (p.ammo[p.weapon] || 0) + take;
          p.reserve[p.weapon] = (p.reserve[p.weapon] || 0) - take;
        }
      }
      const w = WEAPONS[p.weapon];
      const wantFire = w.auto ? mouse.down : mouse.clicked;
      if (wantFire && p.fireCd <= 0 && p.reloadCd <= 0) {
        if (p.weapon === 0) {
          // Fists: melee.
          p.fireCd = w.rate;
          for (const e of this.enemies) {
            if (e.alive && dist(p.x, p.y, e.x, e.y) < 34) {
              e.hp -= w.dmg;
              sfx.hit();
              if (e.hp <= 0) {
                e.alive = false;
                e.down = 0;
                this.onEnemyDown(e);
              }
            }
          }
        } else if ((p.ammo[p.weapon] || 0) > 0) {
          p.fireCd = w.rate;
          p.ammo[p.weapon]--;
          const pellets = w.pellets || 1;
          for (let i = 0; i < pellets; i++) {
            bullets.push({
              x: p.x + Math.cos(p.angle) * 16,
              y: p.y + Math.sin(p.angle) * 16,
              angle: p.angle + (Math.random() - 0.5) * w.spread * 2,
              speed: 900, from: 'player',
              dmg: w.dmg * CHARACTERS[p.charIndex].aim,
              life: 0.9,
            });
          }
          sfx.shoot();
          this.shake = Math.max(this.shake, 0.08);
          particles.push({ x: p.x + Math.cos(p.angle) * 20, y: p.y + Math.sin(p.angle) * 20, vx: 0, vy: 0, life: 0.07, max: 0.07, color: '#ffe9a8', size: 12 });
          if (this.wanted < 2) {
            this.wanted = Math.max(this.wanted, 2);
            this.spawnPolice();
          }
        } else if ((p.reserve[p.weapon] || 0) > 0) {
          p.reloadCd = 1.2;
          sfx.reload();
        }
      }
      if (p.hp <= 0) {
        this.wasted();
        return;
      }
    }
    // F: enter / exit car. Exiting PARKS the car in place (it stays in the
    // world and can be re-entered); entering takes the nearest parked car
    // first, else steals a nearby traffic car.
    if (this.fPressed) {
      if (p.inCar) {
        p.inCar = false;
        p.x = p.car.x + Math.cos(p.car.angle + Math.PI / 2) * 30;
        p.y = p.car.y + Math.sin(p.car.angle + Math.PI / 2) * 30;
        p.car.speed = 0;
        this.parkedCars.push(p.car);
        p.car = null;
      } else {
        // Nearest parked car first (the one the player left behind).
        let best = null;
        let bd = 70;
        for (const c of this.parkedCars) {
          const d = dist(p.x, p.y, c.x, c.y);
          if (d < bd) {
            bd = d;
            best = c;
          }
        }
        if (best) {
          const idx = this.parkedCars.indexOf(best);
          this.parkedCars.splice(idx, 1);
          p.car = best;
          p.car.cond = Math.max(p.car.cond, 40);
          p.inCar = true;
          p.x = best.x;
          p.y = best.y;
          sfx.horn();
        } else {
          // Steal a nearby traffic car.
          let tbest = null;
          let tbd = 70;
          for (const t of this.traffic) {
            const d = dist(p.x, p.y, t.x, t.y);
            if (d < tbd) {
              tbd = d;
              tbest = t;
            }
          }
          if (tbest) {
            const idx = this.traffic.indexOf(tbest);
            this.traffic.splice(idx, 1);
            p.car = tbest;
            p.car.cond = Math.max(p.car.cond, 40);
            p.inCar = true;
            p.x = tbest.x;
            p.y = tbest.y;
            this.wanted = Math.min(5, this.wanted + 1);
            this.spawnPolice();
            floaters.push({ x: p.x, y: p.y - 30, text: 'CAR STOLEN — WANTED UP', life: 1.4, color: '#ff5a4b' });
            sfx.horn();
          }
        }
      }
    }
    // R: reload.
    if (this.rPressed && !p.inCar) {
      const w = WEAPONS[p.weapon];
      if (w.ammo !== Infinity && (p.ammo[p.weapon] || 0) < w.ammo && (p.reserve[p.weapon] || 0) > 0 && p.reloadCd <= 0) {
        p.reloadCd = 1.2;
        sfx.reload();
      }
    }
    // Weapon switch 1-5.
    for (let i = 0; i < 5; i++) {
      if (this['digit' + (i + 1)]) {
        if (this.save.weapons[i]) {
          p.weapon = i;
          sfx.click();
        }
        this['digit' + (i + 1)] = false;
      }
    }
    // Q: radio.
    if (this.qPressed) {
      this.radio = (this.radio + 1) % RADIOS.length;
      sfx.radio();
    }
    // Traffic + peds + police + enemies.
    updateTraffic(this.traffic, dt, p);
    updatePeds(this.peds, dt, p, this.wanted > 0);
    updatePolice(this.police, dt, this);
    updateEnemies(this.enemies, dt, this);
    updateBullets(dt, this);
    // Collectibles.
    for (const c of this.collectibles) {
      if (!c.got && dist(p.x, p.y, c.x, c.y) < 34) {
        c.got = true;
        this.cash += 50;
        this.respect += 10;
        sfx.pickup();
        floaters.push({ x: c.x, y: c.y - 20, text: '+$50  COLLECTIBLE', life: 1.2, color: '#ff9a4b' });
        this.updateMarkers();
        this.saveProgress();
      }
    }
    // POI interactions (respray / weapons / property / safehouse heal).
    for (const poi of POIS) {
      const d = dist(p.x, p.y, poi.x, poi.y);
      if (poi.type === 'respray' && p.inCar && d < 70 && this.wanted > 0 && this.cash >= 150) {
        this.cash -= 150;
        this.wanted = 0;
        this.police = [];
        floaters.push({ x: poi.x, y: poi.y - 30, text: 'RESPRAY — HEAT CLEARED  -$150', life: 1.6, color: '#7ddb8a' });
        sfx.cash();
      }
      if (poi.type === 'weapons' && d < 80) {
        this.interactHint = 'Harbor Arms — refill all ammo $100';
        if (this.interactPressed && this.cash >= 100) {
          this.cash -= 100;
          WEAPONS.forEach((w, i) => {
            if (this.save.weapons[i]) {
              p.ammo[i] = w.ammo;
              p.reserve[i] = w.reserve;
            }
          });
          floaters.push({ x: poi.x, y: poi.y - 30, text: 'AMMO REFILLED  -$100', life: 1.6, color: '#ff7ad8' });
          sfx.cash();
        }
      }
      if (poi.type === 'property' && d < 80 && !this.save.properties.includes(poi.name)) {
        this.interactHint = 'Buy ' + poi.name + ' — $' + poi.price.toLocaleString('en-US');
        if (this.interactPressed && this.cash >= poi.price) {
          this.cash -= poi.price;
          this.save.properties.push(poi.name);
          floaters.push({ x: poi.x, y: poi.y - 30, text: 'PROPERTY BOUGHT', life: 1.6, color: '#c98ae8' });
          sfx.cash();
          this.saveProgress();
        }
      }
      if (poi.type === 'safehouse' && d < 90) {
        if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 20 * dt);
        if (Math.random() < dt * 0.2) this.saveProgress();
      }
    }
    // Wanted / heat.
    this.updateWanted(dt);
    // Mission.
    this.missions.update(dt);
    // GPS distance.
    if (this.objective) this.gpsDist = dist(p.x, p.y, this.objective.x, this.objective.y);
    // Camera follows the player with a smooth lerp (never rotates, never
    // snaps) — turning fast no longer makes the view jump or jitter.
    const tx = clamp(p.x - W / 2, 0, WORLD_W - W);
    const ty = clamp(p.y - H / 2, 0, WORLD_H - H);
    const k = Math.min(1, dt * 6);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    // Audio.
    setSiren(this.wanted > 0);
    setEngine(p.inCar ? Math.abs(p.car.speed) / 520 : 0, p.inCar);
    // Edge-triggered flags reset.
    this.interactPressed = false;
    this.fPressed = false;
    this.rPressed = false;
    this.qPressed = false;
    mouse.clicked = false;
    // Status line for screen readers.
    if (statusEl) {
      statusEl.textContent = 'Crimson Harbor. Day ' + this.day + ', ' +
        (this.missions.current ? this.missions.current.title + ', stage ' + this.missions.stageNum + ' of ' + this.missions.stageTotal : 'free roam') +
        '. Wanted level ' + this.wanted + '. Cash ' + fmtMoney(this.cash) + '.';
    }
  }
  updateWanted(dt) {
    const p = this.player;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    if (this.wanted <= 0) {
      this.inSight = false;
      return;
    }
    // Spawn / despawn police to match the wanted level.
    const want = Math.min(2 + this.wanted, 7);
    if (this.police.length < want) this.spawnPolice();
    // Sight check: any cop within 550 with a clear line of sight sees us.
    let seen = false;
    for (const c of this.police) {
      if (dist(c.x, c.y, px, py) < 550 && !lineBlocked(c.x, c.y, px, py)) {
        seen = true;
        break;
      }
    }
    this.inSight = seen;
    if (seen) {
      this.hiddenT = 6 + this.wanted * 2;
    } else {
      this.hiddenT -= dt * this.heatDrainMul;
      if (this.hiddenT <= 0) {
        this.wanted--;
        this.hiddenT = 6 + this.wanted * 2;
        if (this.wanted === 0) {
          this.police = [];
          setSiren(false);
        }
      }
    }
    this.heatDrainMul = 1;
  }

  // ---- render -------------------------------------------------------------------
  render() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (this.state === 'menu') {
      drawMenu(ctx, this, mouse);
    } else if (this.state === 'controls') {
      drawMenu(ctx, this, mouse);
      drawControls(ctx);
    } else if (this.state === 'settings') {
      drawMenu(ctx, this, mouse);
      drawSettings(ctx, this);
    } else if (this.state === 'map') {
      this.renderWorld();
      drawMap(ctx, this);
    } else if (this.state === 'paused') {
      this.renderWorld();
      drawPause(ctx, this);
    } else if (this.state === 'wasted') {
      this.renderWorld();
      drawWasted(ctx, this);
    } else if (this.state === 'victory') {
      this.renderWorld();
      drawVictory(ctx, this);
    } else {
      this.renderWorld();
      drawHUD(ctx, this);
    }
    if (this.save.settings.showFps && this.state === 'playing') {
      ctx.fillStyle = '#fff';
      ctx.font = '700 13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(Math.round(this.fps) + ' FPS', 16, 700);
    }
    ctx.restore();
  }
  renderWorld() {
    const p = this.player;
    const shx = this.shake > 0 && this.save.settings.shake ? (Math.random() - 0.5) * this.shake * 24 : 0;
    const shy = this.shake > 0 && this.save.settings.shake ? (Math.random() - 0.5) * this.shake * 24 : 0;
    const cam = { x: this.cam.x + shx, y: this.cam.y + shy, w: W, h: H };
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawWorld(ctx, cam, this);
    // Objective marker.
    if (this.objective) {
      const bob = Math.sin(this.time * 3) * 5;
      ctx.fillStyle = '#ffd24b';
      ctx.beginPath();
      ctx.arc(this.objective.x, this.objective.y - 26 + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14101c';
      ctx.font = '900 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', this.objective.x, this.objective.y - 22 + bob);
      ctx.strokeStyle = 'rgba(255,210,75,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.objective.x, this.objective.y, 26 + Math.sin(this.time * 3) * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Collectibles.
    for (const c of this.collectibles) {
      if (c.got) continue;
      if (c.x < cam.x - 40 || c.x > cam.x + W + 40 || c.y < cam.y - 40 || c.y > cam.y + H + 40) continue;
      ctx.fillStyle = '#ff9a4b';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '900 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('$', c.x, c.y + 3);
    }
    // POI icons.
    for (const poi of POIS) {
      if (poi.x < cam.x - 40 || poi.x > cam.x + W + 40 || poi.y < cam.y - 40 || poi.y > cam.y + H + 40) continue;
      ctx.fillStyle = poi.type === 'safehouse' ? '#4be8ff'
        : poi.type === 'weapons' ? '#ff7ad8'
        : poi.type === 'respray' ? '#7ddb8a'
        : poi.type === 'hospital' ? '#ff5a4b'
        : poi.type === 'race' ? '#ffd24b'
        : poi.type === 'property' ? '#c98ae8' : '#fff';
      ctx.beginPath();
      ctx.arc(poi.x, poi.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14101c';
      ctx.font = '900 10px Arial';
      ctx.textAlign = 'center';
      const letter = poi.type === 'safehouse' ? 'H'
        : poi.type === 'hospital' ? '+'
        : poi.type === 'weapons' ? 'W'
        : poi.type === 'respray' ? 'R'
        : poi.type === 'property' ? '$'
        : poi.type === 'race' ? 'F' : 'M';
      ctx.fillText(letter, poi.x, poi.y + 3);
    }
    // Peds.
    for (const ped of this.peds) {
      if (ped.x < -100) continue;
      if (ped.x < cam.x - 30 || ped.x > cam.x + W + 30 || ped.y < cam.y - 30 || ped.y > cam.y + H + 30) continue;
      drawPerson(ctx, ped.x, ped.y, ped.angle, ped.color, false, undefined, ped.walkPhase || 0);
    }
    // Traffic.
    for (const t of this.traffic) {
      if (t.x < cam.x - 60 || t.x > cam.x + W + 60 || t.y < cam.y - 60 || t.y > cam.y + H + 60) continue;
      drawCar(ctx, t);
    }
    // Parked cars (left behind when the player got out on foot).
    for (const c of this.parkedCars) {
      if (c.x < cam.x - 60 || c.x > cam.x + W + 60 || c.y < cam.y - 60 || c.y > cam.y + H + 60) continue;
      drawCar(ctx, c);
    }
    // Police.
    for (const c of this.police) {
      if (c.x < cam.x - 60 || c.x > cam.x + W + 60 || c.y < cam.y - 60 || c.y > cam.y + H + 60) continue;
      drawCar(ctx, c);
    }
    // Enemies.
    for (const e of this.enemies) {
      if (e.x < cam.x - 60 || e.x > cam.x + W + 60 || e.y < cam.y - 60 || e.y > cam.y + H + 60) continue;
      drawEnemy(ctx, e);
    }
    // Player car / player.
    if (p.inCar && p.car) drawCar(ctx, p.car);
    else drawPerson(ctx, p.x, p.y, p.angle, CHARACTERS[p.charIndex].shirt, true, p.angle, p.walkPhase || 0);
    // Bullets.
    for (const b of bullets) {
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x - Math.cos(b.angle) * 14, b.y - Math.sin(b.angle) * 14);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // Particles.
    for (const pt of particles) {
      ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Floaters.
    ctx.font = '900 15px Arial';
    ctx.textAlign = 'center';
    for (const f of floaters) {
      ctx.globalAlpha = clamp(f.life, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ---- input routing ---------------------------------------------------------------
const game = new Game();
window.__game = game; // for Playwright verification

addEventListener('keydown', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  initAudio();
  if (game.state === 'menu') {
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      const items = game.menuItems || [];
      const dir = k === 'ArrowDown' ? 1 : -1;
      let next = game.menuSel;
      for (let i = 0; i < 4; i++) {
        next = (next + dir + 4) % 4;
        if (items[next] && items[next].enabled) break;
      }
      game.menuSel = next;
      sfx.click();
    }
    if (k === 'ArrowLeft') {
      game.charSel = (game.charSel + 5) % 6;
      game.save.charIndex = game.charSel;
      sfx.click();
    }
    if (k === 'ArrowRight') {
      game.charSel = (game.charSel + 1) % 6;
      game.save.charIndex = game.charSel;
      sfx.click();
    }
    if (k === 'Enter') activateMenu();
    return;
  }
  if (game.state === 'controls' || game.state === 'settings') {
    if (k === 'Escape' || k === 'Enter') game.state = 'menu';
    return;
  }
  if (game.state === 'paused') {
    if (k === 'ArrowDown') game.pauseSel = (game.pauseSel + 1) % 3;
    if (k === 'ArrowUp') game.pauseSel = (game.pauseSel + 2) % 3;
    if (k === 'Enter') activatePause();
    if (k === 'Escape' || k === 'p' || k === 'P') game.state = 'playing';
    return;
  }
  if (game.state === 'wasted' || game.state === 'victory') {
    if (k === 'Enter') game.state = 'playing';
    return;
  }
  if (game.state === 'map') {
    if (k === 'm' || k === 'M' || k === 'Escape') game.state = 'playing';
    return;
  }
  // Playing.
  if (k === 'm' || k === 'M') {
    game.state = 'map';
    sfx.click();
    return;
  }
  if (k === 'Escape' || k === 'p' || k === 'P') {
    game.state = 'paused';
    game.pauseSel = 0;
    sfx.click();
    return;
  }
  if (k === 'e' || k === 'E') game.interactPressed = true;
  if (k === 'f' || k === 'F') game.fPressed = true;
  if (k === 'r' || k === 'R') game.rPressed = true;
  if (k === 'q' || k === 'Q') game.qPressed = true;
  if (k >= '1' && k <= '5') game['digit' + k] = true;
});
function activateMenu() {
  const item = (game.menuItems || [])[game.menuSel];
  if (!item || !item.enabled) return;
  sfx.click();
  if (item.id === 'continue') game.continueGame();
  else if (item.id === 'new') game.newGame();
  else if (item.id === 'controls') game.state = 'controls';
  else if (item.id === 'settings') game.state = 'settings';
}
function activatePause() {
  const item = (game.pauseItems || [])[game.pauseSel];
  if (!item) return;
  sfx.click();
  if (item.id === 'RESUME') {
    game.state = 'playing';
  } else if (item.id === 'RESTART MISSION') {
    if (game.missions.current) game.missions.start(game.missions.current);
    game.state = 'playing';
  } else if (item.id === 'QUIT TO MENU') {
    game.state = 'menu';
    game.saveProgress();
  }
}
canvas.addEventListener('click', () => {
  initAudio();
  if (game.state === 'menu') {
    for (const it of game.menuItems || []) {
      if (it.enabled && mouse.x >= it.x - 6 && mouse.x <= it.x + it.w + 6 && mouse.y >= it.y - 6 && mouse.y <= it.y + it.h + 6) {
        game.menuSel = game.menuItems.indexOf(it);
        activateMenu();
        return;
      }
    }
    for (const s of game.charSlots || []) {
      if (mouse.x >= s.x && mouse.x <= s.x + s.w && mouse.y >= s.y && mouse.y <= s.y + s.h) {
        game.charSel = s.i;
        game.save.charIndex = s.i;
        sfx.click();
        return;
      }
    }
  } else if (game.state === 'controls' || game.state === 'settings') {
    if (game.state === 'settings') {
      for (const r of game.settingsRows || []) {
        if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
          game.save.settings[r.key] = !game.save.settings[r.key];
          if (r.key === 'sfx') setMuted(!game.save.settings.sfx);
          game.saveProgress();
          sfx.click();
          return;
        }
      }
    }
    game.state = 'menu';
  } else if (game.state === 'paused') {
    for (const it of game.pauseItems || []) {
      if (mouse.x >= it.x && mouse.x <= it.x + it.w && mouse.y >= it.y && mouse.y <= it.y + it.h) {
        game.pauseSel = game.pauseItems.indexOf(it);
        activatePause();
        return;
      }
    }
  }
});
if (!loadSave().settings.sfx) setMuted(true);

// ---- main loop ----------------------------------------------------------------------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.fpsN++;
  game.fpsT += dt;
  if (game.fpsT >= 0.5) {
    game.fps = game.fpsN / game.fpsT;
    game.fpsN = 0;
    game.fpsT = 0;
  }
  try {
    game.update(dt);
  } catch (err) {
    console.error(err);
  }
  try {
    game.render();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

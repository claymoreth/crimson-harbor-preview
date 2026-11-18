// Crimson Harbor — mission engine: 7 story jobs, each a few stages.
// Stage types: drive (reach the marker), pickup (press E), talk (press E
// at Mara), collect (press E at N points in order), follow (tail a courier
// van — stay in the band, too close is spotted, too far is lost), photo
// (on foot, press E, hold still to take the picture), activate (on foot,
// press E, hold still to light the beacon), swap (press E to exchange a
// package — only while clean), listen (on foot, stay in the listening ring
// — too close is spotted), distract (press E to set off a car alarm,
// opening a 30s window), grab (press E to take the ledger inside the window
// — if it closes, the guard returns and you distract again).
// A stage may carry extra.wanted (raise the heat when it begins) or
// extra.clean (fail the job if any heat appears during the stage).
// Legacy types shoot / boss / escape / deliver still work if a stage uses
// them, but no current job does.
import { MISSIONS, BOSSES, POIS, WEAPONS } from './data.js';
import { dist } from './util.js';
import { spawnCrew, spawnBoss, floaters } from './entities.js';
import { sfx } from './audio.js';

export class MissionManager {
  constructor(game) {
    this.game = game;
    this.mission = null;
    this.stageIdx = 0;
    this.kills = 0;
    this.killsNeed = 0;
    this.bossShown = false;
    this.escapeT = 0;
    this.timer = 0;
    // New-mechanic state (reset in start()).
    this.collectIdx = 0;
    this.collectPoints = [];
    this.followTarget = null;
    this.followProgress = 0;
    this.followNeed = 25;
    this.suspicion = 0;
    this.loseT = 0;
    this.followGrace = 0;
    this.holdT = 0;
    this.holdNeed = 3;
    this.holdStarted = false;
    this.holdStartX = 0;
    this.holdStartY = 0;
    this.listenProgress = 0;
    this.distractWindow = 0;
  }
  get current() { return this.mission; }
  get stage() { return this.mission ? this.mission.stages[this.stageIdx] : null; }
  get stageNum() { return this.stageIdx + 1; }
  get stageTotal() { return this.mission ? this.mission.stages.length : 0; }

  start(mission) {
    this.mission = mission;
    this.stageIdx = 0;
    this.kills = 0;
    this.killsNeed = 0;
    this.bossShown = false;
    this.escapeT = 0;
    this.timer = 0;
    this.collectIdx = 0;
    this.collectPoints = [];
    this.followTarget = null;
    this.followProgress = 0;
    this.suspicion = 0;
    this.loseT = 0;
    this.followGrace = 0;
    this.holdT = 0;
    this.holdStarted = false;
    this.listenProgress = 0;
    this.distractWindow = 0;
    this.game.enemies = [];
    this.game.objective = null;
    this.enterStage();
    sfx.mission();
    this.game.showDialog('MARA VOSS', 'FIXER', mission.brief, 5);
  }

  enterStage() {
    const s = this.stage;
    const g = this.game;
    if (!s) return;
    // Keep the original stage text so dynamic progress text can be reset
    // when the stage is (re-)entered.
    if (!s._baseText) s._baseText = s.text;
    s.text = s._baseText;
    g.objective = { x: s.x, y: s.y };
    this.timer = s.type === 'deliver' ? 150 : 0;
    // A stage may raise the heat when it begins (M1 opens at wanted 4).
    if (s.wanted !== undefined) {
      g.wanted = Math.max(g.wanted, s.wanted);
      g.spawnPolice();
    }
    if (s.type === 'shoot') {
      this.kills = 0;
      this.killsNeed = s.count;
      g.enemies = spawnCrew(s.x, s.y, s.count, s.gang);
      g.wanted = Math.max(g.wanted, 2);
      g.spawnPolice();
    } else if (s.type === 'boss') {
      this.kills = 0;
      const boss = spawnBoss(this.mission.id, s.x, s.y);
      g.enemies = [boss];
      for (let i = 0; i < boss.guardCount; i++) {
        const a = (i / boss.guardCount) * Math.PI * 2;
        g.enemies.push({
          x: s.x + Math.cos(a) * 120,
          y: s.y + Math.sin(a) * 120,
          hp: 70, maxHp: 70,
          alive: true, gang: 'kings', color: '#e8b04b',
          fireCd: 1 + i * 0.4, angle: 0, down: 0,
        });
      }
      this.killsNeed = 1 + boss.guardCount;
      g.wanted = Math.max(g.wanted, 3);
      g.spawnPolice();
      if (!this.bossShown) {
        this.bossShown = true;
        g.showDialog(boss.name, boss.role, boss.line, 6, boss);
      }
    } else if (s.type === 'escape') {
      g.wanted = Math.max(g.wanted, this.mission.id === 1 ? 2 : 3);
      g.spawnPolice();
    } else if (s.type === 'deliver') {
      g.wanted = Math.max(g.wanted, 2);
      g.spawnPolice();
    } else if (s.type === 'collect') {
      this.collectIdx = 0;
      this.collectPoints = s.points || [{ x: s.x, y: s.y }];
      g.objective = { x: this.collectPoints[0].x, y: this.collectPoints[0].y };
    } else if (s.type === 'follow') {
      this.followProgress = 0;
      this.followNeed = s.need || 25;
      this.suspicion = 0;
      this.loseT = 0;
      // A short grace period so the player can orient before "too close"
      // starts counting.
      this.followGrace = 2;
      this.followTarget = this.pickFollowTarget();
      if (this.followTarget) g.objective = { x: this.followTarget.x, y: this.followTarget.y };
    } else if (s.type === 'photo' || s.type === 'activate') {
      this.holdT = 0;
      this.holdNeed = s.holdSecs || 3;
      this.holdStarted = false;
    } else if (s.type === 'listen') {
      this.listenProgress = 0;
    } else if (s.type === 'grab') {
      // The window is set by the 'distract' stage when it completes. If we
      // arrive here without one (e.g. a staged shot), give a fresh window.
      if (!this.distractWindow || this.distractWindow <= 0) this.distractWindow = s.window || 30;
    }
    g.updateMarkers();
  }

  // The courier is a real traffic car. Prefer one 250-600px away so the
  // tail starts inside the band, not bumper-to-bumper. Traffic cars persist
  // for the whole session.
  pickFollowTarget() {
    const g = this.game;
    const p = g.player;
    let best = null;
    let bd = Infinity;
    let farthest = null;
    let fd = -1;
    for (const c of g.traffic || []) {
      const d = dist(c.x, c.y, p.x, p.y);
      if (d > fd) { fd = d; farthest = c; }
      if (d >= 250 && d <= 600 && d < bd) { bd = d; best = c; }
    }
    if (best) return best;
    // No car in the ideal band: take the nearest one beyond 250px, or the
    // farthest one if every car is right on top of the player.
    let beyond = null;
    let bbd = Infinity;
    for (const c of g.traffic || []) {
      const d = dist(c.x, c.y, p.x, p.y);
      if (d > 250 && d < bbd) { bbd = d; beyond = c; }
    }
    return beyond || farthest || null;
  }

  update(dt) {
    const s = this.stage;
    const g = this.game;
    if (!s) return;
    const p = g.player;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    const d = dist(px, py, s.x, s.y);
    // Clean stages (the swap): any heat blows the deal.
    if (s.clean && g.wanted > 0) {
      g.failMission('The deal is blown — you brought heat.');
      return;
    }
    if (s.type === 'deliver' && this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        g.failMission('Out of time — the cargo never arrived.');
        return;
      }
    }
    if (s.type === 'drive' || s.type === 'deliver') {
      if (d < 70) this.nextStage();
    } else if (s.type === 'pickup' || s.type === 'talk') {
      if (d < 80 && g.interactPressed) {
        this.nextStage();
        sfx.pickup();
      }
    } else if (s.type === 'shoot' || s.type === 'boss') {
      if (this.kills >= this.killsNeed) this.nextStage();
    } else if (s.type === 'escape') {
      if (d < 80 && g.wanted === 0) {
        this.nextStage();
      } else if (d < 80 && g.wanted > 0) {
        // At the safehouse: heat drains faster while here.
        g.heatDrainMul = 2.5;
      }
    } else if (s.type === 'collect') {
      const pt = this.collectPoints[this.collectIdx];
      if (pt) {
        g.objective = { x: pt.x, y: pt.y };
        const pd = dist(px, py, pt.x, pt.y);
        s.text = s._baseText.replace(/— \d+\/\d+.*$/, '— ' + this.collectIdx + '/' + this.collectPoints.length + ' (press E at each)');
        if (pd < 80 && g.interactPressed) {
          this.collectIdx++;
          sfx.pickup();
          floaters.push({
            x: pt.x, y: pt.y - 30,
            text: 'ENVELOPE ' + this.collectIdx + '/' + this.collectPoints.length,
            life: 1.4, color: '#ffd24b',
          });
          if (this.collectIdx >= this.collectPoints.length) this.nextStage();
        }
      }
    } else if (s.type === 'follow') {
      if (!this.followTarget) this.followTarget = this.pickFollowTarget();
      const t = this.followTarget;
      if (!t) { s.text = s._baseText + ' — no courier in sight'; return; }
      g.objective = { x: t.x, y: t.y };
      const td = dist(px, py, t.x, t.y);
      if (!p.inCar) {
        s.text = 'Get in your car to tail him — ' + Math.floor(this.followProgress) + 's / ' + this.followNeed + 's';
        return;
      }
      if (td < 150) {
        // Too close: the courier gets suspicious (grace period first).
        if (this.followGrace > 0) {
          this.followGrace -= dt;
          s.text = 'Tail the courier — get into position…';
        } else {
          this.suspicion += dt;
          this.loseT = 0;
          s.text = 'TOO CLOSE — back off! (' + Math.max(0, (4 - this.suspicion)).toFixed(1) + 's)';
          if (this.suspicion >= 4) {
            g.failMission('The courier spotted you.');
            return;
          }
        }
      } else if (td > 600) {
        // Too far: losing him.
        this.followGrace = Math.max(0, this.followGrace - dt);
        this.loseT += dt;
        this.suspicion = Math.max(0, this.suspicion - dt);
        s.text = 'You\'re losing him! (' + Math.max(0, (5 - this.loseT)).toFixed(1) + 's)';
        if (this.loseT >= 5) {
          g.failMission('You lost the courier.');
          return;
        }
      } else {
        // In the band: tailing him, progress fills.
        this.followGrace = Math.max(0, this.followGrace - dt);
        this.followProgress += dt;
        this.suspicion = Math.max(0, this.suspicion - dt);
        this.loseT = 0;
        s.text = 'Tail the courier — ' + Math.floor(this.followProgress) + 's / ' + this.followNeed + 's';
        if (this.followProgress >= this.followNeed) this.nextStage();
      }
    } else if (s.type === 'photo' || s.type === 'activate') {
      this.updateHold(dt, s, d);
    } else if (s.type === 'swap') {
      if (d < 80 && g.interactPressed) {
        this.nextStage();
        sfx.pickup();
      }
    } else if (s.type === 'listen') {
      const inner = s.inner || 120;
      const outer = s.outer || 280;
      const need = s.need || 20;
      if (p.inCar) {
        s.text = 'Get out of the car to listen — ' + Math.floor(this.listenProgress) + 's / ' + need + 's';
        return;
      }
      if (d < inner) {
        g.failMission('You were spotted.');
        return;
      }
      if (d <= outer) {
        this.listenProgress += dt;
        s.text = 'Listening… ' + Math.floor(this.listenProgress) + 's / ' + need + 's';
        if (this.listenProgress >= need) this.nextStage();
      } else {
        s.text = 'Get closer to hear — ' + Math.floor(this.listenProgress) + 's / ' + need + 's';
      }
    } else if (s.type === 'distract') {
      if (d < 80 && g.interactPressed) {
        this.distractWindow = s.window || 30;
        sfx.pickup();
        floaters.push({
          x: s.x, y: s.y - 30,
          text: 'CAR ALARM — the guard is looking away!',
          life: 1.6, color: '#ffd24b',
        });
        this.nextStage();
      }
    } else if (s.type === 'grab') {
      this.distractWindow -= dt;
      if (this.distractWindow <= 0) {
        // The guard is back: go back to the 'distract' stage and try again.
        this.distractWindow = 0;
        this.stageIdx = Math.max(0, this.stageIdx - 1);
        this.enterStage();
        floaters.push({
          x: p.x, y: p.y - 40,
          text: 'Too slow — the guard is back. Set the alarm off again.',
          life: 2, color: '#ff5a4b',
        });
        return;
      }
      s.text = s._baseText.replace(/— \d+s left.*$/, '— ' + Math.ceil(this.distractWindow) + 's left');
      if (d < 80 && g.interactPressed) {
        this.nextStage();
        sfx.pickup();
      }
    }
    // Stage timer text for deliver stages.
    if (s.type === 'deliver') g.stageTimer = this.timer;
  }

  // Shared hold-still logic for 'photo' and 'activate': press E on foot to
  // start, then stay within 25px of the start point until the timer fills.
  // Moving, getting in a car, or leaving the area resets the hold.
  updateHold(dt, s, d) {
    const g = this.game;
    const p = g.player;
    if (!this.holdStarted) {
      s.text = s._baseText;
      if (!p.inCar && d < 80 && g.interactPressed) {
        this.holdStarted = true;
        this.holdStartX = p.x;
        this.holdStartY = p.y;
        this.holdT = 0;
        sfx.pickup();
      }
      return;
    }
    const moved = dist(p.x, p.y, this.holdStartX, this.holdStartY);
    if (p.inCar || moved > 25 || d > 100) {
      this.holdStarted = false;
      this.holdT = 0;
      floaters.push({
        x: p.x, y: p.y - 40,
        text: 'Hold still!',
        life: 1.2, color: '#ff5a4b',
      });
      return;
    }
    this.holdT += dt;
    s.text = s._baseText + ' — ' + Math.min(this.holdNeed, Math.floor(this.holdT) + 1) + 's / ' + this.holdNeed + 's';
    if (this.holdT >= this.holdNeed) this.nextStage();
  }

  nextStage() {
    const g = this.game;
    this.stageIdx++;
    this.escapeT = 0;
    g.heatDrainMul = 1;
    sfx.pickup();
    if (this.stageIdx >= this.mission.stages.length) this.complete();
    else this.enterStage();
  }

  complete() {
    const g = this.game;
    const m = this.mission;
    g.cash += m.reward;
    g.respect += 120;
    // Unlock the next weapon as the story advances.
    const unlocks = { 2: 2, 4: 3, 6: 4 };
    const wi = unlocks[m.id];
    if (wi !== undefined && !g.save.weapons[wi]) {
      g.save.weapons[wi] = true;
      g.player.ammo[wi] = WEAPONS[wi].ammo;
      g.player.reserve[wi] = WEAPONS[wi].reserve;
      floaters.push({
        x: g.player.x, y: g.player.y - 44,
        text: 'NEW WEAPON: ' + WEAPONS[wi].name + ' — press ' + (wi + 1),
        life: 2.5, color: '#ffd24b',
      });
    }
    g.saveProgress();
    sfx.cash();
    g.showDialog(
      'MARA VOSS', 'FIXER',
      'Job done, Leo. $' + m.reward.toLocaleString('en-US') + ' is yours. ' +
        (m.id < 7 ? 'I have more work when you are ready.' : 'That is the last of them. Port Valen is yours now.'),
      6,
    );
    if (m.id >= 7) {
      g.victory();
      return;
    }
    this.mission = null;
    g.objective = null;
    g.enemies = [];
    g.updateMarkers();
    g.missionCompleteFlash = 3;
    g.advanceChapter();
  }

  onKill() { this.kills++; }
}

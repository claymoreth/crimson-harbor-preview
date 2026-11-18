// Crimson Harbor — mission engine: 7 story jobs, each 4 stages.
// Stage types: drive (reach the marker), pickup (press E), shoot (drop N of a
// gang), boss (dialog, then drop the boss + guards), escape (reach the
// safehouse, then lose the heat), deliver (drive, on a clock), talk (press E).
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
    }
    g.updateMarkers();
  }

  update(dt) {
    const s = this.stage;
    const g = this.game;
    if (!s) return;
    const p = g.player;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    const d = dist(px, py, s.x, s.y);
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
    }
    // Stage timer text for deliver stages.
    if (s.type === 'deliver') g.stageTimer = this.timer;
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

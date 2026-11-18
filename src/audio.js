// Crimson Harbor — procedural WebAudio sound effects (no audio files).
let actx = null;
let master = null;
let sirenNodes = null;
let engineNodes = null;
export let muted = false;

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}
export function initAudio() {
  if (actx) {
    if (actx.state === 'suspended') actx.resume();
    return;
  }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(actx.destination);
  } catch (e) {
    actx = null;
  }
}
function env(g, t0, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}
function blip(freq, dur, type = 'sine', vol = 0.25, slideTo = null) {
  if (!actx) return;
  const t0 = actx.currentTime;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  env(g, t0, 0.008, vol, dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
function noiseBurst(dur, vol, lowpass = 1200) {
  if (!actx) return;
  const t0 = actx.currentTime;
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = actx.createBufferSource();
  src.buffer = buf;
  const f = actx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass;
  const g = actx.createGain();
  env(g, t0, 0.004, vol, dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
}
export const sfx = {
  shoot() { noiseBurst(0.12, 0.5, 2400); blip(180, 0.08, 'square', 0.18, 60); },
  enemyShoot() { noiseBurst(0.1, 0.25, 1800); },
  hit() { blip(220, 0.06, 'triangle', 0.3, 90); },
  kill() { blip(520, 0.12, 'sine', 0.3, 180); blip(780, 0.16, 'sine', 0.22, 240); },
  pickup() { blip(660, 0.09, 'sine', 0.3); setTimeout(() => blip(990, 0.12, 'sine', 0.3), 80); },
  cash() { blip(880, 0.1, 'sine', 0.3); setTimeout(() => blip(1174, 0.14, 'sine', 0.3), 90); },
  reload() { blip(300, 0.05, 'square', 0.15); setTimeout(() => blip(420, 0.05, 'square', 0.15), 120); },
  click() { blip(700, 0.04, 'square', 0.12); },
  horn() { blip(330, 0.18, 'square', 0.2, 330); },
  crash() { noiseBurst(0.25, 0.5, 900); },
  busted() { blip(440, 0.4, 'sawtooth', 0.25, 110); },
  mission() { [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.14, 'sine', 0.28), i * 110)); },
  radio() { blip(990, 0.06, 'sine', 0.2); blip(1320, 0.08, 'sine', 0.15); },
};

// Looping two-tone police siren while wanted > 0.
export function setSiren(on) {
  if (!actx) return;
  if (on && !sirenNodes) {
    const o = actx.createOscillator();
    const g = actx.createGain();
    const lfo = actx.createOscillator();
    const lg = actx.createGain();
    o.type = 'sine';
    o.frequency.value = 800;
    lfo.type = 'square';
    lfo.frequency.value = 0.9;
    lg.gain.value = 220;
    lfo.connect(lg);
    lg.connect(o.frequency);
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(master);
    o.start();
    lfo.start();
    sirenNodes = { o, lfo, g };
  } else if (!on && sirenNodes) {
    try {
      sirenNodes.o.stop();
      sirenNodes.lfo.stop();
    } catch (e) {}
    sirenNodes = null;
  }
}
// Engine hum whose pitch follows the car's speed.
export function setEngine(speed01, on) {
  if (!actx) return;
  if (on && !engineNodes) {
    const o = actx.createOscillator();
    const g = actx.createGain();
    const f = actx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = 60;
    f.type = 'lowpass';
    f.frequency.value = 500;
    g.gain.value = 0.045;
    o.connect(f);
    f.connect(g);
    g.connect(master);
    o.start();
    engineNodes = { o, g };
  } else if (!on && engineNodes) {
    try {
      engineNodes.o.stop();
    } catch (e) {}
    engineNodes = null;
  }
  if (engineNodes) engineNodes.o.frequency.value = 55 + speed01 * 130;
}

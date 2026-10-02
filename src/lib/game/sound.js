// Tiny synthesized sound effects (Web Audio), no audio files needed.
// Muted via setSoundEnabled(false); the game store keeps it in sync with Settings.

let ctx = null;
let enabled = true;

export const setSoundEnabled = (on) => { enabled = on; };

const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

const tone = (ac, { freq, start = 0, dur = 0.12, type = 'sine', gain = 0.15, to }) => {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

const SOUNDS = {
  tap: ac => tone(ac, { freq: 420, dur: 0.05, gain: 0.03 }),
  xp: ac => {
    tone(ac, { freq: 880, dur: 0.09, type: 'triangle', gain: 0.12 });
    tone(ac, { freq: 1320, start: 0.07, dur: 0.14, type: 'triangle', gain: 0.12 });
  },
  quest: ac => {
    tone(ac, { freq: 988, dur: 0.08, type: 'square', gain: 0.05 });
    tone(ac, { freq: 1319, start: 0.08, dur: 0.25, type: 'square', gain: 0.05 });
  },
  success: ac => {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(ac, { freq: f, start: i * 0.09, dur: 0.22, type: 'triangle', gain: 0.14 }));
  },
  levelup: ac => {
    [392, 523, 659, 784, 1047].forEach((f, i) =>
      tone(ac, { freq: f, start: i * 0.07, dur: 0.16, type: 'square', gain: 0.05 }));
    [523, 659, 784].forEach(f => tone(ac, { freq: f, start: 0.4, dur: 0.6, type: 'triangle', gain: 0.1 }));
  },
  streak: ac => {
    tone(ac, { freq: 260, to: 900, dur: 0.35, type: 'sawtooth', gain: 0.04 });
    tone(ac, { freq: 1568, start: 0.3, dur: 0.3, type: 'triangle', gain: 0.1 });
    tone(ac, { freq: 2093, start: 0.4, dur: 0.35, type: 'triangle', gain: 0.08 });
  },
  freeze: ac => {
    [1760, 2093, 2637, 3136].forEach((f, i) =>
      tone(ac, { freq: f, start: i * 0.06, dur: 0.3, gain: 0.06 }));
  },
  sad: ac => {
    [392, 330, 262].forEach((f, i) =>
      tone(ac, { freq: f, start: i * 0.22, dur: 0.3, type: 'triangle', gain: 0.1 }));
  },
};

export const playSound = (name) => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const ac = audio();
    if (ac && SOUNDS[name]) SOUNDS[name](ac);
  } catch {
    // Audio is a nicety; never let it break the app
  }
};

export const vibrate = (pattern = 20) => {
  if (!enabled) return;
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
};

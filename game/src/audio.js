// audio.js — all sound is synthesized with WebAudio, no audio files.
// One clear job: tiny bleeps, sizzles and jingles, with a mute toggle.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol || 0.12, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol, lowpass) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass || 1200;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol || 0.08, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.07, 'triangle', 0.1); },
  place() { tone(330, 0.08, 'triangle', 0.1, 260); },
  chop() { noiseBurst(0.09, 0.16, 2400); tone(180, 0.06, 'square', 0.05); },
  sizzle() { noiseBurst(0.35, 0.05, 5000); },
  flip() { tone(440, 0.09, 'triangle', 0.1, 660); },
  ding() { tone(880, 0.12, 'sine', 0.12); tone(1320, 0.18, 'sine', 0.08); },
  serve() { tone(523, 0.1, 'triangle', 0.12); setTimeout(() => tone(659, 0.1, 'triangle', 0.12), 90); setTimeout(() => tone(784, 0.16, 'triangle', 0.12), 180); },
  coin() { tone(988, 0.08, 'square', 0.06); setTimeout(() => tone(1319, 0.14, 'square', 0.05), 70); },
  burn() { tone(220, 0.3, 'sawtooth', 0.1, 110); noiseBurst(0.2, 0.1, 800); },
  walkout() { tone(392, 0.15, 'sine', 0.1, 262); setTimeout(() => tone(262, 0.25, 'sine', 0.1), 140); },
  click() { tone(600, 0.05, 'triangle', 0.08); },
  start() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'triangle', 0.11), i * 90)); },
  gameover() { [784, 659, 523, 392].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.11), i * 130)); },
};

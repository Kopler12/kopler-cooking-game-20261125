// main.js — wires the canvas, the clock, keyboard + mouse to kitchen.js.
// One clear job: run the loop and translate input into game actions.

import { VIEW_W, VIEW_H, BIN_KEYS, RECIPES } from './config.js';
import {
  newGame, startShift, update, clickAt, grabBin, tryServe, clickTrash,
  togglePause,
} from './kitchen.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { ensureAudio, toggleMute, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const state = newGame(20261125);
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
  offsetX = (canvas.width - VIEW_W * scale) / 2;
  offsetY = (canvas.height - VIEW_H * scale) / 2;
}
window.addEventListener('resize', resize);
resize();

function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = (clientX - rect.left) * (canvas.width / rect.width);
  const py = (clientY - rect.top) * (canvas.height / rect.height);
  return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
}

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
  const p = toLogical(e.clientX, e.clientY);
  clickAt(state, p.x, p.y);
  announce();
});

window.addEventListener('keydown', (e) => {
  ensureAudio();
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k >= '1' && k <= '9') {
    const id = BIN_KEYS[Number(k) - 1];
    if (id) grabBin(state, id);
  } else if (k === 'enter') {
    if (state.screen === 'title') startShift(state);
    else if (state.screen === 'results') state.screen = 'title';
    else tryServe(state);
  } else if (k === 'backspace') {
    clickTrash(state);
    e.preventDefault();
  } else if (k === 'p') {
    togglePause(state);
  } else if (k === 'm') {
    const muted = toggleMute();
    state.muted = muted;
  } else if (k === ' ') {
    if (state.screen === 'title') startShift(state);
    e.preventDefault();
  }
  announce();
});

function announce() {
  if (!statusEl) return;
  if (state.screen === 'playing') {
    statusEl.textContent = `Cooking. ${state.coins} coins, ${state.served} served, ${state.timeLeft.toFixed(0)} seconds left.`;
  } else if (state.screen === 'results') {
    statusEl.textContent = `Shift over. ${state.coins} coins, ${state.served} dishes served.`;
  }
}

// Deterministic screenshot staging: ?shot=start|play|serve|end
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) applyShot(state, shot);

// Built-in self-test: ?selftest=1 runs logic checks and reports in the title.
if (params.get('selftest') === '1') {
  runSelfTest();
}

function runSelfTest() {
  const results = [];
  const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  const s = newGame(7);
  startShift(s);
  // Pin the ticket the test cooks, so the check does not depend on the RNG.
  s.tickets = [{ id: 999, recipe: RECIPES.find((r) => r.id === 'cheeseburger'), patience: 60, maxPatience: 62 }];
  check('shift starts playing', s.screen === 'playing');
  check('pinned ticket present', s.tickets.length === 1 && s.tickets[0].recipe.id === 'cheeseburger');
  grabBin(s, 'bun');
  check('hand holds bun', s.hand && s.hand.id === 'bun');
  clickAt(s, 876, 374); // plate centre: stack the bun
  check('bun stacked on plate', s.plate.length === 1 && s.hand === null);
  grabBin(s, 'patty');
  check('hand holds raw patty', s.hand && s.hand.state === 'raw');
  clickAt(s, 500, 300); // grill slot 0
  check('patty on grill', s.grill[0] && s.grill[0].id === 'patty' && s.hand === null);
  update(s, 8);
  clickAt(s, 500, 300);
  check('cooked patty picked up', s.hand && s.hand.id === 'patty' && (s.hand.state === 'cooked' || s.hand.state === 'perfect'));
  clickAt(s, 876, 374);
  grabBin(s, 'cheese');
  clickAt(s, 876, 374);
  grabBin(s, 'lettuce');
  clickAt(s, 560, 470); // chopping board
  check('lettuce on board', s.board && s.board.id === 'lettuce');
  clickAt(s, 560, 470);
  clickAt(s, 560, 470);
  clickAt(s, 560, 470);
  check('lettuce chopped to hand', s.hand && s.hand.id === 'lettuce' && s.hand.state === 'chopped');
  clickAt(s, 876, 374);
  const before = s.coins;
  clickAt(s, 1136, 300); // serve window
  check('cheeseburger served for coins', s.coins > before && s.served === 1);
  check('plate cleared after serve', s.plate.length === 0);
  update(s, 200);
  check('shift ends at zero time', s.screen === 'results');
  const fails = results.filter((r) => r.startsWith('FAIL'));
  document.title = (fails.length ? 'SELFTEST FAIL: ' : 'SELFTEST PASS: ') + results.join(' | ');
  window.__selftest = results;
}

// --- frame loop --------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(state, dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#2b1d16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  render(ctx, state, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

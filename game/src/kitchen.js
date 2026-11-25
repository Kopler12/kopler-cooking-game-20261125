// kitchen.js — the game state and every rule: orders, grill, chopping,
// assembly, serving, timer, scoring. No drawing here, no DOM except none.
// render.js reads this state; main.js sends it clicks and keys.

import {
  VIEW_W, VIEW_H, SHIFT_SECONDS, MAX_TICKETS, ORDER_SPAWN_EVERY,
  ORDER_SPAWN_RUSH, RUSH_AT_SECONDS_LEFT, PATIENCE_SECONDS, PATIENCE_RUSH,
  GRILL_SECONDS, GRILL_PERFECT_FROM, GRILL_PERFECT_TO, GRILL_BURN_AT, CHOPS_NEEDED,
  BASE_PAY, TIP_PER_PATIENCE, PERFECT_BONUS, COMBO_STEP, COMBO_CAP,
  INGREDIENTS, RECIPES, STAR_THRESHOLDS,
} from './config.js';
import { sfx } from './audio.js';

// --- layout: every clickable zone in logical 1280x800 coordinates ---------
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: VIEW_W, h: 64 },
  board: { x: 24, y: 70, w: 1232, h: 124 },
  ticketW: 392, ticketH: 86, ticketGap: 28,
  bins: { x: 24, y: 216, w: 336, h: 316, cols: 3, rows: 3, cellW: 108, cellH: 100, gap: 6 },
  grill: { x: 392, y: 216, w: 336, h: 190 },
  board2: { x: 392, y: 422, w: 336, h: 110 },
  plate: { x: 760, y: 216, w: 232, h: 316 },
  serve: { x: 1016, y: 216, w: 240, h: 190 },
  trash: { x: 1016, y: 422, w: 240, h: 110 },
  hand: { x: 392, y: 556, w: 496, h: 96 },
  help: { x: 24, y: 556, w: 336, h: 96 },
  stats: { x: 920, y: 556, w: 336, h: 96 },
};

export const BIN_ORDER = ['bun', 'patty', 'chicken', 'cheese', 'lettuce', 'tomato', 'onion', 'rice', 'egg'];

// --- deterministic random --------------------------------------------------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let ticketSeq = 0;

export function newGame(seed) {
  return {
    screen: 'title',
    rng: mulberry32(seed || 20261125),
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnTimer: 3,
    tickets: [],
    hand: null,              // { id, state } state: ready|raw|cooked|perfect|chopped|burnt
    grill: [null, null],     // { id, t } seconds on the grill
    board: null,             // { id, chops }
    plate: [],               // [{ id, state }]
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    perfectServes: 0,
    floaters: [],            // { x, y, text, color, t, life }
    shake: 0,
    paused: false,
    over: false,
    muted: false,
    flashServe: 0,
    message: '',
    messageT: 0,
  };
}

export function startShift(state) {
  const fresh = newGame(20261125);
  Object.assign(state, fresh);
  state.screen = 'playing';
  spawnTicket(state);
  spawnTicket(state);
  sfx.start();
}

function spawnTicket(state) {
  if (state.tickets.length >= MAX_TICKETS) return;
  const recipe = RECIPES[Math.floor(state.rng() * RECIPES.length)];
  const rush = state.timeLeft <= RUSH_AT_SECONDS_LEFT;
  const patience = rush ? PATIENCE_RUSH : PATIENCE_SECONDS;
  state.tickets.push({
    id: ++ticketSeq,
    recipe,
    patience,
    maxPatience: patience,
  });
}

function requiredState(ingId) {
  const kind = INGREDIENTS[ingId].kind;
  if (kind === 'grill') return ['cooked', 'perfect'];
  if (kind === 'chop') return ['chopped'];
  return ['ready'];
}

// Does the plate, as stacked, fill one ticket exactly?
export function findMatchingTicket(state) {
  for (const ticket of state.tickets) {
    if (plateMatches(state.plate, ticket.recipe.needs)) return ticket;
  }
  return null;
}

function plateMatches(plate, needs) {
  if (plate.length !== needs.length) return false;
  const pool = plate.map((p) => ({ id: p.id, state: p.state }));
  for (const need of needs) {
    const idx = pool.findIndex((p) => p.id === need && requiredState(need).includes(p.state));
    if (idx === -1) return false;
    pool.splice(idx, 1);
  }
  return true;
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color: color || '#fff', t: 0, life: 1.1 });
}

function setMessage(state, text) {
  state.message = text;
  state.messageT = 2.2;
}

// --- actions: every click or key resolves here -----------------------------
export function grabBin(state, ingId) {
  if (state.screen !== 'playing' || state.paused) return;
  if (state.hand) { setMessage(state, 'Hands full — serve or trash first!'); sfx.click(); return; }
  state.hand = { id: ingId, state: INGREDIENTS[ingId].kind === 'bin' ? 'ready' : 'raw' };
  sfx.pickup();
}

export function clickGrill(state, slot) {
  if (state.screen !== 'playing' || state.paused) return;
  const item = state.grill[slot];
  if (item) {
    if (state.hand) { setMessage(state, 'Hands full!'); return; }
    const t = item.t;
    // Undercooked comes back raw (put it back on); the golden window pays.
    let st = 'cooked';
    if (t >= GRILL_BURN_AT) st = 'burnt';
    else if (t >= GRILL_PERFECT_FROM && t <= GRILL_PERFECT_TO) st = 'perfect';
    else if (t < GRILL_SECONDS) st = 'raw';
    state.hand = { id: item.id, state: st };
    state.grill[slot] = null;
    if (st === 'burnt') { sfx.burn(); addFloater(state, 560, 300, 'BURNT!', '#ff7043'); }
    else if (st === 'perfect') { sfx.flip(); addFloater(state, 560, 300, 'PERFECT!', '#ffd54f'); }
    else sfx.flip();
  } else if (state.hand && INGREDIENTS[state.hand.id].kind === 'grill' && state.hand.state === 'raw') {
    state.grill[slot] = { id: state.hand.id, t: 0 };
    state.hand = null;
    sfx.sizzle();
  } else if (state.hand) {
    setMessage(state, 'Only raw patties, chicken or eggs go on the grill.');
  }
}

export function clickBoard(state) {
  if (state.screen !== 'playing' || state.paused) return;
  if (state.board) {
    state.board.chops += 1;
    sfx.chop();
    if (state.board.chops >= CHOPS_NEEDED) {
      state.hand = { id: state.board.id, state: 'chopped' };
      state.board = null;
      sfx.ding();
    }
  } else if (state.hand && INGREDIENTS[state.hand.id].kind === 'chop' && state.hand.state === 'raw') {
    state.board = { id: state.hand.id, chops: 0 };
    state.hand = null;
    sfx.place();
  } else if (state.hand) {
    setMessage(state, 'Only raw vegetables go on the chopping board.');
  }
}

export function clickPlate(state) {
  if (state.screen !== 'playing' || state.paused) return;
  if (!state.hand) { setMessage(state, 'Grab an ingredient first!'); return; }
  if (state.hand.state === 'burnt') { setMessage(state, 'Burnt! Trash it, do not serve it.'); sfx.burn(); return; }
  state.plate.push({ id: state.hand.id, state: state.hand.state });
  state.hand = null;
  sfx.place();
  const match = findMatchingTicket(state);
  if (match) { state.flashServe = 1; sfx.ding(); }
}

export function clickTrash(state) {
  if (state.screen !== 'playing' || state.paused) return;
  if (state.hand) { state.hand = null; sfx.click(); return; }
  if (state.plate.length) { state.plate = []; sfx.click(); setMessage(state, 'Plate cleared.'); }
}

export function tryServe(state) {
  if (state.screen !== 'playing' || state.paused) return;
  const ticket = findMatchingTicket(state);
  if (!ticket) {
    if (!state.plate.length) { setMessage(state, 'Nothing on the plate to serve.'); return; }
    setMessage(state, 'That does not match any order — check the tickets!');
    state.shake = 0.35;
    sfx.walkout();
    return;
  }
  const patienceLeft = Math.max(0, ticket.patience / ticket.maxPatience);
  const perfectCount = state.plate.filter((p) => p.state === 'perfect').length;
  const grilledCount = state.plate.filter((p) => INGREDIENTS[p.id].kind === 'grill').length;
  let pay = BASE_PAY + ticket.recipe.price;
  pay += Math.round(TIP_PER_PATIENCE * patienceLeft);
  if (grilledCount > 0 && perfectCount === grilledCount) { pay += PERFECT_BONUS; state.perfectServes++; }
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  pay += Math.min(COMBO_CAP, (state.combo - 1) * COMBO_STEP);
  state.coins += pay;
  state.served += 1;
  state.tickets = state.tickets.filter((t) => t.id !== ticket.id);
  state.plate = [];
  state.flashServe = 0;
  addFloater(state, 1136, 300, `+${pay} coins`, '#ffd54f');
  if (state.combo >= 3) addFloater(state, 1136, 340, `COMBO x${state.combo}!`, '#ff8a65');
  sfx.serve();
  setTimeout(() => sfx.coin(), 120);
  const r = LAYOUT.serve;
  addFloater(state, r.x + r.w / 2, r.y + 20, ticket.recipe.name + ' served!', '#aeea00');
}

export function togglePause(state) {
  if (state.screen !== 'playing') return;
  state.paused = !state.paused;
}

// --- hit testing: which station is at (x, y)? ------------------------------
function inside(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function stationAt(state, x, y) {
  const L = LAYOUT;
  if (inside(L.board, x, y)) {
    const slotW = L.ticketW + L.ticketGap;
    const i = Math.floor((x - L.board.x) / slotW);
    if (i >= 0 && i < MAX_TICKETS) return { type: 'ticket', index: i };
  }
  const b = L.bins;
  if (inside(b, x, y)) {
    const col = Math.floor((x - b.x) / (b.cellW + b.gap));
    const row = Math.floor((y - b.y) / (b.cellH + b.gap));
    if (col >= 0 && col < b.cols && row >= 0 && row < b.rows) {
      const idx = row * b.cols + col;
      if (idx < BIN_ORDER.length) return { type: 'bin', id: BIN_ORDER[idx] };
    }
  }
  const g = L.grill;
  if (inside(g, x, y)) {
    const slot = x < g.x + g.w / 2 ? 0 : 1;
    return { type: 'grill', slot };
  }
  if (inside(L.board2, x, y)) return { type: 'board' };
  if (inside(L.plate, x, y)) return { type: 'plate' };
  if (inside(L.serve, x, y)) return { type: 'serve' };
  if (inside(L.trash, x, y)) return { type: 'trash' };
  if (inside(L.hand, x, y)) return { type: 'hand' };
  return null;
}

export function clickAt(state, x, y) {
  if (state.screen === 'title') { startShift(state); return; }
  if (state.screen === 'results') { state.screen = 'title'; return; }
  const hit = stationAt(state, x, y);
  if (!hit) return;
  if (hit.type === 'bin') grabBin(state, hit.id);
  else if (hit.type === 'grill') clickGrill(state, hit.slot);
  else if (hit.type === 'board') clickBoard(state);
  else if (hit.type === 'plate') clickPlate(state);
  else if (hit.type === 'serve') tryServe(state);
  else if (hit.type === 'trash') clickTrash(state);
}

// --- per-frame update --------------------------------------------------------
export function update(state, dt) {
  if (state.screen !== 'playing' || state.paused) {
    for (const f of state.floaters) f.t += dt;
    state.floaters = state.floaters.filter((f) => f.t < f.life);
    return;
  }
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = 'results';
    sfx.gameover();
    return;
  }
  // new orders, faster in rush hour
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnTicket(state);
    state.spawnTimer = state.timeLeft <= RUSH_AT_SECONDS_LEFT ? ORDER_SPAWN_RUSH : ORDER_SPAWN_EVERY;
  }
  // patience drains; a walk-out resets the combo
  for (const t of state.tickets) t.patience -= dt;
  const walked = state.tickets.filter((t) => t.patience <= 0);
  if (walked.length) {
    state.tickets = state.tickets.filter((t) => t.patience > 0);
    state.lost += walked.length;
    state.combo = 0;
    sfx.walkout();
    addFloater(state, 640, 130, 'Customer walked out!', '#ff7043');
  }
  // grill cooks on
  for (const slot of state.grill) if (slot) slot.t += dt;
  // floaters, messages, shake
  for (const f of state.floaters) f.t += dt;
  state.floaters = state.floaters.filter((f) => f.t < f.life);
  if (state.messageT > 0) state.messageT -= dt;
  if (state.shake > 0) state.shake -= dt;
  if (state.flashServe > 0) state.flashServe = Math.max(0, state.flashServe - dt * 0.7);
}

export function starsEarned(state) {
  let stars = 0;
  for (const th of STAR_THRESHOLDS) if (state.coins >= th) stars += 1;
  return stars;
}

export function isRush(state) {
  return state.timeLeft <= RUSH_AT_SECONDS_LEFT && state.screen === 'playing';
}

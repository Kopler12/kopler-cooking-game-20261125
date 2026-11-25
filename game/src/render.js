// render.js — every pixel of Sizzle & Serve, drawn on one canvas.
// One clear job: turn kitchen.js state into the picture. No rules here.

import { VIEW_W, VIEW_H, INGREDIENTS, GRILL_SECONDS, GRILL_PERFECT_FROM, GRILL_PERFECT_TO, GRILL_BURN_AT, CHOPS_NEEDED } from './config.js';
import { LAYOUT, BIN_ORDER, findMatchingTicket, isRush, starsEarned } from './kitchen.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color || '#fff';
  ctx.font = `${weight || 700} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- ingredient art: each food drawn from shapes, no images ----------------
export function drawIngredient(ctx, id, cx, cy, s, state) {
  ctx.save();
  ctx.translate(cx, cy);
  const u = s / 2;
  if (id === 'bun') {
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath(); ctx.ellipse(0, -u * 0.25, u, u * 0.62, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f7cd82';
    ctx.beginPath(); ctx.ellipse(-u * 0.3, -u * 0.45, u * 0.16, u * 0.09, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(u * 0.25, -u * 0.5, u * 0.14, u * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d18f35';
    rr(ctx, -u, u * 0.28, u * 2, u * 0.42, u * 0.2); ctx.fill();
  } else if (id === 'patty') {
    let c = '#c96a4a';
    if (state === 'cooked') c = '#7a3b22';
    if (state === 'perfect') c = '#6b2f1a';
    if (state === 'burnt') c = '#1c1210';
    if (state === 'raw') c = '#e0785e';
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 0, u, u * 0.52, 0, 0, Math.PI * 2); ctx.fill();
    if (state !== 'burnt') {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.ellipse(-u * 0.4, -u * 0.18, u * 0.3, u * 0.12, -0.4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'chicken') {
    let c = '#f2c14e';
    if (state === 'cooked' || state === 'perfect') c = '#d99a26';
    if (state === 'burnt') c = '#241812';
    if (state === 'raw') c = '#f6d488';
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(-u * 0.45, 0, u * 0.55, 0, Math.PI * 2);
    ctx.arc(u * 0.45, -u * 0.1, u * 0.5, 0, Math.PI * 2);
    ctx.arc(0, u * 0.25, u * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,90,20,0.5)';
    for (const [dx, dy] of [[-0.4, -0.1], [0.35, 0.15], [0, -0.35]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.moveTo(-u, u * 0.5); ctx.lineTo(u, u * 0.5); ctx.lineTo(0, -u * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e0a800';
    for (const [dx, dy] of [[-0.35, 0.2], [0.3, 0.25], [0, -0.1]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.1, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    if (state === 'chopped') {
      ctx.fillStyle = '#7dc242';
      for (const [dx, dy, r] of [[-0.4, 0.1, 0.4], [0.35, -0.15, 0.36], [0, 0.35, 0.34]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#4a8a24'; ctx.lineWidth = 2;
      for (const [dx, dy] of [[-0.4, 0.1], [0.35, -0.15], [0, 0.35]]) {
        ctx.beginPath(); ctx.moveTo((dx - 0.2) * u, dy * u); ctx.lineTo((dx + 0.2) * u, dy * u); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#7dc242';
      ctx.beginPath();
      ctx.moveTo(-u, u * 0.3);
      ctx.quadraticCurveTo(-u * 0.7, -u * 0.8, -u * 0.2, -u * 0.3);
      ctx.quadraticCurveTo(0, -u * 0.9, u * 0.3, -u * 0.35);
      ctx.quadraticCurveTo(u * 0.8, -u * 0.8, u, u * 0.3);
      ctx.quadraticCurveTo(0, u * 0.75, -u, u * 0.3);
      ctx.fill();
      ctx.strokeStyle = '#4a8a24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -u * 0.5); ctx.lineTo(0, u * 0.4); ctx.stroke();
    }
  } else if (id === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = '#ef5350';
      for (const [dx, dy] of [[-0.45, 0], [0.05, -0.3], [0.45, 0.2]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.38, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffcdd2';
      for (const [dx, dy] of [[-0.45, 0], [0.05, -0.3], [0.45, 0.2]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.16, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#ef5350';
      ctx.beginPath(); ctx.arc(0, 0, u * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8a80';
      ctx.beginPath(); ctx.arc(-u * 0.3, -u * 0.3, u * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a8a24';
      ctx.beginPath(); ctx.ellipse(0, -u * 0.85, u * 0.22, u * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'onion') {
    if (state === 'chopped') {
      ctx.strokeStyle = '#b39ddb'; ctx.lineWidth = 3;
      for (const [dx, dy, r] of [[-0.4, 0.1, 0.32], [0.35, -0.2, 0.28], [0.1, 0.35, 0.26]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#f3e5f5';
      ctx.beginPath(); ctx.arc(0, 0, u * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b39ddb'; ctx.lineWidth = 2.5;
      for (const r of [0.6, 0.38]) {
        ctx.beginPath(); ctx.arc(0, 0, r * u, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#7cb342';
      ctx.beginPath(); ctx.moveTo(0, -u * 0.85); ctx.lineTo(u * 0.2, -u * 1.15); ctx.lineTo(-u * 0.1, -u * 1.1); ctx.closePath(); ctx.fill();
    }
  } else if (id === 'rice') {
    ctx.fillStyle = '#fff8e1';
    ctx.beginPath(); ctx.ellipse(0, u * 0.2, u, u * 0.6, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#d7ccc8';
    for (const [dx, dy] of [[-0.5, 0], [0, -0.25], [0.45, 0.05], [-0.1, 0.25]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'egg') {
    let yolk = '#ffd54f';
    if (state === 'burnt') yolk = '#3e2723';
    if (state === 'raw') yolk = '#ffec99';
    ctx.fillStyle = state === 'burnt' ? '#4e342e' : '#fffde7';
    ctx.beginPath();
    ctx.ellipse(-u * 0.25, u * 0.1, u * 0.7, u * 0.55, 0.3, 0, Math.PI * 2);
    ctx.ellipse(u * 0.35, -u * 0.15, u * 0.6, u * 0.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = yolk;
    ctx.beginPath(); ctx.arc(0, 0, u * 0.42, 0, Math.PI * 2); ctx.fill();
  }
  if (state === 'perfect') {
    ctx.fillStyle = '#fff176';
    for (const [dx, dy] of [[-0.8, -0.8], [0.85, -0.7], [0.8, 0.8]]) {
      ctx.beginPath();
      ctx.moveTo(dx * u, (dy - 0.25) * u); ctx.lineTo((dx + 0.12) * u, dy * u);
      ctx.lineTo(dx * u, (dy + 0.25) * u); ctx.lineTo((dx - 0.12) * u, dy * u);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

// --- panels ------------------------------------------------------------------
function panel(ctx, r, fill, stroke) {
  rr(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function stationTitle(ctx, x, y, label, sub) {
  // Drawn in the panel header band above the station rect (panel top y-30).
  text(ctx, label, x, y - 22, 15, '#ffe0b2', 800, 'left');
  if (sub) text(ctx, sub, x, y - 7, 11, '#cbb59a', 600, 'left');
}

function fmtTime(s) {
  const m = Math.floor(Math.max(0, s) / 60);
  const ss = Math.floor(Math.max(0, s) % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}

export function render(ctx, state, now) {
  ctx.save();
  if (state.shake > 0) {
    const a = state.shake * 14;
    ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
  }
  drawWall(ctx, now);
  if (state.screen === 'title') { drawTitle(ctx, state, now); ctx.restore(); return; }
  if (state.screen === 'results') { drawResults(ctx, state, now); ctx.restore(); return; }
  drawTopBar(ctx, state);
  drawBoard(ctx, state, now);
  drawBins(ctx, state);
  drawGrill(ctx, state, now);
  drawChopBoard(ctx, state);
  drawPlate(ctx, state, now);
  drawServe(ctx, state, now);
  drawTrash(ctx, state);
  drawHand(ctx, state);
  drawHelp(ctx, state);
  drawStats(ctx, state);
  drawFloaters(ctx, state);
  if (state.messageT > 0) {
    ctx.globalAlpha = Math.min(1, state.messageT);
    rr(ctx, 340, 660, 600, 34, 17);
    ctx.fillStyle = 'rgba(30,18,10,0.92)'; ctx.fill();
    text(ctx, state.message, 640, 678, 15, '#ffe082', 700);
    ctx.globalAlpha = 1;
  }
  if (isRush(state)) {
    const pulse = 0.6 + 0.4 * Math.sin(now / 180);
    ctx.globalAlpha = pulse;
    text(ctx, 'RUSH HOUR — orders are coming fast!', 640, 700, 16, '#ff8a65', 800);
    ctx.globalAlpha = 1;
  }
  if (state.paused) {
    ctx.fillStyle = 'rgba(20,10,5,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', 640, 380, 54, '#fff', 900);
    text(ctx, 'Press P to keep cooking', 640, 430, 18, '#ffe0b2', 600);
  }
  ctx.restore();
}

function drawWall(ctx, now) {
  // warm brick wall, tiled floor, sunny window, hanging lamps
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#8a5636';
  for (let y = 0; y < 560; y += 46) {
    for (let x = (y / 46 % 2) * 40; x < VIEW_W; x += 80) {
      ctx.fillRect(x + 2, y + 2, 76, 42);
    }
  }
  ctx.fillStyle = '#5d3a22';
  ctx.fillRect(0, 560, VIEW_W, 240);
  ctx.fillStyle = '#6b4429';
  for (let x = 0; x < VIEW_W; x += 64) ctx.fillRect(x, 560, 2, 240);
  for (let y = 560; y < VIEW_H; y += 48) ctx.fillRect(0, y, VIEW_W, 2);
  // window with sun
  rr(ctx, 1020, 84, 220, 110, 10);
  ctx.fillStyle = '#bfe3ff'; ctx.fill();
  ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(1130, 84); ctx.lineTo(1130, 194); ctx.moveTo(1020, 139); ctx.lineTo(1240, 139); ctx.stroke();
  ctx.fillStyle = '#ffca28';
  ctx.beginPath(); ctx.arc(1085, 120, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(1180, 165, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
  // hanging lamps
  for (const lx of [300, 640, 980]) {
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 46); ctx.stroke();
    ctx.fillStyle = '#ffb300';
    ctx.beginPath(); ctx.moveTo(lx - 22, 46); ctx.lineTo(lx + 22, 46); ctx.lineTo(lx + 12, 66); ctx.lineTo(lx - 12, 66); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,213,79,0.25)';
    ctx.beginPath(); ctx.ellipse(lx, 120, 60, 60, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawTopBar(ctx, state) {
  const r = LAYOUT.topBar;
  ctx.fillStyle = 'rgba(30,16,8,0.85)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  text(ctx, 'SIZZLE & SERVE', 24, 33, 26, '#ffb300', 900, 'left');
  text(ctx, 'Dapur Kilat', 268, 35, 14, '#ffe0b2', 600, 'left');
  const t = state.timeLeft;
  const low = t <= 30;
  const pulse = low ? 0.7 + 0.3 * Math.sin(Date.now() / 150) : 1;
  ctx.globalAlpha = pulse;
  rr(ctx, 560, 10, 160, 44, 12);
  ctx.fillStyle = low ? '#c62828' : '#37474f'; ctx.fill();
  ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, '⏱ ' + fmtTime(t), 640, 33, 24, '#fff', 800);
  ctx.globalAlpha = 1;
  rr(ctx, 748, 10, 190, 44, 12);
  ctx.fillStyle = '#4e342e'; ctx.fill();
  text(ctx, '🪙 ' + state.coins + ' coins', 843, 33, 20, '#ffd54f', 800);
  text(ctx, 'Served ' + state.served + '  •  Lost ' + state.lost, 1000, 33, 16, '#ffe0b2', 700, 'left');
  if (state.combo >= 2) {
    rr(ctx, 1150, 10, 110, 44, 12);
    ctx.fillStyle = '#e65100'; ctx.fill();
    text(ctx, 'COMBO x' + state.combo, 1205, 33, 17, '#fff', 800);
  }
}

function drawBoard(ctx, state, now) {
  const L = LAYOUT;
  panel(ctx, L.board, 'rgba(43,26,14,0.9)', '#8d6e63');
  text(ctx, 'ORDER BOARD', L.board.x + 16, L.board.y + 16, 13, '#ffb300', 800, 'left');
  for (let i = 0; i < 3; i++) {
    const x = L.board.x + 16 + i * (L.ticketW + L.ticketGap);
    const y = L.board.y + 30;
    const ticket = state.tickets[i];
    rr(ctx, x, y, L.ticketW, L.ticketH, 10);
    ctx.fillStyle = ticket ? '#fff8e1' : 'rgba(255,248,225,0.14)';
    ctx.fill();
    if (!ticket) {
      text(ctx, '— waiting for the next order —', x + L.ticketW / 2, y + L.ticketH / 2, 14, 'rgba(255,248,225,0.6)', 600);
      continue;
    }
    const frac = Math.max(0, ticket.patience / ticket.maxPatience);
    const urgent = frac < 0.35;
    const match = findMatchingTicket(state) === ticket;
    if (match) {
      ctx.strokeStyle = '#7cb342'; ctx.lineWidth = 4; ctx.stroke();
    } else if (urgent) {
      ctx.strokeStyle = `rgba(229,57,53,${0.5 + 0.5 * Math.sin(now / 160)})`; ctx.lineWidth = 3; ctx.stroke();
    }
    text(ctx, ticket.recipe.name, x + 14, y + 17, 17, '#3e2723', 800, 'left');
    text(ctx, ticket.recipe.blurb, x + 14, y + 34, 11, '#8d6e63', 600, 'left');
    text(ctx, ticket.recipe.price + 'c', x + L.ticketW - 14, y + 17, 16, '#e65100', 800, 'right');
    // needed ingredients as mini icons with state dots
    let ix = x + 16;
    for (const need of ticket.recipe.needs) {
      const done = state.plate.some((p) => p.id === need && ['ready', 'cooked', 'perfect', 'chopped'].includes(p.state));
      ctx.globalAlpha = done ? 0.35 : 1;
      drawIngredient(ctx, need, ix + 14, y + 58, 26, 'ready');
      ctx.globalAlpha = 1;
      if (done) {
        ctx.fillStyle = '#7cb342';
        ctx.beginPath(); ctx.arc(ix + 24, y + 48, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ix + 21, y + 48); ctx.lineTo(ix + 24, y + 51); ctx.lineTo(ix + 28, y + 45); ctx.stroke();
      }
      ix += 36;
    }
    // patience bar
    rr(ctx, x + 14, y + L.ticketH - 10, L.ticketW - 28, 6, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fill();
    rr(ctx, x + 14, y + L.ticketH - 10, (L.ticketW - 28) * frac, 6, 3);
    ctx.fillStyle = frac > 0.5 ? '#7cb342' : frac > 0.25 ? '#ffb300' : '#e53935';
    ctx.fill();
  }
}

function drawBins(ctx, state) {
  const b = LAYOUT.bins;
  panel(ctx, { x: b.x - 8, y: b.y - 30, w: b.w + 16, h: b.h + 44 }, 'rgba(43,26,14,0.9)', '#8d6e63');
  stationTitle(ctx, b.x, b.y, 'INGREDIENTS', 'Click a bin — or press 1–9');
  for (let i = 0; i < BIN_ORDER.length; i++) {
    const id = BIN_ORDER[i];
    const col = i % b.cols, row = Math.floor(i / b.cols);
    const x = b.x + col * (b.cellW + b.gap);
    const y = b.y + row * (b.cellH + b.gap);
    rr(ctx, x, y, b.cellW, b.cellH, 10);
    ctx.fillStyle = '#fff3e0'; ctx.fill();
    ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 2; ctx.stroke();
    drawIngredient(ctx, id, x + b.cellW / 2, y + 38, 52, 'ready');
    text(ctx, INGREDIENTS[id].name, x + b.cellW / 2, y + 78, 13, '#4e342e', 700);
    const kind = INGREDIENTS[id].kind;
    const tag = kind === 'grill' ? '→ grill' : kind === 'chop' ? '→ chop' : '→ plate';
    text(ctx, tag, x + b.cellW / 2, y + 92, 10, '#a1887f', 600);
    rr(ctx, x + 4, y + 4, 20, 18, 5);
    ctx.fillStyle = '#6d4c41'; ctx.fill();
    text(ctx, String(i + 1), x + 14, y + 14, 11, '#fff', 800);
  }
}

function drawGrill(ctx, state, now) {
  const g = LAYOUT.grill;
  panel(ctx, { x: g.x - 8, y: g.y - 30, w: g.w + 16, h: g.h + 44 }, 'rgba(43,26,14,0.9)', '#8d6e63');
  stationTitle(ctx, g.x, g.y, 'GRILL', 'Click to place raw meat — grab it in the golden window');
  rr(ctx, g.x, g.y, g.w, g.h, 12);
  ctx.fillStyle = '#37474f'; ctx.fill();
  ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 3; ctx.stroke();
  // grate lines
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo(g.x + 10, g.y + (g.h / 6) * i); ctx.lineTo(g.x + g.w - 10, g.y + (g.h / 6) * i); ctx.stroke();
  }
  for (let s = 0; s < 2; s++) {
    const cx = g.x + g.w * (0.27 + 0.46 * s);
    const cy = g.y + g.h / 2 - 6;
    const item = state.grill[s];
    if (!item) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 52, 30, 0, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'empty', cx, cy, 13, 'rgba(255,255,255,0.75)', 700);
      continue;
    }
    // flames while cooking
    const flame = 0.5 + 0.5 * Math.sin(now / 130 + s * 2);
    ctx.fillStyle = `rgba(255,${140 + Math.floor(60 * flame)},0,${0.35 + 0.3 * flame})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 26, 46, 16 + 8 * flame, 0, 0, Math.PI * 2);
    ctx.fill();
    const t = item.t;
    let st = 'raw';
    if (t >= GRILL_BURN_AT) st = 'burnt';
    else if (t >= GRILL_PERFECT_FROM && t <= GRILL_PERFECT_TO) st = 'perfect';
    else if (t >= GRILL_SECONDS) st = 'cooked';
    drawIngredient(ctx, item.id, cx, cy, 84, st);
    // progress ring
    const frac = Math.min(1, t / GRILL_BURN_AT);
    ctx.beginPath();
    ctx.arc(cx, cy, 56, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = st === 'burnt' ? '#e53935' : st === 'perfect' ? '#ffd54f' : '#aeea00';
    ctx.lineWidth = 6; ctx.stroke();
    if (st === 'perfect') text(ctx, 'PERFECT — GRAB IT!', cx, cy - 66, 13, '#ffd54f', 800);
    else if (st === 'cooked') text(ctx, 'cooked — grab it!', cx, cy - 66, 12, '#aeea00', 700);
    else if (st === 'burnt') text(ctx, 'BURNT!', cx, cy - 66, 13, '#ff7043', 800);
    else text(ctx, 'cooking…', cx, cy - 66, 12, '#ffe0b2', 600);
  }
}

function drawChopBoard(ctx, state) {
  const b = LAYOUT.board2;
  panel(ctx, { x: b.x - 8, y: b.y - 30, w: b.w + 16, h: b.h + 44 }, 'rgba(43,26,14,0.9)', '#8d6e63');
  stationTitle(ctx, b.x, b.y, 'CHOPPING BOARD', 'Click 3 times to chop');
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = '#d7a86a'; ctx.fill();
  ctx.strokeStyle = '#a67c52'; ctx.lineWidth = 3; ctx.stroke();
  if (!state.board) {
    text(ctx, 'place a raw vegetable here', b.x + b.w / 2, b.y + b.h / 2, 14, 'rgba(78,52,46,0.75)', 600);
    return;
  }
  drawIngredient(ctx, state.board.id, b.x + 90, b.y + b.h / 2, 72, 'raw');
  for (let i = 0; i < CHOPS_NEEDED; i++) {
    const cx = b.x + 150 + i * 40;
    const cy = b.y + b.h / 2;
    ctx.fillStyle = i < state.board.chops ? '#7cb342' : 'rgba(78,52,46,0.35)';
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(i + 1), cx, cy + 1, 14, '#fff', 800);
  }
  text(ctx, 'click ×3', b.x + b.w - 16, b.y + b.h / 2, 13, '#4e342e', 700, 'right');
}

function drawPlate(ctx, state, now) {
  const p = LAYOUT.plate;
  const match = findMatchingTicket(state);
  panel(ctx, { x: p.x - 8, y: p.y - 30, w: p.w + 16, h: p.h + 44 }, 'rgba(43,26,14,0.9)', match ? '#7cb342' : '#8d6e63');
  stationTitle(ctx, p.x, p.y, 'ASSEMBLY PLATE', match ? '✓ matches an order — serve it!' : 'Click to stack what you hold');
  // plate dish
  ctx.fillStyle = '#eceff1';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + p.h - 42, 96, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + p.h - 46, 96, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + p.h - 48, 88, 17, 0, 0, Math.PI * 2); ctx.fill();
  if (!state.plate.length) {
    text(ctx, 'empty plate', p.x + p.w / 2, p.y + 90, 15, 'rgba(255,248,225,0.6)', 600);
  }
  // stacked layers, bottom-up
  const cx = p.x + p.w / 2;
  let y = p.y + p.h - 62;
  const items = [...state.plate].reverse();
  for (const item of items) {
    drawIngredient(ctx, item.id, cx, y, 92, item.state);
    y -= 34;
  }
  if (match) {
    const pulse = 0.6 + 0.4 * Math.sin(now / 200);
    ctx.globalAlpha = pulse;
    text(ctx, '✓ ' + match.recipe.name + ' ready!', cx, p.y + 34, 16, '#aeea00', 800);
    ctx.globalAlpha = 1;
  }
}

function drawServe(ctx, state, now) {
  const s = LAYOUT.serve;
  const match = findMatchingTicket(state);
  const pulse = match ? 0.75 + 0.25 * Math.sin(now / 160) : 1;
  panel(ctx, { x: s.x - 8, y: s.y - 30, w: s.w + 16, h: s.h + 44 }, 'rgba(43,26,14,0.9)', match ? '#7cb342' : '#8d6e63');
  stationTitle(ctx, s.x, s.y, 'SERVE WINDOW', 'Enter key works too');
  ctx.globalAlpha = pulse;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = match ? '#558b2f' : '#6d4c41'; ctx.fill();
  ctx.strokeStyle = match ? '#aeea00' : '#a1887f'; ctx.lineWidth = match ? 4 : 2; ctx.stroke();
  ctx.globalAlpha = 1;
  // service bell
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + 62, 34, Math.PI, 0); ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 34, s.y + 58, 68, 8);
  ctx.fillStyle = '#ffb300';
  ctx.beginPath(); ctx.arc(s.x + s.w / 2 + 38, s.y + 70, 6, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + 132, 30, '#fff', 900);
  text(ctx, match ? match.recipe.name : 'no matching order yet', s.x + s.w / 2, s.y + 162, 13, match ? '#dcedc8' : '#d7ccc8', 600);
}

function drawTrash(ctx, state) {
  const t = LAYOUT.trash;
  panel(ctx, { x: t.x - 8, y: t.y - 30, w: t.w + 16, h: t.h + 44 }, 'rgba(43,26,14,0.9)', '#8d6e63');
  stationTitle(ctx, t.x, t.y, 'TRASH', 'Clears hand, then plate');
  rr(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.fillStyle = '#455a64'; ctx.fill();
  ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2; ctx.stroke();
  // bin
  ctx.fillStyle = '#78909c';
  ctx.beginPath(); ctx.moveTo(t.x + 84, t.y + 26); ctx.lineTo(t.x + 156, t.y + 26); ctx.lineTo(t.x + 148, t.y + 92); ctx.lineTo(t.x + 92, t.y + 92); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#607d8b';
  ctx.fillRect(t.x + 78, t.y + 18, 84, 10);
  ctx.strokeStyle = '#455a64'; ctx.lineWidth = 3;
  for (const dx of [100, 120, 140]) {
    ctx.beginPath(); ctx.moveTo(t.x + dx, t.y + 36); ctx.lineTo(t.x + dx, t.y + 82); ctx.stroke();
  }
  text(ctx, 'TRASH', t.x + t.w - 16, t.y + 58, 18, '#eceff1', 800, 'right');
}

function drawHand(ctx, state) {
  const h = LAYOUT.hand;
  panel(ctx, h, 'rgba(43,26,14,0.9)', '#8d6e63');
  text(ctx, 'IN YOUR HAND', h.x + 16, h.y + 20, 13, '#ffb300', 800, 'left');
  if (!state.hand) {
    text(ctx, 'empty — grab an ingredient', h.x + h.w / 2, h.y + 58, 15, 'rgba(255,248,225,0.6)', 600);
    return;
  }
  drawIngredient(ctx, state.hand.id, h.x + 90, h.y + 52, 62, state.hand.state);
  text(ctx, INGREDIENTS[state.hand.id].name, h.x + 140, h.y + 42, 19, '#fff', 800, 'left');
  const label = { ready: 'ready to plate', raw: 'raw — grill or chop it', cooked: 'cooked', perfect: 'PERFECT!', chopped: 'chopped', burnt: 'burnt — trash it!' }[state.hand.state];
  text(ctx, label, h.x + 140, h.y + 68, 13, state.hand.state === 'burnt' ? '#ff7043' : state.hand.state === 'perfect' ? '#ffd54f' : '#ffe0b2', 700, 'left');
}

function drawHelp(ctx, state) {
  const h = LAYOUT.help;
  panel(ctx, h, 'rgba(43,26,14,0.9)', '#8d6e63');
  text(ctx, 'HOW TO PLAY', h.x + 16, h.y + 20, 13, '#ffb300', 800, 'left');
  const lines = [
    '1–9 grab ingredient   •   Click grill / board',
    'Click plate to stack   •   Enter serves',
    'P pause   •   M mute   •   Bksp trash',
  ];
  lines.forEach((l, i) => text(ctx, l, h.x + 16, h.y + 44 + i * 18, 12, '#ffe0b2', 600, 'left'));
}

function drawStats(ctx, state) {
  const s = LAYOUT.stats;
  panel(ctx, s, 'rgba(43,26,14,0.9)', '#8d6e63');
  text(ctx, 'SHIFT SO FAR', s.x + 16, s.y + 20, 13, '#ffb300', 800, 'left');
  text(ctx, `Served ${state.served}   •   Lost ${state.lost}   •   Best combo x${state.bestCombo}`, s.x + 16, s.y + 48, 14, '#fff', 700, 'left');
  text(ctx, `Perfect plates ${state.perfectServes}   •   ${state.coins} coins banked`, s.x + 16, s.y + 74, 13, '#ffe0b2', 600, 'left');
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    const a = 1 - f.t / f.life;
    ctx.globalAlpha = Math.max(0, a);
    text(ctx, f.text, f.x, f.y - f.t * 46, 22, f.color, 900);
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, state, now) {
  ctx.fillStyle = 'rgba(30,16,8,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // hero plate
  drawIngredient(ctx, 'bun', 640, 235, 150, 'ready');
  drawIngredient(ctx, 'patty', 640, 295, 150, 'perfect');
  drawIngredient(ctx, 'cheese', 640, 340, 150, 'ready');
  drawIngredient(ctx, 'lettuce', 640, 385, 150, 'chopped');
  const bob = Math.sin(now / 500) * 6;
  ctx.save();
  ctx.translate(0, bob);
  text(ctx, 'SIZZLE & SERVE', 640, 130, 72, '#ffb300', 900);
  ctx.restore();
  text(ctx, 'D A P U R   K I L A T', 640, 178, 24, '#ffe0b2', 700);
  text(ctx, 'The 3-minute kitchen rush: grill it, chop it, stack it, serve it.', 640, 470, 20, '#fff', 600);
  text(ctx, 'Orders pile up on the board — match the ticket, beat the clock,', 640, 500, 17, '#ffe0b2', 600);
  text(ctx, 'and keep the combo alive through rush hour.', 640, 524, 17, '#ffe0b2', 600);
  const pulse = 0.7 + 0.3 * Math.sin(now / 280);
  ctx.globalAlpha = pulse;
  rr(ctx, 490, 560, 300, 64, 32);
  ctx.fillStyle = '#e65100'; ctx.fill();
  ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, '▶  START SHIFT', 640, 593, 24, '#fff', 900);
  ctx.globalAlpha = 1;
  text(ctx, 'Mouse + keyboard  •  1–9 grab ingredients  •  Enter serves  •  P pause  •  M mute', 640, 670, 14, '#cbb59a', 600);
  text(ctx, 'A complete original cooking game — no network, no downloads, just you and the stove.', 640, 700, 13, '#8d6e63', 600);
}

function drawResults(ctx, state, now) {
  ctx.fillStyle = 'rgba(30,16,8,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT OVER!', 640, 150, 58, '#ffb300', 900);
  const stars = starsEarned(state);
  for (let i = 0; i < 3; i++) {
    const cx = 640 + (i - 1) * 110;
    const cy = 250;
    const lit = i < stars;
    const sc = lit ? 1 + 0.08 * Math.sin(now / 300 + i) : 1;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sc, sc);
    ctx.fillStyle = lit ? '#ffd54f' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? 52 : 22;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  text(ctx, state.coins + ' coins earned', 640, 350, 34, '#fff', 800);
  text(ctx, `${state.served} dishes served   •   ${state.lost} customers lost   •   best combo x${state.bestCombo}`, 640, 400, 19, '#ffe0b2', 600);
  text(ctx, `Perfect plates: ${state.perfectServes}`, 640, 432, 17, '#ffe0b2', 600);
  const verdict = stars === 3 ? 'Head chef material. The kitchen is yours.' : stars === 2 ? 'Solid shift — rush hour nearly had you.' : 'The stove wins this round. Run it back!';
  text(ctx, verdict, 640, 480, 18, '#aeea00', 700);
  const pulse = 0.7 + 0.3 * Math.sin(now / 280);
  ctx.globalAlpha = pulse;
  rr(ctx, 490, 540, 300, 60, 30);
  ctx.fillStyle = '#e65100'; ctx.fill();
  text(ctx, '↻  COOK AGAIN', 640, 571, 22, '#fff', 900);
  ctx.globalAlpha = 1;
  text(ctx, 'Click anywhere to return to the menu', 640, 640, 14, '#cbb59a', 600);
}

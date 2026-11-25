// shots.js — deterministic staged states for the entry screenshots.
// One clear job: given ?shot=start|play|serve|end, put the live game into
// that exact scene so a screenshot is a real render of the game's own code.
// The same states are reachable by playing; nothing here is a mock screen.

import { newGame, startShift } from './kitchen.js';
import { RECIPES } from './config.js';

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function applyShot(state, shot) {
  if (shot === 'start') {
    Object.assign(state, newGame(20261125));
    state.screen = 'title';
    return true;
  }
  if (shot === 'end') {
    Object.assign(state, newGame(20261125));
    state.screen = 'results';
    state.coins = 214;
    state.served = 14;
    state.lost = 2;
    state.bestCombo = 5;
    state.perfectServes = 6;
    return true;
  }
  if (shot === 'play' || shot === 'serve') {
    startShift(state);
    // A busy mid-shift: two tickets waiting, one almost out of patience.
    const [cheese, chicken, salad] = [
      { id: 101, recipe: recipeById('cheeseburger'), patience: 41, maxPatience: 62 },
      { id: 102, recipe: recipeById('chickenburger'), patience: 18, maxPatience: 62 },
      { id: 103, recipe: recipeById('garden salad'), patience: 52, maxPatience: 62 },
    ];
    state.tickets = [cheese, chicken, salad];
    state.timeLeft = 134;
    state.elapsed = 46;
    state.coins = 86;
    state.served = 5;
    state.combo = 3;
    state.bestCombo = 4;
    // Grill: a patty in the golden window, a chicken just put on.
    state.grill = [
      { id: 'patty', t: 9.2 },
      { id: 'chicken', t: 2.1 },
    ];
    // Board: tomato two chops in.
    state.board = { id: 'tomato', chops: 2 };
    if (shot === 'play') {
      // One dish mid-assembly: bun + cooked patty + cheese, lettuce in hand.
      state.plate = [
        { id: 'bun', state: 'ready' },
        { id: 'patty', state: 'cooked' },
        { id: 'cheese', state: 'ready' },
      ];
      state.hand = { id: 'lettuce', state: 'chopped' };
    } else {
      // The same cheeseburger finished: bun, perfect patty, cheese, chopped lettuce.
      state.plate = [
        { id: 'bun', state: 'ready' },
        { id: 'patty', state: 'perfect' },
        { id: 'cheese', state: 'ready' },
        { id: 'lettuce', state: 'chopped' },
      ];
      state.hand = null;
      state.flashServe = 1;
    }
    return true;
  }
  return false;
}

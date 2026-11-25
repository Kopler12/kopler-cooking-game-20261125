// config.js — every tunable number, ingredient and recipe of Sizzle & Serve.
// One clear job: the data that defines the game, no logic, no drawing.

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const SHIFT_SECONDS = 180;        // one full shift
export const MAX_TICKETS = 3;            // order board slots
export const ORDER_SPAWN_EVERY = 14;     // seconds between new orders (early shift)
export const ORDER_SPAWN_RUSH = 9;       // seconds between new orders (rush hour)
export const RUSH_AT_SECONDS_LEFT = 60;  // rush hour starts here
export const PATIENCE_SECONDS = 62;      // how long a ticket waits before walking out
export const PATIENCE_RUSH = 48;

export const GRILL_SECONDS = 7;          // patty / chicken on the grill until cooked
export const GRILL_PERFECT_FROM = 8;     // perfect window starts (seconds on grill)
export const GRILL_PERFECT_TO = 11;      // perfect window ends; cooked until burn
export const GRILL_BURN_AT = 12;         // left longer than this it burns
export const CHOPS_NEEDED = 3;           // clicks to chop one vegetable

export const BASE_PAY = 14;              // coins for a served dish
export const TIP_PER_PATIENCE = 10;      // extra coins scaled by patience left
export const PERFECT_BONUS = 6;          // coins when every cooked item was perfect
export const COMBO_STEP = 2;             // coins per combo level, capped
export const COMBO_CAP = 10;

// Ingredients: id, display name, kind, colour, where it lives.
export const INGREDIENTS = {
  bun:     { name: 'Bun',      kind: 'bin',    color: '#e8a94f', dark: '#b97a28' },
  patty:   { name: 'Patty',    kind: 'grill',  color: '#c96a4a', dark: '#8a3b26' },
  chicken: { name: 'Chicken',  kind: 'grill',  color: '#f2c14e', dark: '#c08a1d' },
  cheese:  { name: 'Cheese',   kind: 'bin',    color: '#ffd23e', dark: '#d9a400' },
  lettuce: { name: 'Lettuce',  kind: 'chop',   color: '#7dc242', dark: '#4a8a24' },
  tomato:  { name: 'Tomato',   kind: 'chop',   color: '#ef5350', dark: '#b71c1c' },
  onion:   { name: 'Onion',    kind: 'chop',   color: '#f3e5f5', dark: '#b39ddb' },
  rice:    { name: 'Rice',     kind: 'bin',    color: '#fff8e1', dark: '#d7ccc8' },
  egg:     { name: 'Egg',      kind: 'grill',  color: '#fff176', dark: '#f9a825' },
};

// Recipes: the dishes on the menu. `needs` lists ingredient ids; grilled and
// chopped items must be prepared first — that is the whole planning puzzle.
export const RECIPES = [
  {
    id: 'cheeseburger', name: 'Cheeseburger', price: 16,
    needs: ['bun', 'patty', 'cheese', 'lettuce'],
    blurb: 'The house classic',
  },
  {
    id: 'chickenburger', name: 'Chicken Burger', price: 18,
    needs: ['bun', 'chicken', 'tomato', 'lettuce'],
    blurb: 'Crispy, juicy, tall',
  },
  {
    id: 'garden salad', name: 'Garden Salad', price: 12,
    needs: ['lettuce', 'tomato', 'onion', 'cheese'],
    blurb: 'No grill, all chop',
  },
  {
    id: 'sunny rice', name: 'Sunny Rice', price: 15,
    needs: ['rice', 'egg', 'onion', 'tomato'],
    blurb: 'Fried egg on rice',
  },
  {
    id: 'double stack', name: 'Double Stack', price: 24,
    needs: ['bun', 'patty', 'patty', 'cheese', 'onion'],
    blurb: 'Two patties, one tower',
  },
];

// Keyboard shortcuts: number keys grab a bin ingredient straight to hand.
export const BIN_KEYS = ['bun', 'cheese', 'rice', 'lettuce', 'tomato', 'onion', 'patty', 'chicken', 'egg'];

// How many points each star needs on the results screen.
export const STAR_THRESHOLDS = [60, 120, 200];

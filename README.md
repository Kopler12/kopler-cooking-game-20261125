# Sizzle & Serve — Dapur Kilat

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Kopler12/kopler-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Kopler12/kopler-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game for the [best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) on make.fun. It runs in a desktop browser from static files, with no network request — open `game/index.html` and play.

## The game

You run a tiny kitchen through a 3-minute shift. Orders land on the board with a patience bar. Grab ingredients from the bins, grill patties, chicken and eggs on the stove (pull them off in the golden window for a perfect sear — leave them and they burn), chop vegetables on the board, stack the dish on the assembly plate, and ring the bell to serve before the customer walks out.

- **5 recipes** — Cheeseburger, Chicken Burger, Garden Salad, Sunny Rice, Double Stack — each a different route through the kitchen: grill, chop, or both.
- **Real pressure** — patience drains, walk-outs reset your combo, and the last minute is rush hour: faster orders, shorter tempers.
- **Feel** — a golden perfect window on the grill, combo bonuses, tips scaled by patience left, synthesized sizzle/chop/ding sounds (WebAudio, no files), and floating coin feedback.
- **Keyboard + mouse** — click everything, or press 1–9 to grab ingredients, Enter to serve, Backspace to trash, P to pause, M to mute.

## Play it

Serve the game folder with any static server and open it in desktop Chrome, for example:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

Screenshots are staged with `?shot=start|play|serve|end` — real renders of the game's own code in a fixed scene. `?selftest=1` runs the logic checks and reports in the document title.

## Layout

- `game/index.html` — the page shell
- `game/src/main.js` — canvas setup, loop, keyboard + mouse
- `game/src/kitchen.js` — game state and rules: orders, grill, chopping, serving, scoring
- `game/src/render.js` — all canvas drawing, including the vector food art
- `game/src/config.js` — tuning, ingredients, recipes
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/shots.js` — deterministic staged scenes for screenshots
- `main.ts` — the make.fun entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — 4 real renders of the game

Everything is original: the idea, the art, the sounds, and the names. No libraries, no network, no copied assets.

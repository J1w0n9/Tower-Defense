# Vue GameCanvas Scaffold — Design

## Context

The project's previous React-based scaffold (`package.json`, `index.html`,
`vite.config.ts`, `tsconfig.json`, all of `src/`) has been deleted from the
working tree (staged, uncommitted). Per user decision, this deletion is kept
as-is and the project restarts fresh using Vue instead of React.

The original `GameCanvas.tsx` (React) rendered game state onto a `<canvas>`
using plain Canvas 2D API calls in `render/Renderer.ts` — no canvas
framework (Pixi/Three/Konva) was ever used, only React for component
lifecycle and event binding. This design ports that one component to Vue.

## Goals

- Stand up a minimal, working Vue + Vite + TypeScript project from scratch.
- Port `GameCanvas` to a Vue SFC (`GameCanvas.vue`) with equivalent
  behavior: RAF-driven render loop, click-to-place-tower handling.
- Define a minimal type contract for the game engine so `GameCanvas.vue`
  compiles and is testable without porting real engine logic.
- Provide a small runnable demo (`App.vue`) so `npm run dev` shows a moving
  mock scene.
- Cover `GameCanvas.vue` with Vitest + `@vue/test-utils` tests.

## Non-goals (deferred)

- Restoring the real game engine (`GameEngine`, `Tower`, `Enemy`,
  `WaveManager`, `Economy`, `EventEmitter`, `Projectile`, `waveGenerator`,
  `maps`, `path`, `vector`, `towers`, `enemies`) and `SaveService`. These
  stay out of scope until a follow-up task explicitly restores them.
- Testing the RAF render loop itself (i.e., asserting `update`/`getSnapshot`
  get called per frame). Only mount rendering and click behavior are tested.
- Any styling/visual polish beyond a bare `<canvas>` element.

## Architecture

```
index.html            → mounts #app, loads /src/main.ts
src/main.ts            → createApp(App).mount('#app')
src/App.vue             → demo: owns a moving mock engine + a fixed
                           MapDefinition, renders <GameCanvas>
src/components/
  GameCanvas.vue        → the ported component
  GameCanvas.test.ts    → Vitest + @vue/test-utils tests
src/engine/
  types.ts              → MapDefinition and supporting geometry types
                           (ported unchanged from HEAD commit)
  GameEngine.ts          → TYPE-ONLY contract: EngineSnapshot,
                           PlaceTowerResult, GameEngine interface.
                           No implementation — this is the seam a future
                           task fills in with the real engine class.
src/render/
  Renderer.ts            → drawGame(ctx, map, snapshot) ported unchanged
                           from HEAD commit (pure Canvas 2D, no deps on
                           React/Vue)
```

## Component contract: `GameCanvas.vue`

Props:
- `map: MapDefinition`
- `engine: GameEngine`
- `selectedTowerId: string | null`

Emits:
- `placement-result: [result: PlaceTowerResult]` — replaces React's
  `onPlacementResult` callback prop.

Behavior (via `<script setup lang="ts">`):
- `onMounted`: start a `requestAnimationFrame` loop; each frame calls
  `engine.update(dt)` then `drawGame(ctx, map, engine.getSnapshot())`.
- `onUnmounted`: `cancelAnimationFrame` to stop the loop.
- `@click` on the canvas: if `selectedTowerId` is set, convert the click's
  page coordinates to a grid cell using `map.cellSize`, call
  `engine.placeTower(cell, selectedTowerId)`, and emit `placement-result`
  with the returned value.

## Type contract

```ts
// src/engine/GameEngine.ts
export interface PlaceTowerResult {
  success: boolean;
  reason?: string;
}

export interface EngineSnapshot {
  towers: { position: { x: number; y: number } }[];
  enemies: { position: { x: number; y: number }; hpFraction: number }[];
}

export interface GameEngine {
  update(dt: number): void;
  getSnapshot(): EngineSnapshot;
  placeTower(cell: { x: number; y: number }, towerId: string): PlaceTowerResult;
}
```

`MapDefinition` in `src/engine/types.ts` is ported unchanged from the HEAD
commit (`cellSize`, `gridWidth`, `gridHeight`, `path`, `buildableTiles`).

This is a plain interface, not a class — any object satisfying the shape
(a real engine, or a demo mock) can be passed as the `engine` prop.

## Demo (`App.vue`)

A small mock object implementing the `GameEngine` interface:
- `getSnapshot()` returns one tower and one enemy.
- `update(dt)` advances the enemy's position along a straight line each
  call (wrapping around), so the render loop visibly animates something on
  `npm run dev` — not just a static frame.
- `placeTower()` returns `{ success: true }` unconditionally.

A fixed small `MapDefinition` (e.g. 10x10 grid, a short 2-3 point path)
is hardcoded in `App.vue` for the demo.

## Testing

- Vitest + `@vue/test-utils`, environment `jsdom`.
- `GameCanvas.test.ts` covers:
  - mounting renders a `<canvas>` element sized from `map`.
  - clicking the canvas with a `selectedTowerId` set calls
    `engine.placeTower` with the correct cell coordinates and emits
    `placement-result` with the mock's return value.
  - clicking with `selectedTowerId === null` does not call `placeTower`.
- The RAF loop itself is not asserted in tests (per scope decision above).

## Tooling / versions

Package manager: npm.

| package | version |
|---|---|
| vue | ^3.5.42 |
| vite | ^8.2.2 |
| @vitejs/plugin-vue | ^6.0.8 |
| vitest | ^5.0.0 |
| @vue/test-utils | ^2.5.0 |
| typescript | ^7.0.2 |
| vue-tsc | ^3.3.11 |
| jsdom | ^30.0.1 |

`package.json` scripts:
- `dev`: `vite`
- `build`: `vue-tsc -b && vite build`
- `test`: `vitest run`

`tsconfig.json` carries forward the ES2022 lib requirement noted in the
original project's fix commit (needed for `Array.prototype.at` to
type-check).

## Follow-up (out of scope here)

- Restore the real engine (`GameEngine` implementation and its
  dependencies) behind the `GameEngine` interface defined here.
- Restore `SaveService` (persistence).
- Wire `App.vue` to the real engine instead of the demo mock, once
  restored.

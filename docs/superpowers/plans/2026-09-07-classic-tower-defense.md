# 클래식 타워 디펜스 웹게임 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 브라우저에서 동작하는 클래식 타워 디펜스 웹게임(맵 3개, 타워 5종, 적 6종+보스)을 React + Canvas로 구현한다.

**Architecture:** DOM/React에 의존하지 않는 순수 TypeScript 게임 엔진(`src/engine/**`)이 시뮬레이션 전체를 소유하고, 얇은 Canvas 렌더러가 매 프레임 엔진 상태를 그림. React는 HUD/상점/모달 등 UI 셸만 담당하며 이벤트 구독으로만 엔진과 통신한다.

**Tech Stack:** Vite, React 18, TypeScript (strict), Vitest, @testing-library/react

**Spec:** `docs/superpowers/specs/2026-09-07-classic-tower-defense-design.md`

## Global Constraints

- 이미지/스프라이트 에셋 사용 금지 — 모든 렌더링은 캔버스 도형(arc, rect, line)으로만 구현한다.
- 저장은 `localStorage`만 사용하고 반드시 `SaveService` 인터페이스 뒤에 감춘다 (나중에 백엔드로 교체 가능하도록).
- `src/engine/**` 아래 코드는 React나 DOM API(`window`, `document`, canvas 등)를 import하지 않는다. 순수 TypeScript만 사용해 유닛 테스트가 DOM 없이 돌아가야 한다.
- 테스트 러너는 Vitest, 컴포넌트 테스트는 @testing-library/react를 사용한다.
- 그리드 좌표계는 두 가지를 혼용하지 않는다: 타워 위치/설치 가능 타일은 **정수 셀 인덱스** `{x, y}`, 경로/적 위치는 **셀 중심 좌표** `{x: n+0.5, y: m+0.5}`. 모든 태스크에서 이 규칙을 지킨다.

---

### Task 0: 프로젝트 스캐폴드 (Vite + React + TS + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/setupTests.ts`, `src/main.tsx`, `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App` React 컴포넌트 (다른 태스크에서 최종적으로 교체됨, Task 14에서 실제 구현으로 대체)

- [ ] **Step 1: 설정 파일 작성**

`package.json`:
```json
{
  "name": "tower-defense",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vitest": "^2.1.3"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
```

`index.html`:
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>타워 디펜스</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/setupTests.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 2: 의존성 설치**

Run: `npm install`

- [ ] **Step 3: 실패하는 스모크 테스트 작성**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('타워 디펜스 로딩 중...')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (`src/App.tsx` 모듈이 없음)

- [ ] **Step 5: App.tsx 최소 구현**

`src/App.tsx`:
```tsx
export function App() {
  return <div>타워 디펜스 로딩 중...</div>;
}
```

- [ ] **Step 6: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/
git commit -m "chore: scaffold vite+react+ts project with vitest"
```

---

### Task 1: 공용 타입, 이벤트 이미터, 벡터 유틸

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/EventEmitter.ts`
- Create: `src/engine/vector.ts`
- Test: `src/engine/EventEmitter.test.ts`
- Test: `src/engine/vector.test.ts`

**Interfaces:**
- Produces: `Point`, `TargetingStrategy`, `TowerStats`, `EnemyStats`, `WaveSpawn`, `WaveDefinition`, `MapDefinition`, `GameStatus`, `GameEventMap` (types.ts) — used by every later engine task
- Produces: `EventEmitter<EventMap>` with `on(event, listener): unsubscribe`, `off(event, listener)`, `emit(event, payload)`
- Produces: `distance`, `add`, `subtract`, `scale`, `normalize` (vector.ts)

- [ ] **Step 1: types.ts 작성 (테스트 불필요, 순수 타입 선언)**

`src/engine/types.ts`:
```ts
export interface Point {
  x: number;
  y: number;
}

export type TargetingStrategy = 'first' | 'closest' | 'strongest';

export interface TowerStats {
  id: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  targeting: TargetingStrategy;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
}

export interface EnemyStats {
  id: string;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  damageReduction?: number;
  isBoss?: boolean;
}

export interface WaveSpawn {
  enemyId: string;
  count: number;
  spawnIntervalSec: number;
}

export interface WaveDefinition {
  waveNumber: number;
  spawns: WaveSpawn[];
}

export interface MapDefinition {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  path: Point[];
  buildableTiles: Point[];
  waves: WaveDefinition[];
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface WaveChangedPayload {
  current: number;
  total: number;
}

export interface GameEventMap {
  'gold-changed': number;
  'lives-changed': number;
  'wave-changed': WaveChangedPayload;
  'status-changed': GameStatus;
  [key: string]: unknown;
}
```

- [ ] **Step 2: EventEmitter 실패하는 테스트 작성**

`src/engine/EventEmitter.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from './EventEmitter';

interface TestEvents {
  ping: number;
  [key: string]: unknown;
}

describe('EventEmitter', () => {
  it('calls a subscribed listener with the emitted payload', () => {
    const emitter = new EventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('ping', listener);

    emitter.emit('ping', 42);

    expect(listener).toHaveBeenCalledWith(42);
  });

  it('stops calling a listener after off() is used', () => {
    const emitter = new EventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('ping', listener);
    emitter.off('ping', listener);

    emitter.emit('ping', 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling a listener after the unsubscribe function is invoked', () => {
    const emitter = new EventEmitter<TestEvents>();
    const listener = vi.fn();
    const unsubscribe = emitter.on('ping', listener);
    unsubscribe();

    emitter.emit('ping', 1);

    expect(listener).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run src/engine/EventEmitter.test.ts`
Expected: FAIL (`./EventEmitter` 모듈 없음)

- [ ] **Step 4: EventEmitter 구현**

`src/engine/EventEmitter.ts`:
```ts
type Listener<T> = (payload: T) => void;

export class EventEmitter<EventMap extends Record<string, unknown>> {
  private listeners = new Map<keyof EventMap, Listener<unknown>[]>();

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    const arr = this.listeners.get(event) ?? [];
    arr.push(listener as Listener<unknown>);
    this.listeners.set(event, arr);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    this.listeners.set(
      event,
      arr.filter((l) => l !== (listener as Listener<unknown>))
    );
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    for (const listener of [...arr]) {
      (listener as Listener<EventMap[K]>)(payload);
    }
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/engine/EventEmitter.test.ts`
Expected: PASS

- [ ] **Step 6: vector 유틸 실패하는 테스트 작성**

`src/engine/vector.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { add, distance, normalize, scale, subtract } from './vector';

describe('vector utils', () => {
  it('computes euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('subtracts two points', () => {
    expect(subtract({ x: 5, y: 5 }, { x: 2, y: 1 })).toEqual({ x: 3, y: 4 });
  });

  it('adds two points', () => {
    expect(add({ x: 1, y: 1 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
  });

  it('scales a vector by a factor', () => {
    expect(scale({ x: 2, y: 3 }, 2)).toEqual({ x: 4, y: 6 });
  });

  it('normalizes a vector to unit length', () => {
    const result = normalize({ x: 3, y: 4 });
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
  });

  it('normalizes a zero vector to zero without dividing by zero', () => {
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 7: 테스트 실패 확인**

Run: `npx vitest run src/engine/vector.test.ts`
Expected: FAIL

- [ ] **Step 8: vector 유틸 구현**

`src/engine/vector.ts`:
```ts
import type { Point } from './types';

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(v: Point, factor: number): Point {
  return { x: v.x * factor, y: v.y * factor };
}

export function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}
```

- [ ] **Step 9: 테스트 통과 확인**

Run: `npx vitest run src/engine/vector.test.ts`
Expected: PASS

- [ ] **Step 10: 커밋**

```bash
git add src/engine/types.ts src/engine/EventEmitter.ts src/engine/EventEmitter.test.ts src/engine/vector.ts src/engine/vector.test.ts
git commit -m "feat: add shared types, event emitter, vector utils"
```

---

### Task 2: 경로 유틸 + 맵 정의 3개

**Files:**
- Create: `src/engine/path.ts`
- Create: `src/engine/waveGenerator.ts`
- Create: `src/engine/maps.ts`
- Test: `src/engine/path.test.ts`
- Test: `src/engine/waveGenerator.test.ts`
- Test: `src/engine/maps.test.ts`

**Interfaces:**
- Consumes: `Point`, `MapDefinition`, `WaveDefinition` (Task 1)
- Produces: `getPathLength(path)`, `getPositionAtDistance(path, distance)`, `distanceToPath(point, path)`, `computeBuildableTiles(gridWidth, gridHeight, path)` (path.ts)
- Produces: `buildWaveList(enemyPool, waveCount, bossId)` (waveGenerator.ts)
- Produces: `MAPS: MapDefinition[]` (maps.ts) — consumed by GameEngine (Task 8) and UI (Task 11-14)

- [ ] **Step 1: path.ts 실패하는 테스트 작성**

`src/engine/path.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { computeBuildableTiles, distanceToPath, getPathLength, getPositionAtDistance } from './path';

const SIMPLE_PATH = [
  { x: 0.5, y: 0.5 },
  { x: 3.5, y: 0.5 },
  { x: 3.5, y: 3.5 },
];

describe('getPathLength', () => {
  it('sums the length of every segment', () => {
    expect(getPathLength(SIMPLE_PATH)).toBe(6);
  });
});

describe('getPositionAtDistance', () => {
  it('returns the start point at distance 0', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 0)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('returns a point partway along the first segment', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 1.5)).toEqual({ x: 2, y: 0.5 });
  });

  it('returns a point on the second segment after crossing the first', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 4)).toEqual({ x: 3.5, y: 1.5 });
  });

  it('clamps to the final point when distance exceeds path length', () => {
    expect(getPositionAtDistance(SIMPLE_PATH, 100)).toEqual({ x: 3.5, y: 3.5 });
  });
});

describe('distanceToPath', () => {
  it('returns 0 for a point on the path', () => {
    expect(distanceToPath({ x: 2, y: 0.5 }, SIMPLE_PATH)).toBe(0);
  });

  it('returns the perpendicular distance for a point off the path', () => {
    expect(distanceToPath({ x: 2, y: 2.5 }, SIMPLE_PATH)).toBe(2);
  });
});

describe('computeBuildableTiles', () => {
  it('excludes tiles whose center is within 1 unit of the path', () => {
    const tiles = computeBuildableTiles(5, 5, SIMPLE_PATH);
    expect(tiles).not.toContainEqual({ x: 1, y: 0 });
    expect(tiles).toContainEqual({ x: 0, y: 4 });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/engine/path.test.ts`
Expected: FAIL

- [ ] **Step 3: path.ts 구현**

`src/engine/path.ts`:
```ts
import type { Point } from './types';
import { distance } from './vector';

export function getPathLength(path: Point[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distance(path[i - 1], path[i]);
  }
  return total;
}

export function getPositionAtDistance(path: Point[], targetDistance: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  let remaining = targetDistance;
  for (let i = 1; i < path.length; i++) {
    const segStart = path[i - 1];
    const segEnd = path[i];
    const segLength = distance(segStart, segEnd);
    if (remaining <= segLength) {
      const t = segLength === 0 ? 0 : remaining / segLength;
      return {
        x: segStart.x + (segEnd.x - segStart.x) * t,
        y: segStart.y + (segEnd.y - segStart.y) * t,
      };
    }
    remaining -= segLength;
  }
  return path[path.length - 1];
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;
  let t = lengthSquared === 0 ? 0 : ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  const closest = { x: a.x + abx * t, y: a.y + aby * t };
  return distance(p, closest);
}

export function distanceToPath(point: Point, path: Point[]): number {
  let min = Infinity;
  for (let i = 1; i < path.length; i++) {
    const d = pointToSegmentDistance(point, path[i - 1], path[i]);
    if (d < min) min = d;
  }
  return min;
}

export function computeBuildableTiles(gridWidth: number, gridHeight: number, path: Point[]): Point[] {
  const tiles: Point[] = [];
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const cellCenter = { x: x + 0.5, y: y + 0.5 };
      if (distanceToPath(cellCenter, path) >= 1.0) {
        tiles.push({ x, y });
      }
    }
  }
  return tiles;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/engine/path.test.ts`
Expected: PASS

- [ ] **Step 5: waveGenerator 실패하는 테스트 작성**

`src/engine/waveGenerator.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildWaveList } from './waveGenerator';

describe('buildWaveList', () => {
  it('creates one wave per waveCount plus a final boss wave', () => {
    const waves = buildWaveList(['scout', 'grunt'], 3, 'boss');
    expect(waves).toHaveLength(4);
    expect(waves[3].spawns).toEqual([{ enemyId: 'boss', count: 1, spawnIntervalSec: 1 }]);
  });

  it('cycles through the enemy pool and increases enemy count each wave', () => {
    const waves = buildWaveList(['scout', 'grunt'], 4, 'boss');
    expect(waves[0].spawns[0].enemyId).toBe('scout');
    expect(waves[1].spawns[0].enemyId).toBe('grunt');
    expect(waves[2].spawns[0].enemyId).toBe('scout');
    expect(waves[1].spawns[0].count).toBeGreaterThan(waves[0].spawns[0].count);
  });

  it('numbers waves starting at 1', () => {
    const waves = buildWaveList(['scout'], 2, 'boss');
    expect(waves.map((w) => w.waveNumber)).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `npx vitest run src/engine/waveGenerator.test.ts`
Expected: FAIL

- [ ] **Step 7: waveGenerator 구현**

`src/engine/waveGenerator.ts`:
```ts
import type { WaveDefinition } from './types';

export function buildWaveList(enemyPool: string[], waveCount: number, bossId: string): WaveDefinition[] {
  const waves: WaveDefinition[] = [];
  for (let i = 0; i < waveCount; i++) {
    const enemyId = enemyPool[i % enemyPool.length];
    const count = 5 + i * 2;
    waves.push({ waveNumber: i + 1, spawns: [{ enemyId, count, spawnIntervalSec: 0.8 }] });
  }
  waves.push({
    waveNumber: waveCount + 1,
    spawns: [{ enemyId: bossId, count: 1, spawnIntervalSec: 1 }],
  });
  return waves;
}
```

- [ ] **Step 8: 테스트 통과 확인**

Run: `npx vitest run src/engine/waveGenerator.test.ts`
Expected: PASS

- [ ] **Step 9: maps.ts 실패하는 테스트 작성**

`src/engine/maps.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { MAPS } from './maps';

describe('MAPS', () => {
  it('defines exactly 3 maps with unique ids', () => {
    expect(MAPS).toHaveLength(3);
    expect(new Set(MAPS.map((m) => m.id)).size).toBe(3);
  });

  it('gives every map at least one wave plus a boss wave', () => {
    for (const map of MAPS) {
      expect(map.waves.length).toBeGreaterThan(1);
      expect(map.waves.at(-1)?.spawns[0].enemyId).toBe('boss');
    }
  });

  it('keeps every map path fully inside its grid bounds', () => {
    for (const map of MAPS) {
      for (const point of map.path) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(map.gridWidth);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(map.gridHeight);
      }
    }
  });

  it('gives every map at least one buildable tile', () => {
    for (const map of MAPS) {
      expect(map.buildableTiles.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 10: 테스트 실패 확인**

Run: `npx vitest run src/engine/maps.test.ts`
Expected: FAIL

- [ ] **Step 11: maps.ts 구현**

`src/engine/maps.ts`:
```ts
import { computeBuildableTiles } from './path';
import type { MapDefinition } from './types';
import { buildWaveList } from './waveGenerator';

const MEADOW_PATH = [
  { x: 0.5, y: 5.5 },
  { x: 6.5, y: 5.5 },
  { x: 6.5, y: 1.5 },
  { x: 12.5, y: 1.5 },
  { x: 12.5, y: 8.5 },
  { x: 15.5, y: 8.5 },
];

const CANYON_PATH = [
  { x: 0.5, y: 1.5 },
  { x: 3.5, y: 1.5 },
  { x: 3.5, y: 9.5 },
  { x: 9.5, y: 9.5 },
  { x: 9.5, y: 3.5 },
  { x: 14.5, y: 3.5 },
  { x: 14.5, y: 10.5 },
  { x: 17.5, y: 10.5 },
];

const FORTRESS_PATH = [
  { x: 0.5, y: 6.5 },
  { x: 4.5, y: 6.5 },
  { x: 4.5, y: 1.5 },
  { x: 9.5, y: 1.5 },
  { x: 9.5, y: 9.5 },
  { x: 14.5, y: 9.5 },
  { x: 14.5, y: 4.5 },
  { x: 19.5, y: 4.5 },
];

const MEADOW: MapDefinition = {
  id: 'meadow',
  name: '초원 경로',
  gridWidth: 16,
  gridHeight: 10,
  cellSize: 40,
  path: MEADOW_PATH,
  buildableTiles: computeBuildableTiles(16, 10, MEADOW_PATH),
  waves: buildWaveList(['scout', 'grunt', 'runner'], 8, 'boss'),
};

const CANYON: MapDefinition = {
  id: 'canyon',
  name: '협곡 경로',
  gridWidth: 18,
  gridHeight: 12,
  cellSize: 40,
  path: CANYON_PATH,
  buildableTiles: computeBuildableTiles(18, 12, CANYON_PATH),
  waves: buildWaveList(['runner', 'shielded', 'swarm', 'grunt'], 10, 'boss'),
};

const FORTRESS: MapDefinition = {
  id: 'fortress',
  name: '요새 경로',
  gridWidth: 20,
  gridHeight: 12,
  cellSize: 40,
  path: FORTRESS_PATH,
  buildableTiles: computeBuildableTiles(20, 12, FORTRESS_PATH),
  waves: buildWaveList(['grunt', 'tank', 'shielded', 'swarm', 'runner'], 12, 'boss'),
};

export const MAPS: MapDefinition[] = [MEADOW, CANYON, FORTRESS];
```

- [ ] **Step 12: 테스트 통과 확인**

Run: `npx vitest run src/engine/maps.test.ts`
Expected: PASS

- [ ] **Step 13: 커밋**

```bash
git add src/engine/path.ts src/engine/path.test.ts src/engine/waveGenerator.ts src/engine/waveGenerator.test.ts src/engine/maps.ts src/engine/maps.test.ts
git commit -m "feat: add path utilities, wave generator, and 3 map definitions"
```

---

### Task 3: 적(Enemy) 스탯 테이블 + Enemy 클래스

**Files:**
- Create: `src/engine/enemies.ts`
- Create: `src/engine/Enemy.ts`
- Test: `src/engine/Enemy.test.ts`

**Interfaces:**
- Consumes: `EnemyStats` (Task 1)
- Produces: `ENEMY_LIST: EnemyStats[]`, `ENEMIES_BY_ID: Record<string, EnemyStats>` (enemies.ts) — consumed by GameEngine (Task 8)
- Produces: `Enemy` class with `id`, `statsId`, `maxHp`, `hp`, `reward`, `baseSpeed`, `damageReduction`, `isBoss`, `distanceTraveled`, getters `speed`, `isDead`, `hpFraction`, methods `applySlow(factor, duration)`, `takeDamage(amount)`, `advance(dt)` — consumed by Tower.findTarget (Task 4), GameEngine (Task 8)

- [ ] **Step 1: enemies.ts 작성 (데이터 테이블, 테스트 불필요)**

`src/engine/enemies.ts`:
```ts
import type { EnemyStats } from './types';

export const ENEMY_LIST: EnemyStats[] = [
  { id: 'scout', name: '스카우트', hp: 20, speed: 2.5, reward: 5 },
  { id: 'grunt', name: '그런트', hp: 50, speed: 1.5, reward: 8 },
  { id: 'runner', name: '러너', hp: 15, speed: 3.5, reward: 6 },
  { id: 'tank', name: '탱크', hp: 150, speed: 0.8, reward: 20 },
  { id: 'shielded', name: '실드병', hp: 80, speed: 1.2, reward: 15, damageReduction: 0.3 },
  { id: 'swarm', name: '스웜', hp: 10, speed: 2, reward: 3 },
  { id: 'boss', name: '보스', hp: 800, speed: 0.6, reward: 100, isBoss: true },
];

export const ENEMIES_BY_ID: Record<string, EnemyStats> = Object.fromEntries(
  ENEMY_LIST.map((enemy) => [enemy.id, enemy])
);
```

- [ ] **Step 2: Enemy 실패하는 테스트 작성**

`src/engine/Enemy.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';

describe('Enemy', () => {
  it('starts at full hp and not dead', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.grunt);
    expect(enemy.hp).toBe(50);
    expect(enemy.isDead).toBe(false);
    expect(enemy.hpFraction).toBe(1);
  });

  it('advances distanceTraveled based on speed and dt', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.scout);
    enemy.advance(2);
    expect(enemy.distanceTraveled).toBe(5);
  });

  it('reduces incoming damage by damageReduction', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.shielded);
    enemy.takeDamage(10);
    expect(enemy.hp).toBe(80 - 7);
  });

  it('becomes dead once hp drops to 0 or below', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.scout);
    enemy.takeDamage(100);
    expect(enemy.isDead).toBe(true);
  });

  it('moves at reduced speed while slowed, then returns to base speed', () => {
    const enemy = new Enemy('e1', ENEMIES_BY_ID.grunt);
    enemy.applySlow(0.5, 1);
    expect(enemy.speed).toBe(0.75);
    enemy.advance(1.5);
    expect(enemy.speed).toBe(1.5);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run src/engine/Enemy.test.ts`
Expected: FAIL

- [ ] **Step 4: Enemy 클래스 구현**

`src/engine/Enemy.ts`:
```ts
import type { EnemyStats } from './types';

export class Enemy {
  readonly id: string;
  readonly statsId: string;
  readonly maxHp: number;
  readonly reward: number;
  readonly baseSpeed: number;
  readonly damageReduction: number;
  readonly isBoss: boolean;
  hp: number;
  distanceTraveled = 0;
  private slowTimeRemaining = 0;
  private slowFactor = 0;

  constructor(id: string, stats: EnemyStats) {
    this.id = id;
    this.statsId = stats.id;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.reward = stats.reward;
    this.baseSpeed = stats.speed;
    this.damageReduction = stats.damageReduction ?? 0;
    this.isBoss = stats.isBoss ?? false;
  }

  get speed(): number {
    return this.slowTimeRemaining > 0 ? this.baseSpeed * (1 - this.slowFactor) : this.baseSpeed;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  get hpFraction(): number {
    return Math.max(0, this.hp / this.maxHp);
  }

  applySlow(factor: number, duration: number): void {
    this.slowFactor = factor;
    this.slowTimeRemaining = duration;
  }

  takeDamage(amount: number): void {
    this.hp -= amount * (1 - this.damageReduction);
  }

  advance(dt: number): void {
    this.distanceTraveled += this.speed * dt;
    if (this.slowTimeRemaining > 0) {
      this.slowTimeRemaining = Math.max(0, this.slowTimeRemaining - dt);
    }
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/engine/Enemy.test.ts`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/engine/enemies.ts src/engine/Enemy.ts src/engine/Enemy.test.ts
git commit -m "feat: add enemy stats table and Enemy class"
```

---

### Task 4: 타워(Tower) 스탯 테이블 + Tower 클래스 (타게팅)

**Files:**
- Create: `src/engine/towers.ts`
- Create: `src/engine/Tower.ts`
- Test: `src/engine/Tower.test.ts`

**Interfaces:**
- Consumes: `TowerStats`, `Point` (Task 1), `Enemy` (Task 3), `distance` (Task 1 vector.ts)
- Produces: `TOWER_LIST: TowerStats[]`, `TOWERS_BY_ID: Record<string, TowerStats>` (towers.ts) — consumed by GameEngine (Task 8), TowerShop (Task 13)
- Produces: `Tower` class with `id`, `stats`, `position`, `level`, getters `centerPosition`, `range`, `damage`, `upgradeCost`, `canFire`, methods `canUpgrade()`, `upgrade()`, `isInRange(pos)`, `tick(dt)`, `resetCooldown()`, `findTarget(candidates)` — consumed by GameEngine (Task 8)
- Produces: `TargetCandidate` interface `{ enemy: Enemy; position: Point }`

- [ ] **Step 1: towers.ts 작성 (데이터 테이블, 테스트 불필요)**

`src/engine/towers.ts`:
```ts
import type { TowerStats } from './types';

export const TOWER_LIST: TowerStats[] = [
  { id: 'basic', name: '기본 터렛', cost: 50, range: 3, damage: 10, fireRate: 1, projectileSpeed: 8, targeting: 'first' },
  { id: 'sniper', name: '저격 타워', cost: 100, range: 6, damage: 35, fireRate: 0.5, projectileSpeed: 12, targeting: 'strongest' },
  { id: 'rapid', name: '속사 타워', cost: 75, range: 2.5, damage: 4, fireRate: 4, projectileSpeed: 10, targeting: 'first' },
  {
    id: 'splash',
    name: '스플래시 캐논',
    cost: 120,
    range: 2.5,
    damage: 15,
    fireRate: 0.7,
    projectileSpeed: 6,
    targeting: 'closest',
    splashRadius: 1.2,
  },
  {
    id: 'slow',
    name: '슬로우 타워',
    cost: 90,
    range: 3,
    damage: 2,
    fireRate: 1,
    projectileSpeed: 8,
    targeting: 'first',
    slowFactor: 0.5,
    slowDuration: 2,
  },
];

export const TOWERS_BY_ID: Record<string, TowerStats> = Object.fromEntries(
  TOWER_LIST.map((tower) => [tower.id, tower])
);
```

- [ ] **Step 2: Tower 실패하는 테스트 작성**

`src/engine/Tower.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';
import { Tower } from './Tower';
import { TOWERS_BY_ID } from './towers';

function makeCandidate(id: string, statsId: string, distanceTraveled: number, position: { x: number; y: number }) {
  const enemy = new Enemy(id, ENEMIES_BY_ID[statsId]);
  enemy.distanceTraveled = distanceTraveled;
  return { enemy, position };
}

describe('Tower', () => {
  it('reports its center position as the middle of its grid cell', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 2, y: 3 });
    expect(tower.centerPosition).toEqual({ x: 2.5, y: 3.5 });
  });

  it('increases range and damage with each upgrade level', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    const baseRange = tower.range;
    const baseDamage = tower.damage;
    tower.upgrade();
    expect(tower.range).toBeGreaterThan(baseRange);
    expect(tower.damage).toBeGreaterThan(baseDamage);
  });

  it('refuses to upgrade past the max level', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    tower.upgrade();
    tower.upgrade();
    expect(tower.canUpgrade()).toBe(false);
    tower.upgrade();
    expect(tower.level).toBe(3);
  });

  it('cannot fire until the cooldown reaches zero, then resets on fire', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    expect(tower.canFire).toBe(true);
    tower.resetCooldown();
    expect(tower.canFire).toBe(false);
    tower.tick(1);
    expect(tower.canFire).toBe(true);
  });

  it('returns null when no enemy is within range', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    const candidates = [makeCandidate('e1', 'scout', 0, { x: 50, y: 50 })];
    expect(tower.findTarget(candidates)).toBeNull();
  });

  it('targets the enemy furthest along the path for "first" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.basic, { x: 0, y: 0 });
    const near = makeCandidate('near', 'scout', 1, { x: 0.5, y: 0.5 });
    const far = makeCandidate('far', 'scout', 5, { x: 1.5, y: 0.5 });
    const target = tower.findTarget([near, far]);
    expect(target).toBe(far.enemy);
  });

  it('targets the highest-hp enemy for "strongest" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.sniper, { x: 0, y: 0 });
    const weak = makeCandidate('weak', 'scout', 0, { x: 0.5, y: 0.5 });
    const strong = makeCandidate('strong', 'tank', 0, { x: 1.5, y: 0.5 });
    const target = tower.findTarget([weak, strong]);
    expect(target).toBe(strong.enemy);
  });

  it('targets the physically closest enemy for "closest" strategy', () => {
    const tower = new Tower('t1', TOWERS_BY_ID.splash, { x: 0, y: 0 });
    const near = makeCandidate('near', 'scout', 0, { x: 0.6, y: 0.5 });
    const far = makeCandidate('far', 'scout', 0, { x: 2, y: 0.5 });
    const target = tower.findTarget([near, far]);
    expect(target).toBe(near.enemy);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run src/engine/Tower.test.ts`
Expected: FAIL

- [ ] **Step 4: Tower 클래스 구현**

`src/engine/Tower.ts`:
```ts
import type { Point, TowerStats } from './types';
import type { Enemy } from './Enemy';
import { distance } from './vector';

export interface TargetCandidate {
  enemy: Enemy;
  position: Point;
}

const RANGE_PER_LEVEL = 0.2;
const DAMAGE_PER_LEVEL = 0.5;
const MAX_LEVEL = 3;

export class Tower {
  readonly id: string;
  readonly stats: TowerStats;
  readonly position: Point;
  level = 1;
  cooldownRemaining = 0;

  constructor(id: string, stats: TowerStats, position: Point) {
    this.id = id;
    this.stats = stats;
    this.position = position;
  }

  get centerPosition(): Point {
    return { x: this.position.x + 0.5, y: this.position.y + 0.5 };
  }

  get range(): number {
    return this.stats.range * (1 + RANGE_PER_LEVEL * (this.level - 1));
  }

  get damage(): number {
    return this.stats.damage * (1 + DAMAGE_PER_LEVEL * (this.level - 1));
  }

  get upgradeCost(): number {
    return Math.round(this.stats.cost * 0.75 * this.level);
  }

  canUpgrade(): boolean {
    return this.level < MAX_LEVEL;
  }

  upgrade(): void {
    if (this.canUpgrade()) this.level += 1;
  }

  isInRange(position: Point): boolean {
    return distance(this.centerPosition, position) <= this.range;
  }

  tick(dt: number): void {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
  }

  get canFire(): boolean {
    return this.cooldownRemaining <= 0;
  }

  resetCooldown(): void {
    this.cooldownRemaining = 1 / this.stats.fireRate;
  }

  findTarget(candidates: TargetCandidate[]): Enemy | null {
    const inRange = candidates.filter((c) => this.isInRange(c.position));
    if (inRange.length === 0) return null;

    switch (this.stats.targeting) {
      case 'first':
        return inRange.reduce((a, b) => (a.enemy.distanceTraveled >= b.enemy.distanceTraveled ? a : b)).enemy;
      case 'strongest':
        return inRange.reduce((a, b) => (a.enemy.hp >= b.enemy.hp ? a : b)).enemy;
      case 'closest':
      default:
        return inRange.reduce((a, b) =>
          distance(this.centerPosition, a.position) <= distance(this.centerPosition, b.position) ? a : b
        ).enemy;
    }
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/engine/Tower.test.ts`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/engine/towers.ts src/engine/Tower.ts src/engine/Tower.test.ts
git commit -m "feat: add tower stats table and Tower class with targeting"
```

---

### Task 5: Projectile 클래스

**Files:**
- Create: `src/engine/Projectile.ts`
- Test: `src/engine/Projectile.test.ts`

**Interfaces:**
- Consumes: `Point` (Task 1), `Enemy` (Task 3), `add`, `subtract`, `scale`, `normalize`, `distance` (Task 1 vector.ts)
- Produces: `Projectile` class with `id`, `target`, `speed`, `damage`, `splashRadius?`, `slowFactor?`, `slowDuration?`, `position`, methods `advance(dt, targetPosition)`, `hasReached(targetPosition)` — consumed by GameEngine (Task 8)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/engine/Projectile.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';
import { ENEMIES_BY_ID } from './enemies';
import { Projectile } from './Projectile';

describe('Projectile', () => {
  it('moves toward the target position at its configured speed', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.scout);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, { speed: 10, damage: 5 });

    projectile.advance(1, { x: 10, y: 0 });

    expect(projectile.position.x).toBeCloseTo(10);
    expect(projectile.position.y).toBeCloseTo(0);
  });

  it('reports it has reached the target once within the hit threshold', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.scout);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, { speed: 10, damage: 5 });

    expect(projectile.hasReached({ x: 5, y: 0 })).toBe(false);

    projectile.advance(1, { x: 0.1, y: 0 });

    expect(projectile.hasReached({ x: 0.1, y: 0 })).toBe(true);
  });

  it('carries optional splash and slow configuration', () => {
    const target = new Enemy('e1', ENEMIES_BY_ID.scout);
    const projectile = new Projectile('p1', { x: 0, y: 0 }, target, {
      speed: 6,
      damage: 15,
      splashRadius: 1.2,
      slowFactor: 0.5,
      slowDuration: 2,
    });

    expect(projectile.splashRadius).toBe(1.2);
    expect(projectile.slowFactor).toBe(0.5);
    expect(projectile.slowDuration).toBe(2);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/engine/Projectile.test.ts`
Expected: FAIL

- [ ] **Step 3: Projectile 클래스 구현**

`src/engine/Projectile.ts`:
```ts
import type { Point } from './types';
import type { Enemy } from './Enemy';
import { add, distance, normalize, scale, subtract } from './vector';

export interface ProjectileOptions {
  speed: number;
  damage: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
}

const HIT_THRESHOLD = 0.2;

export class Projectile {
  readonly id: string;
  readonly target: Enemy;
  readonly speed: number;
  readonly damage: number;
  readonly splashRadius?: number;
  readonly slowFactor?: number;
  readonly slowDuration?: number;
  position: Point;

  constructor(id: string, origin: Point, target: Enemy, options: ProjectileOptions) {
    this.id = id;
    this.position = { ...origin };
    this.target = target;
    this.speed = options.speed;
    this.damage = options.damage;
    this.splashRadius = options.splashRadius;
    this.slowFactor = options.slowFactor;
    this.slowDuration = options.slowDuration;
  }

  advance(dt: number, targetPosition: Point): void {
    const direction = normalize(subtract(targetPosition, this.position));
    this.position = add(this.position, scale(direction, this.speed * dt));
  }

  hasReached(targetPosition: Point): boolean {
    return distance(this.position, targetPosition) <= HIT_THRESHOLD;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/engine/Projectile.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/engine/Projectile.ts src/engine/Projectile.test.ts
git commit -m "feat: add Projectile class"
```

---

### Task 6: Economy 클래스 (골드/라이프)

**Files:**
- Create: `src/engine/Economy.ts`
- Test: `src/engine/Economy.test.ts`

**Interfaces:**
- Produces: `Economy` class with `gold`, `lives`, methods `canAfford(cost)`, `spend(cost)`, `addGold(amount)`, `loseLife(amount?)`, getter `isGameOver` — consumed by GameEngine (Task 8)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/engine/Economy.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { Economy } from './Economy';

describe('Economy', () => {
  it('starts with the given gold and lives', () => {
    const economy = new Economy(150, 20);
    expect(economy.gold).toBe(150);
    expect(economy.lives).toBe(20);
  });

  it('spends gold only when affordable', () => {
    const economy = new Economy(100, 20);
    expect(economy.spend(60)).toBe(true);
    expect(economy.gold).toBe(40);
    expect(economy.spend(50)).toBe(false);
    expect(economy.gold).toBe(40);
  });

  it('adds gold', () => {
    const economy = new Economy(0, 20);
    economy.addGold(25);
    expect(economy.gold).toBe(25);
  });

  it('loses lives and never goes below zero', () => {
    const economy = new Economy(0, 2);
    economy.loseLife();
    expect(economy.lives).toBe(1);
    economy.loseLife(5);
    expect(economy.lives).toBe(0);
  });

  it('reports game over once lives reach zero', () => {
    const economy = new Economy(0, 1);
    expect(economy.isGameOver).toBe(false);
    economy.loseLife();
    expect(economy.isGameOver).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/engine/Economy.test.ts`
Expected: FAIL

- [ ] **Step 3: Economy 클래스 구현**

`src/engine/Economy.ts`:
```ts
export class Economy {
  gold: number;
  lives: number;

  constructor(startingGold: number, startingLives: number) {
    this.gold = startingGold;
    this.lives = startingLives;
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  spend(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.gold -= cost;
    return true;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  loseLife(amount = 1): void {
    this.lives = Math.max(0, this.lives - amount);
  }

  get isGameOver(): boolean {
    return this.lives <= 0;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/engine/Economy.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/engine/Economy.ts src/engine/Economy.test.ts
git commit -m "feat: add Economy class for gold and lives"
```

---

### Task 7: WaveManager

**Files:**
- Create: `src/engine/WaveManager.ts`
- Test: `src/engine/WaveManager.test.ts`

**Interfaces:**
- Consumes: `WaveDefinition` (Task 1)
- Produces: `WaveManager` class with getters `totalWaves`, `currentWaveNumber`, `hasMoreWaves`, `isSpawningComplete`, methods `startNextWave(): boolean`, `update(dt): string[]` (returns enemy stat ids spawned this tick) — consumed by GameEngine (Task 8)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/engine/WaveManager.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { WaveManager } from './WaveManager';
import type { WaveDefinition } from './types';

const WAVES: WaveDefinition[] = [
  { waveNumber: 1, spawns: [{ enemyId: 'scout', count: 2, spawnIntervalSec: 1 }] },
  { waveNumber: 2, spawns: [{ enemyId: 'boss', count: 1, spawnIntervalSec: 1 }] },
];

describe('WaveManager', () => {
  it('reports totalWaves and starts with no wave in progress', () => {
    const manager = new WaveManager(WAVES);
    expect(manager.totalWaves).toBe(2);
    expect(manager.currentWaveNumber).toBe(0);
    expect(manager.hasMoreWaves).toBe(true);
  });

  it('advances to the next wave number when started', () => {
    const manager = new WaveManager(WAVES);
    expect(manager.startNextWave()).toBe(true);
    expect(manager.currentWaveNumber).toBe(1);
  });

  it('refuses to start a wave once all waves are exhausted', () => {
    const manager = new WaveManager(WAVES);
    manager.startNextWave();
    manager.startNextWave();
    expect(manager.hasMoreWaves).toBe(false);
    expect(manager.startNextWave()).toBe(false);
  });

  it('spawns enemies on the configured interval up to the configured count', () => {
    const manager = new WaveManager(WAVES);
    manager.startNextWave();

    expect(manager.update(1)).toEqual(['scout']);
    expect(manager.update(1)).toEqual(['scout']);
    expect(manager.update(1)).toEqual([]);
    expect(manager.isSpawningComplete).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/engine/WaveManager.test.ts`
Expected: FAIL

- [ ] **Step 3: WaveManager 구현**

`src/engine/WaveManager.ts`:
```ts
import type { WaveDefinition } from './types';

interface SpawnQueueEntry {
  enemyId: string;
  timeRemaining: number;
  intervalSec: number;
  remainingCount: number;
}

export class WaveManager {
  private waves: WaveDefinition[];
  private currentWaveIndex = -1;
  private spawnQueue: SpawnQueueEntry[] = [];
  private spawningComplete = true;

  constructor(waves: WaveDefinition[]) {
    this.waves = waves;
  }

  get totalWaves(): number {
    return this.waves.length;
  }

  get currentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  get hasMoreWaves(): boolean {
    return this.currentWaveIndex < this.waves.length - 1;
  }

  get isSpawningComplete(): boolean {
    return this.spawningComplete;
  }

  startNextWave(): boolean {
    if (!this.hasMoreWaves) return false;
    this.currentWaveIndex += 1;
    const wave = this.waves[this.currentWaveIndex];
    this.spawnQueue = wave.spawns.map((spawn) => ({
      enemyId: spawn.enemyId,
      timeRemaining: 0,
      intervalSec: spawn.spawnIntervalSec,
      remainingCount: spawn.count,
    }));
    this.spawningComplete = false;
    return true;
  }

  update(dt: number): string[] {
    const spawned: string[] = [];
    for (const entry of this.spawnQueue) {
      if (entry.remainingCount <= 0) continue;
      entry.timeRemaining -= dt;
      if (entry.timeRemaining <= 0) {
        spawned.push(entry.enemyId);
        entry.remainingCount -= 1;
        entry.timeRemaining = entry.intervalSec;
      }
    }
    this.spawningComplete = this.spawnQueue.every((entry) => entry.remainingCount <= 0);
    return spawned;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/engine/WaveManager.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/engine/WaveManager.ts src/engine/WaveManager.test.ts
git commit -m "feat: add WaveManager for spawn timing and wave progression"
```

---

### Task 8: GameEngine 통합

**Files:**
- Create: `src/engine/GameEngine.ts`
- Test: `src/engine/GameEngine.test.ts`

**Interfaces:**
- Consumes: `EventEmitter`, `GameEventMap`, `MapDefinition`, `Point`, `GameStatus` (Task 1); `getPathLength`, `getPositionAtDistance` (Task 2); `Enemy`, `ENEMIES_BY_ID` (Task 3); `Tower`, `TargetCandidate`, `TOWERS_BY_ID` (Task 4); `Projectile` (Task 5); `Economy` (Task 6); `WaveManager` (Task 7); `distance` (Task 1 vector.ts)
- Produces: `GameEngine extends EventEmitter<GameEventMap>` with constructor `(map: MapDefinition)`, methods `startNextWave(): boolean`, `placeTower(cell: Point, towerId: string): PlaceTowerResult`, `update(dt: number): void`, `getSnapshot(): EngineSnapshot`
- Produces: `PlaceTowerResult { success: boolean; reason?: 'occupied' | 'not-buildable' | 'insufficient-gold' }`
- Produces: `EngineSnapshot { towers, enemies, projectiles, gold, lives, waveNumber, totalWaves, isWaveInProgress, status }` — consumed by Renderer (Task 10), useEngineState hook (Task 14)

- [ ] **Step 1: 타워 배치 관련 실패하는 테스트 작성**

`src/engine/GameEngine.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { GameEngine } from './GameEngine';
import type { MapDefinition } from './types';

const TEST_MAP: MapDefinition = {
  id: 'test',
  name: 'Test Map',
  gridWidth: 5,
  gridHeight: 5,
  cellSize: 40,
  path: [
    { x: 0.5, y: 2.5 },
    { x: 4.5, y: 2.5 },
  ],
  buildableTiles: [
    { x: 1, y: 0 },
    { x: 1, y: 4 },
  ],
  waves: [
    { waveNumber: 1, spawns: [{ enemyId: 'scout', count: 1, spawnIntervalSec: 0.1 }] },
    { waveNumber: 2, spawns: [{ enemyId: 'boss', count: 1, spawnIntervalSec: 0.1 }] },
  ],
};

describe('GameEngine placeTower', () => {
  it('places a tower on a buildable tile and deducts gold', () => {
    const engine = new GameEngine(TEST_MAP);
    const startingGold = engine.getSnapshot().gold;

    const result = engine.placeTower({ x: 1, y: 0 }, 'basic');

    expect(result).toEqual({ success: true });
    expect(engine.getSnapshot().gold).toBe(startingGold - 50);
    expect(engine.getSnapshot().towers).toHaveLength(1);
  });

  it('refuses placement on a non-buildable tile', () => {
    const engine = new GameEngine(TEST_MAP);
    const result = engine.placeTower({ x: 2, y: 2 }, 'basic');
    expect(result).toEqual({ success: false, reason: 'not-buildable' });
  });

  it('refuses placement on an already-occupied tile', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.placeTower({ x: 1, y: 0 }, 'basic');
    const result = engine.placeTower({ x: 1, y: 0 }, 'basic');
    expect(result).toEqual({ success: false, reason: 'occupied' });
  });

  it('refuses placement without enough gold', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.placeTower({ x: 1, y: 0 }, 'sniper');
    const result = engine.placeTower({ x: 1, y: 4 }, 'sniper');
    expect(result).toEqual({ success: false, reason: 'insufficient-gold' });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/engine/GameEngine.test.ts`
Expected: FAIL

- [ ] **Step 3: GameEngine 기본 구현 (배치/스냅샷만)**

`src/engine/GameEngine.ts`:
```ts
import { Economy } from './Economy';
import { ENEMIES_BY_ID } from './enemies';
import { Enemy } from './Enemy';
import { EventEmitter } from './EventEmitter';
import { getPathLength, getPositionAtDistance } from './path';
import { Projectile } from './Projectile';
import { Tower, type TargetCandidate } from './Tower';
import { TOWERS_BY_ID } from './towers';
import type { GameEventMap, GameStatus, MapDefinition, Point } from './types';
import { distance } from './vector';
import { WaveManager } from './WaveManager';

const STARTING_GOLD = 150;
const STARTING_LIVES = 20;

export interface PlaceTowerResult {
  success: boolean;
  reason?: 'occupied' | 'not-buildable' | 'insufficient-gold';
}

export interface EngineSnapshot {
  towers: { id: string; statsId: string; position: Point; level: number }[];
  enemies: { id: string; statsId: string; position: Point; hpFraction: number }[];
  projectiles: { id: string; position: Point }[];
  gold: number;
  lives: number;
  waveNumber: number;
  totalWaves: number;
  isWaveInProgress: boolean;
  status: GameStatus;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export class GameEngine extends EventEmitter<GameEventMap> {
  private map: MapDefinition;
  private pathLength: number;
  private waveManager: WaveManager;
  private economy: Economy;
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private status: GameStatus = 'playing';

  constructor(map: MapDefinition) {
    super();
    this.map = map;
    this.pathLength = getPathLength(map.path);
    this.waveManager = new WaveManager(map.waves);
    this.economy = new Economy(STARTING_GOLD, STARTING_LIVES);
  }

  getSnapshot(): EngineSnapshot {
    return {
      towers: this.towers.map((t) => ({ id: t.id, statsId: t.stats.id, position: t.position, level: t.level })),
      enemies: this.enemies.map((e) => ({
        id: e.id,
        statsId: e.statsId,
        position: getPositionAtDistance(this.map.path, e.distanceTraveled),
        hpFraction: e.hpFraction,
      })),
      projectiles: this.projectiles.map((p) => ({ id: p.id, position: p.position })),
      gold: this.economy.gold,
      lives: this.economy.lives,
      waveNumber: this.waveManager.currentWaveNumber,
      totalWaves: this.waveManager.totalWaves,
      isWaveInProgress:
        this.waveManager.currentWaveNumber > 0 &&
        !(this.waveManager.isSpawningComplete && this.enemies.length === 0),
      status: this.status,
    };
  }

  placeTower(cell: Point, towerId: string): PlaceTowerResult {
    const isBuildable = this.map.buildableTiles.some((t) => t.x === cell.x && t.y === cell.y);
    if (!isBuildable) return { success: false, reason: 'not-buildable' };

    const occupied = this.towers.some((t) => t.position.x === cell.x && t.position.y === cell.y);
    if (occupied) return { success: false, reason: 'occupied' };

    const stats = TOWERS_BY_ID[towerId];
    if (!this.economy.canAfford(stats.cost)) return { success: false, reason: 'insufficient-gold' };

    this.economy.spend(stats.cost);
    this.emit('gold-changed', this.economy.gold);
    this.towers.push(new Tower(nextId('tower'), stats, cell));
    return { success: true };
  }

  startNextWave(): boolean {
    const started = this.waveManager.startNextWave();
    if (started) {
      this.emit('wave-changed', { current: this.waveManager.currentWaveNumber, total: this.waveManager.totalWaves });
    }
    return started;
  }

  update(dt: number): void {
    if (this.status !== 'playing') return;
    // 나머지 시뮬레이션 로직은 Step 6에서 추가한다.
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/engine/GameEngine.test.ts`
Expected: PASS

- [ ] **Step 5: 전투/승패 관련 실패하는 테스트 추가**

`src/engine/GameEngine.test.ts`에 아래 `describe` 블록을 추가:
```ts
describe('GameEngine update loop', () => {
  it('spawns enemies from the active wave and moves them along the path', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.startNextWave();

    engine.update(0.2); // spawnIntervalSec 0.1 이후 스폰

    const snapshot = engine.getSnapshot();
    expect(snapshot.enemies).toHaveLength(1);
    expect(snapshot.enemies[0].position.x).toBeGreaterThan(0.5);
  });

  // dt=0.02 (not 0.1) is deliberate: the projectile homes toward the target's
  // *current* position each tick, so a coarse dt combined with a fast
  // projectile (sniper speed 12) overshoots past a slow-moving scout every
  // tick and never lands within HIT_THRESHOLD — verified by simulation before
  // writing this test. dt=0.02 matches real per-frame granularity and converges.
  it('kills an enemy with a tower, grants gold, and removes the projectile', () => {
    const engine = new GameEngine(TEST_MAP);
    engine.placeTower({ x: 1, y: 0 }, 'sniper');
    engine.startNextWave();

    const goldAfterPlacement = engine.getSnapshot().gold;

    for (let i = 0; i < 1000; i++) {
      engine.update(0.02);
      if (engine.getSnapshot().enemies.length === 0) break;
    }

    const snapshot = engine.getSnapshot();
    expect(snapshot.enemies).toHaveLength(0);
    expect(snapshot.projectiles).toHaveLength(0);
    expect(snapshot.gold).toBeGreaterThan(goldAfterPlacement);
  });

  it('loses a life and emits lives-changed when an enemy reaches the end of the path', () => {
    const engine = new GameEngine(TEST_MAP);
    const livesListener = vi.fn();
    engine.on('lives-changed', livesListener);
    engine.startNextWave();

    for (let i = 0; i < 100; i++) {
      engine.update(0.5);
    }

    expect(engine.getSnapshot().lives).toBeLessThan(20);
    expect(livesListener).toHaveBeenCalled();
  });

  it('sets status to lost and stops simulating once lives reach zero', () => {
    const manyWaves = {
      ...TEST_MAP,
      waves: Array.from({ length: 25 }, (_, i) => ({
        waveNumber: i + 1,
        spawns: [{ enemyId: 'scout', count: 1, spawnIntervalSec: 0.1 }],
      })),
    };
    const engine = new GameEngine(manyWaves);
    const statusListener = vi.fn();
    engine.on('status-changed', statusListener);

    for (let wave = 0; wave < 20; wave++) {
      engine.startNextWave();
      for (let i = 0; i < 50; i++) {
        engine.update(0.5);
      }
    }

    expect(engine.getSnapshot().status).toBe('lost');
    expect(statusListener).toHaveBeenCalledWith('lost');
  });

  // Same dt=0.02 reasoning as the kill test above — a coarse dt would let
  // the scout escape before the sniper's projectile ever converges.
  it('sets status to won once all waves are cleared with no enemies remaining', () => {
    const winMap: MapDefinition = {
      ...TEST_MAP,
      waves: [{ waveNumber: 1, spawns: [{ enemyId: 'scout', count: 1, spawnIntervalSec: 0.1 }] }],
    };
    const engine = new GameEngine(winMap);
    engine.placeTower({ x: 1, y: 0 }, 'sniper');
    engine.startNextWave();

    for (let i = 0; i < 500; i++) {
      engine.update(0.02);
    }

    expect(engine.getSnapshot().status).toBe('won');
  });
});
```

`vi`를 사용하므로 파일 상단 import를 다음으로 교체한다:
```ts
import { describe, expect, it, vi } from 'vitest';
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `npx vitest run src/engine/GameEngine.test.ts`
Expected: FAIL (update가 아직 아무 것도 하지 않음)

- [ ] **Step 7: update() 전체 시뮬레이션 로직 구현**

`GameEngine.ts`의 `update` 메서드를 아래로 교체:
```ts
  update(dt: number): void {
    if (this.status !== 'playing') return;

    const spawnedIds = this.waveManager.update(dt);
    for (const enemyId of spawnedIds) {
      this.enemies.push(new Enemy(nextId('enemy'), ENEMIES_BY_ID[enemyId]));
    }

    for (const enemy of this.enemies) {
      enemy.advance(dt);
    }

    const reachedEnd = this.enemies.filter((e) => e.distanceTraveled >= this.pathLength);
    if (reachedEnd.length > 0) {
      this.economy.loseLife(reachedEnd.length);
      this.enemies = this.enemies.filter((e) => e.distanceTraveled < this.pathLength);
      this.emit('lives-changed', this.economy.lives);
      if (this.economy.isGameOver) {
        this.status = 'lost';
        this.emit('status-changed', 'lost');
        return;
      }
    }

    const candidates: TargetCandidate[] = this.enemies.map((enemy) => ({
      enemy,
      position: getPositionAtDistance(this.map.path, enemy.distanceTraveled),
    }));

    for (const tower of this.towers) {
      tower.tick(dt);
      if (!tower.canFire) continue;
      const target = tower.findTarget(candidates);
      if (!target) continue;
      tower.resetCooldown();
      this.projectiles.push(
        new Projectile(nextId('proj'), tower.centerPosition, target, {
          speed: tower.stats.projectileSpeed,
          damage: tower.damage,
          splashRadius: tower.stats.splashRadius,
          slowFactor: tower.stats.slowFactor,
          slowDuration: tower.stats.slowDuration,
        })
      );
    }

    const remainingProjectiles: Projectile[] = [];
    for (const projectile of this.projectiles) {
      if (projectile.target.isDead || !this.enemies.includes(projectile.target)) continue;
      const targetPos = candidates.find((c) => c.enemy === projectile.target)?.position;
      if (!targetPos) continue;

      projectile.advance(dt, targetPos);
      if (projectile.hasReached(targetPos)) {
        this.resolveHit(projectile, targetPos, candidates);
      } else {
        remainingProjectiles.push(projectile);
      }
    }
    this.projectiles = remainingProjectiles;

    const dead = this.enemies.filter((e) => e.isDead);
    if (dead.length > 0) {
      const reward = dead.reduce((sum, e) => sum + e.reward, 0);
      this.economy.addGold(reward);
      this.emit('gold-changed', this.economy.gold);
      this.enemies = this.enemies.filter((e) => !e.isDead);
    }

    if (
      this.waveManager.isSpawningComplete &&
      !this.waveManager.hasMoreWaves &&
      this.enemies.length === 0 &&
      this.projectiles.length === 0 &&
      this.waveManager.currentWaveNumber > 0
    ) {
      this.status = 'won';
      this.emit('status-changed', 'won');
    }
  }

  private resolveHit(projectile: Projectile, targetPos: Point, candidates: TargetCandidate[]): void {
    projectile.target.takeDamage(projectile.damage);
    if (projectile.slowFactor && projectile.slowDuration) {
      projectile.target.applySlow(projectile.slowFactor, projectile.slowDuration);
    }
    if (projectile.splashRadius) {
      for (const candidate of candidates) {
        if (candidate.enemy === projectile.target) continue;
        if (distance(candidate.position, targetPos) <= projectile.splashRadius) {
          candidate.enemy.takeDamage(projectile.damage);
        }
      }
    }
  }
```

- [ ] **Step 8: 테스트 통과 확인**

Run: `npx vitest run src/engine/GameEngine.test.ts`
Expected: PASS (실패하는 케이스가 있다면 테스트의 반복 횟수/조건을 조정하되, 엔진 로직 자체를 바꾸지 말 것 — 로직이 스펙과 다르면 먼저 원인을 파악한다)

- [ ] **Step 9: 커밋**

```bash
git add src/engine/GameEngine.ts src/engine/GameEngine.test.ts
git commit -m "feat: integrate GameEngine simulation loop"
```

---

### Task 9: SaveService

**Files:**
- Create: `src/persistence/SaveService.ts`
- Test: `src/persistence/SaveService.test.ts`

**Note:** 이 파일은 의도적으로 `src/engine/` 밖에 위치한다. `window.localStorage`를
직접 다루기 때문에 "`src/engine/**`는 DOM을 건드리지 않는다"는 Global
Constraint와 충돌하지 않도록 저장 계층은 별도 디렉토리로 분리한다.

**Interfaces:**
- Produces: `SaveData { version, mapId, gold, lives, waveNumber }`, `SaveService` interface `{ save(data), load(): SaveData | null, clear() }`, `LocalStorageSaveService implements SaveService`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/persistence/SaveService.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageSaveService, type SaveData } from './SaveService';

const SAMPLE: SaveData = { version: 1, mapId: 'meadow', gold: 200, lives: 15, waveNumber: 3 };

describe('LocalStorageSaveService', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when nothing has been saved', () => {
    const service = new LocalStorageSaveService();
    expect(service.load()).toBeNull();
  });

  it('saves and loads data back unchanged', () => {
    const service = new LocalStorageSaveService();
    service.save(SAMPLE);
    expect(service.load()).toEqual(SAMPLE);
  });

  it('returns null for corrupted JSON instead of throwing', () => {
    const service = new LocalStorageSaveService();
    window.localStorage.setItem('td-save-v1', '{not valid json');
    expect(() => service.load()).not.toThrow();
    expect(service.load()).toBeNull();
  });

  it('returns null when the saved version does not match the current version', () => {
    const service = new LocalStorageSaveService();
    window.localStorage.setItem('td-save-v1', JSON.stringify({ ...SAMPLE, version: 999 }));
    expect(service.load()).toBeNull();
  });

  it('clears saved data', () => {
    const service = new LocalStorageSaveService();
    service.save(SAMPLE);
    service.clear();
    expect(service.load()).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/persistence/SaveService.test.ts`
Expected: FAIL

- [ ] **Step 3: SaveService 구현**

`src/persistence/SaveService.ts`:
```ts
export interface SaveData {
  version: number;
  mapId: string;
  gold: number;
  lives: number;
  waveNumber: number;
}

export interface SaveService {
  save(data: SaveData): void;
  load(): SaveData | null;
  clear(): void;
}

const STORAGE_KEY = 'td-save-v1';
const CURRENT_VERSION = 1;

export class LocalStorageSaveService implements SaveService {
  save(data: SaveData): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 저장 공간이 없거나 접근 불가 — 저장은 best-effort이므로 무시한다
    }
  }

  load(): SaveData | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== CURRENT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/persistence/SaveService.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/persistence/SaveService.ts src/persistence/SaveService.test.ts
git commit -m "feat: add SaveService with localStorage implementation"
```

---

### Task 10: Renderer (캔버스 렌더링)

**Files:**
- Create: `src/render/Renderer.ts`
- Test: `src/render/Renderer.test.ts`

**Interfaces:**
- Consumes: `MapDefinition` (Task 1), `EngineSnapshot` (Task 8)
- Produces: `drawGame(ctx: CanvasRenderingContext2D, map: MapDefinition, snapshot: EngineSnapshot): void` — consumed by GameCanvas (Task 11)

- [ ] **Step 1: 실패하는 테스트 작성 (모킹된 컨텍스트로 호출만 검증)**

`src/render/Renderer.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { drawGame } from './Renderer';
import type { EngineSnapshot } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';

function createMockContext() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

const MAP: MapDefinition = {
  id: 'test',
  name: 'Test',
  gridWidth: 5,
  gridHeight: 5,
  cellSize: 40,
  path: [
    { x: 0.5, y: 2.5 },
    { x: 4.5, y: 2.5 },
  ],
  buildableTiles: [{ x: 1, y: 0 }],
  waves: [],
};

const SNAPSHOT: EngineSnapshot = {
  towers: [{ id: 't1', statsId: 'basic', position: { x: 1, y: 0 }, level: 1 }],
  enemies: [{ id: 'e1', statsId: 'scout', position: { x: 2, y: 2.5 }, hpFraction: 0.5 }],
  projectiles: [{ id: 'p1', position: { x: 1.5, y: 2.5 } }],
  gold: 100,
  lives: 20,
  waveNumber: 1,
  totalWaves: 3,
  isWaveInProgress: true,
  status: 'playing',
};

describe('drawGame', () => {
  it('clears the canvas and draws without throwing', () => {
    const ctx = createMockContext();
    expect(() => drawGame(ctx, MAP, SNAPSHOT)).not.toThrow();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, MAP.gridWidth * MAP.cellSize, MAP.gridHeight * MAP.cellSize);
  });

  it('draws one arc per tower, enemy, and projectile', () => {
    const ctx = createMockContext();
    drawGame(ctx, MAP, SNAPSHOT);
    // 타워 1개 + 적 1개 + 투사체 1개 = arc 3번 호출
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/render/Renderer.test.ts`
Expected: FAIL

- [ ] **Step 3: Renderer 구현**

`src/render/Renderer.ts`:
```ts
import type { EngineSnapshot } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';

export function drawGame(ctx: CanvasRenderingContext2D, map: MapDefinition, snapshot: EngineSnapshot): void {
  const { cellSize, gridWidth, gridHeight } = map;

  ctx.clearRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

  ctx.fillStyle = '#2f3a2f';
  ctx.fillRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

  ctx.strokeStyle = '#8a7350';
  ctx.lineWidth = cellSize * 0.8;
  ctx.beginPath();
  map.path.forEach((point, i) => {
    const px = point.x * cellSize;
    const py = point.y * cellSize;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (const tile of map.buildableTiles) {
    ctx.fillRect(tile.x * cellSize, tile.y * cellSize, cellSize, cellSize);
  }

  ctx.fillStyle = '#4a90d9';
  for (const tower of snapshot.towers) {
    ctx.beginPath();
    ctx.arc((tower.position.x + 0.5) * cellSize, (tower.position.y + 0.5) * cellSize, cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of snapshot.enemies) {
    ctx.fillStyle = '#d94a4a';
    ctx.beginPath();
    ctx.arc(enemy.position.x * cellSize, enemy.position.y * cellSize, cellSize * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222222';
    ctx.fillRect(enemy.position.x * cellSize - cellSize * 0.25, enemy.position.y * cellSize - cellSize * 0.4, cellSize * 0.5, 4);
    ctx.fillStyle = '#4ad94a';
    ctx.fillRect(
      enemy.position.x * cellSize - cellSize * 0.25,
      enemy.position.y * cellSize - cellSize * 0.4,
      cellSize * 0.5 * enemy.hpFraction,
      4
    );
  }

  ctx.fillStyle = '#f5e642';
  for (const projectile of snapshot.projectiles) {
    ctx.beginPath();
    ctx.arc(projectile.position.x * cellSize, projectile.position.y * cellSize, cellSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/render/Renderer.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/render/Renderer.ts src/render/Renderer.test.ts
git commit -m "feat: add canvas renderer for game state"
```

---

### Task 11: GameCanvas React 컴포넌트

**Files:**
- Create: `src/components/GameCanvas.tsx`
- Test: `src/components/GameCanvas.test.tsx`

**Interfaces:**
- Consumes: `GameEngine` (Task 8), `drawGame` (Task 10), `MapDefinition` (Task 1)
- Produces: `GameCanvas` component, props `{ map: MapDefinition; engine: GameEngine; selectedTowerId: string | null; onPlacementResult?: (result: PlaceTowerResult) => void }` — consumed by App (Task 14)

- [ ] **Step 1: 실패하는 테스트 작성 (클릭 → 타워 배치 호출만 검증)**

`src/components/GameCanvas.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameCanvas } from './GameCanvas';
import type { MapDefinition } from '../engine/types';

const MAP: MapDefinition = {
  id: 'test',
  name: 'Test',
  gridWidth: 5,
  gridHeight: 5,
  cellSize: 40,
  path: [{ x: 0.5, y: 2.5 }, { x: 4.5, y: 2.5 }],
  buildableTiles: [{ x: 1, y: 0 }],
  waves: [],
};

function makeFakeEngine() {
  return {
    update: vi.fn(),
    getSnapshot: vi.fn(() => ({
      towers: [],
      enemies: [],
      projectiles: [],
      gold: 100,
      lives: 20,
      waveNumber: 0,
      totalWaves: 1,
      isWaveInProgress: false,
      status: 'playing' as const,
    })),
    placeTower: vi.fn(() => ({ success: true })),
  };
}

describe('GameCanvas', () => {
  it('does not place a tower when no tower type is selected', () => {
    const engine = makeFakeEngine();
    render(<GameCanvas map={MAP} engine={engine as never} selectedTowerId={null} />);

    const canvas = screen.getByTestId('game-canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 } as DOMRect);
    fireEvent.click(canvas, { clientX: 60, clientY: 20 });

    expect(engine.placeTower).not.toHaveBeenCalled();
  });

  it('places a tower at the clicked grid cell when a tower type is selected', () => {
    const engine = makeFakeEngine();
    const onPlacementResult = vi.fn();
    render(
      <GameCanvas map={MAP} engine={engine as never} selectedTowerId="basic" onPlacementResult={onPlacementResult} />
    );

    const canvas = screen.getByTestId('game-canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 } as DOMRect);
    fireEvent.click(canvas, { clientX: 60, clientY: 20 });

    expect(engine.placeTower).toHaveBeenCalledWith({ x: 1, y: 0 }, 'basic');
    expect(onPlacementResult).toHaveBeenCalledWith({ success: true });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/GameCanvas.test.tsx`
Expected: FAIL

- [ ] **Step 3: GameCanvas 구현**

`src/components/GameCanvas.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import { drawGame } from '../render/Renderer';
import type { GameEngine, PlaceTowerResult } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';

export interface GameCanvasProps {
  map: MapDefinition;
  engine: GameEngine;
  selectedTowerId: string | null;
  onPlacementResult?: (result: PlaceTowerResult) => void;
}

export function GameCanvas({ map, engine, selectedTowerId, onPlacementResult }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      engine.update(dt);
      drawGame(ctx, map, engine.getSnapshot());
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [engine, map]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTowerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cell = {
      x: Math.floor((event.clientX - rect.left) / map.cellSize),
      y: Math.floor((event.clientY - rect.top) / map.cellSize),
    };
    const result = engine.placeTower(cell, selectedTowerId);
    onPlacementResult?.(result);
  };

  return (
    <canvas
      ref={canvasRef}
      width={map.gridWidth * map.cellSize}
      height={map.gridHeight * map.cellSize}
      onClick={handleClick}
      data-testid="game-canvas"
    />
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/GameCanvas.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/GameCanvas.tsx src/components/GameCanvas.test.tsx
git commit -m "feat: add GameCanvas component with click-to-place towers"
```

---

### Task 12: HUD 컴포넌트

**Files:**
- Create: `src/components/HUD.tsx`
- Test: `src/components/HUD.test.tsx`

**Interfaces:**
- Produces: `HUD` component, props `{ gold, lives, waveNumber, totalWaves, isWaveInProgress, onStartWave }` — consumed by App (Task 14)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/HUD.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HUD } from './HUD';

describe('HUD', () => {
  it('displays gold, lives, and wave progress', () => {
    render(
      <HUD gold={120} lives={18} waveNumber={2} totalWaves={8} isWaveInProgress={false} onStartWave={() => {}} />
    );

    expect(screen.getByTestId('hud-gold')).toHaveTextContent('120');
    expect(screen.getByTestId('hud-lives')).toHaveTextContent('18');
    expect(screen.getByTestId('hud-wave')).toHaveTextContent('2');
    expect(screen.getByTestId('hud-wave')).toHaveTextContent('8');
  });

  it('calls onStartWave when the button is clicked while no wave is in progress', () => {
    const onStartWave = vi.fn();
    render(
      <HUD gold={0} lives={20} waveNumber={0} totalWaves={8} isWaveInProgress={false} onStartWave={onStartWave} />
    );

    fireEvent.click(screen.getByTestId('start-wave-button'));

    expect(onStartWave).toHaveBeenCalledTimes(1);
  });

  it('disables the start button while a wave is in progress', () => {
    render(
      <HUD gold={0} lives={20} waveNumber={1} totalWaves={8} isWaveInProgress onStartWave={() => {}} />
    );

    expect(screen.getByTestId('start-wave-button')).toBeDisabled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/HUD.test.tsx`
Expected: FAIL

- [ ] **Step 3: HUD 구현**

`src/components/HUD.tsx`:
```tsx
export interface HUDProps {
  gold: number;
  lives: number;
  waveNumber: number;
  totalWaves: number;
  isWaveInProgress: boolean;
  onStartWave: () => void;
}

export function HUD({ gold, lives, waveNumber, totalWaves, isWaveInProgress, onStartWave }: HUDProps) {
  return (
    <div className="hud">
      <span data-testid="hud-gold">골드: {gold}</span>
      <span data-testid="hud-lives">라이프: {lives}</span>
      <span data-testid="hud-wave">
        웨이브: {waveNumber} / {totalWaves}
      </span>
      <button onClick={onStartWave} disabled={isWaveInProgress} data-testid="start-wave-button">
        {isWaveInProgress ? '웨이브 진행 중' : '다음 웨이브 시작'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/HUD.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/HUD.tsx src/components/HUD.test.tsx
git commit -m "feat: add HUD component"
```

---

### Task 13: TowerShop 컴포넌트

**Files:**
- Create: `src/components/TowerShop.tsx`
- Test: `src/components/TowerShop.test.tsx`

**Interfaces:**
- Consumes: `TowerStats` (Task 1)
- Produces: `TowerShop` component, props `{ towers: TowerStats[]; gold: number; selectedTowerId: string | null; onSelectTower: (towerId: string) => void }` — consumed by App (Task 14)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/TowerShop.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TowerShop } from './TowerShop';
import { TOWER_LIST } from '../engine/towers';

describe('TowerShop', () => {
  it('renders one option per tower', () => {
    render(<TowerShop towers={TOWER_LIST} gold={1000} selectedTowerId={null} onSelectTower={() => {}} />);

    for (const tower of TOWER_LIST) {
      expect(screen.getByTestId(`tower-option-${tower.id}`)).toBeInTheDocument();
    }
  });

  it('disables towers the player cannot afford', () => {
    render(<TowerShop towers={TOWER_LIST} gold={10} selectedTowerId={null} onSelectTower={() => {}} />);

    expect(screen.getByTestId('tower-option-basic')).toBeDisabled();
  });

  it('calls onSelectTower with the tower id when an affordable tower is clicked', () => {
    const onSelectTower = vi.fn();
    render(<TowerShop towers={TOWER_LIST} gold={1000} selectedTowerId={null} onSelectTower={onSelectTower} />);

    fireEvent.click(screen.getByTestId('tower-option-basic'));

    expect(onSelectTower).toHaveBeenCalledWith('basic');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/TowerShop.test.tsx`
Expected: FAIL

- [ ] **Step 3: TowerShop 구현**

`src/components/TowerShop.tsx`:
```tsx
import type { TowerStats } from '../engine/types';

export interface TowerShopProps {
  towers: TowerStats[];
  gold: number;
  selectedTowerId: string | null;
  onSelectTower: (towerId: string) => void;
}

export function TowerShop({ towers, gold, selectedTowerId, onSelectTower }: TowerShopProps) {
  return (
    <div className="tower-shop">
      {towers.map((tower) => {
        const affordable = gold >= tower.cost;
        return (
          <button
            key={tower.id}
            onClick={() => onSelectTower(tower.id)}
            disabled={!affordable}
            aria-pressed={selectedTowerId === tower.id}
            data-testid={`tower-option-${tower.id}`}
          >
            {tower.name} ({tower.cost}G)
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/TowerShop.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/TowerShop.tsx src/components/TowerShop.test.tsx
git commit -m "feat: add TowerShop component"
```

---

### Task 14: MapSelect, ResultModal, useEngineState 훅, App 통합

**Files:**
- Create: `src/components/MapSelect.tsx`
- Create: `src/components/ResultModal.tsx`
- Create: `src/hooks/useEngineState.ts`
- Modify: `src/App.tsx` (Task 0의 플레이스홀더를 실제 화면 전환 로직으로 교체)
- Modify: `src/App.test.tsx` (플레이스홀더 텍스트 검증 → 맵 선택 화면 검증으로 교체)
- Test: `src/components/MapSelect.test.tsx`
- Test: `src/components/ResultModal.test.tsx`
- Test: `src/hooks/useEngineState.test.ts`

**Interfaces:**
- Consumes: `MapDefinition` (Task 1), `GameEngine`, `EngineSnapshot` (Task 8), `MAPS` (Task 2), `TOWER_LIST` (Task 4), `GameCanvas` (Task 11), `HUD` (Task 12), `TowerShop` (Task 13)
- Produces: `MapSelect` component props `{ maps: MapDefinition[]; onSelectMap: (mapId: string) => void }`
- Produces: `ResultModal` component props `{ status: 'won' | 'lost'; onRestart: () => void }`
- Produces: `useEngineState(engine: GameEngine | null): EngineSnapshot`

- [ ] **Step 1: MapSelect 실패하는 테스트 작성**

`src/components/MapSelect.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapSelect } from './MapSelect';
import { MAPS } from '../engine/maps';

describe('MapSelect', () => {
  it('renders one option per map', () => {
    render(<MapSelect maps={MAPS} onSelectMap={() => {}} />);
    for (const map of MAPS) {
      expect(screen.getByTestId(`map-option-${map.id}`)).toHaveTextContent(map.name);
    }
  });

  it('calls onSelectMap with the clicked map id', () => {
    const onSelectMap = vi.fn();
    render(<MapSelect maps={MAPS} onSelectMap={onSelectMap} />);
    fireEvent.click(screen.getByTestId(`map-option-${MAPS[0].id}`));
    expect(onSelectMap).toHaveBeenCalledWith(MAPS[0].id);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/MapSelect.test.tsx`
Expected: FAIL

- [ ] **Step 3: MapSelect 구현**

`src/components/MapSelect.tsx`:
```tsx
import type { MapDefinition } from '../engine/types';

export interface MapSelectProps {
  maps: MapDefinition[];
  onSelectMap: (mapId: string) => void;
}

export function MapSelect({ maps, onSelectMap }: MapSelectProps) {
  return (
    <div className="map-select">
      <h1>맵을 선택하세요</h1>
      {maps.map((map) => (
        <button key={map.id} onClick={() => onSelectMap(map.id)} data-testid={`map-option-${map.id}`}>
          {map.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/MapSelect.test.tsx`
Expected: PASS

- [ ] **Step 5: ResultModal 실패하는 테스트 작성**

`src/components/ResultModal.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResultModal } from './ResultModal';

describe('ResultModal', () => {
  it('shows a victory message when status is won', () => {
    render(<ResultModal status="won" onRestart={() => {}} />);
    expect(screen.getByTestId('result-modal')).toHaveTextContent('승리');
  });

  it('shows a defeat message when status is lost', () => {
    render(<ResultModal status="lost" onRestart={() => {}} />);
    expect(screen.getByTestId('result-modal')).toHaveTextContent('패배');
  });

  it('calls onRestart when the restart button is clicked', () => {
    const onRestart = vi.fn();
    render(<ResultModal status="won" onRestart={onRestart} />);
    fireEvent.click(screen.getByTestId('restart-button'));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `npx vitest run src/components/ResultModal.test.tsx`
Expected: FAIL

- [ ] **Step 7: ResultModal 구현**

`src/components/ResultModal.tsx`:
```tsx
export interface ResultModalProps {
  status: 'won' | 'lost';
  onRestart: () => void;
}

export function ResultModal({ status, onRestart }: ResultModalProps) {
  return (
    <div role="dialog" data-testid="result-modal">
      <h2>{status === 'won' ? '승리!' : '패배...'}</h2>
      <button onClick={onRestart} data-testid="restart-button">
        맵 선택으로 돌아가기
      </button>
    </div>
  );
}
```

- [ ] **Step 8: 테스트 통과 확인**

Run: `npx vitest run src/components/ResultModal.test.tsx`
Expected: PASS

- [ ] **Step 9: useEngineState 실패하는 테스트 작성**

`src/hooks/useEngineState.test.ts`:
```ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useEngineState } from './useEngineState';
import { GameEngine } from '../engine/GameEngine';
import { MAPS } from '../engine/maps';

describe('useEngineState', () => {
  it('returns a default snapshot when engine is null', () => {
    const { result } = renderHook(() => useEngineState(null));
    expect(result.current.status).toBe('playing');
    expect(result.current.gold).toBe(0);
  });

  it('returns the engine snapshot and updates it after gold changes', () => {
    const engine = new GameEngine(MAPS[0]);
    const { result } = renderHook(() => useEngineState(engine));

    const startingGold = result.current.gold;

    act(() => {
      engine.placeTower(MAPS[0].buildableTiles[0], 'basic');
    });

    expect(result.current.gold).toBe(startingGold - 50);
  });
});
```

- [ ] **Step 10: 테스트 실패 확인**

Run: `npx vitest run src/hooks/useEngineState.test.ts`
Expected: FAIL

- [ ] **Step 11: useEngineState 구현**

`src/hooks/useEngineState.ts`:
```ts
import { useEffect, useState } from 'react';
import type { EngineSnapshot, GameEngine } from '../engine/GameEngine';

const EMPTY_SNAPSHOT: EngineSnapshot = {
  towers: [],
  enemies: [],
  projectiles: [],
  gold: 0,
  lives: 0,
  waveNumber: 0,
  totalWaves: 0,
  isWaveInProgress: false,
  status: 'playing',
};

export function useEngineState(engine: GameEngine | null): EngineSnapshot {
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engine?.getSnapshot() ?? EMPTY_SNAPSHOT);

  useEffect(() => {
    if (!engine) {
      setSnapshot(EMPTY_SNAPSHOT);
      return;
    }
    setSnapshot(engine.getSnapshot());
    const refresh = () => setSnapshot(engine.getSnapshot());
    const unsubscribers = [
      engine.on('gold-changed', refresh),
      engine.on('lives-changed', refresh),
      engine.on('wave-changed', refresh),
      engine.on('status-changed', refresh),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [engine]);

  return snapshot;
}
```

- [ ] **Step 12: 테스트 통과 확인**

Run: `npx vitest run src/hooks/useEngineState.test.ts`
Expected: PASS

- [ ] **Step 13: App.test.tsx를 실제 화면 전환에 맞게 교체**

`src/App.test.tsx` 전체를 아래로 교체:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { MAPS } from './engine/maps';

describe('App', () => {
  it('shows the map select screen first', () => {
    render(<App />);
    expect(screen.getByTestId(`map-option-${MAPS[0].id}`)).toBeInTheDocument();
  });

  it('switches to the game screen after selecting a map', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId(`map-option-${MAPS[0].id}`));
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('hud-gold')).toBeInTheDocument();
  });
});
```

- [ ] **Step 14: 테스트 실패 확인**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (App이 아직 맵 선택 화면을 렌더링하지 않음)

- [ ] **Step 15: App.tsx 실제 구현으로 교체**

`src/App.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MapSelect } from './components/MapSelect';
import { ResultModal } from './components/ResultModal';
import { TowerShop } from './components/TowerShop';
import { GameEngine } from './engine/GameEngine';
import { MAPS } from './engine/maps';
import { TOWER_LIST } from './engine/towers';
import { useEngineState } from './hooks/useEngineState';

export function App() {
  const [mapId, setMapId] = useState<string | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  const map = useMemo(() => MAPS.find((m) => m.id === mapId) ?? null, [mapId]);
  const engine = useMemo(() => (map ? new GameEngine(map) : null), [map]);
  const state = useEngineState(engine);

  const handleRestart = () => {
    setMapId(null);
    setSelectedTowerId(null);
  };

  if (!map || !engine) {
    return <MapSelect maps={MAPS} onSelectMap={setMapId} />;
  }

  return (
    <div className="app">
      <HUD
        gold={state.gold}
        lives={state.lives}
        waveNumber={state.waveNumber}
        totalWaves={state.totalWaves}
        isWaveInProgress={state.isWaveInProgress}
        onStartWave={() => engine.startNextWave()}
      />
      <GameCanvas map={map} engine={engine} selectedTowerId={selectedTowerId} />
      <TowerShop
        towers={TOWER_LIST}
        gold={state.gold}
        selectedTowerId={selectedTowerId}
        onSelectTower={setSelectedTowerId}
      />
      {state.status !== 'playing' && <ResultModal status={state.status} onRestart={handleRestart} />}
    </div>
  );
}
```

- [ ] **Step 16: 테스트 통과 확인**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 17: 전체 테스트 스위트 실행**

Run: `npx vitest run`
Expected: 모든 테스트 PASS

- [ ] **Step 18: 커밋**

```bash
git add src/components/MapSelect.tsx src/components/MapSelect.test.tsx src/components/ResultModal.tsx src/components/ResultModal.test.tsx src/hooks/useEngineState.ts src/hooks/useEngineState.test.ts src/App.tsx src/App.test.tsx
git commit -m "feat: wire up map select, result modal, and full app screen flow"
```

---

### Task 15: 수동 플레이테스트 및 밸런스 점검

**Files:** 없음 (코드 변경 없이 수동 검증만 수행. 밸런스 조정이 필요하면 Task 2/3/4의 데이터 테이블 값만 수정)

이 태스크는 스펙 §7의 "캔버스 렌더링과 밸런스는 자동 테스트 대신 수동 플레이테스트로 확인한다"를 실행하는 단계다.

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev`

- [ ] **Step 2: 초원 경로(meadow) 맵을 처음부터 끝까지(보스 포함) 클리어해보고 다음을 확인**
  - 타워를 설치 가능 타일에서만 놓을 수 있는지
  - 골드가 부족하면 상점 버튼이 비활성화되는지
  - 웨이브 시작 버튼이 진행 중에는 비활성화되는지
  - 적이 끝까지 도달하면 라이프가 줄고, 0이 되면 패배 모달이 뜨는지
  - 보스 웨이브까지 클리어하면 승리 모달이 뜨는지

- [ ] **Step 3: 협곡(canyon), 요새(fortress) 맵도 동일하게 플레이해보고 난이도 체감 기록**
  - 초반 웨이브에서 타워 없이 몇 웨이브까지 버티는지
  - 후반 웨이브(특히 tank, shielded 조합)에서 골드가 부족해 방어가 뚫리는 구간이 있는지

- [ ] **Step 4: 필요 시 밸런스 조정**

문제가 발견되면 아래 파일의 상수만 조정한다 (로직 변경 없음):
  - `src/engine/towers.ts`의 `cost`/`damage`/`fireRate`
  - `src/engine/enemies.ts`의 `hp`/`speed`/`reward`
  - `src/engine/waveGenerator.ts`의 `count = 5 + i * 2` 증가폭

- [ ] **Step 5: 조정한 경우에만 커밋**

```bash
git add src/engine/towers.ts src/engine/enemies.ts src/engine/waveGenerator.ts
git commit -m "balance: tune tower/enemy stats and wave scaling from playtesting"
```

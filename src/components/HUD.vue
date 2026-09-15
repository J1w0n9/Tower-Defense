<script setup lang="ts">
import type { GameStatus } from '../engine/types';

defineProps<{
  gold: number;
  lives: number;
  waveNumber: number;
  totalWaves: number;
  status: GameStatus;
}>();

const emit = defineEmits<{
  'start-wave': [];
  save: [];
  load: [];
}>();
</script>

<template>
  <div class="hud">
    <div class="stats">
      <span class="stat gold">골드: {{ gold }}</span>
      <span class="stat lives">라이프: {{ lives }}</span>
      <span class="stat wave">웨이브: {{ waveNumber }} / {{ totalWaves }}</span>
    </div>
    <div class="actions">
      <button type="button" class="primary" :disabled="status !== 'playing'" @click="emit('start-wave')">
        다음 웨이브 시작
      </button>
      <button type="button" @click="emit('save')">저장</button>
      <button type="button" @click="emit('load')">불러오기</button>
    </div>
  </div>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--panel-border);
}

.stats {
  display: flex;
  gap: 1rem;
  font-weight: 600;
}

.stat.gold {
  color: var(--gold);
}

.stat.lives {
  color: var(--danger-strong);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.45rem 0.9rem;
  background: var(--panel-bg-raised);
  border: 1px solid var(--panel-border);
  border-radius: 0.35rem;
  color: var(--text);
}

button:not(:disabled):hover {
  border-color: var(--accent);
}

button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #1b1405;
  font-weight: 600;
}

button:disabled {
  opacity: 0.5;
}
</style>

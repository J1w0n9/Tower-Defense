<script setup lang="ts">
import { MAPS } from '../engine/maps';

const emit = defineEmits<{
  select: [mapId: string, endless: boolean];
}>();
</script>

<template>
  <div class="map-select">
    <h1>좀비 아포칼립스 디펜스</h1>
    <p class="subtitle">거점을 지킬 지역과 모드를 선택하세요</p>

    <section class="mode-section">
      <h2>일반 모드</h2>
      <div class="map-grid">
        <button v-for="map in MAPS" :key="map.id" type="button" class="map-card" @click="emit('select', map.id, false)">
          {{ map.name }}
        </button>
      </div>
    </section>

    <section class="mode-section">
      <h2>무한 모드</h2>
      <div class="map-grid">
        <button
          v-for="map in MAPS"
          :key="map.id"
          type="button"
          class="map-card endless"
          @click="emit('select', map.id, true)"
        >
          {{ map.name }} (무한)
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.map-select {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.05em;
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
}

.mode-section h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.map-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.map-card {
  min-width: 10rem;
  padding: 1.5rem 1.25rem;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 0.5rem;
  color: var(--text);
  font-size: 1.05rem;
  transition: background-color 0.15s, border-color 0.15s, transform 0.15s;
}

.map-card:hover {
  background: var(--panel-bg-raised);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.map-card.endless {
  border-color: var(--danger);
}

.map-card.endless:hover {
  border-color: var(--danger-strong);
}
</style>

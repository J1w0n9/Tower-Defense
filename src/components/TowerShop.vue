<script setup lang="ts">
import { TOWER_LIST } from '../engine/towers';
import { getTowerColor } from '../render/Renderer';

defineProps<{
  selectedTowerId: string | null;
  gold: number;
}>();

const emit = defineEmits<{
  select: [towerId: string];
}>();

function swatchColor(towerId: string, isSupport: boolean): string {
  return getTowerColor({ id: towerId, towerTypeId: towerId, position: { x: 0, y: 0 }, isSupport, range: 0 });
}
</script>

<template>
  <div class="tower-shop">
    <button
      v-for="tower in TOWER_LIST"
      :key="tower.id"
      type="button"
      class="tower-card"
      :disabled="gold < tower.cost && selectedTowerId !== tower.id"
      :class="{ selected: selectedTowerId === tower.id }"
      @click="emit('select', tower.id)"
    >
      <span class="swatch" :style="{ backgroundColor: swatchColor(tower.id, !!tower.support) }" />
      {{ tower.name }} ({{ tower.cost }}G)
    </button>
  </div>
</template>

<style scoped>
.tower-shop {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  overflow-x: auto;
  background: var(--panel-bg-raised);
  border-bottom: 1px solid var(--panel-border);
}

.tower-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 4.5rem;
  padding: 0.5rem 0.6rem;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 0.4rem;
  color: var(--text);
}

.tower-card:not(:disabled):hover {
  border-color: var(--accent);
}

.tower-card.selected {
  border-color: var(--accent);
  background: var(--panel-bg-raised);
  box-shadow: 0 0 0 1px var(--accent);
}

.tower-card:disabled {
  opacity: 0.4;
}

.swatch {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.45);
}

.tower-card {
  font-size: 0.85rem;
  white-space: nowrap;
}
</style>

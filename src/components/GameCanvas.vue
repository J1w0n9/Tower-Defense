<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { EngineActionResult, GameEngine } from '../engine/GameEngine';
import type { MapDefinition } from '../engine/types';
import { drawGame } from '../render/Renderer';

const props = defineProps<{
  map: MapDefinition;
  engine: GameEngine;
  selectedTowerId: string | null;
}>();

const emit = defineEmits<{
  'placement-result': [result: EngineActionResult];
  'tower-selected': [towerId: string | null];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let rafId = 0;
let lastTime = 0;

function frame(time: number): void {
  const dt = lastTime ? (time - lastTime) / 1000 : 0;
  lastTime = time;
  props.engine.update(dt);
  const ctx = canvasRef.value?.getContext('2d');
  if (ctx) drawGame(ctx, props.map, props.engine.getSnapshot());
  rafId = requestAnimationFrame(frame);
}

onMounted(() => {
  rafId = requestAnimationFrame(frame);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
});

function onCanvasClick(event: MouseEvent): void {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const cell = {
    x: Math.floor((event.clientX - rect.left) / props.map.cellSize),
    y: Math.floor((event.clientY - rect.top) / props.map.cellSize),
  };

  if (props.selectedTowerId) {
    emit('placement-result', props.engine.placeTower(cell, props.selectedTowerId));
    return;
  }

  const existing = props.engine.towers.find((t) => t.position.x === cell.x && t.position.y === cell.y);
  emit('tower-selected', existing?.id ?? null);
}
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="map.gridWidth * map.cellSize"
    :height="map.gridHeight * map.cellSize"
    @click="onCanvasClick"
  />
</template>

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
}>();
</script>

<template>
  <div class="hud">
    <span>골드: {{ gold }}</span>
    <span>라이프: {{ lives }}</span>
    <span>웨이브: {{ waveNumber }} / {{ totalWaves }}</span>
    <button type="button" :disabled="status !== 'playing'" @click="emit('start-wave')">다음 웨이브 시작</button>
  </div>
</template>

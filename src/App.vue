<script setup lang="ts">
import { reactive, ref, shallowRef } from 'vue';
import GameCanvas from './components/GameCanvas.vue';
import GameStatusModal from './components/GameStatusModal.vue';
import HUD from './components/HUD.vue';
import MapSelect from './components/MapSelect.vue';
import TowerShop from './components/TowerShop.vue';
import { GameEngine } from './engine/GameEngine';
import { MAPS } from './engine/maps';
import type { GameStatus, MapDefinition } from './engine/types';

const STARTING_GOLD = 150;
const STARTING_LIVES = 20;

const selectedMap = shallowRef<MapDefinition | null>(null);
const engine = shallowRef<GameEngine | null>(null);
const selectedTowerId = ref<string | null>(null);

const hud = reactive({
  gold: 0,
  lives: 0,
  waveNumber: 0,
  totalWaves: 0,
  status: 'playing' as GameStatus,
});

function selectMap(mapId: string): void {
  const map = MAPS.find((m) => m.id === mapId);
  if (!map) return;

  const newEngine = new GameEngine(map, STARTING_GOLD, STARTING_LIVES);
  hud.gold = newEngine.economy.gold;
  hud.lives = newEngine.economy.lives;
  hud.waveNumber = 0;
  hud.totalWaves = map.waves.length;
  hud.status = 'playing';

  newEngine.events.on('gold-changed', (gold) => (hud.gold = gold));
  newEngine.events.on('lives-changed', (lives) => (hud.lives = lives));
  newEngine.events.on('wave-changed', (wave) => (hud.waveNumber = wave.current));
  newEngine.events.on('status-changed', (status) => (hud.status = status));

  selectedMap.value = map;
  engine.value = newEngine;
  selectedTowerId.value = null;
}

function startWave(): void {
  engine.value?.startNextWave();
}

function selectTower(towerId: string): void {
  selectedTowerId.value = towerId;
}

function restart(): void {
  selectedMap.value = null;
  engine.value = null;
  selectedTowerId.value = null;
}
</script>

<template>
  <MapSelect v-if="!selectedMap || !engine" @select="selectMap" />
  <template v-else>
    <HUD
      :gold="hud.gold"
      :lives="hud.lives"
      :wave-number="hud.waveNumber"
      :total-waves="hud.totalWaves"
      :status="hud.status"
      @start-wave="startWave"
    />
    <TowerShop :selected-tower-id="selectedTowerId" :gold="hud.gold" @select="selectTower" />
    <GameCanvas :map="selectedMap" :engine="engine" :selected-tower-id="selectedTowerId" />
    <GameStatusModal v-if="hud.status !== 'playing'" :status="hud.status" @restart="restart" />
  </template>
</template>

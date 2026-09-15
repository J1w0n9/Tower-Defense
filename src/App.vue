<script setup lang="ts">
import { reactive, ref, shallowRef } from 'vue';
import GameCanvas from './components/GameCanvas.vue';
import GameStatusModal from './components/GameStatusModal.vue';
import HUD from './components/HUD.vue';
import MapSelect from './components/MapSelect.vue';
import TowerInspector from './components/TowerInspector.vue';
import TowerShop from './components/TowerShop.vue';
import type { GameSaveState } from './engine/GameEngine';
import { GameEngine } from './engine/GameEngine';
import { MAPS } from './engine/maps';
import type { GameStatus, MapDefinition } from './engine/types';
import { LocalStorageSaveService } from './persistence/SaveService';

const STARTING_GOLD = 150;
const STARTING_LIVES = 20;
const SAVE_SLOT = 1;

const saveService = new LocalStorageSaveService();

const selectedMap = shallowRef<MapDefinition | null>(null);
const engine = shallowRef<GameEngine | null>(null);
const selectedTowerId = ref<string | null>(null);
const selectedTowerInstanceId = ref<string | null>(null);
const towerPanel = ref<{
  name: string;
  level: number;
  upgradeCost: number;
  canUpgrade: boolean;
  sellRefund: number;
} | null>(null);

const hud = reactive({
  gold: 0,
  lives: 0,
  waveNumber: 0,
  totalWaves: 0,
  status: 'playing' as GameStatus,
});

function attachEngine(map: MapDefinition, newEngine: GameEngine): void {
  const snapshot = newEngine.getSnapshot();
  hud.gold = snapshot.gold;
  hud.lives = snapshot.lives;
  hud.waveNumber = snapshot.waveNumber;
  hud.totalWaves = map.waves.length;
  hud.status = snapshot.status;

  newEngine.events.on('gold-changed', (gold) => (hud.gold = gold));
  newEngine.events.on('lives-changed', (lives) => (hud.lives = lives));
  newEngine.events.on('wave-changed', (wave) => (hud.waveNumber = wave.current));
  newEngine.events.on('status-changed', (status) => (hud.status = status));

  selectedMap.value = map;
  engine.value = newEngine;
  selectedTowerId.value = null;
  selectedTowerInstanceId.value = null;
  towerPanel.value = null;
}

function selectMap(mapId: string): void {
  const map = MAPS.find((m) => m.id === mapId);
  if (!map) return;
  attachEngine(map, new GameEngine(map, STARTING_GOLD, STARTING_LIVES));
}

function startWave(): void {
  engine.value?.startNextWave();
}

function selectTower(towerId: string): void {
  selectedTowerId.value = selectedTowerId.value === towerId ? null : towerId;
}

function refreshTowerPanel(): void {
  const tower = engine.value?.towers.find((t) => t.id === selectedTowerInstanceId.value);
  towerPanel.value = tower
    ? {
        name: tower.stats.name,
        level: tower.level,
        upgradeCost: tower.upgradeCost,
        canUpgrade: tower.canUpgrade(),
        sellRefund: tower.sellValue,
      }
    : null;
}

function onTowerSelected(towerId: string | null): void {
  selectedTowerInstanceId.value = towerId;
  refreshTowerPanel();
}

function upgradeSelectedTower(): void {
  if (!selectedTowerInstanceId.value) return;
  engine.value?.upgradeTower(selectedTowerInstanceId.value);
  refreshTowerPanel();
}

function sellSelectedTower(): void {
  if (!selectedTowerInstanceId.value) return;
  engine.value?.sellTower(selectedTowerInstanceId.value);
  closeTowerPanel();
}

function closeTowerPanel(): void {
  selectedTowerInstanceId.value = null;
  towerPanel.value = null;
}

function saveGame(): void {
  if (!engine.value) return;
  saveService.save(SAVE_SLOT, engine.value.serialize());
}

function loadGame(): void {
  const state = saveService.load(SAVE_SLOT) as GameSaveState | null;
  if (!state) return;
  const map = MAPS.find((m) => m.id === state.mapId);
  if (!map) return;

  const newEngine = new GameEngine(map, STARTING_GOLD, STARTING_LIVES);
  newEngine.loadSnapshot(state);
  attachEngine(map, newEngine);
}

function restart(): void {
  selectedMap.value = null;
  engine.value = null;
  selectedTowerId.value = null;
  selectedTowerInstanceId.value = null;
  towerPanel.value = null;
}
</script>

<template>
  <MapSelect v-if="!selectedMap || !engine" @select="selectMap" />
  <div v-else class="game-shell">
    <HUD
      :gold="hud.gold"
      :lives="hud.lives"
      :wave-number="hud.waveNumber"
      :total-waves="hud.totalWaves"
      :status="hud.status"
      @start-wave="startWave"
      @save="saveGame"
      @load="loadGame"
    />
    <TowerShop :selected-tower-id="selectedTowerId" :gold="hud.gold" @select="selectTower" />
    <div class="game-area">
      <GameCanvas
        :map="selectedMap"
        :engine="engine"
        :selected-tower-id="selectedTowerId"
        @tower-selected="onTowerSelected"
      />
      <TowerInspector
        v-if="towerPanel"
        :tower="towerPanel"
        @upgrade="upgradeSelectedTower"
        @sell="sellSelectedTower"
        @close="closeTowerPanel"
      />
    </div>
    <GameStatusModal v-if="hud.status !== 'playing'" :status="hud.status" @restart="restart" />
  </div>
</template>

<style scoped>
.game-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.game-area {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  overflow: hidden;
}
</style>

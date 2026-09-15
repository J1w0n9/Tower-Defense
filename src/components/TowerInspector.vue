<script setup lang="ts">
defineProps<{
  tower: { name: string; level: number; upgradeCost: number; canUpgrade: boolean; sellRefund: number };
}>();

const emit = defineEmits<{
  upgrade: [];
  sell: [];
  close: [];
}>();
</script>

<template>
  <div class="tower-inspector">
    <div class="header">
      <span class="name">{{ tower.name }} (Lv.{{ tower.level }})</span>
      <button type="button" class="close" @click="emit('close')">닫기</button>
    </div>
    <div class="actions">
      <button type="button" class="upgrade" :disabled="!tower.canUpgrade" @click="emit('upgrade')">
        업그레이드 ({{ tower.upgradeCost }}G)
      </button>
      <button type="button" class="sell" @click="emit('sell')">판매 ({{ tower.sellRefund }}G)</button>
    </div>
  </div>
</template>

<style scoped>
.tower-inspector {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: var(--panel-bg-raised);
  border: 1px solid var(--panel-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  min-width: 12rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.name {
  font-weight: 600;
}

button {
  padding: 0.4rem 0.6rem;
  border-radius: 0.35rem;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--text);
  font-size: 0.85rem;
}

.close {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.upgrade:not(:disabled) {
  border-color: var(--success);
  color: var(--success);
}

.upgrade:disabled {
  opacity: 0.5;
}

.sell {
  border-color: var(--danger);
  color: var(--danger-strong);
}
</style>

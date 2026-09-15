<script setup lang="ts">
defineProps<{
  status: 'won' | 'lost';
}>();

const emit = defineEmits<{
  restart: [];
}>();
</script>

<template>
  <div class="overlay">
    <div class="game-status-modal" :class="status">
      <h2 v-if="status === 'won'">승리! 거점을 지켜냈습니다.</h2>
      <h2 v-else>게임 오버 — 거점이 함락되었습니다.</h2>
      <button type="button" @click="emit('restart')">다시 시작</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 12, 8, 0.75);
  z-index: 20;
}

.game-status-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 2.5rem;
  background: var(--panel-bg-raised);
  border: 1px solid var(--panel-border);
  border-radius: 0.6rem;
  text-align: center;
}

.game-status-modal.won h2 {
  color: var(--success);
}

.game-status-modal.lost h2 {
  color: var(--danger-strong);
}

h2 {
  margin: 0;
  font-size: 1.4rem;
}

button {
  padding: 0.6rem 1.5rem;
  background: var(--accent);
  border: none;
  border-radius: 0.4rem;
  color: #1b1405;
  font-weight: 600;
  font-size: 1rem;
}
</style>

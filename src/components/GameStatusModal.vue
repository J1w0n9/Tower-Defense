<script setup lang="ts">
defineProps<{
  status: 'won' | 'lost';
}>();

const emit = defineEmits<{
  restart: [];
}>();
</script>

<template>
  <div class="game-status-modal">
    <h2 v-if="status === 'won'">승리! 거점을 지켜냈습니다.</h2>
    <h2 v-else>게임 오버 — 거점이 함락되었습니다.</h2>
    <button type="button" @click="emit('restart')">다시 시작</button>
  </div>
</template>

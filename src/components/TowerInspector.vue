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
    <span>{{ tower.name }} (Lv.{{ tower.level }})</span>
    <button type="button" :disabled="!tower.canUpgrade" @click="emit('upgrade')">
      업그레이드 ({{ tower.upgradeCost }}G)
    </button>
    <button type="button" @click="emit('sell')">판매 ({{ tower.sellRefund }}G)</button>
    <button type="button" @click="emit('close')">닫기</button>
  </div>
</template>

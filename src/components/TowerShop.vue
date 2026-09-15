<script setup lang="ts">
import { TOWER_LIST } from '../engine/towers';

defineProps<{
  selectedTowerId: string | null;
  gold: number;
}>();

const emit = defineEmits<{
  select: [towerId: string];
}>();
</script>

<template>
  <div class="tower-shop">
    <button
      v-for="tower in TOWER_LIST"
      :key="tower.id"
      type="button"
      :disabled="gold < tower.cost"
      :class="{ selected: selectedTowerId === tower.id }"
      @click="emit('select', tower.id)"
    >
      {{ tower.name }} ({{ tower.cost }}G)
    </button>
  </div>
</template>

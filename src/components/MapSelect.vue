<script setup lang="ts">
import { MAPS } from '../engine/maps';

const emit = defineEmits<{
  select: [mapId: string];
}>();
</script>

<template>
  <div class="map-select">
    <button v-for="map in MAPS" :key="map.id" type="button" @click="emit('select', map.id)">
      {{ map.name }}
    </button>
  </div>
</template>

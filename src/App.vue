<script setup lang="ts">
import { ref } from 'vue';
import type { Scene } from 'phaser';
import PhaserGame from './PhaserGame.vue';

//  References to the PhaserGame component (game and scene are exposed)
const phaserRef = ref();

// Event emitted from the PhaserGame component
const currentScene = (scene: Scene) => {
  console.log(scene)
}
</script>

<template>
  <PhaserGame ref="phaserRef" @current-active-scene="currentScene" />
</template>

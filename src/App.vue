<script setup lang="ts">
import { ref } from 'vue';
import type { MainMenu } from './game/scenes/MainMenu';
import PhaserGame from './PhaserGame.vue';
import HelloWorld from './components/HelloWorld.vue';

//  References to the PhaserGame component (game and scene are exposed)
const phaserRef = ref();

// Event emitted from the PhaserGame component
const currentScene = (scene: MainMenu) => {
  console.log(scene)
}

</script>

<template>
  <PhaserGame ref="phaserRef" @current-active-scene="currentScene" />
</template>

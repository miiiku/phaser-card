<script setup lang="ts">
import Phaser from 'phaser';
import { onMounted, onUnmounted, ref } from 'vue';
import { EventBus } from './game/EventBus';
import StartGame from './game/main';

// Save the current scene instance
const scene = ref();
const game = ref();

const emit = defineEmits(['current-active-scene']);

onMounted(() => {

  game.value = StartGame('game-container');

  EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) => {

    emit('current-active-scene', scene_instance);

    scene.value = scene_instance;

  });

});

onUnmounted(() => {

  if (game.value) {
    game.value.destroy(true);
    game.value = null;
  }

});

defineExpose({ scene, game });

</script>

<template>
  <div id="game-container"></div>
</template>

<style scoped>
/* Scale Manager 依据父容器的计算尺寸来缩放，父容器必须有明确的宽高。 */
#game-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000000;
  touch-action: none;
}

#game-container :deep(canvas) {
  display: block;
}
</style>
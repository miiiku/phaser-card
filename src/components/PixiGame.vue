<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ASSET_ALIASES, ASSET_BUNDLES } from '@game/assets/assetAliases'
import { loadAssetBundle } from '@game/assets/assetManager'
import { createGameApplication } from '@game/core/createGameApplication'
import { createLoadingScene } from '@game/scenes/createLoadingScene'
import { createMainScene } from '@game/scenes/createMainScene'
import type { LoadingScene } from '@game/scenes/createLoadingScene'
import type { MainScene } from '@game/scenes/createMainScene'
import type { Application } from 'pixi.js'

const container = ref<HTMLElement | null>(null)

let app: Application | null = null
let loadingScene: LoadingScene | null = null
let mainScene: MainScene | null = null
let isUnmounted = false

const waitForMinimumDuration = (startedAt: number, duration: number): Promise<void> => {
  const remaining = Math.max(0, duration - (performance.now() - startedAt))

  return new Promise((resolve) => {
    window.setTimeout(resolve, remaining)
  })
}

onMounted(async () => {
  const host = container.value

  if (!host) return

  const nextApp = await createGameApplication({
    resizeTo: host,
    preference: 'webgl',
    background: '#070916',
    backgroundAlpha: 1,
  })

  if (isUnmounted) {
    nextApp.destroy({ releaseGlobalResources: true })
    return
  }

  app = nextApp
  host.appendChild(nextApp.canvas)

  const nextLoadingScene = createLoadingScene(nextApp)
  loadingScene = nextLoadingScene
  nextApp.stage.addChild(nextLoadingScene.container)

  const loadingStartedAt = performance.now()

  try {
    const mainAssets = await loadAssetBundle(
      ASSET_BUNDLES.MAIN,
      (progress) => {
        if (!isUnmounted) nextLoadingScene.setProgress(progress)
      },
    )

    await waitForMinimumDuration(loadingStartedAt, 650)

    if (isUnmounted) return

    nextLoadingScene.setProgress(1)
    const nextMainScene = createMainScene(nextApp, {
      backgroundTexture: mainAssets[ASSET_ALIASES.MAIN_BACKGROUND],
      deckHeaderTexture: mainAssets[ASSET_ALIASES.DECK_HEADER],
      deckTextures: [
        mainAssets[ASSET_ALIASES.DECK_ICE_MAGIC],
        mainAssets[ASSET_ALIASES.DECK_UNDEAD],
        mainAssets[ASSET_ALIASES.DECK_DRAGON],
        mainAssets[ASSET_ALIASES.DECK_NATURE],
      ],
      deckSelectedTexture: mainAssets[ASSET_ALIASES.DECK_SELECTED_OVERLAY],
    })
    mainScene = nextMainScene
    nextApp.stage.addChildAt(nextMainScene.container, 0)

    nextLoadingScene.destroy()
    loadingScene = null
  } catch (error) {
    console.error('Failed to load game assets.', error)
    nextLoadingScene.setError()
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  loadingScene?.destroy()
  loadingScene = null
  mainScene?.destroy()
  mainScene = null

  app?.destroy(
    { removeView: true, releaseGlobalResources: true },
    { children: true },
  )
  app = null
})
</script>

<template>
  <main ref="container" class="pixi-game" aria-label="抽卡卡牌游戏"></main>
</template>

<style scoped>
.pixi-game {
  position: fixed;
  inset: 0;
  width: 100dvw;
  height: 100dvh;
  overflow: hidden;
  background: #070916;
  touch-action: none;
}

.pixi-game :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

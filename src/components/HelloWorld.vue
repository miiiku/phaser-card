<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { CSSProperties } from 'vue';

// rotate = [
//   上下移动产生多少X轴旋转（上下移动对应X轴转动）,
//   左右移动产生多少Y轴旋转（左右移动对应Y轴转动）,
//   左右移动产生多少Z轴旋转,
//   上下移动产生多少Z轴旋转
// ]

interface CardLayer {
  src: string;
  depth: number;
  stack: number;
  label: string;
  scale?: number;
  origin?: string;
  rotate?: number[];
}

interface CardPreset {
  clip: [number, number, number, number];
  maxAngle: [number, number];
  frame: { src: string; label: string };
  layers: CardLayer[];
}

const cardPresets: CardPreset = {
  clip: [2, 3.125, 4, 3.125],
  maxAngle: [4, 10],
  frame: { src: '/undead-card-layers/frame.png', label: "边框" },
  layers: [
    { src: '/undead-card-layers/background.png', depth: -5, stack: 1, scale: 1.08, label: "背景" },
    { src: '/undead-card-layers/rear-decoration.png', depth: -2, stack: 2, origin: '50% 20%', rotate: [-2.5, -2.5, -5, -1], scale: 1.09, label: "后景装饰" },
    { src: '/undead-card-layers/subject.png', depth: -0.8, stack: 3, scale: 1.2, label: "角色主体" },
    { src: '/undead-card-layers/foreground-decoration.png', depth: 1, stack: 4, label: "前景装饰" },
  ],
}

const layersStyle = computed<CSSProperties>(() => {
  const [top, right, bottom, left] = cardPresets.clip;
  const polygon = `
      ${left}% ${top}%,
      ${100 - right}% ${top}%,
      ${100 - right}% ${100 - bottom}%,
      ${left}% ${100 - bottom}%
    `
  return { clipPath: `polygon(${polygon})` }
})

const cardRef = ref<HTMLElement | null>(null)
const pointer = ref({ x: 0, y: 0 })
const isHovering = ref(false)
let animationFrame = 0

const clamp = (value: number): number => Math.max(-1, Math.min(1, value))

const cardStyle = computed<CSSProperties>(() => {
  const [inline = 10, block = 10] = cardPresets.maxAngle
  return {
    '--pointer-x': `${(pointer.value.x + 1) * 50}%`,
    '--pointer-y': `${(pointer.value.y + 1) * 50}%`,
    transform: `rotateX(${-pointer.value.y * inline}deg) rotateY(${pointer.value.x * block}deg)`,
  }
})

const getLayerStyle = (layer: CardLayer): CSSProperties => ({
  zIndex: layer.stack,
  transform: `translate3d(${pointer.value.x * layer.depth}%, ${pointer.value.y * layer.depth}%, 0)`,
})

const getLocalStyle = (layer: CardLayer): CSSProperties => {
  const [rx = 0, ry = 0, rz = 0, rzy = 0] = layer.rotate ?? []
  const x = pointer.value.x
  const y = pointer.value.y
  return  {
    transformOrigin: layer.origin || '50% 50%',
    transform: `rotateX(${y * rx}deg) rotateY(${x * ry}deg) rotateZ(${x * rz + y * rzy}deg)`
  }
}

const updatePointer = (event: PointerEvent): void => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const rect = cardRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1)
  const y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1)

  cancelAnimationFrame(animationFrame)

  animationFrame = requestAnimationFrame(() => {
    pointer.value = { x, y }
  })
}

const handlePointerEnter = (): void => {
  isHovering.value = true
}

const resetCard = (): void => {
  cancelAnimationFrame(animationFrame)
  isHovering.value = false
  pointer.value = { x: 0, y: 0 }
}

onBeforeUnmount(() => cancelAnimationFrame(animationFrame))
</script>

<template>
  <div class="flex items-center justify-center w-dvw h-dvh">
    <div class="absolute top-0">
      <div>x: {{ pointer.x }}</div>
      <div>y: {{ pointer.y }}</div>
    </div>
    
    <div class="card-perspective">
      <div
        ref="cardRef"
        class="parallax-card relative w-60 aspect-2/3 bg-amber-50"
        :class="{ 'is-hovering': isHovering }"
        :style="cardStyle"
        @pointerenter="handlePointerEnter"
        @pointermove="updatePointer"
        @pointerleave="resetCard"
        @pointercancel="resetCard"
      >
        <div class="absolute inset-0 size-full" :style="layersStyle">
          <div
            v-for="(layer, idx) in cardPresets.layers"
            :key="idx"
            :data-depth="layer.depth"
            :style="getLayerStyle(layer)"
            class="parallax-layer absolute inset-0 size-full"
          >
            <div
              :data-rotate="(layer.rotate ?? [0, 0, 0, 0]).join(',')"
              :style="getLocalStyle(layer)"
              class="absolute inset-0 size-full pointer-events-none"
            >
              <img
                :style="{ transform: `scale(${layer.scale})` }"
                :src="layer.src"
                :alt="layer.label"
                class="block size-full object-cover"
              />
            </div>
          </div>
          <div class="absolute inset-0 size-full z-20" style="box-shadow: inset 0 0 16px 24px rgba(0, 0, 0, 0.5);"></div>
        </div>
        <div class="absolute inset-0 size-full z-20 translate-z-px pointer-events-none">
          <img class="block size-full object-cover" :src="cardPresets.frame.src" :alt="cardPresets.frame.label">
        </div>
        <div class="card-glare absolute inset-0 size-full" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-perspective {
  perspective: 900px;
}

.parallax-card {
  transform-style: preserve-3d;
  transition: transform 180ms ease-out, filter 250ms ease-out;
  will-change: transform;
  touch-action: pan-y;
}

.parallax-card.is-hovering {
  filter: drop-shadow(0 18px 22px rgb(0 0 0 / 0.28));
}

.parallax-layer {
  transition: transform 180ms ease-out;
  will-change: transform;
}

.card-glare {
  z-index: 21;
  opacity: 0;
  background: radial-gradient(circle at var(--pointer-x) var(--pointer-y),
      rgb(255 255 255 / 0.28),
      transparent 42%);
  mix-blend-mode: soft-light;
  transition: opacity 250ms ease-out;
  pointer-events: none;
}

.parallax-card.is-hovering .card-glare {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .parallax-card,
  .parallax-layer,
  .card-glare {
    transition: none;
  }

  .card-glare {
    display: none;
  }
}
</style>

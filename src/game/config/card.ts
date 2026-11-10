export interface ParallaxCardLayerPreset {
  depth: number;
  scale: number;
  // [originX, originY, rzX, rzY]：旋转中心和指针在 X/Y 方向移动时的 Z 轴旋转角度。
  rotate?: [number, number, number, number];
}

// 卡牌轮廓裁减区域，百分比
export interface CardClip {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// 卡牌
export const CARDS = ['undead', 'cthulhu', 'cosmic-octopus', 'cosmic-octopus-2']

// 卡牌分层
export const CARD_LAYERS = [
  'background',
  'rear-decoration',
  'subject',
  'foreground-decoration',
  'frame',
  'mask',
  'back',
]

// 卡牌框架
export const CARD_FRAMES = [
  'frame',
  'back',
  'mask'
]

export const DEFAULT_LAYER_CONFIG: Record<string, ParallaxCardLayerPreset> = {
  'background': { depth: -5, scale: 1.08 },
  'rear-decoration': { depth: -2, scale: 1.09, rotate: [0.5, 0.2, -5, -0.5] },
  'subject': { depth: -0.8, scale: 1.2 },
  'foreground-decoration': { depth: 1, scale: 1 },
}

export const cardLayers = Object.keys(DEFAULT_LAYER_CONFIG)

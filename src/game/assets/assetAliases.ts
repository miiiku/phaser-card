import type { Texture } from 'pixi.js'

export const ASSET_BUNDLES = Object.freeze({
  MAIN: 'main',
} as const)

export type AssetBundleName = (typeof ASSET_BUNDLES)[keyof typeof ASSET_BUNDLES]

export const ASSET_ALIASES = Object.freeze({
  MAIN_BACKGROUND: 'scene.main.background',
  DECK_HEADER: 'ui.deck.header',
  DECK_ICE_MAGIC: 'ui.deck.ice-magic',
  DECK_UNDEAD: 'ui.deck.undead',
  DECK_DRAGON: 'ui.deck.dragon',
  DECK_NATURE: 'ui.deck.nature',
  DECK_SELECTED_OVERLAY: 'ui.deck.selected-overlay',
} as const)

export type AssetAlias = (typeof ASSET_ALIASES)[keyof typeof ASSET_ALIASES]

/**
 * `main` 资源包内的 alias 与贴图一一对应，
 * 加载完成后可按 `ASSET_ALIASES.*` 直接取值。
 */
export type MainBundleAssets = Record<AssetAlias, Texture>

/**
 * 资源包名到加载结果类型的映射，供 `loadAssetBundle` 推断返回值。
 * 新增资源包时在这里补充对应条目。
 */
export type AssetBundleMap = {
  [Bundle in AssetBundleName]: MainBundleAssets
}

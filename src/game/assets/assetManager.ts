import '@esotericsoftware/spine-pixi-v8'
import { Assets } from 'pixi.js'
import type { AssetBundleMap, AssetBundleName } from './assetAliases'
import { assetManifest } from './assetManifest'

export type AssetProgressHandler = (progress: number) => void

let initializationPromise: Promise<void> | null = null

/**
 * Pixi Assets 只能初始化一次，所有场景共用同一个资源解析器与缓存。
 */
export function initializeAssets(): Promise<void> {
  initializationPromise ??= Assets.init({
    basePath: '/game',
    manifest: assetManifest,
    loadOptions: {
      strategy: 'retry',
      retryCount: 3,
      retryDelay: 300,
    },
  })

  return initializationPromise
}

export async function loadAssetBundle<Bundle extends AssetBundleName>(
  bundleName: Bundle,
  onProgress?: AssetProgressHandler,
): Promise<AssetBundleMap[Bundle]> {
  await initializeAssets()

  return Assets.loadBundle(bundleName, onProgress) as Promise<AssetBundleMap[Bundle]>
}

export function preloadAssetBundle(bundleName: AssetBundleName): Promise<void> {
  return Assets.backgroundLoadBundle(bundleName)
}

export function unloadAssetBundle(bundleName: AssetBundleName): Promise<void> {
  return Assets.unloadBundle(bundleName)
}

import { Spine } from '@esotericsoftware/spine-pixi-v8'
import type { SpineFromOptions } from '@esotericsoftware/spine-pixi-v8'
import { Assets } from 'pixi.js'

/** 单个 Spine 资源（skeleton 或 atlas）的注册信息。 */
export interface SpineAssetFile {
  /** 资源 alias，需全局唯一。 */
  alias: string
  /** 资源路径。 */
  src: string
}

export interface SpineAssetSet {
  skeleton: SpineAssetFile
  atlas: SpineAssetFile
}

/** 加载完成后可直接传给 `createSpine` 的 alias 组合。 */
export interface LoadedSpineAssets {
  skeleton: string
  atlas: string
}

/**
 * 注册并加载一组 Spine skeleton 与 atlas 资源。
 */
export async function loadSpineAssets({
  skeleton,
  atlas,
}: SpineAssetSet): Promise<LoadedSpineAssets> {
  Assets.add({ alias: skeleton.alias, src: skeleton.src })
  Assets.add({ alias: atlas.alias, src: atlas.src })

  await Assets.load([skeleton.alias, atlas.alias])

  return {
    skeleton: skeleton.alias,
    atlas: atlas.alias,
  }
}

/** 创建 Spine 显示对象所需的参数，与 `loadSpineAssets` 的返回值和额外选项兼容。 */
export type CreateSpineOptions = SpineFromOptions

/**
 * 从已加载的资源创建 Spine 显示对象。
 */
export function createSpine(options: CreateSpineOptions): Spine {
  return new Spine(Spine.createOptions(options))
}

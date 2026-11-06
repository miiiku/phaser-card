import { Application } from 'pixi.js'
import type { ApplicationOptions } from 'pixi.js'

/** 创建 Pixi 应用时允许覆盖的初始化选项。 */
export type GameApplicationOptions = Partial<ApplicationOptions>

/**
 * 创建尚未挂载到 DOM 的 Pixi 应用。
 * 由 Vue 页面在组件挂载后决定将 app.canvas 放入哪个容器。
 */
export async function createGameApplication(
  options: GameApplicationOptions = {},
): Promise<Application> {
  const app = new Application()

  await app.init({
    antialias: true,
    autoDensity: true,
    backgroundAlpha: 0,
    resolution: globalThis.devicePixelRatio ?? 1,
    resizeTo: globalThis.window,
    ...options,
  })

  return app
}

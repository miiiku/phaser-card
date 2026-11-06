import { Container, Graphics, Text } from 'pixi.js'
import type { Application } from 'pixi.js'

const clamp = (value: number): number => Math.max(0, Math.min(1, value))

/** 加载场景对外暴露的控制接口。 */
export interface LoadingScene {
  container: Container
  /** 设置 0 ~ 1 的加载进度。 */
  setProgress(value: number): void
  /** 展示加载失败提示。 */
  setError(message?: string): void
  destroy(): void
}

export function createLoadingScene(app: Application): LoadingScene {
  const container = new Container()
  const backdrop = new Graphics()
  const ornament = new Graphics()
  const progressTrack = new Graphics()
  const progressFill = new Graphics()
  const title = new Text({
    text: 'ARCANA',
    style: {
      fill: 0xf2d28f,
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: 42,
      fontWeight: '600',
      letterSpacing: 9,
    },
  })
  const status = new Text({
    text: '正在加载游戏资源',
    style: {
      fill: 0xc8bcaa,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 15,
      letterSpacing: 2,
    },
  })
  const percentage = new Text({
    text: '0%',
    style: {
      fill: 0xf2d28f,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 13,
      fontWeight: '600',
    },
  })

  let progress = 0
  let barWidth = 0

  container.label = 'loading-scene'
  title.anchor.set(0.5)
  status.anchor.set(0.5)
  percentage.anchor.set(0.5)
  container.addChild(
    backdrop,
    ornament,
    title,
    status,
    progressTrack,
    progressFill,
    percentage,
  )

  const drawProgress = (): void => {
    progressFill
      .clear()
      .roundRect(0, 0, barWidth * progress, 4, 2)
      .fill({ color: 0xe6b95f })
    percentage.text = `${Math.round(progress * 100)}%`
  }

  const resize = (): void => {
    const { width, height } = app.screen
    const centerX = width / 2
    const centerY = height / 2

    barWidth = Math.min(420, width * 0.68)

    backdrop
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x070916 })

    ornament
      .clear()
      .circle(centerX, centerY - 78, 54)
      .stroke({ color: 0x8e6933, width: 1, alpha: 0.55 })
      .circle(centerX, centerY - 78, 42)
      .stroke({ color: 0x8e6933, width: 1, alpha: 0.28 })

    title.position.set(centerX, centerY - 78)
    status.position.set(centerX, centerY + 20)
    progressTrack.position.set(centerX - barWidth / 2, centerY + 62)
    progressFill.position.copyFrom(progressTrack.position)
    percentage.position.set(centerX, centerY + 88)

    progressTrack
      .clear()
      .roundRect(0, 0, barWidth, 4, 2)
      .fill({ color: 0x5a4b3a, alpha: 0.45 })

    drawProgress()
  }

  app.renderer.on('resize', resize)
  resize()

  return Object.freeze({
    container,
    setProgress(value: number): void {
      progress = clamp(value)
      drawProgress()
    },
    setError(message = '资源加载失败，请刷新页面重试'): void {
      status.text = message
      status.style.fill = 0xe9a3a3
    },
    destroy(): void {
      app.renderer.off('resize', resize)
      container.removeFromParent()
      container.destroy({ children: true })
    },
  })
}

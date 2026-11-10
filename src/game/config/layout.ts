import type { GameObjects } from "phaser";

/** 游戏内容的固定设计尺寸；屏幕多出的区域只用于展示扩展背景。 */
export const DESIGN_WIDTH = 1024;
export const DESIGN_HEIGHT = 768;

/** 将 1024×768 的安全游戏区域居中到 EXPAND 后的逻辑画布中。 */
export function centerDesignArea(
  root: GameObjects.Container,
  viewportWidth: number,
  viewportHeight: number,
) {
  root.setPosition(
    (viewportWidth - DESIGN_WIDTH) / 2,
    (viewportHeight - DESIGN_HEIGHT) / 2,
  );
}

/** 类似 CSS background-size: cover：保持图片比例并铺满整个逻辑画布。 */
export function coverViewport(
  image: GameObjects.Image,
  viewportWidth: number,
  viewportHeight: number,
) {
  const coverScale = Math.max(
    viewportWidth / image.width,
    viewportHeight / image.height,
  );

  image
    .setPosition(viewportWidth / 2, viewportHeight / 2)
    .setScale(coverScale);
}

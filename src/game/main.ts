import { Game, Scale, WEBGL } from "phaser";
import { Preloader } from "./scenes/Preloader";
import { MainGame } from "./scenes/MainGame";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./config/layout";

const scaleConfig: Phaser.Types.Core.ScaleConfig = {
  // Canvas 铺满父容器，同时保持 1024×768 为居中的安全游戏区域。
  mode: Scale.EXPAND,
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  autoCenter: Scale.CENTER_BOTH,
  expandParent: true,
};

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: WEBGL,
  parent: "game-container",
  backgroundColor: "#000000",
  scene: [Preloader, MainGame],
  scale: { ...scaleConfig },
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;

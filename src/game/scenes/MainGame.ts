import { GameObjects, Scale, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { centerDesignArea, coverViewport, DESIGN_HEIGHT, DESIGN_WIDTH } from "../config/layout";
import { CARD_LAYERS, CARDS } from "../config/card";
import { ParallaxCard, type ParallaxCardOptions } from "../objects/ParallaxCard";

export class MainGame extends Scene {
  private cards: ParallaxCard[] = [];
  private background!: GameObjects.Image;
  private container!: GameObjects.Container;

  constructor() {
    super("MainGame");
  }

  preload() {
    // 场景负责加载资源；ParallaxCard 只使用已经加载完成的纹理创建卡牌。
    CARDS.forEach((card) => {
      CARD_LAYERS.forEach((layer) => {
        this.load.image(`${card}/${layer}`, `/game/cards/${card}/${layer}.png`);
      })
    })
  }

  create() {
    const gap = [10, 10];
    const size = [240 * 1.4, 360 * 1.4];

    // background 属于全屏逻辑画布；
    this.background = this.add.image(0, 0, "background").setOrigin(0.5);
    // container 内部始终使用 1024×768 的设计坐标；
    this.container = this.add.container(0, 0);

    const cardConfigs: Omit<ParallaxCardOptions, 'x' | 'y' | 'width' | 'height'>[] = [
      { card: 'undead', initialFace: "back", flipOnClick: true },
      { card: 'cosmic-octopus', initialFace: "back", flipOnClick: true },
      { card: 'cthulhu', initialFace: "back", flipOnClick: true },
    ];

    const startX = (DESIGN_WIDTH - (size[0] + gap[0]) * cardConfigs.length - gap[0]) / 2;
    const centerY = DESIGN_HEIGHT / 2;

    this.cards = cardConfigs.map((card, index) => {
      return new ParallaxCard(this, {
        x: (size[0] + gap[0]) * index + startX + size[0] * 0.5,
        y: centerY,
        width: size[0],
        height: size[1],
        ...card
      });
    });
    this.container.add(this.cards);

    // 调试按钮放在设计区域内，和游戏内容一起居中；翻转期间禁止重复触发。
    const debugButton = this.add.text(0, 24, "", {
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#263347",
      padding: { x: 16, y: 10 },
    }).setInteractive({ cursor: "pointer" });
    this.container.add(debugButton);

    const updateDebugButton = () => {
      const busy = this.cards.some((card) => card.flipping);
      debugButton.setText(busy ? "Debug：翻转中…" : "Debug：切换正面 / 背面");
      debugButton.setAlpha(busy ? 0.5 : 1);
    };

    debugButton.on("pointerdown", () => {
      if (this.cards.some((card) => card.flipping)) return;

      // 存在背面时统一翻正；全部正面时统一翻背，方便测试不同卡牌状态。
      const showFront = this.cards.some((card) => card.currentFace === "back");
      for (const card of this.cards) {
        showFront ? card.flipToFront() : card.flipToBack();
      }
    });

    for (const card of this.cards) {
      card.on("flipstart", updateDebugButton);
      card.on("flipcomplete", updateDebugButton);
    }

    updateDebugButton();

    this.layout();
    this.scale.on(Scale.Events.RESIZE, this.layout, this);

    // 卡牌会在场景 shutdown 时自行释放；这里只清空场景持有的实例列表。
    this.events.once("shutdown", () => {
      this.scale.off(Scale.Events.RESIZE, this.layout, this);
      this.cards = [];
    });

    EventBus.emit("current-scene-ready", this);
  }

  private layout() {
    const { width, height } = this.scale.gameSize;

    coverViewport(this.background, width, height);
    centerDesignArea(this.container, width, height);
  }
}

import { GameObjects, Scale, Scene } from "phaser";
import { centerDesignArea, DESIGN_HEIGHT, DESIGN_WIDTH } from "../config/layout";

export class Preloader extends Scene {
  private loadingRoot!: GameObjects.Container;

  constructor() {
    super("Preloader");
  }

  init() {
    this.loadingRoot = this.add.container(0, 0);

    //  A simple progress bar. This is the outline of the bar.
    const outline = this.add
      .rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 468, 32)
      .setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      DESIGN_WIDTH / 2 - 230,
      DESIGN_HEIGHT / 2,
      4,
      28,
      0xfff000,
    );
    this.loadingRoot.add([outline, bar]);

    this.layout();
    this.scale.on(Scale.Events.RESIZE, this.layout, this);
    this.events.once("shutdown", () => {
      this.scale.off(Scale.Events.RESIZE, this.layout, this);
    });

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");
    this.load.image("logo", "logo.png");
    this.load.image("background", "bg.png");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainGame. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainGame");
  }

  private layout() {
    const { width, height } = this.scale.gameSize;
    centerDesignArea(this.loadingRoot, width, height);
  }
}

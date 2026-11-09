import { BlendModes, GameObjects, Math as PhaserMath, Scene, Textures } from "phaser";

import { EventBus } from "../EventBus";

const CARD_X = 512; // 1024 / 2
const CARD_Y = 384; // 768 / 2
const CARD_WIDTH = 480; // 240;
const CARD_HEIGHT = 720; // 360;
// 数值越大，透视变形越弱；这里与 HelloWorld.vue 中的 CSS perspective 保持一致。
const PERSPECTIVE = 1000;
// 卡图内部的可见区域（百分比），四周留给最上层的卡框。
const CLIP = { top: 0.02, right: 0.03125, bottom: 0.04, left: 0.03125 };
// 卡牌宽高比为 2:3，使用 8×12 网格可以让每个小格接近正方形。
const GRID_COLUMNS = 8;
const GRID_ROWS = 12;

interface GridPoint {
  x: number;
  y: number;
}

interface GridGeometry {
  vertices: number[];
  indices: number[];
  points: GridPoint[];
}

interface CardSurface {
  mesh: GameObjects.Mesh2D;
  // 保存未变形的局部坐标；每一帧都从这些坐标重新计算，避免误差累积。
  points: GridPoint[];
}

interface LayerPreset {
  key: string;
  depth: number;
  scale: number;
  // [originX, originY, rzX, rzY]：鼠标在 X/Y 方向移动时，图层绕 Z 轴旋转的最大角度（不考虑绕 X/Y 轴旋转）。
  rotate?: [number, number, number, number];
}

interface CardLayer extends LayerPreset, CardSurface {}

const LAYER_PRESETS: LayerPreset[] = [
  // depth 控制指针移动时的视差方向和距离，scale 用来避免移动后露出空白边缘。
  { key: "card-background", depth: -5, scale: 1.08 },
  {
    key: "card-rear-decoration",
    depth: -2,
    scale: 1.09,
    rotate: [0.5, 0.2, -5, -0.5],
  },
  { key: "card-subject", depth: -0.8, scale: 1.2 },
  { key: "card-foreground-decoration", depth: 1, scale: 1 },
];

export class MainMenu extends Scene {
  private cardLayers: CardLayer[] = [];
  private frameSurface!: CardSurface;
  private glareSurface!: CardSurface;
  private glareTexture!: Textures.CanvasTexture;
  private glareMaskImage!: HTMLImageElement;
  private pointerText!: GameObjects.Text;
  private pointer = new PhaserMath.Vector2();
  private targetPointer = new PhaserMath.Vector2();
  // 复用矩阵和临时顶点，避免在每一帧中反复创建对象。
  private cardRotationMatrix = new PhaserMath.Matrix4();
  private transformedPoint = new PhaserMath.Vector3();
  private layerTransformMatrix = new GameObjects.Components.TransformMatrix();
  private transformedUvPoint = new PhaserMath.Vector2();
  private hoverAmount = 0;
  private isHovering = false;

  constructor() {
    super("MainMenu");
  }

  preload() {
    // preload 会在 create 之前执行；只有资源加载完成后才能创建对应的 Game Object。
    this.load.image("card-background", "/undead-card-layers/background.png");
    this.load.image("card-rear-decoration", "/undead-card-layers/rear-decoration.png");
    this.load.image("card-subject", "/undead-card-layers/subject.png");
    this.load.image("card-foreground-decoration", "/undead-card-layers/foreground-decoration.png");
    this.load.image("card-frame", "/undead-card-layers/frame.png");
    this.load.image("card-glare-mask", "/undead-card-layers/mask.png");
  }

  create() {
    // create 负责搭建场景。场景重新启动时也会再次执行，所以先重置交互状态。
    this.pointer.set(0, 0);
    this.targetPointer.set(0, 0);
    this.hoverAmount = 0;
    this.isHovering = false;

    this.createGlareTexture();
    // Mask 的 RGB 内容不会参与合成，destination-in 只会读取图片的 Alpha。
    this.glareMaskImage = this.textures
      .get("card-glare-mask")
      .getSourceImage() as HTMLImageElement;

    this.createCard();
    this.createInteraction();
    this.updateCardVisuals();

    EventBus.emit("current-scene-ready", this);
  }

  update(_time: number, delta: number) {
    // update 每帧执行。使用 delta 计算插值比例，可让动画速度不受帧率影响。
    const motionEase = 1 - Math.exp(-delta / 180);
    const hoverEase = 1 - Math.exp(-delta / 250);

    // 当前值逐渐追赶目标值，形成类似 CSS transition 的平滑跟随和归位效果。
    this.pointer.x = PhaserMath.Linear(this.pointer.x, this.targetPointer.x, motionEase);
    this.pointer.y = PhaserMath.Linear(this.pointer.y, this.targetPointer.y, motionEase);
    this.hoverAmount = PhaserMath.Linear(
      this.hoverAmount,
      this.isHovering ? 1 : 0,
      hoverEase,
    );

    if (Math.abs(this.pointer.x) < 0.0001) this.pointer.x = 0;
    if (Math.abs(this.pointer.y) < 0.0001) this.pointer.y = 0;

    this.updateCardVisuals();
  }

  private createCard() {
    this.cardLayers = LAYER_PRESETS.map((preset, index) => {
      const surface = this.createMesh(preset.key, index + 2, true);

      return {
        ...preset,
        ...surface,
      };
    });

    // 内容图层需要裁切，边框和高光则覆盖完整卡面。
    this.frameSurface = this.createMesh("card-frame", 10, false);
    this.glareSurface = this.createMesh("card-glare", 11, false);
    this.glareSurface.mesh
      .setBlendMode(BlendModes.SCREEN)
      .setAlpha(0);

    // 左上角调试信息
    this.pointerText = this.add
      .text(10, 10, "x: 0.000\ny: 0.000", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "16px",
        lineSpacing: 4,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0)
      .setDepth(20);
  }

  private createInteraction() {
    // Zone 是不可见的 Game Object，很适合单独作为卡牌的交互热区。
    const hitArea = this.add
      .zone(CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT)
      .setDepth(30)
      .setInteractive({ cursor: "pointer" });

    hitArea.on("pointerover", () => {
      this.isHovering = true;
    });

    hitArea.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // 把画布坐标换算成卡牌内部的 -1 ～ 1，中心点为 (0, 0)。
      this.targetPointer.set(
        PhaserMath.Clamp(((pointer.x - (CARD_X - CARD_WIDTH / 2)) / CARD_WIDTH) * 2 - 1, -1, 1),
        PhaserMath.Clamp(((pointer.y - (CARD_Y - CARD_HEIGHT / 2)) / CARD_HEIGHT) * 2 - 1, -1, 1),
      );
    });

    hitArea.on("pointerout", () => this.resetCard());

    this.input.on("gameout", this.resetCard, this);
    this.events.once("shutdown", () => {
      this.input.off("gameout", this.resetCard, this);
    });
  }

  private resetCard() {
    this.isHovering = false;
    this.targetPointer.set(0, 0);
  }

  private createMesh(texture: string, depth: number, clipped: boolean): CardSurface {
    const halfWidth = CARD_WIDTH / 2
    const haldHeight = CARD_HEIGHT / 2
    
    const left = clipped ? -halfWidth + CARD_WIDTH * CLIP.left : -halfWidth;
    const right = clipped ? halfWidth - CARD_WIDTH * CLIP.right : halfWidth;
    const top = clipped ? -haldHeight + CARD_HEIGHT * CLIP.top : -haldHeight;
    const bottom = clipped ? haldHeight - CARD_HEIGHT * CLIP.bottom : haldHeight;

    const geometry = this.createGridGeometry(left, top, right, bottom);

    const mesh = this.add
      // WebGL 的纹理 V 轴与图片方向相反，因此最后一个参数需要设置为 true。
      .mesh2d(CARD_X, CARD_Y, texture, geometry.vertices, geometry.indices, true)
      // 网格拓扑不会在运行时变化，因此这里只需要预先整理一次三角形索引。
      .buildOrderedIndices(1, true)
      .setDepth(depth);

    return { mesh, points: geometry.points };
  }

  private createGridGeometry(left: number, top: number, right: number, bottom: number): GridGeometry {
    const vertices: number[]  = [];  // 顶点信息(x,y,u,v) 交给 Mesh2D
    const indices: number[]   = [];  // 描述所有三角形 交给 Mesh2D
    const points: GridPoint[] = [];  // 保存未经变形的原始坐标

    // 8 列网格需要 9 列顶点，12 行网格需要 13 行顶点。
    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const v = row / GRID_ROWS;
      const y = PhaserMath.Linear(top, bottom, v);

      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        const u = column / GRID_COLUMNS;
        const x = PhaserMath.Linear(left, right, u);

        points.push({ x, y });
        // Mesh2D 的每个顶点依次存放 x、y、u、v。
        vertices.push(x, y, u, v);
      }
    }

    const verticesPerRow = GRID_COLUMNS + 1;

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const topLeft = row * verticesPerRow + column;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + verticesPerRow;
        const bottomRight = bottomLeft + 1;

        // 每个小格仍由两个三角形组成，最后一个 0 表示使用第 0 张纹理。
        // tl ───────── tr
        // │           ╱ │
        // │        ╱    │
        // │     ╱       │
        // │ ╱           │
        // bl ───────── br
        indices.push(
          topLeft, topRight, bottomLeft, 0,
          topRight, bottomLeft, bottomRight, 0,
        );
      }
    }

    return { vertices, indices, points };
  }

  private updateCardVisuals() {
    this.updateCardRotationMatrix();

    for (const layer of this.cardLayers) {
      this.updateLayerMesh(layer);
    }

    this.updateProjectedMesh(this.frameSurface);
    this.updateProjectedMesh(this.glareSurface);
    this.paintGlare();

    this.glareSurface.mesh.setAlpha(this.hoverAmount);

    this.pointerText.setText(
      `x: ${this.pointer.x.toFixed(3)}\ny: ${this.pointer.y.toFixed(3)}`,
    );
  }

  private updateLayerMesh(layer: CardLayer) {
    // rzX 鼠标左右移动时，绕 Z 轴旋转的角度
    // rzY 鼠标上下移动时，绕 Z 轴旋转的角度
    const [centerX = 0.5, centerY = 0.5, rzX = 0, rzY = 0] = layer.rotate ?? [];
    const originX = (centerX - 0.5) * CARD_WIDTH;
    const originY = (centerY - 0.5) * CARD_HEIGHT;
    const localRotation = PhaserMath.DegToRad(this.pointer.x * rzX + this.pointer.y * rzY);

    // layer.depth = 最大偏移百分比；
    // this.pointer.x * layer.depth = 偏移百分比；
    // 偏移百分比 * CARD_WIDTH / 100 = 固定偏移值；
    const shiftX = (this.pointer.x * layer.depth * CARD_WIDTH) / 100;
    const shiftY = (this.pointer.y * layer.depth * CARD_HEIGHT) / 100;

    // 组合图层的正向二维变换：以[originX, originY]为中心旋转，再进行视差平移。
    // 链式调用的矩阵实际作用顺序是从最后一步向前应用。
    this.layerTransformMatrix
      .loadIdentity()
      .translate(shiftX + originX, shiftY + originY)
      .rotate(localRotation)
      .translate(-originX, -originY);

    for (let index = 0; index < layer.points.length; index += 1) {
      const point = layer.points[index];
      const offset = index * 4;

      // 网格边界固定不动，所以要使用逆矩阵，从显示位置反查原图片的采样位置。
      this.layerTransformMatrix.applyInverse(
        point.x,
        point.y,
        this.transformedUvPoint,
      );

      // UV 使用 0～1 表示整张纹理；0.5 是图片中心。
      layer.mesh.vertices[offset + 2] =
        0.5 + this.transformedUvPoint.x / (CARD_WIDTH * layer.scale);
      layer.mesh.vertices[offset + 3] =
        0.5 + this.transformedUvPoint.y / (CARD_HEIGHT * layer.scale);
    }

    this.updateProjectedMesh(layer);
  }

  private updateCardRotationMatrix() {
    // 根据归一化指针计算绕 X/Y 轴的最大旋转角度。
    const rotateX = PhaserMath.DegToRad(-this.pointer.y * 4);
    const rotateY = PhaserMath.DegToRad(this.pointer.x * 10);

    // Matrix4 的链式调用会组合成一份 3D 旋转矩阵。
    // 当前顺序与之前的手动公式一致：顶点先绕 Y 轴，再绕 X 轴。
    this.cardRotationMatrix
      .identity()
      .rotateX(rotateX)
      .rotateY(rotateY);
  }

  private updateProjectedMesh(surface: CardSurface) {
    // 每个网格点都独立执行 3D 旋转和透视投影，减小大三角形的 UV 插值误差。
    for (let index = 0; index < surface.points.length; index += 1) {
      const point = surface.points[index];

      // 将卡面上的二维顶点视为 (x, y, 0)，再应用 3D 旋转矩阵。
      this.transformedPoint
        .set(point.x, point.y, 0)
        .transformMat4(this.cardRotationMatrix);

      // 越靠近观察者（z 越大）的顶点会被放得越大，从而形成透视感。
      const perspectiveScale = PERSPECTIVE / (PERSPECTIVE - this.transformedPoint.z);
      const offset = index * 4;

      // Mesh2D 最终只接收 x/y，所以在这里完成透视投影后再写回顶点。
      surface.mesh.vertices[offset] = this.transformedPoint.x * perspectiveScale;
      surface.mesh.vertices[offset + 1] = this.transformedPoint.y * perspectiveScale;
    }
  }

  private createGlareTexture() {
    // CanvasTexture 可以在运行时绘制并作为普通 Phaser 纹理交给 Mesh2D 使用。
    if (this.textures.exists("card-glare")) {
      this.glareTexture = this.textures.get("card-glare") as Textures.CanvasTexture;
      return;
    }

    const texture = this.textures.createCanvas("card-glare", 256, 384);
    if (!texture) throw new Error("Unable to create the card glare texture");
    this.glareTexture = texture;
  }

  private paintGlare() {
    if (this.hoverAmount < 0.001) return;

    const { canvas, context } = this.glareTexture;
    const x = ((this.pointer.x + 1) / 2) * canvas.width;
    const y = ((this.pointer.y + 1) / 2) * canvas.height;
    const radius = canvas.height * 0.42;
    // 径向渐变的中心跟随指针，模拟光源在卡面上的反射。
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

    // 保存 Canvas 状态，防止 destination-in 影响下一帧的正常绘制。
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-over";
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.28)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // destination-in 只保留“已有高光”和“Mask 不透明区域”重叠的部分。
    // Mask 会缩放到高光纹理尺寸，因此它仍与整张卡牌使用相同的 UV。
    context.globalCompositeOperation = "destination-in";
    context.drawImage(
      this.glareMaskImage,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    context.restore();
    this.glareTexture.refresh();
  }
}

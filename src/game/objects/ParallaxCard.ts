import { BlendModes, GameObjects, Math as PhaserMath, Scene, Textures } from "phaser";
import { cardLayers, DEFAULT_LAYER_CONFIG, type CardClip, type ParallaxCardLayerPreset } from "../config/card";

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

interface CardLayer extends ParallaxCardLayerPreset, CardSurface {
  key: string
  uvAtRest: boolean;
}

export type ParallaxCardFace = "front" | "back";

export interface ParallaxCardOptions {
  card: string;
  x: number;
  y: number;
  width: number;
  height: number;
  initialFace?: ParallaxCardFace;
  flipOnClick?: boolean;
  flipDuration?: number;
  perspective?: number;
  depth?: number;
  gridColumns?: number;
  gridRows?: number;
  clip?: CardClip;
}

/**
 * 一张可独立更新和销毁的视差卡牌。
 * 每个实例都持有自己的 Mesh、交互状态和动态高光纹理，因此可以在同一场景中批量创建。
 */
export class ParallaxCard extends GameObjects.Container {
  private static nextId = 0;

  private readonly card: string;
  private readonly cardWidth: number;
  private readonly cardHeight: number;
  private readonly perspective: number;
  private readonly baseDepth: number;
  private readonly gridColumns: number;
  private readonly gridRows: number;
  private readonly clip: CardClip;
  private readonly flipOnClick: boolean;
  private readonly flipDuration: number;
  private readonly glareTextureKey: string;

  private cardLayers: CardLayer[] = [];
  private frameSurface!: CardSurface;
  private glareSurface!: CardSurface;
  private backSurface!: CardSurface;
  private glareTexture!: Textures.CanvasTexture;
  private glareMaskImage!: HTMLImageElement;
  private hitArea!: GameObjects.Zone;

  private readonly pointer = new PhaserMath.Vector2();
  private readonly targetPointer = new PhaserMath.Vector2();
  // 复用矩阵和临时顶点，避免在每一帧中反复创建对象。
  private readonly cardRotationMatrix = new PhaserMath.Matrix4();
  private readonly transformedPoint = new PhaserMath.Vector3();
  private readonly layerTransformMatrix = new GameObjects.Components.TransformMatrix();
  private readonly transformedUvPoint = new PhaserMath.Vector2();
  // flipY 是 Phaser Tween 的保留配置名，角度必须使用独立字段，才能正常生成补间。
  private readonly pose = { flipAngleY: 0 };

  private hoverAmount = 0;
  private isHovering = false;
  private face: ParallaxCardFace;
  private isFlipping = false;

  constructor(scene: Scene, options: ParallaxCardOptions) {
    super(scene, options.x, options.y);

    this.card = options.card;
    this.cardWidth = options.width;
    this.cardHeight = options.height;
    this.perspective = options.perspective ?? 1000;
    this.baseDepth = options.depth ?? 0;
    this.gridColumns = options.gridColumns ?? 8;
    this.gridRows = options.gridRows ?? 12;
    this.clip = options.clip ?? { top: 0.02, right: 0.03125, bottom: 0.04, left: 0.03125 };
    this.face = options.initialFace ?? "front";

    this.flipOnClick = options.flipOnClick ?? false;
    this.flipDuration = options.flipDuration ?? 600;
    this.pose.flipAngleY = this.face === "front" ? 0 : 180;

    this.glareTextureKey = `parallax-card-glare-${ParallaxCard.nextId++}`;
    this.createGlareTexture();
    // Mask 的 RGB 内容不会参与合成，destination-in 只会读取图片的 Alpha。
    this.glareMaskImage = this.scene.textures.get(`${this.card}/mask`).getSourceImage() as HTMLImageElement;

    this.createCard();
    this.createInteraction();
    this.updateVisuals();

    // 注册到场景的 Display List 和 Update List，之后可像普通 Game Object 一样使用。
    this.scene.add.existing(this);
    this.setDepth(this.baseDepth);
    this.scene.input.on("gameout", this.reset, this);
  }

  /** Container 加入 Update List 后，Phaser 会在每一帧自动调用 preUpdate。 */
  preUpdate(_time: number, delta: number) {
    if (this.isDestroyed) return;

    // 使用 delta 计算插值比例，可让动画速度不受帧率影响。
    const motionEase = 1 - Math.exp(-delta / 180);
    const hoverEase = 1 - Math.exp(-delta / 250);

    this.pointer.x = PhaserMath.Linear(this.pointer.x, this.targetPointer.x, motionEase);
    this.pointer.y = PhaserMath.Linear(this.pointer.y, this.targetPointer.y, motionEase);
    this.hoverAmount = PhaserMath.Linear(
      this.hoverAmount,
      this.enableLayerEffect ? 1 : 0,
      hoverEase,
    );

    if (Math.abs(this.pointer.x) < 0.0001) this.pointer.x = 0;
    if (Math.abs(this.pointer.y) < 0.0001) this.pointer.y = 0;

    this.updateVisuals();
  }

  get currentFace(): ParallaxCardFace {
    return this.face;
  }

  get flipping(): boolean {
    return this.isFlipping;
  }

  /** 是否启用视差效果（正面移入视差） */
  get enableLayerEffect(): boolean {
    return this.face === "front" && !this.isFlipping && this.isHovering;
  }

  /** 是否启用放大效果（背面移入放大） */
  get enableZoomEffect(): boolean {
    return this.face === "back" && !this.isFlipping && this.isHovering;
  }

  /** 不播放动画，立即切换到指定卡面。 */
  setFace(face: ParallaxCardFace) {
    this.scene.tweens.killTweensOf(this.pose);
    this.face = face;
    this.isFlipping = false;
    this.pose.flipAngleY = face === "front" ? 0 : 180;
    this.reset();
    this.updateVisuals();
    return this;
  }

  flipToFront(): Phaser.Tweens.Tween | null {
    return this.flipTo("front");
  }

  flipToBack(): Phaser.Tweens.Tween | null {
    return this.flipTo("back");
  }

  /** 使用 Phaser Tween 驱动 Y 轴角度，Matrix4 会在每一帧完成真正的 3D 投影。 */
  private flipTo(face: ParallaxCardFace): Phaser.Tweens.Tween | null {
    if (this.isDestroyed || this.isFlipping || this.face === face) return null;

    this.isFlipping = true;
    // 翻转期间立即清空所有 Hover 姿态，避免残留的图层位移和高光继续参与动画。
    this.targetPointer.set(0, 0);
    this.pointer.set(0, 0);
    this.hoverAmount = 0;
    this.emit("flipstart", face, this);

    // 背面翻正面走 180° → 360°，可保持与正面翻背面的旋转方向一致。
    const targetAngle = face === "front" ? 360 : 180;

    return this.scene.tweens.add({
      targets: this.pose,
      flipAngleY: targetAngle,
      duration: this.flipDuration,
      ease: PhaserMath.Easing.Cubic.InOut,
      // Tween 更新姿态后立即重算 Mesh，避免只在动画结束时看到卡面切换。
      onUpdate: () => this.updateVisuals(),
      onComplete: () => {
        this.face = face;
        this.pose.flipAngleY = face === "front" ? 0 : 180;
        this.isFlipping = false;
        this.updateVisuals();
        this.emit("flipcomplete", face, this);
      },
    });
  }

  /** Container 销毁时，补充清理外部事件和每张卡牌独占的动态纹理。 */
  protected preDestroy() {
    this.scene.input.off("gameout", this.reset, this);
    this.scene.tweens.killTweensOf(this.pose);

    // Container 会在这里自动销毁自己独占管理的所有子对象。
    super.preDestroy();

    // 移除卡牌对应的高光贴图。
    if (this.scene.textures.exists(this.glareTextureKey)) {
      this.scene.textures.remove(this.glareTextureKey);
    }
  }

  private createCard() {
    this.cardLayers = cardLayers.map((key) => {
      const preset = DEFAULT_LAYER_CONFIG[key]!
      const surface = this.createMesh(`${this.card}/${key}`, true);
      return {
        key,
        // 创建网格时的 UV 尚未包含 layer.scale，需要先初始化一次默认采样范围。
        uvAtRest: false,
        ...preset,
        ...surface,
      };
    });

    // 背面旋转到 180° 后会左右颠倒，因此创建时预先反转 U 坐标。
    this.backSurface = this.createMesh(`${this.card}/back`, false, true);

    // 内容图层需要裁切，边框和高光则覆盖完整卡面。
    this.frameSurface = this.createMesh(`${this.card}/frame`, false);
    this.glareSurface = this.createMesh(this.glareTextureKey, false);
    this.glareSurface.mesh.setBlendMode(BlendModes.SCREEN).setAlpha(0);
  }

  private createInteraction() {
    // Zone 是不可见的 Game Object，很适合单独作为卡牌的交互热区。
    this.hitArea = new GameObjects.Zone(
      this.scene,
      0,
      0,
      this.cardWidth,
      this.cardHeight,
    ).setInteractive({ cursor: "pointer" });

    this.hitArea.on("pointerover", () => {
      this.isHovering = true;
    });

    this.hitArea.on("pointermove", (_pointer: Phaser.Input.Pointer, localX: number, localY: number) => {
      if (this.isFlipping) {
        this.targetPointer.set(0, 0);
        return;
      }

      // Phaser 已在命中检测时处理相机及所有父容器的变换。
      // 事件局部坐标以 Zone 左上角为原点，减去 displayOrigin 后才以卡牌中心为原点。
      this.targetPointer.set(
        PhaserMath.Clamp((localX - this.hitArea.displayOriginX) / (this.cardWidth / 2), -1, 1),
        PhaserMath.Clamp((localY - this.hitArea.displayOriginY) / (this.cardHeight / 2), -1, 1),
      );
    });

    this.hitArea.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isFlipping) return;

      this.emit("cardclick", pointer, this);

      if (this.flipOnClick && this.face === "back") {
        this.flipToFront();
      }
    });

    this.hitArea.on("pointerout", this.reset, this);

    this.add(this.hitArea);
  }

  private reset() {
    this.isHovering = false;
    this.targetPointer.set(0, 0);
  }

  private createMesh(
    texture: string,
    clipped: boolean,
    flipU = false,
  ): CardSurface {
    const halfWidth = this.cardWidth / 2;
    const halfHeight = this.cardHeight / 2;
    const left = clipped ? -halfWidth + this.cardWidth * this.clip.left : -halfWidth;
    const right = clipped ? halfWidth - this.cardWidth * this.clip.right : halfWidth;
    const top = clipped ? -halfHeight + this.cardHeight * this.clip.top : -halfHeight;
    const bottom = clipped ? halfHeight - this.cardHeight * this.clip.bottom : halfHeight;
    const geometry = this.createGridGeometry(left, top, right, bottom, flipU);

    const mesh = new GameObjects.Mesh2D(
      this.scene,
      0,
      0,
      texture,
      geometry.vertices,
      geometry.indices,
      true // WebGL 的纹理 V 轴与图片方向相反，因此最后一个参数需要设置为 true
    ).buildOrderedIndices(1, true); // 网格拓扑不会在运行时变化，因此这里只需要预先整理一次三角形索引。

    // Container 内部按添加顺序渲染，后添加的边框和高光自然覆盖在内容层之上。
    this.add(mesh);

    return { mesh, points: geometry.points };
  }

  private createGridGeometry(
    left: number,
    top: number,
    right: number,
    bottom: number,
    flipU: boolean,
  ): GridGeometry {
    const vertices: number[] = [];
    const indices: number[] = [];
    const points: GridPoint[] = [];

    for (let row = 0; row <= this.gridRows; row += 1) {
      const v = row / this.gridRows;
      const y = PhaserMath.Linear(top, bottom, v);

      for (let column = 0; column <= this.gridColumns; column += 1) {
        const u = column / this.gridColumns;
        const textureU = flipU ? 1 - u : u;
        const x = PhaserMath.Linear(left, right, u);

        points.push({ x, y });
        // Mesh2D 的每个顶点依次存放 x、y、u、v。
        vertices.push(x, y, textureU, v);
      }
    }

    const verticesPerRow = this.gridColumns + 1;

    for (let row = 0; row < this.gridRows; row += 1) {
      for (let column = 0; column < this.gridColumns; column += 1) {
        const tl = row * verticesPerRow + column;
        const tr = tl + 1;
        const bl = tl + verticesPerRow;
        const br = bl + 1;

        // 每个小格仍由两个三角形组成，最后一个 0 表示使用第 0 张纹理。
        indices.push(
          tl, tr, bl, 0,
          tr, bl, br, 0,
        );
      }
    }

    return { vertices, indices, points };
  }

  private updateVisuals() {
    this.updateCardRotationMatrix();

    for (const layer of this.cardLayers) {
      this.updateLayerMesh(layer);
    }

    this.updateProjectedMesh(this.frameSurface);
    this.updateProjectedMesh(this.glareSurface);
    this.updateProjectedMesh(this.backSurface);
    this.syncFaceVisibility();
    this.paintGlare();
    this.glareSurface.mesh.setAlpha(this.hoverAmount);
  }

  private syncFaceVisibility() {
    const normalizedAngle = PhaserMath.Wrap(this.pose.flipAngleY, 0, 360);
    const frontVisible = normalizedAngle < 90 || normalizedAngle >= 270;

    for (const layer of this.cardLayers) {
      layer.mesh.setVisible(frontVisible);
    }

    this.frameSurface.mesh.setVisible(frontVisible);
    this.glareSurface.mesh.setVisible(frontVisible);
    this.backSurface.mesh.setVisible(!frontVisible);
  }

  private updateLayerMesh(layer: CardLayer) {
    // 鼠标移出后仍使用逐帧衰减的 pointer，保留平滑回正；背面及翻转时立即停用。
    const pointerX = this.enableLayerEffect ? this.pointer.x : 0;
    const pointerY = this.enableLayerEffect ? this.pointer.y : 0;

    if (pointerX === 0 && pointerY === 0) {
      // UV 会保留上一帧的值：回正时恢复一次，之后跳过矩阵和 UV 运算。
      if (!layer.uvAtRest) {
        for (let index = 0; index < layer.points.length; index += 1) {
          const point = layer.points[index];
          const offset = index * 4;
          layer.mesh.vertices[offset + 2] =
            0.5 + point.x / (this.cardWidth * layer.scale);
          layer.mesh.vertices[offset + 3] =
            0.5 + point.y / (this.cardHeight * layer.scale);
        }
        layer.uvAtRest = true;
      }

      // 不启用视差时，整卡的 3D 倾斜和翻转仍然需要更新。
      this.updateProjectedMesh(layer);
      return;
    }

    layer.uvAtRest = false;
    const [centerX = 0.5, centerY = 0.5, rzX = 0, rzY = 0] = layer.rotate ?? [];
    const originX = (centerX - 0.5) * this.cardWidth;
    const originY = (centerY - 0.5) * this.cardHeight;
    const localRotation = PhaserMath.DegToRad(
      pointerX * rzX + pointerY * rzY,
    );
    const shiftX = (pointerX * layer.depth * this.cardWidth) / 100;
    const shiftY = (pointerY * layer.depth * this.cardHeight) / 100;

    // 以指定原点旋转，再进行视差平移；实际作用顺序从最后一步向前应用。
    this.layerTransformMatrix
      .loadIdentity()
      .translate(shiftX + originX, shiftY + originY)
      .rotate(localRotation)
      .translate(-originX, -originY);

    for (let index = 0; index < layer.points.length; index += 1) {
      const point = layer.points[index];
      const offset = index * 4;

      // 网格边界固定不动，使用逆矩阵从显示位置反查原图片的采样位置。
      this.layerTransformMatrix.applyInverse(
        point.x,
        point.y,
        this.transformedUvPoint,
      );

      layer.mesh.vertices[offset + 2] =
        0.5 + this.transformedUvPoint.x / (this.cardWidth * layer.scale);
      layer.mesh.vertices[offset + 3] =
        0.5 + this.transformedUvPoint.y / (this.cardHeight * layer.scale);
    }

    this.updateProjectedMesh(layer);
  }

  private updateCardRotationMatrix() {
    const hoverWeight = this.face === "front" && !this.isFlipping ? 1 : 0;
    const rotateX = PhaserMath.DegToRad(-this.pointer.y * 4 * hoverWeight);
    const rotateY = PhaserMath.DegToRad(
      this.pointer.x * 10 * hoverWeight + this.pose.flipAngleY,
    );

    this.cardRotationMatrix.identity().rotateX(rotateX).rotateY(rotateY);
  }

  private updateProjectedMesh(surface: CardSurface) {
    for (let index = 0; index < surface.points.length; index += 1) {
      const point = surface.points[index];

      this.transformedPoint
        .set(point.x, point.y, 0)
        .transformMat4(this.cardRotationMatrix);

      const perspectiveScale = this.perspective / (this.perspective - this.transformedPoint.z);
      const offset = index * 4;

      surface.mesh.vertices[offset] = this.transformedPoint.x * perspectiveScale;
      surface.mesh.vertices[offset + 1] = this.transformedPoint.y * perspectiveScale;
    }
  }

  private createGlareTexture() {
    const texture = this.scene.textures.createCanvas(this.glareTextureKey, 256, 384);
    if (!texture) throw new Error("Unable to create the card glare texture");
    this.glareTexture = texture;
  }

  private paintGlare() {
    if (this.hoverAmount < 0.001) return;

    const { canvas, context } = this.glareTexture;
    const x = ((this.pointer.x + 1) / 2) * canvas.width;
    const y = ((this.pointer.y + 1) / 2) * canvas.height;
    const radius = canvas.height * 0.42;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-over";
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.28)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 只保留高光与 Mask 不透明区域重叠的部分。
    context.globalCompositeOperation = "destination-in";
    context.drawImage(this.glareMaskImage, 0, 0, canvas.width, canvas.height);
    context.restore();
    this.glareTexture.refresh();
  }
}

import { Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js'
import type {
  Application,
  ColorSource,
  TextStyleAlign,
  TextStyleFontWeight,
} from 'pixi.js'

const DESIGN_WIDTH = 1440
const DESIGN_HEIGHT = 810

const COLORS = Object.freeze({
  gold: 0xe2b868,
  goldBright: 0xffdc8a,
  panel: 0x11172a,
  purple: 0x5a3f86,
  text: 0xf6ecd8,
  textMuted: 0xbdb4a8,
} as const)

/** 从图集式贴图中裁剪出的区域。 */
interface TextureFrame {
  x: number
  y: number
  width: number
  height: number
}

const DECK_TEXTURE_FRAMES: readonly TextureFrame[] = Object.freeze([
  { x: 402, y: 23, width: 1367, height: 672 },
  { x: 329, y: 0, width: 1514, height: 711 },
  { x: 140, y: 11, width: 1891, height: 677 },
  { x: 320, y: 15, width: 1528, height: 679 },
])

const DECK_HEADER_FRAME: TextureFrame = Object.freeze({
  x: 53,
  y: 13,
  width: 2067,
  height: 649,
})

const DECK_SELECTED_FRAME: TextureFrame = Object.freeze({
  x: 11,
  y: 0,
  width: 2148,
  height: 706,
})

interface TextOptions {
  fill?: ColorSource
  fontFamily?: string
  fontWeight?: TextStyleFontWeight
  letterSpacing?: number
  align?: TextStyleAlign
}

interface PanelOptions {
  radius?: number
  fill?: ColorSource
  alpha?: number
  stroke?: ColorSource
  strokeWidth?: number
  strokeAlpha?: number
}

/** 卡组槽位的交互句柄。 */
export interface DeckSlot {
  container: Container
  setSelected(value: boolean): void
}

interface DeckSlotOptions {
  texture: Texture
  selectedTexture: Texture
  y: number
  selected?: boolean
  onSelect: () => void
}

/** 创建主场景所需的全部贴图。 */
export interface MainSceneOptions {
  backgroundTexture: Texture
  deckHeaderTexture: Texture
  deckTextures: readonly Texture[]
  deckSelectedTexture: Texture
}

/** 主场景对外暴露的控制接口。 */
export interface MainScene {
  container: Container
  destroy(): void
}

function createTrimmedTexture(texture: Texture, frame: TextureFrame): Texture {
  return new Texture({
    source: texture.source,
    frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
  })
}

function createText(text: string, fontSize: number, options: TextOptions = {}): Text {
  return new Text({
    text,
    style: {
      fill: options.fill ?? COLORS.text,
      fontFamily: options.fontFamily ?? 'system-ui, sans-serif',
      fontSize,
      fontWeight: options.fontWeight ?? '500',
      letterSpacing: options.letterSpacing ?? 0,
      align: options.align ?? 'left',
    },
  })
}

function drawPanel(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  options: PanelOptions = {},
): void {
  graphics
    .roundRect(x, y, width, height, options.radius ?? 18)
    .fill({ color: options.fill ?? COLORS.panel, alpha: options.alpha ?? 0.82 })
    .stroke({
      color: options.stroke ?? COLORS.gold,
      width: options.strokeWidth ?? 2,
      alpha: options.strokeAlpha ?? 0.65,
    })
}

function createDeckSlot({
  texture,
  selectedTexture,
  y,
  selected = false,
  onSelect,
}: DeckSlotOptions): DeckSlot {
  const slot = new Container()
  const artwork = new Sprite(texture)
  const selection = new Sprite(selectedTexture)

  slot.position.set(50, y)
  slot.eventMode = 'static'
  slot.cursor = 'pointer'
  slot.hitArea = new Rectangle(0, 0, 276, 92)
  artwork.width = 276
  artwork.height = 92
  selection.position.set(-23, -8)
  selection.width = 322
  selection.height = 108
  selection.visible = selected
  slot.addChild(artwork, selection)
  slot.on('pointertap', onSelect)

  return Object.freeze({
    container: slot,
    setSelected(value: boolean): void {
      selection.visible = value
    },
  })
}

function createTag(x: number, label: string): Container {
  const tag = new Container()
  const surface = new Graphics()
  const text = createText(label, 14)

  tag.position.set(x, 592)
  surface
    .roundRect(0, 0, 100, 38, 18)
    .fill({ color: COLORS.purple, alpha: 0.68 })
    .stroke({ color: COLORS.gold, width: 1, alpha: 0.65 })
  text.anchor.set(0.5)
  text.position.set(50, 19)
  tag.addChild(surface, text)

  return tag
}

interface DeckOption {
  name: string
  summary: string
}

/**
 * 主界面场景骨架：卡组选择、卡组详情、卡面展示与进入抽卡操作区。
 */
export function createMainScene(
  app: Application,
  {
    backgroundTexture,
    deckHeaderTexture,
    deckTextures,
    deckSelectedTexture,
  }: MainSceneOptions,
): MainScene {
  const container = new Container()
  const background = new Sprite(backgroundTexture)
  const shade = new Graphics()
  const ui = new Container()
  const trimmedDeckHeader = createTrimmedTexture(deckHeaderTexture, DECK_HEADER_FRAME)
  const trimmedDeckTextures = deckTextures.map((texture, index) => (
    createTrimmedTexture(texture, DECK_TEXTURE_FRAMES[index])
  ))
  const trimmedDeckSelected = createTrimmedTexture(
    deckSelectedTexture,
    DECK_SELECTED_FRAME,
  )
  const derivedTextures = [
    trimmedDeckHeader,
    ...trimmedDeckTextures,
    trimmedDeckSelected,
  ]

  container.label = 'main-game-scene'
  container.eventMode = 'static'
  background.label = 'main-background'
  background.anchor.set(0.5)
  ui.label = 'main-menu-layout'
  container.addChild(background, shade, ui)

  const header = new Graphics()
  drawPanel(header, 424, 24, 592, 92, {
    fill: 0x15162c,
    alpha: 0.9,
  })
  const headerTitle = createText('CARD DECK', 43, {
    fill: COLORS.goldBright,
    fontFamily: 'Georgia, Times New Roman, serif',
    fontWeight: '700',
    letterSpacing: 5,
  })
  const headerSubtitle = createText('选择本局使用的卡组', 13, {
    fill: COLORS.textMuted,
    letterSpacing: 4,
  })
  headerTitle.anchor.set(0.5)
  headerSubtitle.anchor.set(0.5)
  headerTitle.position.set(720, 61)
  headerSubtitle.position.set(720, 94)
  ui.addChild(header, headerTitle, headerSubtitle)

  const deckPanel = new Graphics()
  drawPanel(deckPanel, 28, 138, 320, 536)
  const deckHeader = new Sprite(trimmedDeckHeader)
  deckHeader.position.set(62, 148)
  deckHeader.width = 252
  deckHeader.height = 79
  ui.addChild(deckPanel, deckHeader)

  const deckOptions: readonly DeckOption[] = [
    { name: '冰霜魔法', summary: '冰霜魔法卡组' },
    { name: '亡灵秘术', summary: '亡灵秘术卡组' },
    { name: '巨龙烈焰', summary: '巨龙烈焰卡组' },
    { name: '自然之灵', summary: '自然之灵卡组' },
  ]
  const deckSlots: DeckSlot[] = []
  const selectDeck = (index: number): void => {
    deckSlots.forEach((slot, slotIndex) => {
      slot.setSelected(slotIndex === index)
    })
    detailTitle.text = deckOptions[index].name
    selectedDeck.text = deckOptions[index].summary
  }

  trimmedDeckTextures.forEach((texture, index) => {
    const slot = createDeckSlot({
      texture,
      selectedTexture: trimmedDeckSelected,
      y: 238 + index * 99,
      selected: index === 0,
      onSelect: () => selectDeck(index),
    })
    deckSlots.push(slot)
    ui.addChild(slot.container)
  })

  const detailPanel = new Graphics()
  drawPanel(detailPanel, 370, 138, 430, 536, {
    fill: 0x14223a,
    stroke: 0x78bdf0,
    strokeAlpha: 0.68,
  })
  const deckArtwork = new Graphics()
  deckArtwork
    .roundRect(394, 164, 382, 256, 16)
    .fill({ color: 0x294b73, alpha: 0.7 })
    .stroke({ color: 0x9edcff, width: 2, alpha: 0.75 })
    .roundRect(485, 198, 200, 188, 14)
    .fill({ color: 0x152c4a, alpha: 0.9 })
    .stroke({ color: 0xc4ecff, width: 2, alpha: 0.7 })
    .circle(585, 292, 48)
    .stroke({ color: 0xc4ecff, width: 3, alpha: 0.8 })
  const detailTitle = createText('冰霜魔法', 35, {
    fill: 0xc9efff,
    fontWeight: '700',
  })
  const detailDescription = createText(
    '卡组说明区域\n展示主题、玩法特性与专属效果。',
    17,
    { fill: COLORS.textMuted },
  )
  detailTitle.anchor.set(0.5)
  detailTitle.position.set(585, 458)
  detailDescription.position.set(420, 506)
  ui.addChild(
    detailPanel,
    deckArtwork,
    detailTitle,
    detailDescription,
    createTag(420, '冰霜'),
    createTag(535, '控制'),
    createTag(650, '倍率'),
  )

  const previewPanel = new Graphics()
  drawPanel(previewPanel, 824, 138, 588, 536, {
    fill: 0x17122b,
    stroke: 0xb38cff,
    strokeAlpha: 0.62,
  })
  const previewTitle = createText('卡组展示区域', 20, {
    fill: 0xd9c5ff,
    letterSpacing: 2,
  })
  previewTitle.anchor.set(0.5)
  previewTitle.position.set(1118, 170)
  const pedestal = new Graphics()
  pedestal
    .ellipse(1118, 574, 230, 52)
    .fill({ color: 0x432d6e, alpha: 0.72 })
    .stroke({ color: 0xb68cff, width: 3, alpha: 0.8 })
    .ellipse(1118, 574, 175, 30)
    .stroke({ color: COLORS.gold, width: 2, alpha: 0.65 })
  const previewCard = new Graphics()
  previewCard
    .roundRect(1003, 224, 230, 322, 18)
    .fill({ color: 0x2c2048, alpha: 0.95 })
    .stroke({ color: COLORS.goldBright, width: 4, alpha: 0.85 })
    .roundRect(1021, 244, 194, 282, 12)
    .fill({ color: 0x4a3868, alpha: 0.55 })
    .stroke({ color: 0xc2a1ff, width: 1, alpha: 0.8 })
    .circle(1118, 378, 66)
    .stroke({ color: COLORS.gold, width: 3, alpha: 0.75 })
  const previewHint = createText('卡面 / 卡包 / Spine 展示占位', 14, {
    fill: COLORS.textMuted,
  })
  previewHint.anchor.set(0.5)
  previewHint.position.set(1118, 638)
  ui.addChild(
    previewPanel,
    previewTitle,
    pedestal,
    previewCard,
    previewHint,
  )

  const actionBar = new Graphics()
  drawPanel(actionBar, 28, 696, 1384, 92, {
    fill: 0x101321,
    alpha: 0.94,
  })
  const selectedLabel = createText('当前选择', 13, {
    fill: COLORS.textMuted,
    letterSpacing: 2,
  })
  const selectedDeck = createText('冰霜魔法卡组', 26, {
    fill: COLORS.goldBright,
    fontWeight: '700',
  })
  selectedLabel.position.set(64, 715)
  selectedDeck.position.set(64, 741)
  const startButton = new Graphics()
  startButton
    .roundRect(1080, 710, 294, 64, 18)
    .fill({ color: 0x6f471c, alpha: 0.95 })
    .stroke({ color: COLORS.goldBright, width: 3, alpha: 0.95 })
  const startButtonText = createText('进入抽卡', 28, {
    fill: 0xfff2cb,
    fontWeight: '800',
    letterSpacing: 4,
  })
  startButtonText.anchor.set(0.5)
  startButtonText.position.set(1227, 742)
  const actionHint = createText('投注设置将在后续版本开放', 14, {
    fill: COLORS.textMuted,
  })
  actionHint.position.set(720, 734)
  ui.addChild(
    actionBar,
    selectedLabel,
    selectedDeck,
    actionHint,
    startButton,
    startButtonText,
  )

  const resize = (): void => {
    const { width, height } = app.screen
    const backgroundScale = Math.max(
      width / backgroundTexture.width,
      height / backgroundTexture.height,
    )
    const layoutScale = Math.min(
      width / DESIGN_WIDTH,
      height / DESIGN_HEIGHT,
    )

    background.position.set(width / 2, height / 2)
    background.scale.set(backgroundScale)

    shade
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x050814, alpha: 0.48 })

    ui.scale.set(layoutScale)
    ui.position.set(
      (width - DESIGN_WIDTH * layoutScale) / 2,
      (height - DESIGN_HEIGHT * layoutScale) / 2,
    )

    container.hitArea = new Rectangle(0, 0, width, height)
  }

  app.renderer.on('resize', resize)
  resize()

  return Object.freeze({
    container,
    destroy(): void {
      app.renderer.off('resize', resize)
      container.removeFromParent()
      container.destroy({ children: true, texture: false, textureSource: false })
      derivedTextures.forEach((texture) => texture.destroy(false))
    },
  })
}

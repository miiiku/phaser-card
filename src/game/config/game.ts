export interface DeckCardCountRange {
  readonly min: number
  readonly max: number
}

export interface GameConfig {
  readonly drawCount: number
  readonly maxCardStar: number
  readonly deckCardCount: DeckCardCountRange
}

export const GAME_CONFIG: GameConfig = Object.freeze({
  drawCount: 6,
  maxCardStar: 3,
  deckCardCount: Object.freeze({
    min: 8,
    max: 12,
  }),
})

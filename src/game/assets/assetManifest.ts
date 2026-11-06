import type { AssetsManifest } from 'pixi.js'
import { ASSET_ALIASES, ASSET_BUNDLES } from './assetAliases'

export const assetManifest = {
  bundles: [
    {
      name: ASSET_BUNDLES.MAIN,
      assets: [
        {
          alias: ASSET_ALIASES.MAIN_BACKGROUND,
          src: 'sprite/bg.png',
        },
        {
          alias: ASSET_ALIASES.DECK_HEADER,
          src: 'ui/decks/deck-header.png',
        },
        {
          alias: ASSET_ALIASES.DECK_ICE_MAGIC,
          src: 'ui/decks/ice-magic.png',
        },
        {
          alias: ASSET_ALIASES.DECK_UNDEAD,
          src: 'ui/decks/undead.png',
        },
        {
          alias: ASSET_ALIASES.DECK_DRAGON,
          src: 'ui/decks/dragon.png',
        },
        {
          alias: ASSET_ALIASES.DECK_NATURE,
          src: 'ui/decks/nature.png',
        },
        {
          alias: ASSET_ALIASES.DECK_SELECTED_OVERLAY,
          src: 'ui/decks/selected-overlay.png',
        },
      ],
    },
  ],
} satisfies AssetsManifest

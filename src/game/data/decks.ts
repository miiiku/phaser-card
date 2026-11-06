/**
 * 单套卡组的静态配置。
 * 具体卡池、权重和倍率将在数值设计阶段补充。
 */
export interface DeckConfig {
  /** 卡组唯一标识，同时可作为资源 alias 的前缀。 */
  readonly id: string
  /** 卡组展示名称。 */
  readonly name: string
}

/**
 * 卡组配置入口。
 * 具体卡池、权重和倍率将在数值设计阶段填充。
 */
export const DECKS: readonly DeckConfig[] = Object.freeze([])

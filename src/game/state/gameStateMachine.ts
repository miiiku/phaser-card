export const GAME_STATES = Object.freeze({
  LOBBY: 'LOBBY',
  READY: 'READY',
  DRAWING: 'DRAWING',
  REVEALING: 'REVEALING',
  EFFECT: 'EFFECT',
  MERGING: 'MERGING',
  SETTLING: 'SETTLING',
  COLLECTION_CHECK: 'COLLECTION_CHECK',
  COLLECTION_REWARD: 'COLLECTION_REWARD',
  ROUND_COMPLETE: 'ROUND_COMPLETE',
  EXIT_CONFIRM: 'EXIT_CONFIRM',
  ENDED: 'ENDED',
} as const)

export type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES]

const TRANSITIONS: Readonly<Record<GameState, readonly GameState[]>> = Object.freeze({
  [GAME_STATES.LOBBY]: [GAME_STATES.READY],
  [GAME_STATES.READY]: [GAME_STATES.DRAWING, GAME_STATES.EXIT_CONFIRM],
  [GAME_STATES.DRAWING]: [GAME_STATES.REVEALING],
  [GAME_STATES.REVEALING]: [GAME_STATES.EFFECT, GAME_STATES.MERGING],
  [GAME_STATES.EFFECT]: [GAME_STATES.MERGING],
  [GAME_STATES.MERGING]: [GAME_STATES.SETTLING],
  [GAME_STATES.SETTLING]: [GAME_STATES.COLLECTION_CHECK],
  [GAME_STATES.COLLECTION_CHECK]: [
    GAME_STATES.COLLECTION_REWARD,
    GAME_STATES.ROUND_COMPLETE,
  ],
  [GAME_STATES.COLLECTION_REWARD]: [GAME_STATES.ROUND_COMPLETE],
  [GAME_STATES.ROUND_COMPLETE]: [
    GAME_STATES.DRAWING,
    GAME_STATES.EXIT_CONFIRM,
  ],
  [GAME_STATES.EXIT_CONFIRM]: [
    GAME_STATES.READY,
    GAME_STATES.ROUND_COMPLETE,
    GAME_STATES.ENDED,
  ],
  [GAME_STATES.ENDED]: [GAME_STATES.LOBBY],
})

/** 状态迁移完成后的通知载荷。 */
export interface GameStateChange {
  readonly previousState: GameState
  readonly state: GameState
}

export type GameStateListener = (change: GameStateChange) => void

export interface GameStateMachine {
  readonly state: GameState
  canTransition(nextState: GameState): boolean
  transition(nextState: GameState): GameState
  /** 订阅状态变化，返回取消订阅函数。 */
  subscribe(listener: GameStateListener): () => void
}

export function createGameStateMachine(
  initialState: GameState = GAME_STATES.LOBBY,
): GameStateMachine {
  if (!(initialState in TRANSITIONS)) {
    throw new Error(`Unknown initial game state: ${initialState}`)
  }

  let state: GameState = initialState
  const listeners = new Set<GameStateListener>()

  const canTransition = (nextState: GameState): boolean =>
    TRANSITIONS[state].includes(nextState)

  return Object.freeze({
    get state() {
      return state
    },
    canTransition,
    transition(nextState: GameState): GameState {
      if (!canTransition(nextState)) {
        throw new Error(`Invalid game state transition: ${state} -> ${nextState}`)
      }

      const previousState = state
      state = nextState
      listeners.forEach((listener) => listener({ previousState, state }))

      return state
    },
    subscribe(listener: GameStateListener): () => void {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  })
}

/** 与 `fetch` 签名一致的请求实现，便于测试时替换。 */
export type GameSessionFetcher = typeof fetch

export interface GameSessionApiOptions {
  /** 接口前缀，默认 `/api`。 */
  baseUrl?: string
  /** 自定义 fetch 实现，默认使用全局 `fetch`。 */
  fetcher?: GameSessionFetcher
}

export interface GameSessionApi {
  createSession<T = unknown>(payload: unknown): Promise<T>
  draw<T = unknown>(sessionId: string): Promise<T>
  restoreSession<T = unknown>(sessionId: string): Promise<T>
  endSession<T = unknown>(sessionId: string): Promise<T>
}

/**
 * 游戏局服务端边界。
 * 所有真实开奖结果与结算都应由服务端生成并保存。
 */
export function createGameSessionApi({
  baseUrl = '/api',
  fetcher = fetch,
}: GameSessionApiOptions = {}): GameSessionApi {
  const request = async <T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> => {
    const response = await fetcher(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`Game session request failed: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  return Object.freeze({
    createSession<T = unknown>(payload: unknown): Promise<T> {
      return request<T>('/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    draw<T = unknown>(sessionId: string): Promise<T> {
      return request<T>(`/sessions/${sessionId}/draws`, { method: 'POST' })
    },
    restoreSession<T = unknown>(sessionId: string): Promise<T> {
      return request<T>(`/sessions/${sessionId}`)
    },
    endSession<T = unknown>(sessionId: string): Promise<T> {
      return request<T>(`/sessions/${sessionId}`, { method: 'DELETE' })
    },
  })
}

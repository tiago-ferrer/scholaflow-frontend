import { api, makeApi } from './client'
import type { AiModelConfig, DeepgramBalance } from '$lib/types/adminAiConfig'

const BASE = '/api/v1/admin/ai-config'

export function makeAdminAiConfigApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    getAiModelConfig: () => a.get<AiModelConfig>(BASE),
    // 200 OK with an empty body — res.json() throws SyntaxError on it, same pattern
    // used by adminPrompts.ts's setPaperSummaryPrompt().
    setOpenAiModel: async (model: string): Promise<void> => {
      try {
        await a.put<unknown>(`${BASE}/openai-model`, { model })
      } catch (e) {
        if (e instanceof SyntaxError) return
        throw e
      }
    },
    setOpenAiMaxTokens: async (maxTokens: number): Promise<void> => {
      try {
        await a.put<unknown>(`${BASE}/openai-max-tokens`, { max_tokens: maxTokens })
      } catch (e) {
        if (e instanceof SyntaxError) return
        throw e
      }
    },
    setDeepgramModel: async (model: string): Promise<void> => {
      try {
        await a.put<unknown>(`${BASE}/deepgram-model`, { model })
      } catch (e) {
        if (e instanceof SyntaxError) return
        throw e
      }
    },
    getDeepgramBalance: () => a.get<DeepgramBalance[]>(`${BASE}/deepgram-balance`),
    getOpenAiModels: () => a.get<string[]>(`${BASE}/openai-models`),
    getDeepgramModels: () => a.get<string[]>(`${BASE}/deepgram-models`),
  }
}

export const adminAiConfigApi = makeAdminAiConfigApi()

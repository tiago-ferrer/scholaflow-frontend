import { api, makeApi } from './client'
import type { PaperSummaryPrompt } from '$lib/types/adminPrompt'

const BASE = '/api/v1/admin/prompts/paper-summary'

export function makeAdminPromptsApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    getPaperSummaryPrompt: () => a.get<PaperSummaryPrompt>(BASE),
    // 200 OK with an empty body — res.json() throws SyntaxError on it, same as the
    // 202-empty-body case in transcription.ts's triggerTranscription().
    setPaperSummaryPrompt: async (promptText: string): Promise<void> => {
      try {
        await a.put<unknown>(BASE, { prompt_text: promptText })
      } catch (e) {
        if (e instanceof SyntaxError) return
        throw e
      }
    },
  }
}

export const adminPromptsApi = makeAdminPromptsApi()

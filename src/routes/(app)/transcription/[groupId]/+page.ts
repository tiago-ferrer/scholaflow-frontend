import type { PageLoad } from './$types'
import { makeTranscriptionApi } from '$lib/api/transcription'

export const load: PageLoad = async ({ url, params, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    transcriptions: await makeTranscriptionApi(fetch).listTranscriptions(params.groupId, page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}

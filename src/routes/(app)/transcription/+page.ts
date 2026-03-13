import type { PageLoad } from './$types'
import { makeTranscriptionApi } from '$lib/api/transcription'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    groups: await makeTranscriptionApi(fetch).listGroups(page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}

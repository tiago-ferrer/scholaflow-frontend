import type { LayoutLoad } from './$types'
import { makeTranscriptionApi } from '$lib/api/transcription'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: LayoutLoad = async ({ params, fetch }) => {
  try {
    return { group: await makeTranscriptionApi(fetch).getGroup(params.groupId) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Group not found')
    throw e
  }
}

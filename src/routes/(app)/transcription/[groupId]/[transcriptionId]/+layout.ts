import type { LayoutLoad } from './$types'
import { makeTranscriptionApi } from '$lib/api/transcription'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: LayoutLoad = async ({ params, fetch }) => {
  const api = makeTranscriptionApi(fetch)
  try {
    const [transcription, notes] = await Promise.all([
      api.getTranscription(params.groupId, params.transcriptionId),
      api.listNotes(params.groupId, params.transcriptionId),
    ])
    return { transcription, notes }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Transcription not found')
    throw e
  }
}

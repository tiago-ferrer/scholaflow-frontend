import { writable } from 'svelte/store'
import type { TranscriptionGroup } from '$lib/types/transcription'
import { transcriptionApi } from '$lib/api/transcription'

export const transcriptionGroups = writable<TranscriptionGroup[]>([])

export async function refreshTranscriptionGroups(): Promise<void> {
  try {
    const result = await transcriptionApi.listGroups(0, 100, false)
    transcriptionGroups.set(result.items)
  } catch {
    // Silent — sidebar shows empty state if API unavailable
  }
}

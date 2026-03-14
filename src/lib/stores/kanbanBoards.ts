import { writable } from 'svelte/store'
import type { KanbanBoard } from '$lib/types/kanban'
import { kanbanApi } from '$lib/api/kanban'

export const kanbanBoards = writable<KanbanBoard[]>([])

export async function refreshKanbanBoards(): Promise<void> {
  try {
    const result = await kanbanApi.listBoards(0, 100, false)
    kanbanBoards.set(result.items)
  } catch {
    // Silent — sidebar shows empty state if API unavailable
  }
}

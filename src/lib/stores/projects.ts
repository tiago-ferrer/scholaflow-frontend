import { writable } from 'svelte/store'
import type { Project } from '$lib/types/project'
import { projectsApi } from '$lib/api/projects'

export const projects = writable<Project[]>([])

export async function refreshProjects(): Promise<void> {
  try {
    const result = await projectsApi.list(0, 100, false)
    projects.set(result.items)
  } catch {
    // Silent — sidebar shows empty state if API unavailable
  }
}

import type { LayoutLoad } from './$types'
import { makeNotebooksApi } from '$lib/api/notebooks'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: LayoutLoad = async ({ params, fetch }) => {
  try {
    return { notebook: await makeNotebooksApi(fetch).get(params.id) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Notebook not found')
    throw e
  }
}

import type { PageLoad } from './$types'
import { makePapersApi } from '$lib/api/papers'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    return { paper: await makePapersApi(fetch).get(params.id) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Paper not found')
    throw e
  }
}

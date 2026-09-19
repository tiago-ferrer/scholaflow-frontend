import type { PageLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'

export const load: PageLoad = async ({ fetch }) => {
  const api = makeReferencesApi(fetch)
  const groups = await api.findDuplicates()
  return { groups }
}

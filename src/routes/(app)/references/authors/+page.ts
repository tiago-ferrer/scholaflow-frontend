import type { PageLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'

export const load: PageLoad = async ({ fetch }) => {
  const api = makeReferencesApi(fetch)
  const authors = await api.listAuthors()
  return { authors }
}

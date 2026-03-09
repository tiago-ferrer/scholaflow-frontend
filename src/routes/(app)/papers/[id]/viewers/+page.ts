import type { PageLoad } from './$types'
import { makePapersApi } from '$lib/api/papers'

// paper is provided by parent +layout.ts
export const load: PageLoad = async ({ params, fetch }) => {
  const viewers = await makePapersApi(fetch).listViewers(params.id)
  return { viewers }
}

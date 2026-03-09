import type { PageLoad } from './$types'
import { makePapersApi } from '$lib/api/papers'
import { makeApiKeysApi } from '$lib/api/apikeys'

export const load: PageLoad = async ({ fetch }) => {
  const [papers, apiKeys] = await Promise.all([
    makePapersApi(fetch).list(0, 5),
    makeApiKeysApi(fetch).list(),
  ])
  return { recentPapers: papers.items, apiKeyCount: apiKeys.length }
}

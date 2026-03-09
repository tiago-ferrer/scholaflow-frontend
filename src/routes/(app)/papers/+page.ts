import type { PageLoad } from './$types'
import { makePapersApi } from '$lib/api/papers'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const nextToken = url.searchParams.get('next_token') ?? undefined
  return { papers: await makePapersApi(fetch).list(page, 20, nextToken), page }
}

import type { PageLoad } from './$types'
import { makeNotebooksApi } from '$lib/api/notebooks'

export const load: PageLoad = async ({ params, url, fetch }) => {
  const postsPage = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  const posts = await makeNotebooksApi(fetch).listPosts(params.id, postsPage, 20, includeDeleted)
  return { posts, postsPage, includeDeleted }
}

import { api, makeApi } from './client'
import type { ReferenceFolder, CreateFolderPayload, RenameFolderPayload, MoveFolderPayload, SetFolderFeedPayload } from '$lib/types/folder'

const BASE = '/api/v1/reference-folders'

export function makeFoldersApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    list:   ()                                  => a.get<ReferenceFolder[]>(BASE),
    create: (payload: CreateFolderPayload)      => a.post<ReferenceFolder>(BASE, payload),
    rename: (id: string, payload: RenameFolderPayload) => a.patch<ReferenceFolder>(`${BASE}/${id}`, payload),
    move:   (id: string, payload: MoveFolderPayload)   => a.put<ReferenceFolder>(`${BASE}/${id}/parent`, payload),
    remove: (id: string)                        => a.delete<void>(`${BASE}/${id}`),
    // null feed_url stops watching — see FeedImportJob on the backend (polls every ~30 min).
    setFeed: (id: string, feedUrl: string | null) =>
      a.put<ReferenceFolder>(`${BASE}/${id}/feed`, { feed_url: feedUrl } satisfies SetFolderFeedPayload),
  }
}

export const foldersApi = makeFoldersApi()

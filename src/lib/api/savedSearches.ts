import { api, makeApi } from './client'
import type { SavedSearch, CreateSavedSearchPayload } from '$lib/types/savedSearch'

const BASE = '/api/v1/saved-searches'

export function makeSavedSearchesApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    list:   ()                                     => a.get<SavedSearch[]>(BASE),
    create: (payload: CreateSavedSearchPayload)     => a.post<SavedSearch>(BASE, payload),
    remove: (id: string)                            => a.delete<void>(`${BASE}/${id}`),
  }
}

export const savedSearchesApi = makeSavedSearchesApi()

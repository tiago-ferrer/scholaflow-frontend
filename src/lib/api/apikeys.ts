import { api, makeApi } from './client'
import type { ApiKey, ApiKeyCreated, CreateApiKeyPayload } from '$lib/types/apikey'

export function makeApiKeysApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    list:   ()                             => a.get<ApiKey[]>('/api/v1/api-keys'),
    create: (payload: CreateApiKeyPayload) => a.post<ApiKeyCreated>('/api/v1/api-keys', payload),
    delete: (id: string)                   => a.delete<void>(`/api/v1/api-keys/${id}`),
  }
}

export const apiKeysApi = makeApiKeysApi()

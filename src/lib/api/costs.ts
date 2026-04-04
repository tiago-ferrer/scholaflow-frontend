import { api, makeApi } from './client'
import type { StorageCost } from '$lib/types/costs'

const BASE = '/api/v1/costs'

export function makeCostsApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    getStorage:    ()  => a.get<StorageCost>(`${BASE}/storage`),
    getAllStorage:  ()  => a.get<StorageCost[]>(`${BASE}/storage/all`),
  }
}

export const costsApi = makeCostsApi()

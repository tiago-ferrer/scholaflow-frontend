import { api, makeApi } from './client'
import type { StorageCost, UsageCost } from '$lib/types/costs'

const BASE = '/api/v1/costs'

export function makeCostsApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    getStorage:    ()  => a.get<StorageCost>(`${BASE}/storage`),
    getAllStorage:  ()  => a.get<StorageCost[]>(`${BASE}/storage/all`),
    getUsage:      ()  => a.get<UsageCost>(`${BASE}/usage`),
    getAllUsage:   ()  => a.get<UsageCost[]>(`${BASE}/usage/all`),
  }
}

export const costsApi = makeCostsApi()

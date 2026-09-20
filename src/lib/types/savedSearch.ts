export interface SavedSearch {
  id: string
  name: string
  query: string
  created_at: string
}

export interface CreateSavedSearchPayload {
  name: string
  query: string
}

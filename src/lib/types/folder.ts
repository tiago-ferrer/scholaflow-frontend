export interface ReferenceFolder {
  id: string
  name: string
  parent_id: string | null
  created_at: string
  feed_url: string | null
  children: ReferenceFolder[]
}

export interface CreateFolderPayload {
  name: string
  parent_id?: string | null
}

export interface RenameFolderPayload {
  name: string
}

export interface MoveFolderPayload {
  parent_id: string | null
}

export interface SetFolderFeedPayload {
  feed_url: string | null
}

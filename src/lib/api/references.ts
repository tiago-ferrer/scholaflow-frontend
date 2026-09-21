import { get } from 'svelte/store'
import { api, makeApi, ApiError, readSseStream } from './client'
import { authStore } from '$lib/stores/auth'
import type { Reference, CreateReferencePayload, PatchReferencePayload, PageResult, BibImportJob, ReferenceSearchResult, DuplicateGroup, AuthorUsage, MergeAuthorsResult } from '$lib/types/reference'
import type { Viewer } from '$lib/types/viewer'
import type { NotebookPost } from '$lib/types/notebook'

const BASE = '/api/v1/references'
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export function makeReferencesApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    // GET /references does real offset pagination (page*size) server-side — it has no
    // next_token/cursor param (any next_token sent is silently ignored by the backend,
    // and the response's cursor field is always null). Don't reintroduce one here.
    list: (page = 0, size = 20, folderId?: string) => {
      const params = new URLSearchParams({ page: String(page), size: String(size) })
      if (folderId) params.set('folderId', folderId)
      return a.get<PageResult<Reference>>(`${BASE}?${params}`)
    },
    // Semantic search over the caller's own references (owner-only, no folder scoping).
    // Note: query params are `q`/`topK` — NOT snake_cased, unlike JSON body/response fields.
    search: (q: string, topK = 20) => {
      const params = new URLSearchParams({ q, topK: String(topK) })
      return a.get<ReferenceSearchResult[]>(`${BASE}/search?${params}`)
    },

    get:         (id: string)                                   => a.get<Reference>(`${BASE}/${id}`),
    create:      (payload: CreateReferencePayload)              => a.post<Reference>(BASE, payload),
    replace:     (id: string, payload: CreateReferencePayload)  => a.put<Reference>(`${BASE}/${id}`, payload),
    patch:       (id: string, payload: PatchReferencePayload)   => a.patch<Reference>(`${BASE}/${id}`, payload),
    remove:      (id: string)                                   => a.delete<void>(`${BASE}/${id}`),
    restore:     (id: string)                                   => a.put<Reference>(`${BASE}/${id}/restore`, {}),
    listTrash:   ()                                              => a.get<Reference[]>(`${BASE}/trash`),

    addNote:     (id: string, note: string)                     => a.post<Reference>(`${BASE}/${id}/notes`, { note }),
    deleteNote:  (id: string, noteId: string)                   => a.delete<Reference>(`${BASE}/${id}/notes/${noteId}`),

    upload: (id: string, file: File) => {
      const fd = new FormData(); fd.append('file', file)
      return a.upload<Reference>(`${BASE}/${id}/attachments`, fd)
    },
    getDownloadUrl: async (id: string, attachId: string): Promise<string> => {
      const res = await a.get<{ url: string }>(`${BASE}/${id}/attachments/${attachId}/url`)
      return res.url
    },
    getAnnotationUrl: async (id: string, attachId: string): Promise<string> => {
      const res = await a.get<{ url: string }>(`${BASE}/${id}/attachments/${attachId}/annotation/url`)
      return res.url
    },
    deleteAttachment: (id: string, attachId: string) => a.delete<Reference>(`${BASE}/${id}/attachments/${attachId}`),

    assignFolder: (id: string, folderId: string | null) =>
      a.put<Reference>(`${BASE}/${id}/folder`, { folder_id: folderId }),

    // Kicks off an async import job — returns immediately with { job_id, status: 'PENDING', total }.
    // Poll getImportJob() for progress and the final result.
    importBib: (file: File, folderId?: string) => {
      const fd = new FormData(); fd.append('file', file)
      const url = folderId ? `${BASE}/import?folderId=${folderId}` : `${BASE}/import`
      return a.upload<BibImportJob>(url, fd)
    },
    getImportJob: (jobId: string) => a.get<BibImportJob>(`${BASE}/import/${jobId}`),

    listViewers:  (id: string)                          => a.get<Viewer[]>(`${BASE}/${id}/viewers`),
    addViewer:    (id: string, viewer_username: string) => a.post<void>(`${BASE}/${id}/viewers`, { viewer_username }),
    removeViewer: (id: string, username: string)        => a.delete<void>(`${BASE}/${id}/viewers/${username}`),

    // Fetches metadata from Crossref/Open Library/PubMed for a DOI, ISBN or PMID and returns it
    // pre-filled in create-reference shape. Does NOT create the reference — review/edit, then
    // call create() with the result.
    lookup: (identifier: string) =>
      a.get<CreateReferencePayload>(`${BASE}/lookup?identifier=${encodeURIComponent(identifier)}`),

    findDuplicates: () => a.get<DuplicateGroup[]>(`${BASE}/duplicates`),
    listAuthors:    () => a.get<AuthorUsage[]>(`${BASE}/authors`),
    mergeAuthors:   (variants: string[], canonical: string) =>
      a.post<MergeAuthorsResult>(`${BASE}/authors/merge`, { variants, canonical }),

    addLinkAttachment: (id: string, url: string, label?: string) =>
      a.post<Reference>(`${BASE}/${id}/attachments/link`, { url, label: label || null }),

    // AI paper summary — generates and saves a notebook post from the paper's PDF, streamed as
    // Server-Sent Events (`delta` chunks of generated text, then one `done` with the saved
    // post). Pre-flight validation (paper access, notebook ownership, PDF presence/size, prompt
    // configured) still fails as a plain JSON error before the stream opens. No idempotency
    // protection: a duplicate call creates a duplicate post, so callers must disable the
    // trigger while in flight. Raw fetch, not makeApi() (which only handles JSON responses).
    streamSummarizePost: async (
      id: string,
      notebookId: string,
      onDelta: (chunk: string) => void,
    ): Promise<NotebookPost> => {
      const auth = get(authStore)
      const res = await fetch(`${BASE_URL}${BASE}/${id}/summarize-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ notebook_id: notebookId }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let body: Record<string, unknown> = {}
        try { body = JSON.parse(text) } catch { /* not json */ }
        throw new ApiError(res.status, String(body.error ?? 'UNKNOWN'), String(body.message ?? (text || 'Request failed')))
      }

      let finalPost: NotebookPost | null = null
      await readSseStream(res, (eventName, data) => {
        if (eventName === 'delta') onDelta(data)
        else if (eventName === 'done') finalPost = JSON.parse(data) as NotebookPost
      })

      if (!finalPost) {
        throw new ApiError(0, 'STREAM_INCOMPLETE', "Couldn't generate the summary, try again.")
      }
      return finalPost
    },

    // The caller's own notebook posts that reference this paper (not "who can see this paper").
    // Soft-deleted posts excluded. Returns [] for a paper the caller can't see — never 404s.
    listPosts: (id: string) => a.get<NotebookPost[]>(`${BASE}/${id}/posts`),
  }
}

export const referencesApi = makeReferencesApi()

export type FolderDownloadMode = 'original' | 'annotated'

export interface FolderDownload {
  blob: Blob
  filename: string
}

/**
 * Downloads the zip of a folder's active attachments built by GET /references/download.
 * Raw fetch, not the makeApi() client (which always parses JSON) — this endpoint streams a
 * zip body. Reads it via a stream reader instead of res.blob() so onProgress can report live
 * bytes-received while the server is still building the zip (no Content-Length up front).
 */
export async function downloadFolderZip(
  folderId: string,
  mode: FolderDownloadMode,
  opts: { onProgress?: (bytesReceived: number) => void; signal?: AbortSignal } = {},
): Promise<FolderDownload> {
  const auth = get(authStore)
  const headers = new Headers()
  if (auth.token) headers.set('Authorization', `Bearer ${auth.token}`)

  const params = new URLSearchParams({ folderId, mode })
  const res = await fetch(`${BASE_URL}${BASE}/download?${params}`, { headers, signal: opts.signal })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let body: Record<string, unknown> = {}
    try { body = JSON.parse(text) } catch { /* not json */ }
    throw new ApiError(res.status, String(body.error ?? 'UNKNOWN'), String(body.message ?? (text || 'Download failed')))
  }

  const filename = filenameFromContentDisposition(res.headers.get('Content-Disposition')) ?? 'references.zip'

  if (!res.body) {
    return { blob: await res.blob(), filename }
  }

  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    opts.onProgress?.(received)
  }
  // Blob's BlobPart type wants ArrayBufferView<ArrayBuffer>, but the DOM lib types
  // stream chunks as Uint8Array<ArrayBufferLike> (which also covers SharedArrayBuffer) —
  // Blob itself accepts any ArrayBufferView at runtime, so this is a type-only mismatch.
  return { blob: new Blob(chunks as BlobPart[], { type: 'application/zip' }), filename }
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const match = /filename="?([^";]+)"?/.exec(header)
  return match ? match[1] : null
}

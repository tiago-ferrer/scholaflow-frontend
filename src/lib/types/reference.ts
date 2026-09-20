export type BibTexEntryType =
  | 'article'
  | 'book'
  | 'booklet'
  | 'conference'
  | 'inbook'
  | 'incollection'
  | 'inproceedings'
  | 'manual'
  | 'mastersthesis'
  | 'misc'
  | 'phdthesis'
  | 'proceedings'
  | 'techreport'
  | 'unpublished'

export const BIBTEX_ENTRY_TYPES: BibTexEntryType[] = [
  'article', 'book', 'booklet', 'conference', 'inbook', 'incollection',
  'inproceedings', 'manual', 'mastersthesis', 'misc', 'phdthesis',
  'proceedings', 'techreport', 'unpublished',
]

export type ReferenceRole = 'OWNER' | 'VIEWER'

export interface UserNote {
  id: string
  note: string
  created_at: string
  deleted: boolean
}

export interface Attachment {
  id: string
  filename: string
  s3_key: string | null
  content_type: string | null
  size_bytes: number | null
  created_at: string
  deleted: boolean
  annotation_key: string | null
  /** Non-null marks this as a link attachment (an external URL, no uploaded file). */
  link_url: string | null
}

export interface Reference {
  id: string
  owner: string
  role: ReferenceRole

  // BibTeX core
  entry_type: BibTexEntryType
  citation_key: string | null
  title: string
  author: string[] | null
  editor: string[] | null
  year: number | null
  month: string | null

  // Journal / conference
  journal: string | null
  booktitle: string | null
  volume: string | null
  number: string | null
  pages: string | null
  series: string | null

  // Publisher
  publisher: string | null
  address: string | null
  edition: string | null

  // Identifiers
  doi: string | null
  url: string | null

  // Extra metadata
  abstract: string | null
  note: string | null
  categories: string[] | null
  citation_count: number | null

  // App fields
  folder_id: string | null
  created_at: string
  updated_at: string
  notes: UserNote[] | null
  attachments: Attachment[]
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface CreateReferencePayload {
  entry_type: BibTexEntryType
  title: string
  citation_key?: string | null
  author?: string[] | null
  editor?: string[] | null
  year?: number | null
  month?: string | null
  journal?: string | null
  booktitle?: string | null
  volume?: string | null
  number?: string | null
  pages?: string | null
  series?: string | null
  publisher?: string | null
  address?: string | null
  edition?: string | null
  doi?: string | null
  url?: string | null
  abstract?: string | null
  note?: string | null
  categories?: string[] | null
  citation_count?: number | null
}

export type PatchReferencePayload = Partial<CreateReferencePayload>

export interface BibImportSkipped {
  citation_key: string
  doi: string
  existing_id: string
}

export interface BibImportFailed {
  citation_key: string
  reason: string
}

export interface BibImportResult {
  added: number
  skipped: number
  skipped_references: BibImportSkipped[]
  failed_entries: BibImportFailed[]
}

// Async import job — POST /references/import returns one immediately (status PENDING),
// GET /references/import/{job_id} polls it. `result` is populated only once COMPLETED;
// `error_message` only once FAILED (reserved for a fatal error outside the per-entry loop —
// a single bad entry doesn't fail the job, it shows up in result.failed_entries instead).
export type BibImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface BibImportJob {
  job_id: string
  status: BibImportJobStatus
  total: number
  processed: number
  result: BibImportResult | null
  error_message?: string
}

// No total/count field and no cursor — GET /references does real page*size offset pagination,
// so `hasNext` must be inferred from `items.length === size` (see references +page.svelte).
export interface PageResult<T> {
  items: T[]
  page: number
  size: number
}

// Semantic search — owner-only, no pagination. `score` is a COSINE distance
// (lower = more similar), already sorted best-first by the backend.
export interface ReferenceSearchResult {
  reference: Reference
  score: number
}

// GET /references/duplicates — owned references grouped by matching DOI or citation key.
export interface DuplicateGroup {
  match_type: 'DOI' | 'CITATION_KEY'
  match_value: string
  items: Reference[]
}

// GET /references/authors — distinct author/editor name usage across the library.
export interface AuthorUsage {
  name: string
  count: number
}

export interface MergeAuthorsResult {
  updated_references: number
}

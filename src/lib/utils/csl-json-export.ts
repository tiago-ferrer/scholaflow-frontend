import type { Reference } from '$lib/types/reference'
import { generateCitationKey } from './bibtex-export'
import { parseName } from './citation'

/**
 * Serializes references to CSL-JSON — the format citeproc-js and Zotero/Mendeley's "Citation
 * Style Language" plugins consume to render any of the thousands of CSL styles. Unlike our
 * fixed APA/MLA/Chicago/ABNT formatters in `citation.ts`, this doesn't format text itself —
 * it hands structured data to a CSL processor, which is what a downstream tool imports it for.
 */

const CSL_TYPE_BY_ENTRY_TYPE: Record<string, string> = {
  article: 'article-journal',
  book: 'book',
  booklet: 'book',
  inbook: 'chapter',
  incollection: 'chapter',
  inproceedings: 'paper-conference',
  conference: 'paper-conference',
  proceedings: 'paper-conference',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  techreport: 'report',
  manual: 'document',
  unpublished: 'manuscript',
  misc: 'document',
}

interface CslName {
  family: string
  given?: string
}

function cslNames(names: string[] | null | undefined): CslName[] | undefined {
  const list = (names ?? []).map((n) => n.trim()).filter(Boolean)
  if (!list.length) return undefined
  return list.map((n) => {
    const { last, first } = parseName(n)
    return first ? { family: last, given: first } : { family: last }
  })
}

/** CSL-JSON has no plain "pages" field — split the same "start-end" string used elsewhere. */
function cslPage(pages: string | null): string | undefined {
  return pages?.trim() || undefined
}

function referenceToCslJson(ref: Reference): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: generateCitationKey(ref),
    type: CSL_TYPE_BY_ENTRY_TYPE[ref.entry_type] ?? 'document',
    title: ref.title,
  }

  const author = cslNames(ref.author)
  if (author) out.author = author
  const editor = cslNames(ref.editor)
  if (editor) out.editor = editor

  const containerTitle = ref.journal ?? ref.booktitle
  if (containerTitle) out['container-title'] = containerTitle
  if (ref.volume) out.volume = ref.volume
  if (ref.number) out.issue = ref.number
  const page = cslPage(ref.pages)
  if (page) out.page = page
  if (ref.publisher) out.publisher = ref.publisher
  if (ref.address) out['publisher-place'] = ref.address
  if (ref.edition) out.edition = ref.edition
  if (ref.year) out.issued = { 'date-parts': [[ref.year]] }
  if (ref.doi) out.DOI = ref.doi
  if (ref.url) out.URL = ref.url
  if (ref.abstract) out.abstract = ref.abstract
  if (ref.note) out.note = ref.note
  if (ref.categories?.length) out.keyword = ref.categories.join(', ')

  return out
}

/** Serializes any number of references into one CSL-JSON array (the standard container shape). */
export function referencesToCslJson(refs: Reference[]): string {
  return `${JSON.stringify(refs.map(referenceToCslJson), null, 2)}\n`
}

/** Slugifies a display name into a safe `.json` filename — mirrors `bibFilename`. */
export function cslJsonFilename(base: string): string {
  const slug = base
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'references'}.json`
}

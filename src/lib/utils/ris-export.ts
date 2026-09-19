import type { Reference } from '$lib/types/reference'
import { parseName } from './citation'

/**
 * Serializes references to RIS — the tagged plain-text format EndNote, Mendeley and most
 * reference managers import natively (Zotero/Mendeley both export it too). Field order follows
 * the de-facto convention most parsers expect: TY first, ER last, everything else in between.
 */

const TY_BY_ENTRY_TYPE: Record<string, string> = {
  article: 'JOUR',
  book: 'BOOK',
  booklet: 'BOOK',
  inbook: 'CHAP',
  incollection: 'CHAP',
  inproceedings: 'CONF',
  conference: 'CONF',
  proceedings: 'CONF',
  phdthesis: 'THES',
  mastersthesis: 'THES',
  techreport: 'RPRT',
  manual: 'GEN',
  unpublished: 'UNPB',
  misc: 'GEN',
}

/** RIS authors are one "Last, First" tag per person, not a joined list. */
function risAuthorLines(tag: string, names: string[] | null | undefined): string[] {
  return (names ?? []).map((n) => n.trim()).filter(Boolean).map((n) => {
    const { last, first } = parseName(n)
    return `${tag}  - ${first ? `${last}, ${first}` : last}`
  })
}

/** RIS splits a "start-end" page range into SP/EP; a single page number only sets SP. */
function pageLines(pages: string | null): string[] {
  if (!pages) return []
  const match = pages.match(/^\s*(\S+?)\s*-+\s*(\S+)\s*$/)
  if (match) return [`SP  - ${match[1]}`, `EP  - ${match[2]}`]
  return [`SP  - ${pages.trim()}`]
}

function referenceToRis(ref: Reference): string {
  const lines: string[] = []
  const push = (tag: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined) return
    const v = String(value).trim()
    if (v) lines.push(`${tag}  - ${v}`)
  }

  push('TY', TY_BY_ENTRY_TYPE[ref.entry_type] ?? 'GEN')
  lines.push(...risAuthorLines('AU', ref.author))
  lines.push(...risAuthorLines('ED', ref.editor))
  push('TI', ref.title)
  push('T2', ref.journal ?? ref.booktitle)
  push('PY', ref.year)
  push('VL', ref.volume)
  push('IS', ref.number)
  lines.push(...pageLines(ref.pages))
  push('PB', ref.publisher)
  push('CY', ref.address)
  push('DO', ref.doi)
  push('UR', ref.url)
  push('AB', ref.abstract)
  push('N1', ref.note)
  for (const c of ref.categories ?? []) push('KW', c)
  lines.push('ER  - ')

  return lines.join('\n')
}

/** Serializes any number of references into one .ris document (blank line between entries). */
export function referencesToRis(refs: Reference[]): string {
  return `${refs.map(referenceToRis).join('\n\n')}\n`
}

/** Slugifies a display name into a safe `.ris` filename — mirrors `bibFilename`. */
export function risFilename(base: string): string {
  const slug = base
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'references'}.ris`
}

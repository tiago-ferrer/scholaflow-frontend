# References

Academic paper/citation library. The core research management feature.

## Routes

```
references/
  +page.svelte          # List of all references with search + filters
  +page.ts              # Loads paginated references
  new/
    +page.svelte        # Create reference (manual form or BibTeX import)
  trash/
    +page.svelte        # Soft-deleted references (7-day TTL) with a restore action
    +page.ts
  duplicates/
    +page.svelte        # Owned references grouped by matching DOI or citation key
    +page.ts
  authors/
    +page.svelte        # Author/editor name usage across the library + merge variants
    +page.ts
  [id]/
    +layout.ts          # Loads reference by ID; shared by all sub-routes
    +page.svelte        # Reference detail: metadata, notes, attachments, viewers
    edit/
      +page.svelte      # Edit reference metadata
    viewers/
      +page.svelte      # Manage shared viewers (who can access this paper)
      +page.ts
```

## Data Model (`$lib/types/reference.ts`)

`Reference` has:
- Bibliographic fields: `title`, `authors`, `year`, `journal`, `doi`, `url`, `abstract`, `tags`
- `entryType: BibTexEntryType` — one of 14 BibTeX types (ARTICLE, BOOK, INPROCEEDINGS, etc.)
- Notes (inline on detail page)
- Attachments (PDF files, etc.)
- Soft delete (`deletedAt`)

## API (`$lib/api/references.ts`)

Key methods beyond standard CRUD:
- `getDownloadUrl(id, attachId)` → presigned URL for downloading/viewing a PDF attachment
- `getAnnotatedPdfUrl(id, attachId)` → presigned URL for the annotated PDF version
- `getAnnotationUrl(id, attachId)` → URL for the annotation image overlay
- `addViewer(id, payload)`, `removeViewer(id, viewerId)` — sharing/collaboration
- `addNote(id, content)`, `patchNote(id, noteId, content)`, `deleteNote(id, noteId)`

## PDF Viewing

The detail page has two PDF view modes:
- **Original** — raw uploaded PDF via presigned download URL
- **Annotated** — annotated version with an image overlay (annotation image rendered on top of the PDF)

Both views use `viewers/+page.svelte` which loads the appropriate URL from the API.

## BibTeX Import

`FromBibTexModal.svelte` parses a BibTeX string (via `$lib/utils/bibtex.ts`) and pre-fills the create form. Accessible from the "New" button on the references list.

## Trash

`GET /references/trash` (owner-only) returns soft-deleted references, most recently deleted first — a backend table Scan, not a GSI query (deleted items are absent from the sparse owner-index). Linked from `FolderTree.svelte`'s bottom "library tools" section. Restoring uses the existing `referencesApi.restore(id)`.

## Add by DOI/ISBN/PMID

`AddByIdentifierModal.svelte` calls `referencesApi.lookup(identifier)` (`GET /references/lookup`), which fetches metadata from Crossref/Open Library/PubMed server-side and returns it pre-filled in create-reference shape — same "review, then create" flow as `FromBibTexModal`. Accessible from the "Add by ID" button on the references list.

## Duplicates & Author Merge

Linked from `FolderTree.svelte`'s bottom section (below "Unfiled"):
- `/references/duplicates` lists owned references sharing a DOI or citation key, grouped, with a delete action per item.
- `/references/authors` lists every distinct author/editor name with its usage count; selecting 2+ and setting a canonical name calls `referencesApi.mergeAuthors()` to rewrite them across the library.

## Create Form

Manual form covers all bibliographic fields. `BibTexEntryType` selector determines which fields are shown/required.

## Favorite, Read Status, Related Items

`Reference.starred`/`read`/`related_ids` are all set via the existing `referencesApi.patch()` — no dedicated endpoints. The list page shows a star toggle per row (and bolds unread titles); the detail page has a star toggle in the header, marks the reference read on open (fire-and-forget, no reload), and has a "Related" card that resolves `related_ids` to full references client-side (`referencesApi.get()` per ID) and offers a semantic-search picker (`referencesApi.search()`) to add more.

## Saved Searches ("Smart Collections")

`$lib/api/savedSearches.ts` (`/api/v1/saved-searches`) stores just `{name, query}` — re-running the query always reflects the current library, so there's no snapshot to keep in sync. Managed inline on the references list page: a bookmark button next to the search bar appears once a search is active, and saved searches render as removable pills below the search bar; clicking one re-runs it.

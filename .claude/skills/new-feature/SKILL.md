---
name: new-feature
description: Implement a new full-stack feature in this SvelteKit app following the established architecture, API patterns, design system, and UI conventions. Use when adding a new top-level section (e.g. a new resource type with list + detail pages).
---

Implement the feature described in $ARGUMENTS.

Follow every step below exactly. Do not skip any step, and do not invent patterns that deviate from the existing codebase conventions.

---

## Stack & Rules

- **Svelte 5 runes only** — `$state`, `$derived`, `$derived.by`, `$props`, `$effect`. Never `export let`, reactive labels (`$:`), or `<slot />`.
- **`{@render children()}`** not `<slot />`.
- **Dynamic icons**: `<item.icon size={20} />` — NOT `<svelte:component this={item.icon} />`.
- **CSS globals in Svelte**: `.wrapper :global(svg) { ... }` on its own block — never comma-separate inside `:global()`.
- **No Tailwind classes in markup** — all styles go in `<style>` blocks using the design tokens below.
- **No component fetches** — only `$lib/api/*` modules call the API.
- **No fetch in stores** — stores use the exported singleton (e.g. `kanbanApi`), not `makeXxxApi(fetch)`.
- **Load functions** use `makeXxxApi(fetch)` with SvelteKit's injected `fetch` for SSR compatibility.

---

## Design Tokens (CSS custom properties)

Use only these — never hardcode colors or sizes:

```
--color-surface-0/1/2/3      background layers (0 = page, 3 = border)
--color-primary              accent / links
--color-primary-subtle       light primary tint for active chips
--color-text-primary/secondary/disabled
--color-error                danger actions
--color-sidebar-bg/text/active/active-text
--shadow-1/2/3               elevation
--topbar-height              60px
--sidebar-width / --sidebar-collapsed-width
--transition-standard        fast ease transition
```

---

## Step 1 — Types (`src/lib/types/<feature>.ts`)

Define interfaces for:
- The primary resource (with `id`, `owner`, `created_at`, `updated_at`, `deleted` fields)
- Any sub-resources
- `Create*Payload` and `Patch*Payload` interfaces (all fields optional on Patch)
- Re-export `PageResult<T>` if needed (or import from an existing types file)

Example pattern:
```ts
export interface MyItem {
  id: string
  owner: string
  title: string
  description: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface CreateMyItemPayload { title: string; description?: string }
export interface PatchMyItemPayload  { title?: string; description?: string }

export interface PageResult<T> { items: T[]; page: number; size: number; next_token?: string }
```

---

## Step 2 — API module (`src/lib/api/<feature>.ts`)

Follow the `makeXxxApi(fetchFn?)` factory pattern exactly:

```ts
import { api, makeApi } from './client'
import type { MyItem, CreateMyItemPayload, PatchMyItemPayload, PageResult } from '$lib/types/<feature>'

const BASE = '/api/v1/<feature>'

export function makeMyFeatureApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    listItems:  (page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<MyItem>>(`${BASE}/items?${params}`)
    },
    getItem:    (id: string)                               => a.get<MyItem>(`${BASE}/items/${id}`),
    createItem: (payload: CreateMyItemPayload)             => a.post<MyItem>(`${BASE}/items`, payload),
    patchItem:  (id: string, payload: PatchMyItemPayload)  => a.patch<MyItem>(`${BASE}/items/${id}`, payload),
    removeItem: (id: string)                               => a.delete<void>(`${BASE}/items/${id}`),
  }
}

export const myFeatureApi = makeMyFeatureApi()
```

---

## Step 3 — Sidebar store (`src/lib/stores/<feature>Items.ts`)

```ts
import { writable } from 'svelte/store'
import type { MyItem } from '$lib/types/<feature>'
import { myFeatureApi } from '$lib/api/<feature>'

export const myFeatureItems = writable<MyItem[]>([])

export async function refreshMyFeatureItems(): Promise<void> {
  try {
    const result = await myFeatureApi.listItems(0, 100, false)
    myFeatureItems.set(result.items)
  } catch {
    // Silent — sidebar shows empty state if API unavailable
  }
}
```

---

## Step 4 — Navigation (`src/lib/config/navigation.ts`)

1. Import the appropriate lucide-svelte icon (check existing imports first).
2. Add a `NavItem` in the correct `NAV_SECTIONS` array position.

```ts
{ label: 'My Feature', href: '/my-feature', icon: MyIcon },
```

---

## Step 5 — Sidebar (`src/lib/components/layout/Sidebar.svelte`)

Add in the script block:
```ts
import { myFeatureItems, refreshMyFeatureItems } from '$lib/stores/<feature>Items'
const visibleItems = $derived($myFeatureItems.filter(i => !i.deleted))
let myFeatureExpanded = $state(false)
function toggleMyFeature() { myFeatureExpanded = !myFeatureExpanded }
```

Call `refreshMyFeatureItems()` inside the existing `onMount`.

In the template, add — exactly following the `/kanban`, `/gantt`, `/projects` pattern:

1. Add `item.href === '/my-feature'` to the `has-submenu` class condition on `.nav-item-wrapper`.
2. Add the chevron toggle button block for `item.href === '/my-feature'`.
3. Add the sub-items block after the toggle:

```svelte
{#if item.href === '/my-feature' && !$sidebarCollapsed && myFeatureExpanded}
  {#each visibleItems as item}
    {@const active = activeHref.startsWith(`/my-feature/${item.id}`)}
    <a href="/my-feature/{item.id}" class="nav-item nav-subitem" class:active aria-current={active ? 'page' : undefined}>
      <span class="subitem-dot">·</span>
      <span>{item.title}</span>
    </a>
  {/each}
  <a href="/my-feature" class="nav-item nav-subitem nav-subitem-new">
    <Plus size={14} />
    <span>New item</span>
  </a>
{/if}
```

---

## Step 6 — Breadcrumb (`src/lib/components/layout/Breadcrumb.svelte`)

1. Import the primary type: `import type { MyItem } from '$lib/types/<feature>'`
2. Add `myFeature?: MyItem` to the `data` type cast in `labelFor`.
3. Add resolution block:
```ts
if (data.myFeature && part === data.myFeature.id) {
  return truncate(data.myFeature.title) // or .name, whatever the display field is
}
```

---

## Step 7 — List page load (`src/routes/(app)/<feature>/+page.ts`)

```ts
import type { PageLoad } from './$types'
import { makeMyFeatureApi } from '$lib/api/<feature>'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    items: await makeMyFeatureApi(fetch).listItems(page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}
```

---

## Step 8 — List page (`src/routes/(app)/<feature>/+page.svelte`)

Must match the Kanban/Gantt/Projects card UX exactly:

**Script:**
```ts
let { data }: { data: PageData } = $props()

// Create modal
let newOpen = $state(false)
let newTitle = $state('')
let newDesc = $state('')
let creating = $state(false)
let newErrors = $state<Record<string, string>>({})

async function createItem() {
  creating = true; newErrors = {}
  try {
    const item = await myFeatureApi.createItem({ title: newTitle, description: newDesc || undefined })
    toast.success('Created')
    newOpen = false; newTitle = ''; newDesc = ''
    goto(`/my-feature/${item.id}`)
  } catch (e) {
    if (e instanceof ApiError) { if (e.fields) newErrors = e.fields; else toast.error(e.message) }
    else toast.error('Something went wrong, please try again')
  } finally { creating = false }
}

// Delete
let deleteTarget = $state<MyItem | null>(null)
let deleting = $state(false)

async function confirmDelete() {
  if (!deleteTarget) return
  deleting = true
  try {
    await myFeatureApi.removeItem(deleteTarget.id)
    toast.success('Deleted')
    deleteTarget = null
    await invalidateAll()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Something went wrong, please try again')
  } finally { deleting = false }
}

function toggleDeleted() {
  const p = new URLSearchParams()
  if (!data.includeDeleted) p.set('includeDeleted', 'true')
  goto(`/my-feature?${p}`)
}
```

**Template structure:**
```svelte
<div class="page">
  <div class="page-header">
    <h1>My Feature</h1>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>Show deleted</button>
      <Button onclick={() => { newTitle = ''; newDesc = ''; newErrors = {}; newOpen = true }}>
        <Plus size={20} /> New Item
      </Button>
    </div>
  </div>

  {#if data.items.items.length === 0}
    <EmptyState title="No items yet" message="Create your first item." />
  {:else}
    <div class="items-grid">
      {#each data.items.items as item}
        <div
          class="item-card"
          class:deleted-card={item.deleted}
          onclick={() => !item.deleted && goto(`/my-feature/${item.id}`)}
          role="button"
          tabindex={item.deleted ? -1 : 0}
          onkeydown={(e) => e.key === 'Enter' && !item.deleted && goto(`/my-feature/${item.id}`)}
        >
          <div class="card-top">
            <span class="card-title" class:deleted-text={item.deleted}>{item.title}</span>
            {#if item.deleted}<span class="deleted-badge">deleted</span>{/if}
          </div>
          {#if item.description}<p class="card-desc">{item.description}</p>{/if}
          <div class="card-footer">
            <span class="card-date">{formatDate(item.updated_at)}</span>
            <div class="card-actions" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
              {#if !item.deleted}
                <button class="icon-btn" title="Open" onclick={() => goto(`/my-feature/${item.id}`)}><Pencil size={16} /></button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = item}><Trash2 size={16} /></button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
    <Pagination
      page={data.page}
      hasNext={data.items.items.length === 20}
      onprev={() => { const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) }); if (data.includeDeleted) p.set('includeDeleted', 'true'); goto(`/my-feature?${p}`) }}
      onnext={() => { const p = new URLSearchParams({ page: String(data.page + 1) }); if (data.includeDeleted) p.set('includeDeleted', 'true'); goto(`/my-feature?${p}`) }}
    />
  {/if}
</div>

<!-- Create Modal -->
<Modal open={newOpen} title="New Item" onclose={() => newOpen = false}>
  <form onsubmit={(e) => { e.preventDefault(); createItem() }} class="modal-form">
    <div class="form-group">
      <label for="new-title">Title *</label>
      <input id="new-title" bind:value={newTitle} placeholder="e.g. My Item" required />
      {#if newErrors.title}<span class="field-error">{newErrors.title}</span>{/if}
    </div>
    <div class="form-group">
      <label for="new-desc">Description</label>
      <textarea id="new-desc" bind:value={newDesc} rows="3" placeholder="Optional description"></textarea>
    </div>
    <div class="form-actions">
      <Button type="submit" loading={creating} disabled={!newTitle.trim()}>Create</Button>
      <Button variant="text" onclick={() => newOpen = false}>Cancel</Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirm -->
<ConfirmDialog
  open={!!deleteTarget}
  title="Delete item?"
  message={`"${deleteTarget?.title}" will be soft-deleted.`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>
```

**Required CSS pattern** (copy from `/gantt/+page.svelte` or `/kanban/+page.svelte`):
- `.page { max-width: 100%; }`
- `.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }`
- `.items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }`
- `.item-card` — surface-0 background, border, border-radius 12px, cursor pointer, hover box-shadow + primary border
- `.deleted-card { opacity: 0.55; cursor: default; }` + hover resets
- `.card-footer { display: flex; align-items: center; justify-content: space-between; }`
- `.icon-btn` — 28×28, border-radius 6px, no border, transparent bg; `.danger:hover` uses error color
- Modal form styles matching other pages

---

## Step 9 — Detail page load (`src/routes/(app)/<feature>/[itemId]/+page.ts`)

```ts
import type { PageLoad } from './$types'
import { makeMyFeatureApi } from '$lib/api/<feature>'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const item = await makeMyFeatureApi(fetch).getItem(params.itemId)
    return { item, myFeature: item }  // 'myFeature' key used by Breadcrumb
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
      throw error(404, 'Not found')
    }
    throw e
  }
}
```

> The load must return the resource under the key that matches what Breadcrumb looks for (e.g. `chart`, `board`, `project`). Add the new key name to Breadcrumb in Step 6.

---

## Step 10 — Detail page (`src/routes/(app)/<feature>/[itemId]/+page.svelte`)

**Header pattern** (matches Kanban/Gantt/Projects):
```svelte
<div class="feature-header">
  <div class="feature-header-left">
    <a href="/my-feature" class="back-link">← Items</a>
    <div class="title-row">
      {#if editingTitle}
        <input bind:value={titleInput} class="title-input" onkeydown={...} />
        <button class="icon-btn" onclick={saveTitle} disabled={saving}><Check size={16} /></button>
        <button class="icon-btn" onclick={() => { editingTitle = false; titleInput = item.title }}><X size={16} /></button>
      {:else}
        <h1 class="item-title">{item.title}</h1>
        <button class="icon-btn" onclick={() => { editingTitle = true; titleInput = item.title }} title="Edit"><Pencil size={15} /></button>
      {/if}
    </div>
    {#if item.description}<span class="item-desc">{item.description}</span>{/if}
  </div>
  <div class="feature-header-right">
    <!-- action buttons specific to this feature -->
  </div>
</div>
```

**Header CSS:**
```css
.feature-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.feature-header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.feature-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
.back-link { font-size: 0.8125rem; color: var(--color-primary); text-decoration: none; }
.back-link:hover { text-decoration: underline; }
.title-row { display: flex; align-items: center; gap: 6px; }
.item-title { margin: 0; font-size: 1.375rem; font-weight: 500; }
.item-desc { font-size: 0.8125rem; color: var(--color-text-secondary); }
.title-input { font-size: 1.1rem; font-weight: 600; border: 1px solid var(--color-primary); border-radius: 6px; padding: 4px 8px; background: var(--color-surface-0); color: var(--color-text-primary); outline: none; width: 300px; }
.icon-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; border: none; background: none; cursor: pointer; color: var(--color-text-secondary); }
.icon-btn:hover:not(:disabled) { background: var(--color-surface-2); color: var(--color-text-primary); }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
```

---

## Step 11 — Verify

After creating all files, run:
```
npm run check
```

Fix any TypeScript errors before finishing. Common issues:
- Missing type import in Breadcrumb
- `data.myFeature` key mismatch between `+page.ts` return value and Breadcrumb key check
- Forgetting to add the store refresh call to `onMount` in Sidebar
- Svelte 5 rune usage in non-rune context (all `.svelte` files in this project already use runes mode)

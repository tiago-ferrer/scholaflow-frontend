<script lang="ts">
  import type { PageData } from './$types'
  import { invalidateAll } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import { GitMerge } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let selected  = $state<Set<string>>(new Set())
  let canonical = $state('')
  let merging   = $state(false)
  let filter    = $state('')

  const filteredAuthors = $derived(
    data.authors.filter(a => a.name.toLowerCase().includes(filter.trim().toLowerCase())),
  )

  function toggle(name: string) {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    selected = next
    // Prefill canonical with the most-used selected variant if the field is still empty
    if (!canonical.trim() && next.size > 0) {
      const best = data.authors
        .filter(a => next.has(a.name))
        .sort((a, b) => b.count - a.count)[0]
      canonical = best?.name ?? ''
    }
  }

  async function merge() {
    const variants = [...selected]
    const target = canonical.trim()
    if (variants.length < 2 || !target) return
    merging = true
    try {
      const result = await referencesApi.mergeAuthors(variants, target)
      toast.success(`Updated ${result.updated_references} reference(s)`)
      selected = new Set()
      canonical = ''
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to merge authors')
    } finally {
      merging = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/references" class="back-link">← References</a>
    <h1>Merge Authors</h1>
    <p class="subtitle">Select two or more name spellings that refer to the same person, then merge them into one.</p>
  </div>

  {#if data.authors.length === 0}
    <EmptyState title="No authors yet" message="Authors will show up here once your references have some." />
  {:else}
    <div class="merge-bar">
      <FormField label="Canonical name">
        <input type="text" bind:value={canonical} placeholder="Name to use going forward" />
      </FormField>
      <Button onclick={merge} loading={merging} disabled={selected.size < 2 || !canonical.trim()}>
        <GitMerge size={18} /> Merge {selected.size >= 2 ? `(${selected.size})` : ''}
      </Button>
    </div>

    <input
      type="text"
      class="filter-input"
      bind:value={filter}
      placeholder="Filter names…"
    />

    <ul class="author-list">
      {#each filteredAuthors as author (author.name)}
        <li class="author-item">
          <label class="author-label">
            <input
              type="checkbox"
              checked={selected.has(author.name)}
              onchange={() => toggle(author.name)}
            />
            <span class="author-name">{author.name}</span>
          </label>
          <span class="author-count">{author.count} {author.count === 1 ? 'reference' : 'references'}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .page { max-width: 640px; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0 0 4px; font-size: 1.375rem; font-weight: 500; }
  .subtitle { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }

  .merge-bar {
    display: flex; align-items: flex-end; gap: 12px; margin-bottom: 16px;
    padding: 16px; border: 1px solid var(--color-surface-3); border-radius: 10px;
    background: var(--color-surface-0);
  }
  .merge-bar :global(.field) { flex: 1; }
  .merge-bar input[type="text"] {
    width: 100%; padding: 8px 12px; border-radius: 6px; box-sizing: border-box;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .merge-bar input[type="text"]:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .filter-input {
    width: 100%; padding: 8px 12px; margin-bottom: 12px; border-radius: 6px; box-sizing: border-box;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .filter-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .author-list {
    list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px;
    border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden;
  }
  .author-item {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 8px 14px; background: var(--color-surface-0);
  }
  .author-label { display: flex; align-items: center; gap: 10px; cursor: pointer; min-width: 0; }
  .author-name { font-size: 0.875rem; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .author-count { font-size: 0.75rem; color: var(--color-text-secondary); flex-shrink: 0; }
</style>

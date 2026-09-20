<script lang="ts">
  import type { PageData } from './$types'
  import { invalidateAll } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import type { Reference } from '$lib/types/reference'
  import { Trash2 } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let deleteTarget = $state<Reference | null>(null)

  function label(r: Reference): string {
    const author = r.author?.[0]?.split(',')[0]?.trim() ?? r.editor?.[0]?.split(',')[0]?.trim()
    return [author, r.year].filter(Boolean).join(', ')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await referencesApi.remove(deleteTarget.id)
      toast.success('Reference deleted')
      deleteTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete reference')
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/references" class="back-link">← References</a>
    <h1>Duplicate References</h1>
    <p class="subtitle">Owned references sharing the same DOI or citation key.</p>
  </div>

  {#if data.groups.length === 0}
    <EmptyState title="No duplicates found" message="Your library has no references sharing a DOI or citation key." />
  {:else}
    <div class="groups">
      {#each data.groups as group}
        <div class="card">
          <div class="card-header">
            <StatusChip label={group.match_type === 'DOI' ? 'DOI' : 'Citation key'} variant="info" />
            <span class="match-value">{group.match_value}</span>
          </div>
          <ul class="item-list">
            {#each group.items as item (item.id)}
              <li class="item">
                <div class="item-info">
                  <a href={`/references/${item.id}`} class="item-title">{item.title}</a>
                  <span class="item-meta">{label(item)}</span>
                </div>
                <button class="icon-btn danger" data-tooltip="Delete" onclick={() => deleteTarget = item}>
                  <Trash2 size={18} />
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  {/if}
</div>

<DestructiveConfirmDialog
  open={!!deleteTarget}
  title="Delete reference?"
  message="This reference will be moved to trash."
  confirmPhrase={`I want to delete ${deleteTarget?.title ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 720px; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0 0 4px; font-size: 1.375rem; font-weight: 500; }
  .subtitle { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }

  .groups { display: flex; flex-direction: column; gap: 16px; }

  .card {
    border: 1px solid var(--color-surface-3); border-radius: 10px; padding: 16px;
    background: var(--color-surface-0);
  }
  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .match-value { font-size: 0.8125rem; color: var(--color-text-secondary); font-family: var(--font-mono, monospace); }

  .item-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .item {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 8px 10px; border-radius: 6px; transition: background var(--transition-standard);
  }
  .item:hover { background: var(--color-surface-1); }
  .item-info { display: flex; flex-direction: column; min-width: 0; }
  .item-title {
    font-size: 0.875rem; color: var(--color-text-primary); text-decoration: none; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .item-title:hover { text-decoration: underline; }
  .item-meta { font-size: 0.75rem; color: var(--color-text-secondary); }

  .icon-btn {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard), color var(--transition-standard);
  }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }
</style>

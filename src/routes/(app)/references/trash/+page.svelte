<script lang="ts">
  import type { PageData } from './$types'
  import { invalidateAll } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import { formatDate } from '$lib/utils/format'
  import type { Reference } from '$lib/types/reference'
  import { RotateCcw } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let restoringId = $state<string | null>(null)

  function daysLeft(ref: Reference): number | null {
    if (!ref.ttl_expiry) return null
    return Math.max(0, Math.ceil((ref.ttl_expiry * 1000 - Date.now()) / 86_400_000))
  }

  async function restore(ref: Reference) {
    restoringId = ref.id
    try {
      await referencesApi.restore(ref.id)
      toast.success(`"${ref.title}" restored`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to restore reference')
    } finally {
      restoringId = null
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/references" class="back-link">← References</a>
    <h1>Trash</h1>
    <p class="subtitle">Deleted references are kept for 7 days, then removed permanently.</p>
  </div>

  {#if data.references.length === 0}
    <EmptyState title="Trash is empty" message="Deleted references show up here for 7 days before they're gone for good." />
  {:else}
    <ul class="item-list">
      {#each data.references as ref (ref.id)}
        <li class="item">
          <div class="item-info">
            <span class="item-title">{ref.title}</span>
            <span class="item-meta">
              Deleted {ref.deleted_at ? formatDate(ref.deleted_at) : '—'}
              {#if daysLeft(ref) !== null}
                <span class="dot">·</span>
                {daysLeft(ref) === 0 ? 'Expires today' : `Expires in ${daysLeft(ref)} day${daysLeft(ref) === 1 ? '' : 's'}`}
              {/if}
            </span>
          </div>
          <button class="icon-btn" data-tooltip="Restore" disabled={restoringId === ref.id} onclick={() => restore(ref)}>
            <RotateCcw size={18} />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .page { max-width: 720px; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0 0 4px; font-size: 1.375rem; font-weight: 500; }
  .subtitle { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }

  .item-list {
    list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px;
    border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden;
  }
  .item {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 10px 14px; background: var(--color-surface-0);
  }
  .item-info { display: flex; flex-direction: column; min-width: 0; gap: 2px; }
  .item-title {
    font-size: 0.875rem; color: var(--color-text-primary); font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .item-meta { font-size: 0.75rem; color: var(--color-text-secondary); }
  .dot { margin: 0 4px; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard), color var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-primary); }
  .icon-btn:disabled { opacity: 0.5; cursor: default; }
</style>

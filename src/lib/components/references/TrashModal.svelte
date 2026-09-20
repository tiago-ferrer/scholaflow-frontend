<script lang="ts">
  import { scale, fade } from 'svelte/transition'
  import { invalidateAll } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { formatDate } from '$lib/utils/format'
  import type { Reference } from '$lib/types/reference'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { X, RotateCcw, AlertCircle } from 'lucide-svelte'

  interface Props {
    open?: boolean
    onclose?: () => void
  }
  let { open = false, onclose }: Props = $props()

  let references  = $state<Reference[]>([])
  let loading      = $state(false)
  let loadError     = $state<string | null>(null)
  let restoringId  = $state<string | null>(null)
  let loaded        = false

  async function load() {
    loading = true
    loadError = null
    try {
      references = await referencesApi.listTrash()
      loaded = true
    } catch (e) {
      loadError = e instanceof ApiError ? e.message : 'Failed to load trash'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (open && !loaded) load()
  })

  function handleClose() {
    onclose?.()
  }

  function daysLeft(ref: Reference): number | null {
    if (!ref.ttl_expiry) return null
    return Math.max(0, Math.ceil((ref.ttl_expiry * 1000 - Date.now()) / 86_400_000))
  }

  async function restore(ref: Reference) {
    restoringId = ref.id
    try {
      await referencesApi.restore(ref.id)
      toast.success(`"${ref.title}" restored`)
      references = references.filter((r) => r.id !== ref.id)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to restore reference')
    } finally {
      restoringId = null
    }
  }
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div
      class="modal"
      transition:scale={{ start: 0.96, duration: 150 }}
      role="dialog"
      aria-modal="true"
      aria-label="Trash"
    >
      <div class="modal-header">
        <h3>Trash</h3>
        <button class="close-btn" onclick={handleClose} aria-label="Close"><X size={22} /></button>
      </div>

      <p class="subtitle">Deleted references are kept for 7 days, then removed permanently.</p>

      <div class="modal-body">
        {#if loading}
          <div class="state-row"><Spinner size={20} /><span>Loading trash…</span></div>
        {:else if loadError}
          <div class="load-error">
            <AlertCircle size={18} />
            <span>{loadError}</span>
            <button class="retry-btn" onclick={load}>Try again</button>
          </div>
        {:else if references.length === 0}
          <EmptyState title="Trash is empty" message="Deleted references show up here for 7 days before they're gone for good." />
        {:else}
          <ul class="item-list">
            {#each references as ref (ref.id)}
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
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }

  .modal {
    background: var(--color-surface-0); border-radius: 12px;
    box-shadow: var(--shadow-3); display: flex; flex-direction: column;
    width: min(560px, 100%); max-height: 88vh;
  }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
  .modal-header h3 { margin: 0; font-size: 1.0625rem; font-weight: 500; }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .close-btn:hover { background: var(--color-surface-2); }

  .subtitle {
    margin: 0; padding: 12px 24px 0; font-size: 0.8125rem; color: var(--color-text-secondary);
  }

  .modal-body { flex: 1; overflow-y: auto; padding: 16px 24px 20px; }

  .state-row {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.875rem; color: var(--color-text-secondary); padding: 24px 0;
  }

  .load-error {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    font-size: 0.875rem; color: var(--color-error); padding: 32px 0; text-align: center;
  }
  .retry-btn {
    margin-top: 4px; padding: 6px 14px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); color: var(--color-text-primary); cursor: pointer;
    font-size: 0.8125rem; font-family: inherit;
  }
  .retry-btn:hover { background: var(--color-surface-2); }

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

  @media (max-width: 680px) {
    .overlay { padding: 12px; }
  }
</style>

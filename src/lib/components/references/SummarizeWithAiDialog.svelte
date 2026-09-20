<script lang="ts">
  import { scale, fade } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { notebooksApi } from '$lib/api/notebooks'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { X, Sparkles, Check } from 'lucide-svelte'
  import type { Notebook, NotebookPost } from '$lib/types/notebook'

  interface Props {
    open?: boolean
    referenceId: string
    onclose?: () => void
    onsuccess?: (post: NotebookPost) => void
    /** Called when this reference's summarize action should stop being offered this session. */
    ondisable?: () => void
  }
  let { open = false, referenceId, onclose, onsuccess, ondisable }: Props = $props()

  const PAGE_SIZE = 50

  let notebooks       = $state<Notebook[]>([])
  let notebooksPage    = $state(0)
  let notebooksHasMore = $state(false)
  let notebooksLoading = $state(false)
  let query            = $state('')
  let selectedId       = $state<string | null>(null)
  let generating       = $state(false)

  const filteredNotebooks = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return notebooks
    return notebooks.filter(n => n.title.toLowerCase().includes(q))
  })

  $effect(() => {
    if (open) loadNotebooks(0)
  })

  async function loadNotebooks(page: number) {
    notebooksLoading = true
    try {
      const result = await notebooksApi.list(page, PAGE_SIZE)
      notebooks = page === 0 ? result.items : [...notebooks, ...result.items]
      notebooksPage = page
      notebooksHasMore = result.items.length === PAGE_SIZE
    } catch {
      toast.error('Failed to load notebooks')
    } finally {
      notebooksLoading = false
    }
  }

  function reset() {
    notebooks = []
    notebooksPage = 0
    notebooksHasMore = false
    query = ''
    selectedId = null
  }

  function handleClose() {
    if (generating) return
    reset()
    onclose?.()
  }

  async function confirm() {
    if (!selectedId || generating) return
    generating = true
    try {
      const post = await referencesApi.summarizePost(referenceId, selectedId)
      const notebookTitle = notebooks.find(n => n.id === selectedId)?.title ?? 'the notebook'
      toast.success(`Summary added to ${notebookTitle}`, {
        action: { label: 'View', onClick: () => goto(`/notebooks/${post.notebook_id}/posts/${post.id}`) },
      })
      onsuccess?.(post)
      reset()
      onclose?.()
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.message.includes('PDF attachment')) {
        toast.error(e.message)
        ondisable?.()
        reset()
        onclose?.()
      } else if (e instanceof ApiError && e.status === 400 && e.message.includes('prompt configured')) {
        toast.error("AI summaries aren't available yet — an admin needs to configure this feature.")
        ondisable?.()
        reset()
        onclose?.()
      } else if (e instanceof ApiError && e.status === 404) {
        toast.error('That notebook is no longer available — pick another.')
        selectedId = null
      } else if (e instanceof ApiError && e.status >= 500) {
        toast.error("Couldn't generate the summary, try again.")
      } else {
        toast.error(e instanceof ApiError ? e.message : "Couldn't generate the summary, try again.")
      }
    } finally {
      generating = false
    }
  }
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div class="modal" transition:scale={{ start: 0.96, duration: 150 }} role="dialog" aria-modal="true" aria-label="Summarize with AI">
      <div class="modal-header">
        <h3><Sparkles size={18} /> Summarize with AI</h3>
        <button class="close-btn" onclick={handleClose} aria-label="Close" disabled={generating}><X size={22} /></button>
      </div>

      <div class="modal-body">
        {#if generating}
          <div class="generating-state">
            <Spinner size={28} />
            <p>Generating summary… this can take up to 20 seconds.</p>
          </div>
        {:else}
          <p class="hint">Choose a notebook — the AI will generate the title and content from the paper's PDF.</p>
          <input
            type="text"
            class="search-input"
            bind:value={query}
            placeholder="Search your notebooks…"
            autocomplete="off"
          />
          <div class="notebook-list">
            {#if notebooksLoading && notebooks.length === 0}
              <div class="state-row"><Spinner size={20} /><span>Loading notebooks…</span></div>
            {:else if filteredNotebooks.length === 0}
              <p class="empty-msg">No notebooks found.</p>
            {:else}
              {#each filteredNotebooks as nb (nb.id)}
                <button
                  type="button"
                  class="notebook-row"
                  class:selected={selectedId === nb.id}
                  onclick={() => selectedId = nb.id}
                >
                  <span class="notebook-title">{nb.title}</span>
                  {#if selectedId === nb.id}<Check size={18} />{/if}
                </button>
              {/each}
              {#if notebooksHasMore && !query.trim()}
                <button type="button" class="load-more-btn" onclick={() => loadNotebooks(notebooksPage + 1)} disabled={notebooksLoading}>
                  {notebooksLoading ? 'Loading…' : 'Load more'}
                </button>
              {/if}
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <Button variant="text" onclick={handleClose} disabled={generating}>Cancel</Button>
        <Button loading={generating} disabled={!selectedId} onclick={confirm}>Generate Summary</Button>
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
    width: min(480px, 100%); max-height: 88vh;
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
  .modal-header h3 { margin: 0; font-size: 1.0625rem; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .close-btn:hover:not(:disabled) { background: var(--color-surface-2); }
  .close-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
  .hint { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0; }

  .search-input {
    width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .notebook-list {
    display: flex; flex-direction: column; gap: 4px;
    max-height: 280px; overflow-y: auto;
    border: 1px solid var(--color-surface-3); border-radius: 8px; padding: 6px;
  }
  .notebook-row {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    width: 100%; text-align: left; padding: 8px 10px; border-radius: 6px;
    border: none; background: transparent; cursor: pointer;
    font-family: inherit; font-size: 0.8125rem; color: var(--color-text-primary);
  }
  .notebook-row:hover { background: var(--color-surface-1); }
  .notebook-row.selected { background: var(--color-primary-subtle); color: var(--color-primary); }
  .notebook-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .load-more-btn {
    padding: 8px; border-radius: 6px; border: none; background: transparent;
    color: var(--color-primary); cursor: pointer; font-size: 0.8125rem; font-family: inherit;
  }
  .load-more-btn:hover:not(:disabled) { background: var(--color-surface-1); }
  .load-more-btn:disabled { opacity: 0.6; cursor: default; }

  .state-row { display: flex; align-items: center; gap: 10px; font-size: 0.8125rem; color: var(--color-text-secondary); padding: 8px; }
  .empty-msg { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0; padding: 8px; }

  .generating-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 14px; padding: 32px 16px; color: var(--color-text-secondary);
  }
  .generating-state p { margin: 0; font-size: 0.875rem; text-align: center; }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 14px 24px; border-top: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
</style>

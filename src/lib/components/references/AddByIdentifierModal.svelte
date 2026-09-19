<script lang="ts">
  import { goto } from '$app/navigation'
  import { scale, fade } from 'svelte/transition'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { CreateReferencePayload } from '$lib/types/reference'
  import Button from '$lib/components/ui/Button.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { X, AlertCircle, Search } from 'lucide-svelte'

  interface Props {
    open?: boolean
    onclose?: () => void
  }
  let { open = false, onclose }: Props = $props()

  let identifier   = $state('')
  let looking      = $state(false)
  let lookupError  = $state<string | null>(null)
  let payload      = $state<CreateReferencePayload | null>(null)
  let saving       = $state(false)

  function reset() {
    identifier = ''
    looking = false
    lookupError = null
    payload = null
  }

  function handleClose() {
    reset()
    onclose?.()
  }

  async function lookup() {
    const id = identifier.trim()
    if (!id) return
    looking = true
    lookupError = null
    payload = null
    try {
      payload = await referencesApi.lookup(id)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        lookupError = `No metadata found for "${id}".`
      } else if (e instanceof ApiError && e.status === 400) {
        lookupError = `"${id}" isn't a recognized DOI, ISBN or PMID.`
      } else {
        lookupError = e instanceof ApiError ? e.message : 'Lookup failed — try again.'
      }
    } finally {
      looking = false
    }
  }

  function onIdentifierKey(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); lookup() }
  }

  async function create() {
    if (!payload) return
    saving = true
    try {
      const reference = await referencesApi.create(payload)
      toast.success('Reference created')
      handleClose()
      goto(`/references/${reference.id}`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create reference')
    } finally {
      saving = false
    }
  }

  // Labelled preview rows — same shape as FromBibTexModal's preview
  const preview = $derived.by(() => {
    if (!payload) return []
    const rows: { label: string; value: string }[] = []
    if (payload.entry_type)     rows.push({ label: 'Type',      value: payload.entry_type })
    if (payload.title)          rows.push({ label: 'Title',     value: payload.title })
    if (payload.author?.length) rows.push({ label: 'Author(s)', value: payload.author.join('; ') })
    if (payload.editor?.length) rows.push({ label: 'Editor(s)', value: payload.editor.join('; ') })
    if (payload.year)           rows.push({ label: 'Year',      value: String(payload.year) })
    if (payload.journal)        rows.push({ label: 'Journal',   value: payload.journal })
    if (payload.volume)         rows.push({ label: 'Volume',    value: payload.volume })
    if (payload.number)         rows.push({ label: 'Number',    value: payload.number })
    if (payload.pages)          rows.push({ label: 'Pages',     value: payload.pages })
    if (payload.publisher)      rows.push({ label: 'Publisher', value: payload.publisher })
    if (payload.doi)            rows.push({ label: 'DOI',       value: payload.doi })
    if (payload.url)            rows.push({ label: 'URL',       value: payload.url })
    if (payload.abstract)       rows.push({ label: 'Abstract',  value: payload.abstract.slice(0, 160) + (payload.abstract.length > 160 ? '…' : '') })
    return rows
  })
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div
      class="modal"
      transition:scale={{ start: 0.96, duration: 150 }}
      role="dialog"
      aria-modal="true"
      aria-label="Add by DOI, ISBN or PMID"
    >
      <div class="modal-header">
        <h3>Add by DOI, ISBN or PMID</h3>
        <button class="close-btn" onclick={handleClose} aria-label="Close"><X size={22} /></button>
      </div>

      <div class="modal-body">
        <div class="lookup-row">
          <input
            type="text"
            class="identifier-input"
            bind:value={identifier}
            onkeydown={onIdentifierKey}
            placeholder="e.g. 10.1038/nphys1170, 9780134685991, or 30049270"
            spellcheck="false"
            autocomplete="off"
          />
          <Button onclick={lookup} loading={looking} disabled={!identifier.trim()}>
            <Search size={18} /> Look up
          </Button>
        </div>

        <div class="preview-pane">
          {#if looking}
            <div class="state-row"><Spinner size={20} /><span>Looking up metadata…</span></div>
          {:else if lookupError}
            <div class="parse-error"><AlertCircle size={18} /><span>{lookupError}</span></div>
          {:else if payload}
            <dl class="preview-grid">
              {#each preview as row}
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              {/each}
            </dl>
          {:else}
            <p class="hint">Paste a DOI (10.xxxx/…), ISBN (10 or 13 digits) or PubMed ID, then look it up.</p>
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <Button variant="text" onclick={handleClose}>Cancel</Button>
        <Button loading={saving} disabled={!payload} onclick={create}>
          Create Reference
        </Button>
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

  .modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

  .lookup-row { display: flex; gap: 8px; }
  .identifier-input {
    flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); color: var(--color-text-primary);
    font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .identifier-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .preview-pane {
    min-height: 220px; border: 1px solid var(--color-surface-3); border-radius: 8px;
    padding: 16px; background: var(--color-surface-1);
  }

  .hint { font-size: 0.875rem; color: var(--color-text-disabled); margin: 0; }

  .state-row {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.875rem; color: var(--color-text-secondary);
  }

  .parse-error {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 0.875rem; color: var(--color-error);
  }

  .preview-grid {
    display: grid; grid-template-columns: 90px 1fr; gap: 4px 12px;
    font-size: 0.8125rem; margin: 0;
  }
  dt { color: var(--color-text-secondary); font-weight: 500; word-break: keep-all; padding: 3px 0; }
  dd { margin: 0; color: var(--color-text-primary); word-break: break-word; padding: 3px 0; }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 14px 24px; border-top: 1px solid var(--color-surface-3); flex-shrink: 0;
  }

  @media (max-width: 680px) {
    .overlay { padding: 12px; }
  }
</style>

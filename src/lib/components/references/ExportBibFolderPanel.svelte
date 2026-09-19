<script lang="ts">
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { referencesToBibTeX, bibFilename } from '$lib/utils/bibtex-export'
  import { referencesToRis, risFilename } from '$lib/utils/ris-export'
  import { referencesToCslJson, cslJsonFilename } from '$lib/utils/csl-json-export'
  import { toast } from '$lib/stores/toast'
  import type { Reference } from '$lib/types/reference'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { Quote, Copy, Download, AlertTriangle } from 'lucide-svelte'

  interface Props {
    open: boolean
    /** null = "unfiled" pseudo-folder */
    folderId: string | null
    folderLabel: string
    onclose: () => void
  }
  let { open, folderId, folderLabel, onclose }: Props = $props()

  type Step = 'counting' | 'ready' | 'empty' | 'error'
  type Format = 'bib' | 'ris' | 'json'

  const FORMATS: { id: Format; label: string }[] = [
    { id: 'bib', label: 'BibTeX' },
    { id: 'ris', label: 'RIS' },
    { id: 'json', label: 'CSL-JSON' },
  ]

  let step         = $state<Step>('counting')
  let errorMessage = $state('')
  let refs         = $state<Reference[]>([])
  let copied       = $state(false)
  let format       = $state<Format>('bib')
  let copyTimer: ReturnType<typeof setTimeout>

  function serialize(): string {
    if (format === 'ris') return referencesToRis(refs)
    if (format === 'json') return referencesToCslJson(refs)
    return referencesToBibTeX(refs)
  }

  function filename(): string {
    if (format === 'ris') return risFilename(folderLabel)
    if (format === 'json') return cslJsonFilename(folderLabel)
    return bibFilename(folderLabel)
  }

  function extension(): string {
    if (format === 'ris') return '.ris'
    if (format === 'json') return '.json'
    return '.bib'
  }

  function mimeType(): string {
    if (format === 'ris') return 'application/x-research-info-systems;charset=utf-8'
    if (format === 'json') return 'application/json;charset=utf-8'
    return 'text/plain;charset=utf-8'
  }

  const apiFolderId = $derived(folderId ?? 'unfiled')

  $effect(() => {
    if (open) load()
  })

  async function load() {
    step = 'counting'
    errorMessage = ''
    refs = []
    copied = false
    try {
      let page = 0
      const all: Reference[] = []
      // No cursor — GET /references paginates by real page*size offset, so a short
      // (< requested size) page is the signal that this was the last one.
      for (;;) {
        const result = await referencesApi.list(page, 100, apiFolderId)
        all.push(...result.items)
        if (result.items.length < 100) break
        page++
      }
      refs = all
      step = all.length === 0 ? 'empty' : 'ready'
    } catch (e) {
      errorMessage = e instanceof ApiError ? e.message : 'Não foi possível carregar esta pasta.'
      step = 'error'
    }
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(serialize())
      clearTimeout(copyTimer)
      copied = true
      copyTimer = setTimeout(() => (copied = false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  function downloadExport() {
    const blob = new Blob([serialize()], { type: mimeType() })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename()
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
</script>

<SlideOver open={open} title="Exportar referências" onclose={onclose} width="400px">
<div class="panel">
  <p class="folder-label">{folderLabel}</p>

  <div class="format-picker">
    {#each FORMATS as f (f.id)}
      <button
        type="button"
        class="format-btn"
        class:active={format === f.id}
        onclick={() => (format = f.id)}
      >{f.label}</button>
    {/each}
  </div>

  {#if step === 'counting'}
    <div class="state-row">
      <Spinner size={20} />
      <span>Buscando references da pasta…</span>
    </div>
  {:else if step === 'empty'}
    <div class="state-row empty">
      <Quote size={28} />
      <span>Nenhuma reference nesta pasta.</span>
    </div>
  {:else if step === 'error'}
    <div class="state-row error">
      <AlertTriangle size={20} />
      <span>{errorMessage}</span>
    </div>
    <Button variant="outlined" onclick={load}>Tentar novamente</Button>
  {:else}
    <p class="summary">{refs.length} {refs.length === 1 ? 'reference' : 'references'}.</p>
    <div class="actions">
      <Button variant="outlined" onclick={copyExport}>
        {#if copied}Copiado!{:else}<Copy size={18} /> Copiar para a área de transferência{/if}
      </Button>
      <Button onclick={downloadExport}>
        <Download size={18} /> Baixar {extension()}
      </Button>
    </div>
  {/if}
</div>
</SlideOver>

<style>
  .panel { display: flex; flex-direction: column; gap: 16px; }
  .folder-label { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }

  .format-picker {
    display: flex; gap: 4px; padding: 4px; border-radius: 8px;
    background: var(--color-surface-1);
  }
  .format-btn {
    flex: 1; padding: 6px 8px; border: none; border-radius: 6px; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    font-size: 0.8125rem; font-weight: 500;
    transition: background var(--transition-standard), color var(--transition-standard);
  }
  .format-btn:hover { color: var(--color-text-primary); }
  .format-btn.active { background: var(--color-surface-0); color: var(--color-text-primary); box-shadow: var(--shadow-1); }

  .state-row {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.875rem; color: var(--color-text-secondary);
    padding: 12px 0;
  }
  .state-row.empty { flex-direction: column; text-align: center; padding: 32px 0; color: var(--color-text-disabled); }
  .state-row.error { color: var(--color-error); }

  .summary { margin: 0; font-size: 0.875rem; }

  .actions { display: flex; flex-direction: column; gap: 8px; }
</style>

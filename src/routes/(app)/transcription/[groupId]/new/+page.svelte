<script lang="ts">
  import type { PageData } from './$types'
  import { goto } from '$app/navigation'
  import { transcriptionApi } from '$lib/api/transcription'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'

  let { data }: { data: PageData } = $props()
  let group = $derived(data.group)

  const MAX_BYTES = 100 * 1024 * 1024 // 100 MB

  let name    = $state('')
  let date    = $state(new Date().toISOString().slice(0, 10))
  let file    = $state<File | null>(null)
  let saving  = $state(false)
  let errors  = $state<Record<string, string>>({})

  function handleFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const f = input.files?.[0] ?? null
    if (f && f.size > MAX_BYTES) {
      errors = { ...errors, audio: 'File is too large. Maximum size is 100 MB.' }
      input.value = ''
      file = null
      return
    }
    file = f
    if (errors.audio) errors = { ...errors, audio: '' }
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!date) e.date = 'Date is required'
    if (!file) e.audio = 'Please select an audio file'
    return e
  }

  async function submit(evt: SubmitEvent) {
    evt.preventDefault()
    errors = validate()
    if (Object.keys(errors).filter(k => errors[k]).length) return

    saving = true
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('date', date)
      fd.append('audio', file!)

      const transcription = await transcriptionApi.createTranscription(group.id, fd)

      // Immediately trigger AI transcription (fire-and-forget — 202 Accepted)
      try {
        await transcriptionApi.triggerTranscription(group.id, transcription.id)
      } catch {
        // Non-fatal — user can retry from the detail page
      }

      toast.success('Recording uploaded')
      goto(`/transcription/${group.id}/${transcription.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/transcription/{group.id}" class="back-link">← {group.name}</a>
    <h1>New Recording</h1>
  </div>

  <form onsubmit={submit} class="form">
    <div class="form-grid">
      <FormField label="Name" required error={errors.name}>
        <input type="text" bind:value={name} placeholder="Interview with Alice" />
      </FormField>

      <FormField label="Date" required error={errors.date}>
        <input type="date" bind:value={date} />
      </FormField>

      <FormField label="Audio file" required error={errors.audio} hint="Accepts audio files up to 100 MB">
        <input type="file" accept=".aac,.amr,.flac,.m4a,.mp3,.mp4,.ogg,.opus,.pcm,.wav,.webm,audio/*" onchange={handleFile} />
      </FormField>
    </div>

    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto(`/transcription/${group.id}`)}>Cancel</Button>
      <Button type="submit" loading={saving} disabled={saving}>Upload & Transcribe</Button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 400; }

  .form { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 28px; max-width: 560px; }
  .form-grid { display: flex; flex-direction: column; gap: 18px; }
  .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-surface-3); }

  :global(.form input[type="file"]) {
    width: 100%; padding: 8px 12px; border-radius: 6px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
    box-sizing: border-box; cursor: pointer;
  }
  :global(.form input[type="file"]:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  @media (max-width: 1019px) {
    .form { padding: 16px 14px; border-radius: 8px; }
    .form-actions { flex-wrap: wrap; }
    .form-actions :global(button) { flex: 1; }
  }
</style>

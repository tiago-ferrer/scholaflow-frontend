<script lang="ts">
  import { goto } from '$app/navigation'
  import { transcriptionApi } from '$lib/api/transcription'
  import { refreshTranscriptionGroups } from '$lib/stores/transcriptionGroups'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'

  let name        = $state('')
  let description = $state('')
  let notePrompt  = $state('')
  let saving      = $state(false)
  let errors      = $state<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    errors = validate()
    if (Object.keys(errors).length) return

    saving = true
    try {
      const group = await transcriptionApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        note_prompt: notePrompt.trim() || undefined,
      })
      toast.success('Group created')
      await refreshTranscriptionGroups()
      goto(`/transcription/${group.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create group')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/transcription" class="back-link">← Transcription</a>
    <h1>New Group</h1>
  </div>

  <form onsubmit={submit} class="form">
    <div class="form-grid">
      <FormField label="Name" required error={errors.name}>
        <input type="text" bind:value={name} placeholder="My Interviews" />
      </FormField>
      <FormField label="Description">
        <input type="text" bind:value={description} placeholder="A brief description…" />
      </FormField>
      <FormField
        label="AI note generation prompt"
        hint="This text is sent to the AI model before the transcript when generating notes. Leave blank to disable AI note generation for this group."
      >
        <textarea bind:value={notePrompt} rows={4} placeholder="Summarise the key points, action items, and decisions from this transcript…"></textarea>
      </FormField>
    </div>
    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto('/transcription')}>Cancel</Button>
      <Button type="submit" loading={saving}>Create Group</Button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 400; }

  .form { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 28px; }
  .form-grid { display: flex; flex-direction: column; gap: 18px; }
  .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-surface-3); }

  :global(.form textarea) {
    width: 100%; padding: 8px 12px; border-radius: 6px; resize: vertical;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
    box-sizing: border-box;
  }
  :global(.form textarea:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  @media (max-width: 1019px) {
    .form { padding: 16px 14px; border-radius: 8px; }
  }
</style>

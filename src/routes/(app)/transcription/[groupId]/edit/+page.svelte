<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { transcriptionApi } from '$lib/api/transcription'
  import { refreshTranscriptionGroups } from '$lib/stores/transcriptionGroups'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'

  let { data }: { data: PageData } = $props()
  let group = $derived(data.group)

  let name        = $state(group.name)
  let description = $state(group.description ?? '')
  let notePrompt  = $state(group.note_prompt ?? '')
  let saving      = $state(false)
  let errors      = $state<Record<string, string>>({})
  let deleteOpen  = $state(false)
  let deleting    = $state(false)

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
      await transcriptionApi.patchGroup(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        note_prompt: notePrompt.trim() || undefined,
      })
      toast.success('Group saved')
      await refreshTranscriptionGroups()
      await invalidateAll()
      goto(`/transcription/${group.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save group')
    } finally {
      saving = false
    }
  }

  async function confirmDelete() {
    deleting = true
    try {
      await transcriptionApi.removeGroup(group.id)
      toast.success('Group deleted')
      await refreshTranscriptionGroups()
      goto('/transcription')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete group')
    } finally {
      deleting = false
      deleteOpen = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/transcription/{group.id}" class="back-link">← {group.name}</a>
    <h1>Edit Group</h1>
  </div>

  <form onsubmit={submit} class="form">
    <div class="form-grid">
      <FormField label="Name" required error={errors.name}>
        <input type="text" bind:value={name} />
      </FormField>
      <FormField label="Description">
        <input type="text" bind:value={description} />
      </FormField>
      <FormField
        label="AI note generation prompt"
        hint="This text is sent to the AI model before the transcript when generating notes. Leave blank to disable AI note generation for this group."
      >
        <textarea bind:value={notePrompt} rows={4}></textarea>
      </FormField>
    </div>
    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto(`/transcription/${group.id}`)}>Cancel</Button>
      <div class="actions-right">
        <Button variant="text" onclick={() => deleteOpen = true}>Delete Group</Button>
        <Button type="submit" loading={saving}>Save</Button>
      </div>
    </div>
  </form>
</div>

<ConfirmDialog
  open={deleteOpen}
  title="Delete group?"
  message="This group and all its transcriptions will be soft-deleted."
  confirmLabel="Delete"
  variant="danger"
  onconfirm={confirmDelete}
  oncancel={() => deleteOpen = false}
/>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 400; }

  .form { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 28px; }
  .form-grid { display: flex; flex-direction: column; gap: 18px; }
  .form-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-surface-3); flex-wrap: wrap; }
  .actions-right { display: flex; gap: 8px; }

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

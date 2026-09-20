<script lang="ts">
  import { adminPromptsApi } from '$lib/api/adminPrompts'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'

  let paperSummaryPrompt        = $state('')
  let paperSummaryPromptLoading = $state(true)
  let paperSummaryPromptSaving  = $state(false)

  let maxFileSizeMb      = $state<number | ''>('')
  let maxFileSizeSaving  = $state(false)

  async function loadPaperSummaryPrompt() {
    paperSummaryPromptLoading = true
    try {
      const res = await adminPromptsApi.getPaperSummaryPrompt()
      paperSummaryPrompt = res.prompt_text ?? ''
      maxFileSizeMb = Math.round((res.max_file_size_bytes / (1024 * 1024)) * 10) / 10
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        toast.error('Failed to load the paper-summary prompt. Please try again.')
      }
      // 403 — just don't render; handled in template
    } finally {
      paperSummaryPromptLoading = false
    }
  }

  $effect(() => {
    loadPaperSummaryPrompt()
  })

  async function savePaperSummaryPrompt() {
    if (!paperSummaryPrompt.trim()) return
    paperSummaryPromptSaving = true
    try {
      await adminPromptsApi.setPaperSummaryPrompt(paperSummaryPrompt.trim())
      toast.success("Prompt updated — used for all users' next summary generation.")
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error("You don't have permission to do this.")
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to save the prompt. Please try again.')
      }
    } finally {
      paperSummaryPromptSaving = false
    }
  }

  async function saveMaxFileSize() {
    if (!maxFileSizeMb || maxFileSizeMb <= 0) return
    maxFileSizeSaving = true
    try {
      await adminPromptsApi.setMaxFileSize(Math.round(maxFileSizeMb * 1024 * 1024))
      toast.success('Max file size updated.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error("You don't have permission to do this.")
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to save the max file size. Please try again.')
      }
    } finally {
      maxFileSizeSaving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>AI Configs</h1>
    <p class="page-subtitle">Prompts and settings that drive AI features across all users</p>
  </div>

  <div class="card">
    <h2 class="section-title">Paper Summary Prompt</h2>
    <p class="hint">This prompt applies to every user's AI summaries, not just yours.</p>
    {#if paperSummaryPromptLoading}
      <div class="skeleton" style="height: 120px; margin-top: 12px;"></div>
    {:else}
      <textarea
        class="prompt-textarea"
        bind:value={paperSummaryPrompt}
        rows={8}
        placeholder="No prompt configured yet — paper summaries won't work until you set one."
      ></textarea>
      <div class="prompt-actions">
        <button
          class="action-btn primary"
          onclick={savePaperSummaryPrompt}
          disabled={!paperSummaryPrompt.trim() || paperSummaryPromptSaving}
        >
          {paperSummaryPromptSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    {/if}
  </div>

  <div class="card">
    <h2 class="section-title">Max PDF Size for Summaries</h2>
    <p class="hint">Papers with a PDF larger than this won't be summarizable. Defaults to 20MB if unset.</p>
    {#if paperSummaryPromptLoading}
      <div class="skeleton" style="height: 38px; width: 140px; margin-top: 12px;"></div>
    {:else}
      <div class="max-size-row">
        <div class="max-size-input-wrap">
          <input
            type="number"
            class="max-size-input"
            bind:value={maxFileSizeMb}
            min="0.1"
            step="0.1"
          />
          <span class="max-size-unit">MB</span>
        </div>
        <button
          class="action-btn primary"
          onclick={saveMaxFileSize}
          disabled={!maxFileSizeMb || maxFileSizeMb <= 0 || maxFileSizeSaving}
        >
          {maxFileSizeSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 400; }
  .page-subtitle { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }
  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .section-title { font-size: 1rem; font-weight: 500; margin: 0 0 16px; }
  .hint { font-size: 0.75rem; color: var(--color-text-secondary); margin: -12px 0 0; line-height: 1.5; }

  .action-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); cursor: pointer; font-size: 0.8125rem;
    color: var(--color-text-primary); white-space: nowrap;
  }
  .action-btn.primary {
    background: var(--color-primary); color: #fff; border-color: var(--color-primary);
  }
  .action-btn.primary:hover:not(:disabled) { opacity: 0.9; background: var(--color-primary); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .skeleton {
    background: linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 50%, var(--color-surface-2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .prompt-textarea {
    width: 100%; box-sizing: border-box; margin-top: 12px; padding: 10px 12px;
    border-radius: 8px; resize: vertical; min-height: 120px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .prompt-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  .prompt-actions { display: flex; justify-content: flex-end; margin-top: 12px; }

  .max-size-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
  .max-size-input-wrap { position: relative; }
  .max-size-input {
    width: 120px; box-sizing: border-box; padding: 8px 40px 8px 12px;
    border-radius: 8px; border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .max-size-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  .max-size-unit {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    font-size: 0.8125rem; color: var(--color-text-secondary); pointer-events: none;
  }
</style>

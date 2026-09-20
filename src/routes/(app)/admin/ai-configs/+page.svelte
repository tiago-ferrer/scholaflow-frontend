<script lang="ts">
  import { adminPromptsApi } from '$lib/api/adminPrompts'
  import { adminAiConfigApi } from '$lib/api/adminAiConfig'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { DeepgramBalance } from '$lib/types/adminAiConfig'
  import { RefreshCw } from 'lucide-svelte'

  let paperSummaryPrompt        = $state('')
  let paperSummaryPromptLoading = $state(true)
  let paperSummaryPromptSaving  = $state(false)

  let maxFileSizeMb      = $state<number | ''>('')
  let maxFileSizeSaving  = $state(false)

  let aiConfigLoading = $state(true)

  let openAiModel         = $state('')
  let openAiModelOriginal = $state('')
  let openAiModelSaving   = $state(false)
  let openAiModelOptions  = $state<string[]>([])

  let openAiMaxTokens         = $state<number | ''>('')
  let openAiMaxTokensOriginal = $state<number | ''>('')
  let openAiMaxTokensSaving   = $state(false)

  let deepgramModel         = $state('')
  let deepgramModelOriginal = $state('')
  let deepgramModelSaving   = $state(false)
  let deepgramModelOptions  = $state<string[]>([])

  let deepgramBalance        = $state<DeepgramBalance[] | null>(null)
  let deepgramBalanceLoading = $state(true)
  let deepgramBalanceError   = $state(false)

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
    loadAiConfig()
    loadOpenAiModels()
    loadDeepgramModels()
    loadDeepgramBalance()
  })

  async function loadAiConfig() {
    aiConfigLoading = true
    try {
      const res = await adminAiConfigApi.getAiModelConfig()
      openAiModel = openAiModelOriginal = res.open_ai_chat_model
      openAiMaxTokens = openAiMaxTokensOriginal = res.open_ai_max_tokens
      deepgramModel = deepgramModelOriginal = res.deepgram_model
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        toast.error('Failed to load the AI model configuration. Please try again.')
      }
    } finally {
      aiConfigLoading = false
    }
  }

  // Suggestions only — a slow or failed models list must never block editing the
  // free-text model fields, so failures here are silent.
  async function loadOpenAiModels() {
    try {
      openAiModelOptions = await adminAiConfigApi.getOpenAiModels()
    } catch {
      openAiModelOptions = []
    }
  }

  async function loadDeepgramModels() {
    try {
      deepgramModelOptions = await adminAiConfigApi.getDeepgramModels()
    } catch {
      deepgramModelOptions = []
    }
  }

  async function loadDeepgramBalance() {
    deepgramBalanceLoading = true
    deepgramBalanceError = false
    try {
      deepgramBalance = await adminAiConfigApi.getDeepgramBalance()
    } catch {
      deepgramBalance = null
      deepgramBalanceError = true
    } finally {
      deepgramBalanceLoading = false
    }
  }

  let deepgramBalanceTotals = $derived.by(() => {
    if (!deepgramBalance) return []
    const totals = new Map<string, number>()
    for (const entry of deepgramBalance) {
      totals.set(entry.units, (totals.get(entry.units) ?? 0) + entry.amount)
    }
    return [...totals.entries()]
  })

  function formatAmount(amount: number, units: string): string {
    return units === 'usd' ? `$${amount.toFixed(2)}` : `${amount} ${units}`
  }

  function formatBalanceEntry(entry: DeepgramBalance): string {
    const amountText = formatAmount(entry.amount, entry.units)
    return entry.purchase_order_id ? `${amountText} (PO: ${entry.purchase_order_id})` : amountText
  }

  // Keeps the currently-configured value selectable even if it fell out of the live
  // models list (e.g. a deprecated/custom model an admin set before it existed).
  function optionsWithCurrent(options: string[], current: string): string[] {
    return current && !options.includes(current) ? [current, ...options] : options
  }

  async function saveOpenAiModel() {
    if (!openAiModel.trim() || openAiModel.trim() === openAiModelOriginal) return
    openAiModelSaving = true
    try {
      const value = openAiModel.trim()
      await adminAiConfigApi.setOpenAiModel(value)
      openAiModel = openAiModelOriginal = value
      toast.success('OpenAI model updated.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error("You don't have permission to do this.")
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to save the OpenAI model. Please try again.')
      }
    } finally {
      openAiModelSaving = false
    }
  }

  async function saveOpenAiMaxTokens() {
    if (!openAiMaxTokens || openAiMaxTokens <= 0 || openAiMaxTokens === openAiMaxTokensOriginal) return
    openAiMaxTokensSaving = true
    try {
      const value = Math.round(openAiMaxTokens)
      await adminAiConfigApi.setOpenAiMaxTokens(value)
      openAiMaxTokens = openAiMaxTokensOriginal = value
      toast.success('Max tokens updated.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error("You don't have permission to do this.")
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to save max tokens. Please try again.')
      }
    } finally {
      openAiMaxTokensSaving = false
    }
  }

  async function saveDeepgramModel() {
    if (!deepgramModel.trim() || deepgramModel.trim() === deepgramModelOriginal) return
    deepgramModelSaving = true
    try {
      const value = deepgramModel.trim()
      await adminAiConfigApi.setDeepgramModel(value)
      deepgramModel = deepgramModelOriginal = value
      toast.success('Deepgram model updated.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error("You don't have permission to do this.")
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Failed to save the Deepgram model. Please try again.')
      }
    } finally {
      deepgramModelSaving = false
    }
  }

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

  <div class="card">
    <h2 class="section-title">AI Model Configuration</h2>
    <p class="hint">Platform-wide model settings — changes apply to every user's next AI generation, no redeploy needed.</p>

    {#if aiConfigLoading}
      <div class="skeleton" style="height: 38px; margin-top: 16px;"></div>
      <div class="skeleton" style="height: 38px; margin-top: 12px;"></div>
      <div class="skeleton" style="height: 38px; margin-top: 12px;"></div>
    {:else}
      <div class="field-row">
        <label class="field-label" for="openai-model-input">OpenAI Chat Model</label>
        <div class="field-controls">
          {#if openAiModelOptions.length > 0}
            <select id="openai-model-input" class="field-input" bind:value={openAiModel}>
              {#each optionsWithCurrent(openAiModelOptions, openAiModelOriginal) as model (model)}
                <option value={model}>{model}</option>
              {/each}
            </select>
          {:else}
            <input
              id="openai-model-input"
              type="text"
              class="field-input"
              bind:value={openAiModel}
              placeholder="gpt-4o"
            />
          {/if}
          <button
            class="action-btn primary"
            onclick={saveOpenAiModel}
            disabled={!openAiModel.trim() || openAiModel.trim() === openAiModelOriginal || openAiModelSaving}
          >
            {openAiModelSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div class="field-row">
        <label class="field-label" for="openai-max-tokens-input">OpenAI Max Tokens</label>
        <p class="hint field-hint">Applies to all AI-generated content — paper summaries and transcription notes.</p>
        <div class="field-controls">
          <input
            id="openai-max-tokens-input"
            type="number"
            class="field-input"
            bind:value={openAiMaxTokens}
            min="1"
            step="1"
          />
          <button
            class="action-btn primary"
            onclick={saveOpenAiMaxTokens}
            disabled={!openAiMaxTokens || openAiMaxTokens <= 0 || openAiMaxTokens === openAiMaxTokensOriginal || openAiMaxTokensSaving}
          >
            {openAiMaxTokensSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div class="field-row">
        <label class="field-label" for="deepgram-model-input">Deepgram Model</label>
        <div class="field-controls">
          {#if deepgramModelOptions.length > 0}
            <select id="deepgram-model-input" class="field-input" bind:value={deepgramModel}>
              {#each optionsWithCurrent(deepgramModelOptions, deepgramModelOriginal) as model (model)}
                <option value={model}>{model}</option>
              {/each}
            </select>
          {:else}
            <input
              id="deepgram-model-input"
              type="text"
              class="field-input"
              bind:value={deepgramModel}
              placeholder="nova-3"
            />
          {/if}
          <button
            class="action-btn primary"
            onclick={saveDeepgramModel}
            disabled={!deepgramModel.trim() || deepgramModel.trim() === deepgramModelOriginal || deepgramModelSaving}
          >
            {deepgramModelSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    {/if}

    <div class="balance-section">
      <div class="balance-header">
        <h3 class="balance-title">Deepgram Balance</h3>
        <button
          class="icon-btn"
          onclick={loadDeepgramBalance}
          disabled={deepgramBalanceLoading}
          title="Refresh balance"
          aria-label="Refresh Deepgram balance"
        >
          <RefreshCw size={14} class={deepgramBalanceLoading ? 'spin' : ''} />
        </button>
      </div>

      {#if deepgramBalanceLoading}
        <p class="balance-hint">Checking balance…</p>
      {:else if deepgramBalanceError || !deepgramBalance || deepgramBalance.length === 0}
        <p class="balance-hint muted">Balance unavailable</p>
      {:else}
        {#if deepgramBalanceTotals.length > 1 || deepgramBalance.length > 1}
          <p class="balance-total">
            {deepgramBalanceTotals.map(([units, amount]) => formatAmount(amount, units)).join(' + ')}
          </p>
        {/if}
        <ul class="balance-list">
          {#each deepgramBalance as entry (entry.balance_id)}
            <li>{formatBalanceEntry(entry)}</li>
          {/each}
        </ul>
      {/if}
    </div>
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

  .field-row { margin-top: 20px; }
  .field-row:first-of-type { margin-top: 16px; }
  .field-label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 6px; }
  .field-hint { margin: 0 0 8px; }
  .field-controls { display: flex; align-items: center; gap: 12px; }
  .field-input {
    flex: 1; min-width: 0; box-sizing: border-box; padding: 8px 12px;
    border-radius: 8px; border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .field-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  select.field-input { cursor: pointer; }

  .balance-section {
    margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-surface-3);
  }
  .balance-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .balance-title { font-size: 0.875rem; font-weight: 500; margin: 0; }
  .icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); color: var(--color-text-secondary); cursor: pointer;
  }
  .icon-btn:hover:not(:disabled) { color: var(--color-text-primary); }
  .icon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .icon-btn :global(.spin) { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .balance-hint { margin: 0; font-size: 0.8125rem; color: var(--color-text-secondary); }
  .balance-hint.muted { font-style: italic; }
  .balance-total { font-size: 1rem; font-weight: 500; margin: 4px 0 4px; }
  .balance-list {
    margin: 4px 0 0; padding-left: 18px; font-size: 0.8125rem;
    color: var(--color-text-secondary); line-height: 1.7;
  }
</style>

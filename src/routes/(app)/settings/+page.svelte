<script lang="ts">
  import { goto } from '$app/navigation'
  import { theme, toggleTheme, sidebarAutoHide, toggleSidebarAutoHide } from '$lib/stores/ui'
  import { authStore, currentUser, currentEmail, isAdmin } from '$lib/stores/auth'
  import { authApi } from '$lib/api/auth'
  import { costsApi } from '$lib/api/costs'
  import { adminPromptsApi } from '$lib/api/adminPrompts'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { Sun, Moon, RefreshCw, LogOut } from 'lucide-svelte'
  import type { StorageCost, UsageCost, ResourceUsage } from '$lib/types/costs'

  function logout() { authStore.clear(); goto('/') }

  // 'idle' | 'sending' | 'token' | 'success'
  type PwStep = 'idle' | 'sending' | 'token' | 'success'

  let pwStep        = $state<PwStep>('idle')
  let token         = $state('')
  let newPassword   = $state('')
  let confirmPw     = $state('')
  let showPw        = $state(false)
  let pwLoading     = $state(false)
  let pwError       = $state<string | null>(null)
  let fieldErrors   = $state<Record<string, string>>({})

  // Storage state
  let storage       = $state<StorageCost | null>(null)
  let storageLoading = $state(true)
  let allStorage    = $state<StorageCost[] | null>(null)
  let allStorageLoading = $state(false)
  let allStorageSortKey = $state<'username' | 'storage_size_bytes' | 'estimated_monthly_cost_usd'>('storage_size_bytes')
  let allStorageSortDir = $state<'asc' | 'desc'>('desc')

  // AI & transcription usage state
  let usage         = $state<UsageCost | null>(null)
  let usageLoading  = $state(true)
  let allUsage      = $state<UsageCost[] | null>(null)
  let allUsageLoading = $state(false)
  let allUsageSortKey = $state<'username' | 'total'>('total')
  let allUsageSortDir = $state<'asc' | 'desc'>('desc')

  const RESOURCE_LABELS: Record<string, string> = {
    OPENAI_CHAT: 'AI Note Generation',
    OPENAI_EMBEDDING: 'Semantic Search / Indexing',
    DEEPGRAM: 'Audio Transcription',
  }

  function resourceLabel(key: string): string {
    if (RESOURCE_LABELS[key]) return RESOURCE_LABELS[key]
    return key
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  function formatQuantity(unit: string, quantity: number): string {
    if (unit === 'tokens') return `${quantity.toLocaleString('en-US')} tokens`
    if (unit === 'audio_ms') return `${(quantity / 60000).toLocaleString('en-US', { maximumFractionDigits: 1 })} min`
    if (unit === 'bytes') return formatBytes(quantity)
    return quantity.toLocaleString('en-US')
  }

  function nonStorageEntries(u: UsageCost): [string, ResourceUsage][] {
    return Object.entries(u.by_resource).filter(([key]) => key !== 'S3_STORAGE')
  }

  function nonStorageTotal(u: UsageCost): number {
    return nonStorageEntries(u).reduce((sum, [, r]) => sum + r.estimated_cost_usd, 0)
  }

  $effect(() => {
    loadStorage()
  })

  $effect(() => {
    loadUsage()
  })

  async function loadUsage() {
    usageLoading = true
    try {
      usage = await costsApi.getUsage()
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        toast.error('Failed to load usage data. Please try again.')
      }
    } finally {
      usageLoading = false
    }
  }

  async function loadAllUsage() {
    allUsageLoading = true
    try {
      allUsage = await costsApi.getAllUsage()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status >= 500) toast.error('Failed to load usage data. Please try again.')
        // 403 — just don't render; handled in template
      }
    } finally {
      allUsageLoading = false
    }
  }

  $effect(() => {
    if ($isAdmin) loadAllUsage()
  })

  async function loadStorage() {
    storageLoading = true
    try {
      storage = await costsApi.getStorage()
    } catch (err) {
      if (err instanceof ApiError && err.status >= 500) {
        toast.error('Failed to load storage data. Please try again.')
      }
    } finally {
      storageLoading = false
    }
  }

  async function loadAllStorage() {
    allStorageLoading = true
    try {
      allStorage = await costsApi.getAllStorage()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status >= 500) toast.error('Failed to load storage data. Please try again.')
        // 403 — just don't render; handled in template
      }
    } finally {
      allStorageLoading = false
    }
  }

  $effect(() => {
    if ($isAdmin) loadAllStorage()
  })

  // Paper Summary Prompt (admin only, singleton)
  let paperSummaryPrompt        = $state('')
  let paperSummaryPromptLoading = $state(true)
  let paperSummaryPromptSaving  = $state(false)

  async function loadPaperSummaryPrompt() {
    paperSummaryPromptLoading = true
    try {
      const res = await adminPromptsApi.getPaperSummaryPrompt()
      paperSummaryPrompt = res.prompt_text ?? ''
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
    if ($isAdmin) loadPaperSummaryPrompt()
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

  function formatCost(usd: number): string {
    if (usd === 0) return '$0.00'
    return usd.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 1,
    })
  }

  let sortedAllStorage = $derived.by(() => {
    if (!allStorage) return []
    return [...allStorage].sort((a, b) => {
      const dir = allStorageSortDir === 'asc' ? 1 : -1
      if (allStorageSortKey === 'username') return dir * a.username.localeCompare(b.username)
      if (allStorageSortKey === 'storage_size_bytes') return dir * (a.storage_size_bytes - b.storage_size_bytes)
      return dir * (a.estimated_monthly_cost_usd - b.estimated_monthly_cost_usd)
    })
  })

  let totalBytes = $derived(allStorage ? allStorage.reduce((s, r) => s + r.storage_size_bytes, 0) : 0)
  let totalCost  = $derived(allStorage ? allStorage.reduce((s, r) => s + r.estimated_monthly_cost_usd, 0) : 0)

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
  }

  function setSort(key: typeof allStorageSortKey) {
    if (allStorageSortKey === key) {
      allStorageSortDir = allStorageSortDir === 'asc' ? 'desc' : 'asc'
    } else {
      allStorageSortKey = key
      allStorageSortDir = key === 'username' ? 'asc' : 'desc'
    }
  }

  let usageEntries = $derived(usage ? nonStorageEntries(usage) : [])
  let usageTotal   = $derived(usage ? nonStorageTotal(usage) : 0)

  let usageColumns = $derived.by(() => {
    if (!allUsage) return []
    const units = new Map<string, string>()
    for (const u of allUsage) {
      for (const [key, r] of Object.entries(u.by_resource)) {
        if (key !== 'S3_STORAGE' && !units.has(key)) units.set(key, r.unit)
      }
    }
    return [...units.entries()].map(([key, unit]) => ({ key, unit, label: resourceLabel(key) }))
  })

  let sortedAllUsage = $derived.by(() => {
    if (!allUsage) return []
    return [...allUsage].sort((a, b) => {
      const dir = allUsageSortDir === 'asc' ? 1 : -1
      if (allUsageSortKey === 'username') return dir * a.username.localeCompare(b.username)
      return dir * (nonStorageTotal(a) - nonStorageTotal(b))
    })
  })

  let allUsageColumnTotals = $derived.by(() => {
    const totals = new Map<string, number>()
    if (!allUsage) return totals
    for (const col of usageColumns) {
      totals.set(col.key, allUsage.reduce((s, u) => s + (u.by_resource[col.key]?.quantity ?? 0), 0))
    }
    return totals
  })

  let allUsageTotalCost = $derived(allUsage ? allUsage.reduce((s, u) => s + nonStorageTotal(u), 0) : 0)

  function setUsageSort(key: typeof allUsageSortKey) {
    if (allUsageSortKey === key) {
      allUsageSortDir = allUsageSortDir === 'asc' ? 'desc' : 'asc'
    } else {
      allUsageSortKey = key
      allUsageSortDir = key === 'username' ? 'asc' : 'desc'
    }
  }

  async function startChange() {
    pwError = null
    pwStep = 'sending'
    try {
      await authApi.forgotPassword({ email: $currentEmail! })
      pwStep = 'token'
    } catch {
      pwError = 'Failed to send reset email. Please try again.'
      pwStep = 'idle'
    }
  }

  function cancel() {
    pwStep = 'idle'
    token = ''
    newPassword = ''
    confirmPw = ''
    showPw = false
    pwError = null
    fieldErrors = {}
  }

  async function submitReset(e: SubmitEvent) {
    e.preventDefault()
    fieldErrors = {}
    pwError = null

    if (newPassword.length < 8) {
      fieldErrors = { newPassword: 'Password must be at least 8 characters' }
      return
    }
    if (newPassword !== confirmPw) {
      fieldErrors = { confirmPw: 'Passwords do not match' }
      return
    }

    pwLoading = true
    try {
      await authApi.resetPassword({ token, new_password: newPassword })
      pwStep = 'success'
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'Invalid or expired token') {
          pwError = 'This token is invalid or has expired. Request a new one.'
        } else if (err.fields?.new_password) {
          fieldErrors = { newPassword: err.fields.new_password }
        } else {
          pwError = 'Something went wrong. Please try again.'
        }
      } else {
        pwError = 'Something went wrong. Please try again.'
      }
    } finally {
      pwLoading = false
    }
  }
</script>

<div class="page">
  <h1>Settings</h1>

  <div class="card">
    <h2 class="section-title">Account</h2>
    <div class="setting-row">
      <span class="label">Username</span>
      <span class="value">{$currentUser}</span>
    </div>
    <div class="divider"></div>
    <div class="setting-row">
      <span class="label">Email</span>
      <span class="value">{$currentEmail ?? '—'}</span>
    </div>
    <div class="divider"></div>

    {#if pwStep === 'idle'}
      <div class="setting-row">
        <div>
          <span class="label">Password</span>
          <span class="hint">A reset link will be sent to your email</span>
        </div>
        <button class="action-btn" onclick={startChange}>Change password</button>
      </div>
      {#if pwError}
        <div class="banner error">{pwError}</div>
      {/if}

    {:else if pwStep === 'sending'}
      <div class="setting-row">
        <span class="label">Password</span>
        <span class="value muted">Sending reset link…</span>
      </div>

    {:else if pwStep === 'token'}
      <div class="pw-panel">
        <div class="pw-panel-header">
          <span class="label">Change password</span>
          <button class="cancel-btn" onclick={cancel}>Cancel</button>
        </div>
        <div class="banner info">Reset link sent to <strong>{$currentEmail}</strong>. Paste the token from the email below.</div>

        {#if pwError}
          <div class="banner error">{pwError}</div>
        {/if}

        <form onsubmit={submitReset} class="pw-form">
          <div class="field-wrap">
            <label class="field-label">Token from email</label>
            <input type="text" bind:value={token} required placeholder="Paste token here" autocomplete="off" />
          </div>

          <div class="field-wrap">
            <label class="field-label">New password</label>
            <div class="pw-input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                bind:value={newPassword}
                required
                minlength="8"
                autocomplete="new-password"
                class:field-invalid={!!fieldErrors.newPassword}
              />
              <button type="button" class="show-toggle" onclick={() => (showPw = !showPw)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {#if fieldErrors.newPassword}
              <span class="field-error">{fieldErrors.newPassword}</span>
            {/if}
          </div>

          <div class="field-wrap">
            <label class="field-label">Confirm password</label>
            <input
              type={showPw ? 'text' : 'password'}
              bind:value={confirmPw}
              required
              autocomplete="new-password"
              class:field-invalid={!!fieldErrors.confirmPw}
            />
            {#if fieldErrors.confirmPw}
              <span class="field-error">{fieldErrors.confirmPw}</span>
            {/if}
          </div>

          <div class="pw-actions">
            <button type="submit" class="action-btn primary" disabled={!token || !newPassword || !confirmPw || pwLoading}>
              {pwLoading ? 'Saving…' : 'Set new password'}
            </button>
          </div>
        </form>
      </div>

    {:else if pwStep === 'success'}
      <div class="setting-row">
        <span class="label">Password</span>
        <div class="success-row">
          <span class="success-msg">Password updated successfully</span>
          <button class="cancel-btn" onclick={cancel}>Done</button>
        </div>
      </div>
    {/if}

    <div class="divider"></div>
    <div class="setting-row">
      <div>
        <span class="label">Session</span>
        <span class="hint">Sign out of your account on this device</span>
      </div>
      <button class="action-btn danger" onclick={logout}>
        <LogOut size={14} />
        Log out
      </button>
    </div>
  </div>

  <div class="card">
    <h2 class="section-title">Appearance</h2>
    <div class="setting-row">
      <div>
        <span class="label">Theme</span>
        <span class="hint">Toggle between light and dark mode</span>
      </div>
      <button class="theme-toggle" onclick={toggleTheme}>
        {#if $theme === 'dark'}
          <Sun size={23} /> Light
        {:else}
          <Moon size={23} /> Dark
        {/if}
      </button>
    </div>

    <div class="divider"></div>
    <div class="setting-row">
      <div>
        <span class="label">Auto-hide sidebar</span>
        <span class="hint">Keep the sidebar collapsed; hover it to expand, move away to collapse it again</span>
      </div>
      <label class="switch">
        <input type="checkbox" checked={$sidebarAutoHide} onchange={toggleSidebarAutoHide} />
        <span class="switch-track"></span>
      </label>
    </div>
  </div>

  <!-- Storage Usage -->
  <div class="card">
    <h2 class="section-title">Storage Usage</h2>
    {#if storageLoading}
      <div class="storage-grid">
        <div class="storage-item">
          <span class="storage-label">Storage used</span>
          <div class="skeleton skeleton-value"></div>
        </div>
        <div class="storage-item">
          <span class="storage-label">Est. monthly cost</span>
          <div class="skeleton skeleton-value"></div>
        </div>
      </div>
    {:else if storage}
      <div class="storage-grid">
        <div class="storage-item">
          <span class="storage-label">Storage used</span>
          {#if storage.storage_size_bytes === 0}
            <span class="storage-value muted">No files uploaded yet</span>
          {:else}
            <span class="storage-value">{storage.storage_size_formatted}</span>
          {/if}
        </div>
        <div class="storage-item">
          <span class="storage-label">Est. monthly cost</span>
          <span class="storage-value">{formatCost(storage.estimated_monthly_cost_usd)}</span>
        </div>
      </div>
      <p class="storage-hint">Covers all uploaded files: attachments, annotations, handwriting PDFs, and drawings.</p>
    {/if}
  </div>

  <!-- AI & Transcription Usage -->
  <div class="card">
    <h2 class="section-title">AI & Transcription Usage</h2>
    {#if usageLoading}
      <div class="storage-grid">
        {#each { length: 3 } as _}
          <div class="storage-item">
            <span class="storage-label">Loading</span>
            <div class="skeleton skeleton-value"></div>
          </div>
        {/each}
      </div>
    {:else if usage}
      {#if usageEntries.length === 0}
        <div class="storage-grid">
          <div class="storage-item">
            <span class="storage-label">AI usage</span>
            <span class="storage-value muted">No AI usage yet</span>
          </div>
        </div>
      {:else}
        <div class="storage-grid">
          {#each usageEntries as [key, resource]}
            <div class="storage-item">
              <span class="storage-label">{resourceLabel(key)}</span>
              <span class="storage-value">{formatQuantity(resource.unit, resource.quantity)}</span>
              <span class="storage-value muted">{formatCost(resource.estimated_cost_usd)}</span>
            </div>
          {/each}
        </div>
        <p class="storage-hint">Total: {formatCost(usageTotal)} — estimated costs based on approximate provider pricing, not an exact bill.</p>
      {/if}
    {/if}
  </div>

  <!-- Admin: Paper Summary Prompt -->
  {#if $isAdmin}
    <div class="card">
      <h2 class="section-title">Paper Summary Prompt</h2>
      <p class="storage-hint">This prompt applies to every user's AI summaries, not just yours.</p>
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
  {/if}

  <!-- Admin: All Users Storage -->
  {#if $isAdmin}
    <div class="card">
      <div class="admin-header">
        <h2 class="section-title">All Users Storage</h2>
        <button class="action-btn" onclick={loadAllStorage} disabled={allStorageLoading}>
          <RefreshCw size={14} />
          {allStorageLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {#if allStorageLoading}
        <div class="table-wrap">
          <table class="storage-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Storage Used</th>
                <th>Est. Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {#each { length: 4 } as _}
                <tr>
                  <td><div class="skeleton skeleton-cell"></div></td>
                  <td><div class="skeleton skeleton-cell"></div></td>
                  <td><div class="skeleton skeleton-cell"></div></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if allStorage === null}
        <!-- not yet loaded or 403 — render nothing -->
      {:else if allStorage.length === 0}
        <p class="empty-msg">No users found.</p>
      {:else}
        <div class="table-wrap">
          <table class="storage-table">
            <thead>
              <tr>
                <th>
                  <button class="sort-btn" onclick={() => setSort('username')}>
                    Username
                    {#if allStorageSortKey === 'username'}<span class="sort-indicator">{allStorageSortDir === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </th>
                <th>
                  <button class="sort-btn" onclick={() => setSort('storage_size_bytes')}>
                    Storage Used
                    {#if allStorageSortKey === 'storage_size_bytes'}<span class="sort-indicator">{allStorageSortDir === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </th>
                <th>
                  <button class="sort-btn" onclick={() => setSort('estimated_monthly_cost_usd')}>
                    Est. Monthly Cost
                    {#if allStorageSortKey === 'estimated_monthly_cost_usd'}<span class="sort-indicator">{allStorageSortDir === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {#each sortedAllStorage as row}
                <tr>
                  <td>{row.username}</td>
                  <td>{row.storage_size_formatted}</td>
                  <td>{formatCost(row.estimated_monthly_cost_usd)}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>Total ({allStorage.length} users)</td>
                <td>{formatBytes(totalBytes)}</td>
                <td>{formatCost(totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Admin: All Users AI Usage -->
  {#if $isAdmin}
    <div class="card">
      <div class="admin-header">
        <h2 class="section-title">All Users AI Usage</h2>
        <button class="action-btn" onclick={loadAllUsage} disabled={allUsageLoading}>
          <RefreshCw size={14} />
          {allUsageLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {#if allUsageLoading}
        <div class="table-wrap">
          <table class="storage-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {#each { length: 4 } as _}
                <tr>
                  <td><div class="skeleton skeleton-cell"></div></td>
                  <td><div class="skeleton skeleton-cell"></div></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if allUsage === null}
        <!-- not yet loaded or 403 — render nothing -->
      {:else if allUsage.length === 0}
        <p class="empty-msg">No users found.</p>
      {:else}
        <div class="table-wrap">
          <table class="storage-table">
            <thead>
              <tr>
                <th>
                  <button class="sort-btn" onclick={() => setUsageSort('username')}>
                    Username
                    {#if allUsageSortKey === 'username'}<span class="sort-indicator">{allUsageSortDir === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </th>
                {#each usageColumns as col}
                  <th>{col.label}</th>
                {/each}
                <th>
                  <button class="sort-btn" onclick={() => setUsageSort('total')}>
                    Total
                    {#if allUsageSortKey === 'total'}<span class="sort-indicator">{allUsageSortDir === 'asc' ? '↑' : '↓'}</span>{/if}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {#each sortedAllUsage as row}
                <tr>
                  <td>{row.username}</td>
                  {#each usageColumns as col}
                    <td>{row.by_resource[col.key] ? formatQuantity(col.unit, row.by_resource[col.key].quantity) : '—'}</td>
                  {/each}
                  <td>{formatCost(nonStorageTotal(row))}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>Total ({allUsage.length} users)</td>
                {#each usageColumns as col}
                  <td>{formatQuantity(col.unit, allUsageColumnTotals.get(col.key) ?? 0)}</td>
                {/each}
                <td>{formatCost(allUsageTotalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page { max-width: 100%; }
  h1 { margin: 0 0 24px; font-size: 1.75rem; font-weight: 400; }
  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .section-title { font-size: 1rem; font-weight: 500; margin: 0 0 16px; }
  .setting-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; }
  .label { color: var(--color-text-primary); font-weight: 500; display: block; }
  .hint { font-size: 0.75rem; color: var(--color-text-secondary); display: block; }
  .value { color: var(--color-text-secondary); }
  .value.muted { opacity: 0.5; }
  .divider { height: 1px; background: var(--color-surface-3); margin: 16px 0; }

  .action-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); cursor: pointer; font-size: 0.8125rem;
    color: var(--color-text-primary); white-space: nowrap;
  }
  .action-btn:hover:not(:disabled) { background: var(--color-surface-2); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-btn.primary {
    background: var(--color-primary); color: #fff; border-color: var(--color-primary);
  }
  .action-btn.primary:hover:not(:disabled) { opacity: 0.9; background: var(--color-primary); }
  .action-btn.danger { color: var(--color-error); border-color: var(--color-error); }
  .action-btn.danger:hover:not(:disabled) { background: color-mix(in srgb, var(--color-error) 10%, transparent); }

  .cancel-btn {
    background: none; border: none; cursor: pointer; font-size: 0.8125rem;
    color: var(--color-text-secondary); padding: 4px 8px; border-radius: 6px;
  }
  .cancel-btn:hover { background: var(--color-surface-2); }

  .banner {
    margin-top: 12px; padding: 10px 14px; border-radius: 8px; font-size: 0.8125rem; line-height: 1.5;
  }
  .banner.error { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }
  .banner.info  { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-text-primary); }

  .pw-panel { display: flex; flex-direction: column; gap: 12px; }
  .pw-panel-header { display: flex; align-items: center; justify-content: space-between; }
  .pw-form { display: flex; flex-direction: column; gap: 12px; }
  .pw-actions { display: flex; justify-content: flex-end; }

  .field-wrap { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 0.8125rem; color: var(--color-text-secondary); }
  .field-wrap input {
    width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 0.875rem;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); box-sizing: border-box;
  }
  .field-wrap input:focus { outline: none; border-color: var(--color-primary); }
  .field-wrap input.field-invalid { border-color: var(--color-error); }
  .field-error { font-size: 0.75rem; color: var(--color-error); }

  .pw-input-wrap { position: relative; }
  .pw-input-wrap input { padding-right: 52px; }
  .show-toggle {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; font-size: 0.75rem;
    color: var(--color-primary); padding: 0; font-family: inherit;
  }

  .success-row { display: flex; align-items: center; gap: 12px; }
  .success-msg { font-size: 0.8125rem; color: var(--color-primary); }

  .theme-toggle {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1); cursor: pointer;
    font-size: 0.875rem; color: var(--color-text-primary);
  }
  .theme-toggle:hover { background: var(--color-surface-2); }

  .switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
  .switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
  .switch-track {
    position: absolute; inset: 0; background: var(--color-surface-3); border-radius: 999px;
    transition: background var(--transition-standard);
  }
  .switch-track::before {
    content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
    border-radius: 50%; background: #fff; box-shadow: var(--shadow-1);
    transition: transform var(--transition-standard);
  }
  .switch input:checked + .switch-track { background: var(--color-primary); }
  .switch input:checked + .switch-track::before { transform: translateX(18px); }
  .switch input:focus-visible + .switch-track { outline: 2px solid var(--color-primary); outline-offset: 2px; }

  /* Storage */
  .storage-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;
  }
  .storage-item {
    background: var(--color-surface-1); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 16px;
  }
  .storage-label { font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 6px; }
  .storage-value { font-size: 1.125rem; font-weight: 500; color: var(--color-text-primary); }
  .storage-value.muted { font-size: 0.875rem; font-weight: 400; color: var(--color-text-secondary); }
  .storage-hint { font-size: 0.75rem; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }

  /* Skeletons */
  .skeleton {
    background: linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 50%, var(--color-surface-2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }
  .skeleton-value { height: 28px; width: 80px; margin-top: 6px; }
  .skeleton-cell  { height: 16px; width: 80%; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Admin table */
  .admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .admin-header .section-title { margin-bottom: 0; }

  .table-wrap { overflow-x: auto; }
  .storage-table {
    width: 100%; border-collapse: collapse; font-size: 0.875rem;
  }
  .storage-table th {
    text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--color-surface-3);
    color: var(--color-text-secondary); font-weight: 500; white-space: nowrap;
  }
  .storage-table td {
    padding: 10px 12px; border-bottom: 1px solid var(--color-surface-3);
    color: var(--color-text-primary);
  }
  .storage-table tbody tr:last-child td { border-bottom: none; }
  .storage-table tbody tr:hover td { background: var(--color-surface-1); }

  .total-row td {
    border-top: 2px solid var(--color-surface-3); border-bottom: none;
    font-weight: 500; color: var(--color-text-primary); padding: 10px 12px;
  }

  .sort-btn {
    background: none; border: none; cursor: pointer; font-size: 0.875rem;
    color: var(--color-text-secondary); font-weight: 500; padding: 0;
    display: inline-flex; align-items: center; gap: 4px; font-family: inherit;
  }
  .sort-btn:hover { color: var(--color-text-primary); }
  .sort-indicator { color: var(--color-primary); }

  .empty-msg { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; }

  .prompt-textarea {
    width: 100%; box-sizing: border-box; margin-top: 12px; padding: 10px 12px;
    border-radius: 8px; resize: vertical; min-height: 120px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .prompt-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  .prompt-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>

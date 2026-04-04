<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/ui'
  import { currentUser, currentEmail, isAdmin } from '$lib/stores/auth'
  import { authApi } from '$lib/api/auth'
  import { costsApi } from '$lib/api/costs'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { Sun, Moon, RefreshCw } from 'lucide-svelte'
  import type { StorageCost } from '$lib/types/costs'

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

  $effect(() => {
    loadStorage()
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
</style>

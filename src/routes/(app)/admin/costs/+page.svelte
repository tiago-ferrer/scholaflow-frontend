<script lang="ts">
  import { costsApi } from '$lib/api/costs'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { RefreshCw } from 'lucide-svelte'
  import type { StorageCost, UsageCost, ResourceUsage } from '$lib/types/costs'

  let allStorage    = $state<StorageCost[] | null>(null)
  let allStorageLoading = $state(false)
  let allStorageSortKey = $state<'username' | 'storage_size_bytes' | 'estimated_monthly_cost_usd'>('storage_size_bytes')
  let allStorageSortDir = $state<'asc' | 'desc'>('desc')

  let allUsage      = $state<UsageCost[] | null>(null)
  let allUsageLoading = $state(false)
  let allUsageSortKey = $state<'username' | 'total'>('total')
  let allUsageSortDir = $state<'asc' | 'desc'>('desc')

  const RESOURCE_LABELS: Record<string, string> = {
    OPENAI_CHAT_TRANSCRIPTION_NOTE: 'AI Note Generation',
    OPENAI_CHAT_PAPER_SUMMARY: 'AI Paper Summaries',
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

  function formatCost(usd: number): string {
    if (usd === 0) return '$0.00'
    return usd.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 1,
    })
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
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
    loadAllStorage()
    loadAllUsage()
  })

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

  function setSort(key: typeof allStorageSortKey) {
    if (allStorageSortKey === key) {
      allStorageSortDir = allStorageSortDir === 'asc' ? 'desc' : 'asc'
    } else {
      allStorageSortKey = key
      allStorageSortDir = key === 'username' ? 'asc' : 'desc'
    }
  }

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
</script>

<div class="page">
  <div class="page-header">
    <h1>Costs</h1>
    <p class="page-subtitle">Storage and AI/transcription usage costs across all users</p>
  </div>

  <!-- All Users Storage -->
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

  <!-- All Users AI Usage -->
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
</div>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 400; }
  .page-subtitle { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }
  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .section-title { font-size: 1rem; font-weight: 500; margin: 0 0 16px; }

  .action-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); cursor: pointer; font-size: 0.8125rem;
    color: var(--color-text-primary); white-space: nowrap;
  }
  .action-btn:hover:not(:disabled) { background: var(--color-surface-2); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Skeletons */
  .skeleton {
    background: linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 50%, var(--color-surface-2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }
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

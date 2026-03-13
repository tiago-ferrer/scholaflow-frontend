<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { transcriptionApi } from '$lib/api/transcription'
  import { refreshTranscriptionGroups } from '$lib/stores/transcriptionGroups'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { TranscriptionGroup } from '$lib/types/transcription'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Pencil, Trash2, Mic } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let deleteTarget = $state<TranscriptionGroup | null>(null)
  let deleting = $state(false)

  function toggleDeleted() {
    const params = new URLSearchParams()
    if (!data.includeDeleted) params.set('includeDeleted', 'true')
    goto(`/transcription?${params}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    deleting = true
    try {
      await transcriptionApi.removeGroup(deleteTarget.id)
      toast.success('Group deleted')
      deleteTarget = null
      await refreshTranscriptionGroups()
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete group')
    } finally {
      deleting = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Transcription</h1>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Show deleted
      </button>
      <Button onclick={() => goto('/transcription/new')}><Plus size={20} /> New Group</Button>
    </div>
  </div>

  {#if data.groups.items.length === 0}
    <EmptyState title="No transcription groups yet" message="Create a group to start organising your audio recordings.">
      {#snippet actions()}
        <Button onclick={() => goto('/transcription/new')}><Plus size={20} /> New Group</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <!-- Desktop table -->
    <div class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Updated</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.groups.items as group}
            <tr class:deleted-row={group.deleted}>
              <td class="name-cell">
                <a href="/transcription/{group.id}" class="group-link" class:deleted-text={group.deleted}>
                  <Mic size={16} />
                  {group.name}
                </a>
                {#if group.deleted}<span class="deleted-badge">deleted</span>{/if}
              </td>
              <td class="desc-cell">{group.description ?? ''}</td>
              <td class="date-cell">{formatDate(group.updated_at)}</td>
              <td class="actions-cell">
                <button class="icon-btn" title="Open" onclick={() => goto(`/transcription/${group.id}`)}>
                  <Mic size={20} />
                </button>
                {#if !group.deleted}
                  <button class="icon-btn" title="Edit" onclick={() => goto(`/transcription/${group.id}/edit`)}>
                    <Pencil size={20} />
                  </button>
                  <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = group}>
                    <Trash2 size={20} />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="card-list mobile-only">
      {#each data.groups.items as group}
        <div class="group-card" class:deleted-card={group.deleted} onclick={() => goto(`/transcription/${group.id}`)}>
          <div class="card-top">
            <span class="card-title" class:deleted-text={group.deleted}>{group.name}</span>
            {#if group.deleted}<span class="deleted-badge">deleted</span>{/if}
          </div>
          {#if group.description}
            <p class="card-desc">{group.description}</p>
          {/if}
          <div class="card-footer">
            <span class="card-date">{formatDate(group.updated_at)}</span>
            <div class="card-actions" onclick={(e) => e.stopPropagation()}>
              {#if !group.deleted}
                <button class="icon-btn" title="Edit" onclick={() => goto(`/transcription/${group.id}/edit`)}>
                  <Pencil size={20} />
                </button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = group}>
                  <Trash2 size={20} />
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <Pagination
      page={data.page}
      hasNext={!!data.groups.next_token}
      nextToken={data.groups.next_token}
      onprev={() => {
        const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/transcription?${p}`)
      }}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.page + 1) })
        if (data.groups.next_token) p.set('next_token', data.groups.next_token)
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/transcription?${p}`)
      }}
    />
  {/if}
</div>

<ConfirmDialog
  open={!!deleteTarget}
  title="Delete group?"
  message="This group and all its transcriptions will be soft-deleted."
  confirmLabel="Delete"
  variant="danger"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  .desktop-only { display: block; }
  .mobile-only  { display: none; }
  @media (max-width: 1019px) {
    .desktop-only { display: none; }
    .mobile-only  { display: flex; flex-direction: column; gap: 12px; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .header-actions { width: 100%; justify-content: flex-end; }
  }

  .table-wrapper { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-3); background: var(--color-surface-1); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--color-surface-2); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--color-surface-1); }

  .name-cell { max-width: 220px; }
  .desc-cell { max-width: 300px; color: var(--color-text-secondary); font-size: 0.8125rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .date-cell { white-space: nowrap; color: var(--color-text-secondary); font-size: 0.8125rem; }
  .group-link { color: var(--color-text-primary); text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
  .group-link:hover { color: var(--color-primary); }
  .actions-col { width: 1%; }
  .actions-cell { display: flex; align-items: center; gap: 2px; }

  .deleted-row td { opacity: 0.55; }
  .deleted-text { text-decoration: line-through; color: var(--color-text-disabled); }
  .deleted-badge {
    display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 10px;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500; vertical-align: middle;
  }

  .group-card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 14px 16px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .group-card:hover { background: var(--color-surface-1); }
  .deleted-card { opacity: 0.6; }
  .card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; }
  .card-desc { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-footer { display: flex; align-items: center; justify-content: space-between; }
  .card-date { font-size: 0.75rem; color: var(--color-text-disabled); }
  .card-actions { display: flex; gap: 4px; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }
</style>

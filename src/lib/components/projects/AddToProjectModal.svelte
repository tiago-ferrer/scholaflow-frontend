<!-- Reusable modal for adding an entity to one of the user's projects. -->
<script lang="ts">
  import { scale, fade } from 'svelte/transition'
  import { projectsApi } from '$lib/api/projects'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { ProjectItemType } from '$lib/types/project'
  import type { Project } from '$lib/types/project'
  import Button from '$lib/components/ui/Button.svelte'
  import { X, FolderOpen } from 'lucide-svelte'

  interface Props {
    open?: boolean
    entityType: ProjectItemType
    entityId: string
    parentId?: string | null
    onclose?: () => void
    onadded?: () => void
  }

  let {
    open = false,
    entityType,
    entityId,
    parentId = null,
    onclose,
    onadded,
  }: Props = $props()

  let projects = $state<Project[]>([])
  let loading = $state(false)
  let selectedProjectId = $state<string | null>(null)
  let adding = $state(false)

  // Load projects when opened
  $effect(() => {
    if (open && projects.length === 0) {
      loadProjects()
    }
    if (!open) {
      selectedProjectId = null
    }
  })

  async function loadProjects() {
    loading = true
    try {
      const res = await projectsApi.list(0, 100, false)
      projects = res.items
    } catch {
      toast.error('Failed to load projects')
    } finally {
      loading = false
    }
  }

  // IDs already containing this entity (for deduplication)
  const alreadyInProjectIds = $derived(
    new Set(
      projects
        .filter(p => p.items.some(i => i.entity_id === entityId))
        .map(p => p.id)
    )
  )

  async function confirm() {
    if (!selectedProjectId) return
    adding = true
    try {
      await projectsApi.addItem(selectedProjectId, {
        type: entityType,
        entity_id: entityId,
        parent_id: parentId,
      })
      toast.success('Added to project')
      onclose?.()
      onadded?.()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to add to project')
    } finally {
      adding = false
    }
  }
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div
      class="modal-card"
      transition:scale={{ start: 0.95, duration: 150 }}
      role="dialog"
      aria-modal="true"
      aria-label="Add to Project"
    >
      <div class="modal-header">
        <h3>Add to Project</h3>
        <button class="close-btn" onclick={onclose} aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div class="modal-body">
        {#if loading}
          <p class="status-msg">Loading projects…</p>
        {:else if projects.length === 0}
          <div class="empty-state">
            <FolderOpen size={36} />
            <p>No projects yet. <a href="/projects">Create one</a> first.</p>
          </div>
        {:else}
          <p class="hint">Select a project to add this item to:</p>
          <div class="project-list">
            {#each projects as proj}
              {@const alreadyAdded = alreadyInProjectIds.has(proj.id)}
              <button
                class="project-row"
                class:selected={selectedProjectId === proj.id}
                class:already-added={alreadyAdded}
                disabled={alreadyAdded}
                onclick={() => selectedProjectId = selectedProjectId === proj.id ? null : proj.id}
              >
                <FolderOpen size={18} />
                <span class="proj-name">{proj.name}</span>
                {#if alreadyAdded}
                  <span class="added-chip">Already added</span>
                {:else}
                  <span class="item-count">{proj.items.length} items</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <Button variant="text" onclick={onclose}>Cancel</Button>
        <Button
          loading={adding}
          disabled={!selectedProjectId}
          onclick={confirm}
        >Add to Project</Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .modal-card {
    background: var(--color-surface-0); border-radius: 12px;
    max-width: 440px; width: 100%; box-shadow: var(--shadow-3);
    display: flex; flex-direction: column; max-height: 80vh;
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px; border-bottom: 1px solid var(--color-surface-3);
    flex-shrink: 0;
  }
  .modal-header h3 { margin: 0; font-size: 1.0625rem; font-weight: 500; }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .close-btn:hover { background: var(--color-surface-2); }

  .modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }

  .hint { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 12px; }
  .status-msg { font-size: 0.875rem; color: var(--color-text-secondary); text-align: center; padding: 16px 0; }

  .empty-state {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 24px 0; color: var(--color-text-secondary);
  }
  .empty-state p { font-size: 0.875rem; margin: 0; }
  .empty-state a { color: var(--color-primary); text-decoration: none; }
  .empty-state a:hover { text-decoration: underline; }

  .project-list { display: flex; flex-direction: column; gap: 4px; }

  .project-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; border: 1px solid transparent;
    background: transparent; cursor: pointer; text-align: left;
    font-size: 0.875rem; color: var(--color-text-primary); width: 100%;
    transition: background var(--transition-standard), border-color var(--transition-standard);
  }
  .project-row:hover:not(:disabled) { background: var(--color-surface-1); }
  .project-row.selected { background: var(--color-primary-subtle); border-color: var(--color-primary); }
  .project-row.already-added { opacity: 0.5; cursor: not-allowed; }

  .proj-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .added-chip, .item-count {
    flex-shrink: 0; font-size: 0.6875rem; padding: 1px 6px;
    border-radius: 8px; background: var(--color-surface-2); color: var(--color-text-secondary);
  }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 14px 20px; border-top: 1px solid var(--color-surface-3);
    flex-shrink: 0;
  }
</style>

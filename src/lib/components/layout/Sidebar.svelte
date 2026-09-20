<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { sidebarCollapsed, sidebarAutoHide, toggleSidebar, sidebarMobileOpen, closeMobileSidebar } from '$lib/stores/ui'
  import { currentUser } from '$lib/stores/auth'
  import { NAV_SECTIONS } from '$lib/config/navigation'
  import { transcriptionGroups, refreshTranscriptionGroups } from '$lib/stores/transcriptionGroups'
  import { notebooks, refreshNotebooks } from '$lib/stores/notebooks'
  import { kanbanBoards, refreshKanbanBoards } from '$lib/stores/kanbanBoards'
  import { projects, refreshProjects } from '$lib/stores/projects'
  import { ganttCharts, refreshGanttCharts } from '$lib/stores/ganttCharts'
  import { excalidrawDrawings, refreshExcalidrawDrawings } from '$lib/stores/excalidrawDrawings'
  import { ChevronLeft, ChevronRight, Plus } from 'lucide-svelte'
  import Avatar from '$lib/components/ui/Avatar.svelte'

  let hovering = $state(false)
  const collapsed = $derived($sidebarAutoHide ? !hovering : $sidebarCollapsed)

  function onMouseEnter() {
    if ($sidebarAutoHide) hovering = true
  }
  function onMouseLeave() {
    if ($sidebarAutoHide) hovering = false
  }

  const activeHref = $derived($page.url.pathname)
  const visibleGroups = $derived($transcriptionGroups.filter(g => !g.deleted))
  const visibleNotebooks = $derived($notebooks.filter(n => !n.deleted))
  const visibleBoards = $derived($kanbanBoards.filter(b => !b.deleted))
  const visibleProjects = $derived($projects.filter(p => !p.deleted))
  const visibleGanttCharts = $derived($ganttCharts.filter(c => !c.deleted))
  const visibleDrawings = $derived($excalidrawDrawings.filter(d => !d.deleted))

  let notebooksExpanded = $state(false)
  let transcriptionExpanded = $state(false)
  let kanbanExpanded = $state(false)
  let projectsExpanded = $state(false)
  let ganttExpanded = $state(false)
  let excalidrawExpanded = $state(false)
  let mcpApiKeysExpanded = $state(false)

  // Close mobile sidebar on navigation
  $effect(() => { $page.url.pathname; closeMobileSidebar() })

  onMount(() => { refreshTranscriptionGroups(); refreshNotebooks(); refreshKanbanBoards(); refreshProjects(); refreshGanttCharts(); refreshExcalidrawDrawings() })

  function toggleNotebooks() {
    notebooksExpanded = !notebooksExpanded
  }

  function toggleTranscriptions() {
      transcriptionExpanded = !transcriptionExpanded
  }

  function toggleKanban() {
    kanbanExpanded = !kanbanExpanded
  }

  function toggleProjects() {
    projectsExpanded = !projectsExpanded
  }

  function toggleGantt() {
    ganttExpanded = !ganttExpanded
  }

  function toggleExcalidraw() {
    excalidrawExpanded = !excalidrawExpanded
  }

  function toggleMcpApiKeys() {
    mcpApiKeysExpanded = !mcpApiKeysExpanded
  }
</script>

<aside
  class="sidebar"
  class:collapsed={collapsed}
  class:mobile-open={$sidebarMobileOpen}
  class:overlay-expanded={$sidebarAutoHide && !collapsed}
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
  aria-label="Main navigation"
>
  <div class="sidebar-header" class:collapsed={collapsed}>
    {#if !collapsed}
      <div class="product-brand">
        <span class="product-name"><span class="logo-paper">schola</span><span class="logo-hub">flow</span></span>
        <span class="product-tagline">Research | Share | Connect</span>
      </div>
    {/if}
    <button
      class="collapse-btn"
      class:auto-hide-logo={$sidebarAutoHide}
      onclick={toggleSidebar}
      aria-label="Toggle sidebar"
      disabled={$sidebarAutoHide}
      title={$sidebarAutoHide ? 'Auto-hide is on — hover the sidebar to expand it' : undefined}
    >
      {#if $sidebarAutoHide}
        <img src="/icon_1024.png" alt="" class="brand-mark" />
      {:else if collapsed}
        <ChevronRight size={29} />
      {:else}
        <ChevronLeft size={29} />
      {/if}
    </button>
  </div>

  <nav class="sidebar-nav">
    {#each NAV_SECTIONS as section}
      {#if section.title && !collapsed}
        <p class="section-label">{section.title}</p>
      {/if}
      {#each section.items as item}
        {@const active = activeHref.startsWith(item.href)}
        <div class="nav-item-wrapper" class:has-submenu={item.href === '/notebooks' || item.href === '/transcription' || item.href === '/kanban' || item.href === '/projects' || item.href === '/gantt' || item.href === '/excalidraw' || item.submenu}>
          <a
            href={item.href}
            class="nav-item"
            class:active
            title={collapsed ? item.label : undefined}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon size={collapsed ? 20 : 20} />
            {#if !collapsed}
              <span>{item.label}</span>
            {/if}
            {#if item.badge && !collapsed}
              <span class="badge">{item.badge}</span>
            {/if}
          </a>
          {#if item.href === '/notebooks' && !collapsed}
            <button
              class="submenu-toggle"
              onclick={toggleNotebooks}
              aria-label={notebooksExpanded ? 'Collapse notebooks' : 'Expand notebooks'}
              title={notebooksExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={18} class={notebooksExpanded ? 'rotated' : ''} />
            </button>
          {/if}
          {#if item.href === '/transcription' && !collapsed}
            <button
              class="submenu-toggle"
              onclick={toggleTranscriptions}
              aria-label={transcriptionExpanded ? 'Collapse transcription' : 'Expand transcription'}
              title={transcriptionExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={18} class={transcriptionExpanded ? 'rotated' : ''} />
            </button>
          {/if}
          {#if item.href === '/kanban' && !collapsed}
            <button
              class="submenu-toggle"
              onclick={toggleKanban}
              aria-label={kanbanExpanded ? 'Collapse kanban' : 'Expand kanban'}
              title={kanbanExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={18} class={kanbanExpanded ? 'rotated' : ''} />
            </button>
          {/if}
          {#if item.href === '/gantt' && !collapsed}
            <button
              class="submenu-toggle"
              onclick={toggleGantt}
              aria-label={ganttExpanded ? 'Collapse gantt' : 'Expand gantt'}
              title={ganttExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={18} class={ganttExpanded ? 'rotated' : ''} />
            </button>
          {/if}
          {#if item.href === '/projects' && !collapsed}
            <button
              class="submenu-toggle"
              onclick={toggleProjects}
              aria-label={projectsExpanded ? 'Collapse projects' : 'Expand projects'}
              title={projectsExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={18} class={projectsExpanded ? 'rotated' : ''} />
            </button>
          {/if}
          {#if item.href === '/excalidraw' && !collapsed}
            <button
              class="submenu-toggle"
              onclick={toggleExcalidraw}
              aria-label={excalidrawExpanded ? 'Collapse excalidraw' : 'Expand excalidraw'}
              title={excalidrawExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={18} class={excalidrawExpanded ? 'rotated' : ''} />
            </button>
          {/if}
          {#if item.submenu && !collapsed}
            <button
              class="submenu-toggle"
              onclick={() => {
                if (item.href === '/mcp') toggleMcpApiKeys()
              }}
              aria-label={item.href === '/mcp' && mcpApiKeysExpanded ? 'Collapse' : 'Expand'}
              title={item.href === '/mcp' && mcpApiKeysExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight size={18} class={item.href === '/mcp' && mcpApiKeysExpanded ? 'rotated' : ''} />
            </button>
          {/if}
        </div>
        {#if item.submenu && !collapsed && item.href === '/mcp' && mcpApiKeysExpanded}
          {#each item.submenu as subitem}
            {@const subitemActive = activeHref.startsWith(subitem.href)}
            <a
              href={subitem.href}
              class="nav-item nav-subitem"
              class:active={subitemActive}
              aria-current={subitemActive ? 'page' : undefined}
            >
              <span class="subitem-dot">·</span>
              <span>{subitem.label}</span>
            </a>
          {/each}
        {/if}
        {#if item.href === '/kanban' && !collapsed && kanbanExpanded}
          {#each visibleBoards as board}
            {@const boardActive = activeHref.startsWith(`/kanban/${board.id}`)}
            <a
              href="/kanban/{board.id}"
              class="nav-item nav-subitem"
              class:active={boardActive}
              aria-current={boardActive ? 'page' : undefined}
            >
              <span class="subitem-dot">·</span>
              <span>{board.title}</span>
            </a>
          {/each}
        {/if}
        {#if item.href === '/transcription' && !collapsed && transcriptionExpanded}
          {#each visibleGroups as group}
            {@const groupActive = activeHref.startsWith(`/transcription/${group.id}`)}
            <a
              href="/transcription/{group.id}"
              class="nav-item nav-subitem"
              class:active={groupActive}
              aria-current={groupActive ? 'page' : undefined}
            >
              <span class="subitem-dot">·</span>
              <span>{group.name}</span>
            </a>
          {/each}
          <a href="/transcription/new" class="nav-item nav-subitem nav-subitem-new">
            <Plus size={14} />
            <span>New group</span>
          </a>
        {/if}
        {#if item.href === '/gantt' && !collapsed && ganttExpanded}
          {#each visibleGanttCharts as chart}
            {@const chartActive = activeHref.startsWith(`/gantt/${chart.id}`)}
            <a
              href="/gantt/{chart.id}"
              class="nav-item nav-subitem"
              class:active={chartActive}
              aria-current={chartActive ? 'page' : undefined}
            >
              <span class="subitem-dot">·</span>
              <span>{chart.title}</span>
            </a>
          {/each}
          <a href="/gantt" class="nav-item nav-subitem nav-subitem-new">
            <Plus size={14} />
            <span>New chart</span>
          </a>
        {/if}
        {#if item.href === '/excalidraw' && !collapsed && excalidrawExpanded}
          {#each visibleDrawings as drawing}
            {@const drawingActive = activeHref.startsWith(`/excalidraw/${drawing.id}`)}
            <a
              href="/excalidraw/{drawing.id}"
              class="nav-item nav-subitem"
              class:active={drawingActive}
              aria-current={drawingActive ? 'page' : undefined}
            >
              <span class="subitem-dot">·</span>
              <span>{drawing.title}</span>
            </a>
          {/each}
          <a href="/excalidraw" class="nav-item nav-subitem nav-subitem-new">
            <Plus size={14} />
            <span>New drawing</span>
          </a>
        {/if}
        {#if item.href === '/projects' && !collapsed && projectsExpanded}
          {#each visibleProjects as project}
            {@const projectActive = activeHref.startsWith(`/projects/${project.id}`)}
            <a
              href="/projects/{project.id}"
              class="nav-item nav-subitem"
              class:active={projectActive}
              aria-current={projectActive ? 'page' : undefined}
            >
              <span class="subitem-dot">·</span>
              <span>{project.name}</span>
            </a>
          {/each}
          <a href="/projects" class="nav-item nav-subitem nav-subitem-new">
            <Plus size={14} />
            <span>New project</span>
          </a>
        {/if}
        {#if item.href === '/notebooks' && !collapsed && notebooksExpanded}
          {#each visibleNotebooks as nb}
            {@const nbActive = activeHref.startsWith(`/notebooks/${nb.id}`)}
            <a
              href="/notebooks/{nb.id}"
              class="nav-item nav-subitem"
              class:active={nbActive}
              aria-current={nbActive ? 'page' : undefined}
            >
              <span class="subitem-dot">·</span>
              <span>{nb.title}</span>
            </a>
          {/each}
          <a href="/notebooks/new" class="nav-item nav-subitem nav-subitem-new">
            <Plus size={14} />
            <span>New notebook</span>
          </a>
        {/if}
      {/each}
    {/each}
  </nav>

  {#if !collapsed}
    <a href="/settings" class="sidebar-footer" aria-current={activeHref.startsWith('/settings') ? 'page' : undefined}>
      <div class="user-chip">
        <Avatar name={$currentUser ?? 'U'} size={40} />
        <span class="username">{$currentUser}</span>
      </div>
    </a>
  {/if}
</aside>

<style>
  .sidebar {
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 40;
    width: var(--sidebar-width);
    background: var(--color-sidebar-bg);
    border-right: 1px solid var(--color-surface-3);
    display: flex; flex-direction: column;
    transition: width var(--transition-sidebar), transform var(--transition-sidebar);
    overflow: hidden;
  }
  .sidebar.collapsed { width: var(--sidebar-collapsed-width); }

  /* Below 1020px: sidebar hidden off-screen, slides in as overlay */
  @media (max-width: 1019px) {
    .sidebar { width: var(--sidebar-width); transform: translateX(-100%); }
    .sidebar.mobile-open { transform: translateX(0); }
  }

  .sidebar-header {
    height: var(--topbar-height);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; gap: 8px; flex-shrink: 0;
    border-bottom: 1px solid var(--color-surface-3);
  }
  .sidebar-header.collapsed {
    justify-content: center;
    padding: 0;
  }

  /* On mobile the sidebar is always expanded, so show header normally */
  @media (max-width: 1019px) {
    .sidebar-header.collapsed { justify-content: space-between; padding: 0 16px; }
  }

  .product-brand { display: flex; flex-direction: column; gap: 1px; }
  .product-name { font-size: 28px; white-space: nowrap; }
  .product-tagline { font-size: 0.6rem; color: #545A62; letter-spacing: 0.05em; white-space: nowrap; }
  .logo-paper { color: #447EE2; }
  .logo-hub   { color: #596772; }
  :global([data-theme="dark"]) .logo-hub { color: #ffffff; }

  .collapse-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
    flex-shrink: 0;
  }
  .collapse-btn:hover { background: var(--color-surface-2); }
  .collapse-btn:disabled { cursor: default; opacity: 0.4; }
  .collapse-btn:disabled:hover { background: transparent; }
  .collapse-btn.auto-hide-logo:disabled { opacity: 1; }
  .brand-mark { width: 26px; height: 26px; border-radius: 7px; object-fit: cover; }

  /* Hide collapse button on mobile */
  @media (max-width: 1019px) {
    .collapse-btn { display: none; }
  }

  /* Auto-hide: sidebar overlays content while hover-expanded, so it needs its own shadow */
  .sidebar.overlay-expanded { box-shadow: var(--shadow-2); }

  .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
  .section-label {
    font-size: 0.6875rem; font-weight: 500; letter-spacing: .8px; text-transform: uppercase;
    color: var(--color-text-secondary); padding: 16px 16px 4px; white-space: nowrap; margin: 0;
  }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; margin: 2px 8px; border-radius: 24px;
    color: var(--color-sidebar-text); text-decoration: none; white-space: nowrap;
    font-size: 0.875rem; font-weight: 500;
    transition: background var(--transition-standard), color var(--transition-standard);
  }
  .nav-item:hover { background: var(--color-surface-2); }
  .nav-item.active {
    background: var(--color-sidebar-active);
    color: var(--color-sidebar-active-text);
  }

  .nav-item-wrapper {
    display: flex; align-items: center; position: relative;
  }
  .nav-item-wrapper.has-submenu .nav-item {
    flex: 1;
  }

  .submenu-toggle {
    display: flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; margin-right: 8px; border: none;
    background: transparent; cursor: pointer; color: var(--color-text-secondary);
    transition: color var(--transition-standard), transform var(--transition-standard);
    flex-shrink: 0;
  }
  .submenu-toggle:hover { color: var(--color-text-primary); }
  .submenu-toggle :global(svg) {
    transition: transform var(--transition-standard);
  }
  .submenu-toggle :global(svg.rotated) {
    transform: rotate(90deg);
  }

  .badge {
    margin-left: auto; background: var(--color-primary); color: white;
    font-size: 0.6875rem; font-weight: 600; padding: 2px 7px; border-radius: 10px;
  }

  .nav-subitem {
    padding: 7px 16px 7px 32px;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--color-text-secondary);
  }
  .nav-subitem.active {
    background: var(--color-sidebar-active);
    color: var(--color-sidebar-active-text);
    font-weight: 500;
  }
  .subitem-dot {
    font-size: 1rem; line-height: 1; color: var(--color-text-disabled); flex-shrink: 0;
  }
  .nav-subitem-new {
    color: var(--color-text-disabled);
    font-size: 0.75rem;
  }
  .nav-subitem-new:hover { color: var(--color-primary); }
  .sidebar-footer {
    display: block; padding: 12px 16px; border-top: 1px solid var(--color-surface-3); flex-shrink: 0;
    text-decoration: none; transition: background var(--transition-standard);
  }
  .sidebar-footer:hover, .sidebar-footer[aria-current="page"] { background: var(--color-surface-2); }
  .user-chip { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .username { font-size: 0.8125rem; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>

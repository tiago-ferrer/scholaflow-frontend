<script lang="ts">
  import { page } from '$app/stores'
  import { ChevronRight } from 'lucide-svelte'
  import type { Paper } from '$lib/types/paper'

  function labelFor(part: string): string {
    // If this segment looks like a paper ID, try to use paper data from the page
    const paper = ($page.data as { paper?: Paper }).paper
    if (paper && part === paper.id) {
      const firstAuthor = paper.authors[0]?.split(' ').pop() ?? ''
      const extra = paper.authors.length > 1 ? ' et al.' : ''
      return `${paper.year} · ${firstAuthor}${extra}`
    }
    return part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
  }

  const crumbs = $derived.by(() => {
    const parts = $page.url.pathname.split('/').filter(Boolean)
    return parts.map((part, i) => ({
      label: labelFor(part),
      href: '/' + parts.slice(0, i + 1).join('/'),
    }))
  })
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
  {#each crumbs as crumb, i}
    {#if i > 0}
      <ChevronRight size={18} class="sep" />
    {/if}
    {#if i === crumbs.length - 1}
      <span class="current">{crumb.label}</span>
    {:else}
      <a href={crumb.href} class="link">{crumb.label}</a>
    {/if}
  {/each}
</nav>

<style>
  .breadcrumb {
    display: flex; align-items: center; gap: 4px;
    font-size: 1.006rem; min-width: 0;
  }
  .link { color: var(--color-text-secondary); text-decoration: none; }
  .link:hover { color: var(--color-primary); }
  .current { color: var(--color-text-primary); font-weight: 500; }
  :global(.sep) { color: var(--color-text-disabled); flex-shrink: 0; }
</style>

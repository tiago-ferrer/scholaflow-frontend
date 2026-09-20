<script lang="ts">
  import { toggleMobileSidebar } from '$lib/stores/ui'
  import { Menu } from 'lucide-svelte'
</script>

<button class="mobile-menu-btn" onclick={toggleMobileSidebar} aria-label="Open menu">
  <Menu size={22} />
</button>

<style>
  /* Floating menu trigger for the mobile overlay sidebar — desktop has no top bar */
  .mobile-menu-btn {
    display: none;
    position: fixed; top: 12px; left: 12px; z-index: 30;
    width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
    align-items: center; justify-content: center;
    background: var(--color-surface-0); color: var(--color-text-secondary);
    box-shadow: var(--shadow-1);
  }
  .mobile-menu-btn:hover { background: var(--color-surface-2); }

  @media (max-width: 1019px) {
    .mobile-menu-btn { display: flex; }
  }
</style>

# Layout Components

App shell components rendered once in the `(app)` group layout.

## Components

### `Sidebar.svelte`
Left navigation sidebar.
- Reads `NAV_SECTIONS` from `$lib/config/navigation.ts` to render nav items
- Filters out any item with `adminOnly: true` unless `$isAdmin` (from `$lib/stores/auth`) is true
- Reads list stores (`kanbanBoards`, `notebooks`, `transcriptionGroups`, etc.) to render dynamic sub-items
- Calls `refresh*()` store functions on mount to populate dynamic sub-items
- Controlled by `sidebarCollapsed`, `sidebarAutoHide` and `sidebarMobileOpen` from `$lib/stores/ui`
- Uses `<item.icon />` pattern for lucide icons — NOT `<svelte:component this={item.icon} />`
- Active item highlighted by matching `$page.url.pathname`
- Footer user chip (`Avatar` + username) is an `<a href="/settings">`, not a plain `<div>` — clicking it navigates to Settings

**Auto-hide mode** (toggled from Settings > Appearance, `sidebarAutoHide`): the template's `collapsed`
value is a local `$derived` — `$sidebarAutoHide ? !hovering : $sidebarCollapsed` — not `$sidebarCollapsed`
directly, so every `{#if !collapsed}` / `class:collapsed={collapsed}` in the markup reacts to hover too.
`hovering` is local `$state`, flipped by `onmouseenter`/`onmouseleave` on the `<aside>` (no-ops when
auto-hide is off). The manual collapse chevron is `disabled` (not hidden) while auto-hide is on, since
the resting state is enforced automatically. `+layout.svelte`'s `.main-area` margin only reacts to
`$sidebarAutoHide || $sidebarCollapsed` — never to `hovering` — so a hover-expanded sidebar overlays
the content (via its existing `position: fixed`) instead of pushing it; `.sidebar.overlay-expanded` adds
`--shadow-2` for separation in that state.

### `TopBar.svelte`
No longer a visible bar on desktop (removed as redundant with the per-page `<h1>`
title and the Sidebar's active nav item). Renders only a floating hamburger button,
shown below the 1020px breakpoint, that calls `toggleMobileSidebar` from
`$lib/stores/ui` to open the overlay Sidebar on mobile.
Dark mode toggle and Log out moved to the Settings page (`(app)/settings/+page.svelte`).

### `NavLoadingOverlay.svelte`
Full-bleed loading veil shown over the content area (not the Sidebar) while
a route `load` function is running. Rendered in `(app)/+layout.svelte` whenever the
SvelteKit `$navigating` store (`$app/stores`) is non-null. Covers only `.content-area`
(absolute inset, `z-index: 10`, below Sidebar's 40 and TopBar's floating button's 30)
so the Sidebar stays interactive during navigation while the rest of the screen is
blocked from clicks and shows a `BrandLoadingIcon` (Scholaflow brand mark, bloom animation).

## Layout Hierarchy

```
(app)/+layout.svelte
  <Sidebar />
  <TopBar />                            ← mobile-only floating menu button
  <div class="content-area">           ← position: relative
    <main>
      <slot />   ← {#render children()}
    </main>
    <NavLoadingOverlay />              ← shown while $navigating
  </div>
  <ToastStack />
```

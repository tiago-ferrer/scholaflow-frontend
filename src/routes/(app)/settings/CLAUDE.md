# Settings

User profile and account settings.

## Routes

```
settings/
  +page.svelte    # Settings form
```

## Content

Single-page settings form. No `+page.ts` loader — user profile data comes from `authStore` / `currentUser`.

Typical settings: display name, email, password change, theme preference (light/dark), log out.

Theme toggle syncs to `$lib/stores/ui` `theme` store which persists to `localStorage`. Log out (`authStore.clear()` + `goto('/')`) lives in the Account card here — `TopBar` no longer renders these actions (it's mobile-menu-only now, see `lib/components/layout/CLAUDE.md`).

# Admin

Dedicated console for ROLE_ADMIN users. Not embedded in `settings/` — has its own sidebar nav item
(`Admin`, `adminOnly: true` in `$lib/config/navigation.ts`) with a submenu per admin feature.

## Routes

```
admin/
  +layout.ts        # Guard: redirects to /dashboard unless $isAdmin
  +page.svelte       # Admin home — redirects to /admin/costs
  costs/
    +page.svelte     # All-users storage + AI/transcription usage cost breakdown
  ai-configs/
    +page.svelte     # Paper Summary Prompt (singleton, applies to every user)
```

## Guard

`+layout.ts` checks `isAdmin` (derived from the `ROLE_ADMIN` claim in the JWT, `$lib/stores/auth`) and
redirects non-admins to `/dashboard`. This is in addition to — not instead of — the parent `(app)/+layout.ts`
login guard, which runs first since `admin/` is nested under `(app)/`.

The sidebar also hides the `Admin` nav item and its submenu from non-admins (`adminOnly` field, filtered in
`Sidebar.svelte`), but that's UI-only — the route guard here is what actually enforces access.

## Adding a new admin feature

1. Add a route under `admin/your-feature/+page.svelte` — no extra guard needed, it inherits this layout's.
2. Add a submenu entry under the `Admin` nav item in `$lib/config/navigation.ts`.
3. Each admin page pulls its own data (no shared `+layout.ts` loader) — the personal-vs-admin split for
   cost data mirrors `$lib/api/costs.ts`: `getStorage`/`getUsage` (own data, used in `settings/`) vs.
   `getAllStorage`/`getAllUsage` (all users, used in `costs/`).

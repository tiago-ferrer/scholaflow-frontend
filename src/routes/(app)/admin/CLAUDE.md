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
    +page.svelte     # Paper Summary Prompt + max PDF size for summaries (both singleton, apply to every user)
```

`ai-configs/+page.svelte` fetches both settings from the same `GET /admin/prompts/paper-summary` response
(`PaperSummaryPrompt` — `prompt_text` and `max_file_size_bytes`), but saves them independently via two
separate `PUT`s (`adminPromptsApi.setPaperSummaryPrompt` / `setMaxFileSize`) — editing one never resends
the other. The size field is entered/displayed in MB in the UI and converted to bytes at the API boundary;
the API itself only ever speaks bytes.

`costs/+page.svelte`'s `RESOURCE_LABELS` map (and the identical one in `../settings/+page.svelte`) must be
kept in sync with whatever `by_resource` keys the backend reports — e.g. OpenAI chat usage is split by
feature (`OPENAI_CHAT_TRANSCRIPTION_NOTE`, `OPENAI_CHAT_PAPER_SUMMARY`), not a single `OPENAI_CHAT` key.
An unmapped key still renders (via `resourceLabel()`'s title-case fallback), so this map is a labeling
nicety, not a correctness requirement — but keep it current when the backend adds a new cost category.

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

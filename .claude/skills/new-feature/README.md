# new-feature skill

Scaffolds a complete new top-level feature in this SvelteKit app, following the project's established architecture, API patterns, and design system.

## What it does

Given a feature description it walks through every layer in the correct order:

1. **Types** — resource + payload interfaces in `src/lib/types/`
2. **API module** — `makeXxxApi(fetchFn?)` factory + singleton in `src/lib/api/`
3. **Sidebar store** — `writable` store + silent `refreshXxx()` in `src/lib/stores/`
4. **Navigation** — adds a `NavItem` entry in `src/lib/config/navigation.ts`
5. **Sidebar** — expand/collapse toggle, sub-items list, "New X" link
6. **Breadcrumb** — UUID → human-readable title resolution
7. **List page** — cards grid, filter chip, pagination, create Modal, delete ConfirmDialog
8. **Detail page** — two-column header (back link + editable title + description / action buttons)
9. **Type check** — runs `npm run check` at the end and fixes any errors

All generated code uses Svelte 5 runes, the project's CSS design tokens, and matches the UX conventions of existing features (Kanban, Gantt, Projects).

## How to use

```
/new-feature <description>
```

### Examples

```
/new-feature a Reading Lists feature — users can create named lists and save references to them

/new-feature a Flashcards feature — users create decks of question/answer cards linked to papers

/new-feature a Citations feature — users manage citation styles and export bibliographies
```

The skill uses `$ARGUMENTS` to receive everything after `/new-feature` as the feature description, so be as specific as you like about resource names, fields, and behaviour.

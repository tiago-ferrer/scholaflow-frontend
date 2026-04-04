# Scholaflow Frontend

SvelteKit 2 + Svelte 5 frontend for the Scholaflow REST API — a research management tool for academics.

## Prerequisites

- Node.js 18+
- npm

## Getting started

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment

Create a `.env` file in the project root (this file is **not committed** to the repository):

```sh
cp .env.example .env
```

Or create it manually:

```sh
# .env
VITE_API_BASE_URL=http://localhost:8000
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the Scholaflow REST API | `''` (same-origin) |

### 3. Run the dev server

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```sh
# or open it automatically
npm run dev -- --open
```

## Other commands

```sh
npm run build     # production build
npm run preview   # preview production build
npm run check     # type-check with svelte-check
```

## Stack

- **SvelteKit 2** with **Svelte 5 runes**
- **TailwindCSS 4**
- **TypeScript** strict mode
- `lucide-svelte` for icons
- `marked` + `katex` for Markdown and math rendering

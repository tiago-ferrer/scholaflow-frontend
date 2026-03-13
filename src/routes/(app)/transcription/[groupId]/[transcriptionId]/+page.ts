import type { PageLoad } from './$types'

// Data is loaded by the parent layout (+layout.ts).
// This file exists to satisfy SvelteKit's type generation for PageData.
export const load: PageLoad = async () => ({})

import { redirect } from '@sveltejs/kit'
import { browser } from '$app/environment'
import { get } from 'svelte/store'
import { isAdmin } from '$lib/stores/auth'

export const load = () => {
  if (browser && !get(isAdmin)) {
    throw redirect(302, '/dashboard')
  }
}

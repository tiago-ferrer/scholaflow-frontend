import { authStore } from '$lib/stores/auth'
import { get } from 'svelte/store'
import { goto } from '$app/navigation'
import { browser } from '$app/environment'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  fields?: Record<string, string>
  constructor(
    public status: number,
    public code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message)
    this.fields = fields
  }
}

export function makeApi(fetchFn: typeof fetch = globalThis.fetch) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const auth = get(authStore)

    const headers = new Headers(init.headers as HeadersInit)
    if (!(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (auth.token) {
      headers.set('Authorization', `Bearer ${auth.token}`)
    }

    const url = `${BASE_URL}${path}`
    if (import.meta.env.DEV) {
      console.log('[api]', init.method ?? 'GET', url, {
        hasAuth: headers.has('Authorization'),
        contentType: headers.get('Content-Type'),
        bodyType: init.body?.constructor?.name,
      })
    }
    const res = await fetchFn(url, { ...init, headers })

    if (res.status === 401) {
      authStore.clear()
      if (browser) await goto('/login')
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      if (import.meta.env.DEV) console.error('[api] error response', res.status, text)
      let body: Record<string, unknown> = {}
      try { body = JSON.parse(text) } catch { /* not json */ }
      const fields = typeof body.fields === 'object' && body.fields !== null
        ? body.fields as Record<string, string>
        : undefined
      throw new ApiError(res.status, String(body.error ?? 'UNKNOWN'), String(body.message ?? (text || 'Request failed')), fields)
    }

    if (res.status === 204 || res.status === 202) return undefined as T
    return res.json() as Promise<T>
  }

  return {
    get:    <T>(path: string)                     => request<T>(path),
    post:   <T>(path: string, body: unknown)      => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
    put:    <T>(path: string, body: unknown)      => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
    patch:  <T>(path: string, body: unknown)      => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: <T>(path: string)                     => request<T>(path, { method: 'DELETE' }),
    upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST',   body: formData }),
    putForm:<T>(path: string, formData: FormData) => request<T>(path, { method: 'PUT',    body: formData }),
  }
}

export const api = makeApi()

/**
 * Reads a `text/event-stream` response body, calling `onEvent` once per SSE event with its
 * `event:` name (empty string if the event had no name) and its joined `data:` payload.
 * Call this only after confirming `response.ok` — it does not do JSON error handling.
 */
export async function readSseStream(
  response: Response,
  onEvent: (eventName: string, data: string) => void,
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  let buffer = ''

  const processFrame = (frame: string) => {
    let eventName = ''
    const dataLines: string[] = []
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice('event:'.length)
      else if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length))
    }
    if (dataLines.length > 0) onEvent(eventName, dataLines.join('\n'))
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      processFrame(buffer.slice(0, sep))
      buffer = buffer.slice(sep + 2)
    }
  }
  if (buffer.trim()) processFrame(buffer)
}

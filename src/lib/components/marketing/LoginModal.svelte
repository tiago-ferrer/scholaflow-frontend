<script lang="ts">
  import { goto } from '$app/navigation'
  import { authApi } from '$lib/api/auth'
  import { authStore } from '$lib/stores/auth'
  import { ApiError } from '$lib/api/client'

  interface Props {
    open: boolean
    onclose: () => void
  }

  let { open, onclose }: Props = $props()

  let username = $state('')
  let password = $state('')
  let error    = $state<string | null>(null)
  let loading  = $state(false)

  function reset() {
    username = ''
    password = ''
    error    = null
    loading  = false
  }

  function close() {
    reset()
    onclose()
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close()
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    error   = null
    loading = true
    try {
      const res = await authApi.login({ username, password })
      authStore.login(res.token, username)
      close()
      goto('/dashboard')
    } catch (err) {
      error = err instanceof ApiError ? err.message : 'Login failed'
    } finally {
      loading = false
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={onBackdropClick}>
    <div class="modal" role="dialog" aria-modal="true" aria-label="Sign in">
      <div class="modal-logo">
        <span class="logo-schola">schola</span><span class="logo-flow">flow</span>
      </div>
      <p class="modal-tagline">Research | Share | Connect</p>

      <h2 class="modal-title">Sign in to Beta</h2>

      {#if error}
        <div class="error-banner" role="alert">{error}</div>
      {/if}

      <form onsubmit={submit} class="form">
        <div class="field-group">
          <label for="modal-username">Username</label>
          <input
            id="modal-username" type="text"
            bind:value={username} required autocomplete="username"
            placeholder="your username"
          />
        </div>
        <div class="field-group">
          <label for="modal-password">Password</label>
          <input
            id="modal-password" type="password"
            bind:value={password} required autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <div class="forgot-link">
          <a href="/forgot-password" onclick={close}>Forgot password?</a>
        </div>
        <button type="submit" class="submit-btn" disabled={loading || !username || !password}>
          {#if loading}
            <span class="spin" aria-hidden="true"></span>
            Signing in…
          {:else}
            Sign in
          {/if}
        </button>
      </form>

      <p class="modal-footer">
        Don't have an account? <a href="/register" onclick={close}>Register</a>
      </p>

      <button class="close-btn" onclick={close} aria-label="Close">✕</button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    animation: fadeIn 150ms ease both;
  }
  .modal {
    background: var(--color-surface-0);
    border-radius: 16px;
    padding: 40px 40px 32px;
    width: 100%; max-width: 400px;
    box-shadow: var(--shadow-3), 0 24px 60px rgba(0,0,0,0.2);
    position: relative;
    animation: slideUp 200ms ease both;
  }
  .modal-logo {
    font-size: 2.4rem; font-weight: 700;
    text-align: center; margin-bottom: 4px;
  }
  .logo-schola { color: #447EE2; }
  .logo-flow   { color: #596772; }
  :global([data-theme="dark"]) .logo-flow { color: #ffffff; }
  .modal-tagline {
    text-align: center; font-size: 0.85rem; color: #545A62;
    letter-spacing: 0.05em; margin: 0 0 28px;
  }
  .modal-title {
    font-size: 1.25rem; font-weight: 600;
    margin: 0 0 20px; color: var(--color-text-primary);
  }
  .error-banner {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
    color: var(--color-error); padding: 10px 14px; border-radius: 6px;
    font-size: 0.875rem; margin-bottom: 16px;
  }
  .form { display: flex; flex-direction: column; gap: 14px; }
  .field-group { display: flex; flex-direction: column; gap: 5px; }
  .field-group label {
    font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary);
  }
  .field-group input {
    width: 100%; padding: 10px 14px; border-radius: 8px;
    border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.9rem; font-family: inherit; outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  .field-group input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-subtle);
  }
  .forgot-link { text-align: right; margin-top: -6px; }
  .forgot-link a {
    font-size: 0.8rem; color: var(--color-text-secondary); text-decoration: none;
  }
  .forgot-link a:hover { color: var(--color-primary); }
  .submit-btn {
    width: 100%; padding: 11px; border-radius: 8px;
    background: var(--color-primary); color: #fff;
    font-weight: 600; font-size: 0.95rem; font-family: inherit;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 150ms ease;
  }
  .submit-btn:hover:not(:disabled) { background: var(--color-primary-hover); }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .spin {
    width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: spin 0.6s linear infinite;
  }
  .modal-footer {
    font-size: 0.875rem; color: var(--color-text-secondary);
    text-align: center; margin: 20px 0 0;
  }
  .modal-footer a { color: var(--color-primary); text-decoration: none; }
  .modal-footer a:hover { text-decoration: underline; }
  .close-btn {
    position: absolute; top: 14px; right: 16px;
    background: none; border: none; cursor: pointer;
    font-size: 1rem; color: var(--color-text-disabled);
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: background 150ms ease, color 150ms ease;
  }
  .close-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 480px) {
    .modal { padding: 32px 24px 24px; }
  }
</style>

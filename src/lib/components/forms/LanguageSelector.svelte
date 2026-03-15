<script lang="ts">
  import FormField from './FormField.svelte'

  export const LANGUAGES = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (GB)' },
    { code: 'pt-BR', label: 'Portuguese (Brazil)' },
    { code: 'es-ES', label: 'Spanish (Spain)' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'it-IT', label: 'Italian' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'zh-CN', label: 'Chinese (Simplified)' },
    { code: 'zh-TW', label: 'Chinese (Traditional)' },
  ]

  interface Props {
    value: string
    required?: boolean
    error?: string
    disabled?: boolean
  }

  let { value = $bindable(''), required = false, error = '', disabled = false }: Props = $props()
</script>

<FormField label="Audio Language" {required} {error}>
  <select bind:value {disabled}>
    <option value="">Use Default (Portuguese BR)</option>
    {#each LANGUAGES as lang}
      <option value={lang.code}>{lang.label}</option>
    {/each}
  </select>
</FormField>

<style>
  :global(select) {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    background: var(--color-surface-0);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-family: inherit;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  :global(select:focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-subtle);
  }

  :global(select:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>

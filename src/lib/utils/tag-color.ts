/**
 * Deterministic per-name color for category/tag chips — no backend field, no persistence.
 * The same tag name always maps to the same hue, so colors stay stable across sessions and
 * devices without storing anything. Colors are mixed with the surface/text theme tokens (not
 * used raw) so they stay readable in both light and dark mode automatically.
 */

function hashHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}

/** Inline `style` value for a tag chip's background/text color. */
export function tagChipStyle(name: string): string {
  const accent = `hsl(${hashHue(name)} 70% 45%)`
  return `background: color-mix(in srgb, ${accent} 18%, var(--color-surface-2)); `
       + `color: color-mix(in srgb, ${accent} 65%, var(--color-text-primary));`
}

import type { Settings } from '../lib/storage'

/** One-tap light/dark switch. Picks the opposite of what is currently shown. */
export function ThemeToggle({ dark, settings, onChange }: { dark: boolean; settings: Settings; onChange: (s: Settings) => void }) {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      onClick={() => onChange({ ...settings, theme: dark ? 'light' : 'dark' })}
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  )
}

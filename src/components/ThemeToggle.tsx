import { useT } from '../hooks/useLang'
import type { Settings } from '../lib/storage'

/** One-tap light/dark switch. Picks the opposite of what is currently shown. */
export function ThemeToggle({ dark, settings, onChange }: { dark: boolean; settings: Settings; onChange: (s: Settings) => void }) {
  const t = useT()
  return (
    <button
      type="button"
      className="btn btn-secondary"
      aria-label={dark ? t('toLight') : t('toDark')}
      title={dark ? t('lightMode') : t('darkMode')}
      onClick={() => onChange({ ...settings, theme: dark ? 'light' : 'dark' })}
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  )
}

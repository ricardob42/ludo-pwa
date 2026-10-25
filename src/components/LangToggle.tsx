import { useT } from '../hooks/useLang'
import type { Settings } from '../lib/storage'

/** One-tap Spanish / English switch. Shows the code of the language you would switch to. */
export function LangToggle({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  const t = useT()
  const next = settings.lang === 'es' ? 'en' : 'es'
  return (
    <button type="button" className="btn btn-secondary" aria-label={t('switchLang')} title={t('switchLang')} onClick={() => onChange({ ...settings, lang: next })}>
      <span aria-hidden="true" className="font-extrabold tracking-wide">
        {next.toUpperCase()}
      </span>
    </button>
  )
}

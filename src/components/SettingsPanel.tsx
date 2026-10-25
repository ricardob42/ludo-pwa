import { useEffect, useRef } from 'react'
import { useT } from '../hooks/useLang'
import type { Settings } from '../lib/storage'

interface Props {
  settings: Settings
  reduced: boolean
  onChange: (s: Settings) => void
  onClose: () => void
}

function Seg<V extends string>({ name, label, value, options, onChange }: { name: string; label: string; value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <fieldset>
      <legend className="panel-title">{label}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label key={o.value}>
            <input type="radio" name={name} className="sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="seg text-center text-sm">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
      <span className="font-semibold">{label}</span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  )
}

export function SettingsPanel({ settings, reduced, onChange, onClose }: Props) {
  const t = useT()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => onChange({ ...settings, [k]: v })

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-2 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="glass max-h-[92dvh] w-full max-w-md space-y-5 overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="settings-title" className="text-2xl font-black tracking-tight">
            {t('settingsTitle')}
          </h2>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label={t('close')} title={t('close')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <Seg name="lang" label={t('language')} value={settings.lang} onChange={set('lang')} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
        <Seg
          name="theme"
          label={t('theme')}
          value={settings.theme}
          onChange={set('theme')}
          options={[{ value: 'system', label: t('themeSystem') }, { value: 'light', label: t('themeLight') }, { value: 'dark', label: t('themeDark') }]}
        />
        <Seg name="view" label={t('boardView')} value={settings.view} onChange={set('view')} options={[{ value: '3d', label: t('view3d') }, { value: 'flat', label: t('viewFlat') }]} />
        <Seg
          name="difficulty"
          label={t('aiDifficulty')}
          value={settings.difficulty}
          onChange={set('difficulty')}
          options={[{ value: 'easy', label: t('easy') }, { value: 'medium', label: t('medium') }, { value: 'hard', label: t('hard') }]}
        />
        <div>
          <Seg
            name="speed"
            label={t('animSpeed')}
            value={settings.speed}
            onChange={set('speed')}
            options={[{ value: 'normal', label: t('speedNormal') }, { value: 'fast', label: t('speedFast') }, { value: 'off', label: t('speedOff') }]}
          />
          {reduced && <p className="mt-2 text-sm text-muted">{t('reducedNote')}</p>}
        </div>

        <div>
          <Switch label={t('sound')} checked={settings.sound} onChange={set('sound')} />
          <Switch label={t('extraRoll')} checked={settings.extraRoll} onChange={set('extraRoll')} />
        </div>

        <button className="cta !min-h-12 !text-base" onClick={onClose}>
          {t('done')}
        </button>
      </div>
    </div>
  )
}

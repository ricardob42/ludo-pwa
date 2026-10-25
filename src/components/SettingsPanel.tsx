import { useEffect, useRef } from 'react'
import { useT } from '../hooks/useLang'
import type { Settings } from '../lib/storage'

interface Props {
  settings: Settings
  reduced: boolean
  onChange: (s: Settings) => void
  onClose: () => void
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

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-2 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="card max-h-[92dvh] w-full max-w-md space-y-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 id="settings-title" className="text-xl font-bold">
          {t('settingsTitle')}
        </h2>

        <label className="block">
          <span className="mb-1 block font-semibold">{t('language')}</span>
          <select className="field" value={settings.lang} onChange={(e) => onChange({ ...settings, lang: e.target.value as Settings['lang'] })}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">{t('theme')}</span>
          <select className="field" value={settings.theme} onChange={(e) => onChange({ ...settings, theme: e.target.value as Settings['theme'] })}>
            <option value="system">{t('themeSystem')}</option>
            <option value="light">{t('themeLight')}</option>
            <option value="dark">{t('themeDark')}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">{t('boardView')}</span>
          <select className="field" value={settings.view} onChange={(e) => onChange({ ...settings, view: e.target.value as Settings['view'] })}>
            <option value="3d">{t('view3d')}</option>
            <option value="flat">{t('viewFlat')}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">{t('aiDifficulty')}</span>
          <select className="field" value={settings.difficulty} onChange={(e) => onChange({ ...settings, difficulty: e.target.value as Settings['difficulty'] })}>
            <option value="easy">{t('easy')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="hard">{t('hard')}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">{t('animSpeed')}</span>
          <select className="field" value={settings.speed} onChange={(e) => onChange({ ...settings, speed: e.target.value as Settings['speed'] })}>
            <option value="normal">{t('speedNormal')}</option>
            <option value="fast">{t('speedFast')}</option>
            <option value="off">{t('speedOff')}</option>
          </select>
          {reduced && <span className="mt-1 block text-sm text-muted">{t('reducedNote')}</span>}
        </label>

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="h-6 w-6" checked={settings.sound} onChange={(e) => onChange({ ...settings, sound: e.target.checked })} />
          <span className="font-semibold">{t('sound')}</span>
        </label>

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="h-6 w-6" checked={settings.extraRoll} onChange={(e) => onChange({ ...settings, extraRoll: e.target.checked })} />
          <span className="font-semibold">{t('extraRoll')}</span>
        </label>

        <button ref={closeRef} className="btn w-full" onClick={onClose}>
          {t('done')}
        </button>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import type { Settings } from '../lib/storage'

interface Props {
  settings: Settings
  reduced: boolean
  onChange: (s: Settings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, reduced, onChange, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-2 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="text-xl font-bold">
          Settings
        </h2>

        <label className="block">
          <span className="mb-1 block font-semibold">Theme</span>
          <select className="field" value={settings.theme} onChange={(e) => onChange({ ...settings, theme: e.target.value as Settings['theme'] })}>
            <option value="system">Match my device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">AI difficulty</span>
          <select className="field" value={settings.difficulty} onChange={(e) => onChange({ ...settings, difficulty: e.target.value as Settings['difficulty'] })}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-semibold">Animation speed</span>
          <select className="field" value={settings.speed} onChange={(e) => onChange({ ...settings, speed: e.target.value as Settings['speed'] })}>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
            <option value="off">Off (instant)</option>
          </select>
          {reduced && <span className="mt-1 block text-sm text-muted">Your system asks for reduced motion, so animations are off.</span>}
        </label>

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="h-6 w-6" checked={settings.sound} onChange={(e) => onChange({ ...settings, sound: e.target.checked })} />
          <span className="font-semibold">Sound effects</span>
        </label>

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="h-6 w-6" checked={settings.extraRoll} onChange={(e) => onChange({ ...settings, extraRoll: e.target.checked })} />
          <span className="font-semibold">Extra roll after a 6</span>
        </label>

        <button ref={closeRef} className="btn w-full" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}

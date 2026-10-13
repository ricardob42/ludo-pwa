import { useState } from 'react'
import { COLORS, type Color } from '../lib/ludo/rules'
import { COLOR_HEX } from '../lib/ludo/theme'
import type { Controller } from '../hooks/useGameController'
import { useInstallPrompt } from '../hooks/usePwa'
import { ThemeToggle } from './ThemeToggle'
import { SettingsPanel } from './SettingsPanel'

export function SetupScreen({ ctl, dark }: { ctl: Controller; dark: boolean }) {
  const [humans, setHumans] = useState(1)
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  const [colors, setColors] = useState<Color[]>([...COLORS])
  const [random, setRandom] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { canInstall, install } = useInstallPrompt()
  const { settings, setSettings } = ctl

  const pickColor = (i: number, c: Color) => {
    const next = [...colors]
    const other = next.indexOf(c)
    if (other >= 0) next[other] = next[i]
    next[i] = c
    setColors(next)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-extrabold text-brand">Ludo</h1>
        <div className="flex gap-2">
          {canInstall && (
            <button className="btn btn-secondary" onClick={() => void install()}>
              Install app
            </button>
          )}
          <ThemeToggle dark={dark} settings={settings} onChange={setSettings} />
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      </header>

      {ctl.saved && (
        <section className="card flex flex-wrap items-center justify-between gap-2" aria-label="Saved game">
          <p className="font-semibold">You have an unfinished game.</p>
          <div className="flex gap-2">
            <button className="btn" onClick={ctl.resume}>
              Resume
            </button>
            <button className="btn btn-secondary" onClick={ctl.discardSaved}>
              Discard
            </button>
          </div>
        </section>
      )}

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          ctl.start({ humans, names, colors, randomColors: random })
        }}
      >
        <h2 className="text-xl font-bold">New game</h2>
        <p className="text-muted">Four seats are always in play. Seats without a human are played by the computer.</p>

        <fieldset>
          <legend className="mb-1 font-semibold">Human players</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <label key={n} className="flex-1">
                <input type="radio" name="humans" className="sr-only" checked={humans === n} onChange={() => setHumans(n)} />
                <span className="choice">{n}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted">{humans === 4 ? 'No computer players.' : `${4 - humans} computer player${4 - humans > 1 ? 's' : ''}.`}</p>
        </fieldset>

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="h-6 w-6" checked={random} onChange={(e) => setRandom(e.target.checked)} />
          <span className="font-semibold">Randomize seat colors</span>
        </label>

        <div className="space-y-3">
          {Array.from({ length: humans }, (_, i) => (
            <div key={i} className="space-y-2">
              <label className="block">
                <span className="mb-1 block font-semibold">Name, player {i + 1}</span>
                <input
                  className="field"
                  value={names[i]}
                  maxLength={16}
                  onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                />
              </label>
              {!random && (
                <fieldset>
                  <legend className="sr-only">Color, player {i + 1}</legend>
                  <div className="flex gap-2">
                    {COLORS.map((c) => {
                      const selected = colors[i] === c
                      return (
                        <label key={c} className="flex-1">
                          <input type="radio" name={`color-${i}`} className="sr-only" checked={selected} onChange={() => pickColor(i, c)} />
                          <span
                            className="block h-12 cursor-pointer rounded-xl"
                            style={{
                              background: COLOR_HEX[c],
                              boxShadow: selected ? '0 0 0 3px var(--surface), 0 0 0 6px var(--ink)' : 'none',
                            }}
                          />
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              )}
            </div>
          ))}
        </div>

        {humans < 4 && (
          <label className="block">
            <span className="mb-1 block font-semibold">Computer difficulty</span>
            <select className="field" value={settings.difficulty} onChange={(e) => setSettings({ ...settings, difficulty: e.target.value as typeof settings.difficulty })}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        )}


        <button type="submit" className="btn w-full text-lg">
          Start game
        </button>
      </form>

      {showSettings && <SettingsPanel settings={settings} reduced={ctl.reduced} onChange={setSettings} onClose={() => setShowSettings(false)} />}
    </main>
  )
}

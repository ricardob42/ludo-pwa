import { useState } from 'react'
import { COLORS, type Color } from '../lib/ludo/rules'
import { COLOR_HEX } from '../lib/ludo/theme'
import type { Controller } from '../hooks/useGameController'
import { useInstallPrompt } from '../hooks/usePwa'
import { DieCube } from './Die3D'
import { Pawn, PawnDefs } from './PieceShape'
import { SettingsPanel } from './SettingsPanel'
import { ThemeToggle } from './ThemeToggle'

const SUB = ['You vs 3 CPUs', '2 players + 2 CPUs', '3 players + 1 CPU', 'Everyone plays']

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
    <main className="hero-bg min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-10 pt-4">
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" aria-label="Ludo">
            <span className="text-2xl font-black tracking-tight">Ludo</span>
            <span className="flex gap-1" aria-hidden="true">
              {COLORS.map((c) => (
                <span key={c} className="h-3 w-3 rounded-full" style={{ background: COLOR_HEX[c] }} />
              ))}
            </span>
          </div>
          <div className="flex gap-2">
            {canInstall && (
              <button className="btn btn-secondary" onClick={() => void install()}>
                Install app
              </button>
            )}
            <ThemeToggle dark={dark} settings={settings} onChange={setSettings} />
            <button className="btn btn-secondary" onClick={() => setShowSettings(true)} aria-label="Settings">
              ⚙
            </button>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.05fr_1fr]">
          {/* ---------- hero ---------- */}
          <section className="text-center lg:text-left">
            <span className="eyebrow">The classic race game</span>
            <h1 className="hero-title mt-4">
              Roll. Race.
              <br />
              <span className="text-brand">Send them home.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted lg:mx-0">
              Get all four pawns around the board before your rivals do. Play the computer, or pass the phone around with friends.
              Works offline, no sign-up.
            </p>

            <div className="mt-6 flex items-end justify-center gap-6 lg:justify-start" aria-hidden="true">
              <svg viewBox="0 0 6.6 1.7" className="w-72 max-w-[70%]">
                <PawnDefs />
                {COLORS.map((c, i) => (
                  <g key={c} transform={`translate(${0.9 + i * 1.6} 1.0) scale(1.45)`}>
                    <g className="bob" style={{ animationDelay: `${i * 0.35}s` }}>
                      <Pawn color={c} />
                    </g>
                  </g>
                ))}
              </svg>
              <DieCube size={64} idle />
            </div>

            {ctl.saved && (
              <div className="glass mt-8 flex flex-wrap items-center justify-between gap-3 p-4 text-left">
                <div>
                  <p className="font-bold">Game in progress</p>
                  <p className="text-sm text-muted">Pick up right where you left off.</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={ctl.resume}>
                    Resume
                  </button>
                  <button className="btn btn-secondary" onClick={ctl.discardSaved}>
                    Discard
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ---------- setup ---------- */}
          <form
            className="glass space-y-6 p-5 sm:p-7"
            onSubmit={(e) => {
              e.preventDefault()
              ctl.start({ humans, names, colors, randomColors: random })
            }}
          >
            <fieldset>
              <legend className="mb-3 text-lg font-extrabold">Who is playing?</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <label key={n}>
                    <input type="radio" name="humans" className="sr-only" checked={humans === n} onChange={() => setHumans(n)} />
                    <span className="tile">
                      <strong>{n}</strong>
                      <small>{SUB[n - 1]}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-4">
              <h2 className="text-lg font-extrabold">Players</h2>
              {Array.from({ length: humans }, (_, i) => (
                <div key={i} className="space-y-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-muted">Name, player {i + 1}</span>
                    <input className="field" value={names[i]} maxLength={16} onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))} />
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
                                className="block h-11 cursor-pointer rounded-xl transition-transform hover:-translate-y-0.5"
                                style={{ background: COLOR_HEX[c], boxShadow: selected ? '0 0 0 3px var(--surface), 0 0 0 6px var(--ink)' : 'none' }}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>
                  )}
                </div>
              ))}

              <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
                <span className="font-semibold">Randomize seat colors</span>
                <input type="checkbox" className="sr-only" checked={random} onChange={(e) => setRandom(e.target.checked)} />
                <span className="switch" aria-hidden="true" />
              </label>
            </div>

            {humans < 4 && (
              <fieldset>
                <legend className="mb-3 text-lg font-extrabold">Computer skill</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <label key={d}>
                      <input type="radio" name="difficulty" className="sr-only" checked={settings.difficulty === d} onChange={() => setSettings({ ...settings, difficulty: d })} />
                      <span className="seg capitalize">{d}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <button type="submit" className="cta">
              Start game
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {showSettings && <SettingsPanel settings={settings} reduced={ctl.reduced} onChange={setSettings} onClose={() => setShowSettings(false)} />}
    </main>
  )
}

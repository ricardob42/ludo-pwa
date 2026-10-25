import { useState } from 'react'
import { LAST_OUTER, piecesInGoal, type Move } from '../lib/ludo/rules'
import { COLORS } from '../lib/ludo/rules'
import { cap } from '../lib/ludo/setup'
import { COLOR_HEX, COLOR_INK } from '../lib/ludo/theme'
import type { Controller } from '../hooks/useGameController'
import { Board } from './Board'
import { Dice } from './Dice'
import { EndScreen } from './EndScreen'
import { ThemeToggle } from './ThemeToggle'
import { SettingsPanel } from './SettingsPanel'

function describeMove(m: Move): string {
  const dest = m.capture ? `, capture ${cap(m.capture.color)}` : m.kind === 'goal' ? ', reach home' : m.kind === 'lane' ? ', into the home column' : ''
  if (m.kind === 'exit') return `Pawn in the yard: leave the yard${dest}`
  const from = m.from > LAST_OUTER ? 'in the home column' : `${m.from} squares from start`
  return `Pawn ${from}: move ${m.to - m.from}${dest}`
}

export function GameScreen({ ctl, dark }: { ctl: Controller; dark: boolean }) {
  const { game, current, moves, busy, face, rolling, anim, log, settings } = ctl
  const [hover, setHover] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  if (!game || !current) return null

  const human = current.kind === 'human'
  const over = game.phase === 'over'
  const canMove = human && game.phase === 'move' && !busy && moves.length > 1
  const color = current.color

  const status = over
    ? 'Game over'
    : human
      ? game.phase === 'roll'
        ? `${current.name} is rolling…`
        : `${current.name}, drag a pawn to move ${game.roll}`
      : `${current.name} is playing…`

  const openSettings = () => {
    ctl.setPaused(true)
    setShowSettings(true)
  }
  const closeSettings = () => {
    setShowSettings(false)
    ctl.setPaused(false)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-3 p-2 lg:flex-row lg:items-start lg:p-4">
      <section className="flex-1" aria-label="Board">
        <header className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold text-brand">Ludo</h1>
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1 text-center font-bold"
            style={{ background: COLOR_HEX[color], color: COLOR_INK[color] }}
          >
            <span>{status}</span>
          </div>
          <ThemeToggle dark={dark} settings={settings} onChange={ctl.setSettings} />
          <button className="btn btn-secondary" onClick={openSettings} aria-label="Settings">
            ⚙
          </button>
        </header>
        <Board
          game={game}
          anim={anim}
          moves={canMove ? moves : []}
          highlight={hover}
          interactive={canMove}
          stepMs={ctl.stepMs}
          view={settings.view}
          thrown={ctl.thrown}
          rollMs={ctl.rollMs}
          onPick={(p) => void ctl.move(p)}
          onHover={setHover}
        />
      </section>

      <aside className="flex w-full flex-col gap-3 lg:w-80">
        <section className="card flex items-center gap-4" aria-label="Dice">
          <Dice value={face} rolling={rolling} />
          <div className="flex-1">
          </div>
        </section>

        {canMove && (
          <section className="card" aria-label="Legal moves">
            <h2 className="mb-1 font-bold">Legal moves</h2>
            <p className="mb-2 text-sm text-muted">Drag a glowing pawn onto its dashed circle, or pick a move below. Hover a move to see which pawn it is.</p>
            <ul className="space-y-2">
              {moves.map((m) => (
                <li key={m.piece}>
                  <button
                    className="btn btn-secondary w-full justify-start text-left"
                    onClick={() => void ctl.move(m.piece)}
                    onMouseEnter={() => setHover(m.piece)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(m.piece)}
                    onBlur={() => setHover(null)}
                  >
                    {describeMove(m)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" aria-label="Players">
          <h2 className="mb-2 font-bold">Players</h2>
          <ul className="space-y-1">
            {COLORS.map((c, i) => {
              const seat = game.seats[i]
              const rank = game.finished.indexOf(c)
              return (
                <li
                  key={c}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 font-semibold"
                  style={{ background: COLOR_HEX[c], color: COLOR_INK[c], outline: i === game.turn && !over ? '3px solid #111827' : 'none' }}
                  aria-current={i === game.turn && !over ? 'true' : undefined}
                >
                  <span className="flex-1 truncate">
                    {seat.name} {seat.kind === 'ai' ? '🤖' : ''}
                  </span>
                  <span>{rank >= 0 ? `#${rank + 1}` : `${piecesInGoal(game, c)}/4 home`}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card" aria-label="Game log">
          <h2 className="mb-2 font-bold">Log</h2>
          <ol className="max-h-40 space-y-1 overflow-y-auto text-sm" aria-live="polite" aria-relevant="additions">
            {log.slice(-8).reverse().map((l, i) => (
              <li key={`${log.length}-${i}`} className={i === 0 ? 'font-bold' : 'text-muted'}>
                {l}
              </li>
            ))}
          </ol>
        </section>

        <button
          className="btn btn-secondary"
          onClick={() => {
            if (over || window.confirm('Leave this game? It is saved and can be resumed from the menu.')) ctl.quit()
          }}
        >
          Menu
        </button>
      </aside>

      {over && <EndScreen game={game} onRematch={ctl.rematch} onNew={ctl.quit} />}
      {showSettings && <SettingsPanel settings={settings} reduced={ctl.reduced} onChange={ctl.setSettings} onClose={closeSettings} />}
    </main>
  )
}

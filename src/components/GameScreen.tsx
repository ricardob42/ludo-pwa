import { useState } from 'react'
import { COLORS, LAST_OUTER, piecesInGoal, uniqueMoves, type Move } from '../lib/ludo/rules'
import { COLOR_HEX, COLOR_INK } from '../lib/ludo/theme'
import { colorName, seatName, type T } from '../lib/i18n'
import { describeEvent, type LogEntry } from '../lib/ludo/log'
import { useT } from '../hooks/useLang'
import type { Controller } from '../hooks/useGameController'
import { Board } from './Board'
import { Dice } from './Dice'
import { EndScreen } from './EndScreen'
import { LangToggle } from './LangToggle'
import { PawnIcon } from './PieceShape'
import { SettingsPanel } from './SettingsPanel'
import { ThemeToggle } from './ThemeToggle'

function describeMove(m: Move, t: T): string {
  const dest = m.capture
    ? t('destCapture', { color: colorName(t, m.capture.color) })
    : m.kind === 'goal'
      ? t('destGoal')
      : m.kind === 'lane'
        ? t('destLane')
        : ''
  if (m.kind === 'exit') return t('mvExit', { dest })
  const from = m.from > LAST_OUTER ? t('fromLane') : t('fromTrack', { n: m.from })
  return t('mvMove', { from, n: m.to - m.from, dest })
}

const entryColor = (e: LogEntry) => ('color' in e ? e.color : null)
const ORD = ['ord1', 'ord2', 'ord3', 'ord4'] as const

export function GameScreen({ ctl, dark }: { ctl: Controller; dark: boolean }) {
  const t = useT()
  const { game, current, moves, busy, face, rolling, anim, log, settings } = ctl
  const [hover, setHover] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  if (!game || !current) return null

  const human = current.kind === 'human'
  const over = game.phase === 'over'
  const choices = uniqueMoves(moves) // identical options (e.g. four pawns in the yard) are shown once
  const canMove = human && game.phase === 'move' && !busy && choices.length > 1
  const color = current.color
  const who = seatName(current, t)

  const status = over
    ? t('gameOver')
    : human
      ? game.phase === 'roll'
        ? t('isRolling', { name: who })
        : t('dragPawn', { name: who, n: game.roll ?? '' })
      : t('isPlaying', { name: who })

  const openSettings = () => {
    ctl.setPaused(true)
    setShowSettings(true)
  }
  const closeSettings = () => {
    setShowSettings(false)
    ctl.setPaused(false)
  }

  return (
    <main className="hero-bg min-h-dvh">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-3 lg:p-5">
        {/* ---------- top bar ---------- */}
        <header className="topbar">
          <div className="order-1 flex items-center gap-2" aria-label="Ludo">
            <h1 className="text-2xl font-black tracking-tight">Ludo</h1>
            <span className="flex gap-1" aria-hidden="true">
              {COLORS.map((c) => (
                <span key={c} className="h-3 w-3 rounded-full" style={{ background: COLOR_HEX[c] }} />
              ))}
            </span>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="status-pill order-3 basis-full md:order-2 md:basis-0 md:flex-1"
            style={{ background: COLOR_HEX[color], color: COLOR_INK[color] }}
          >
            {!over && <PawnIcon color={color} size={24} />}
            <span>{status}</span>
          </div>
          <div className="order-2 ml-auto flex gap-2 md:order-3">
            <LangToggle settings={settings} onChange={ctl.setSettings} />
            <ThemeToggle dark={dark} settings={settings} onChange={ctl.setSettings} />
            <button className="icon-btn" onClick={openSettings} aria-label={t('settings')} title={t('settings')}>
              ⚙
            </button>
            <button
              className="icon-btn"
              aria-label={t('menu')}
              title={t('menu')}
              onClick={() => {
                if (over || window.confirm(t('leaveConfirm'))) ctl.quit()
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <section className="min-w-0 flex-1" aria-label={t('board')}>
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

          <aside className="flex w-full flex-col gap-4 lg:w-[22rem]">
            {/* ---------- turn + dice ---------- */}
            <section className="glass flex items-center gap-4 p-4" aria-label={t('dice')}>
              <div className="flex flex-col items-center gap-1">
                <Dice value={face} rolling={rolling} />
                <span className="text-xs font-semibold text-muted">{t('lastRoll')}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="panel-title !mb-1">{t('turn')}</p>
                <div className="flex items-center gap-2">
                  <PawnIcon color={color} size={30} />
                  <p className="truncate text-xl font-extrabold">{who}</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-muted">{colorName(t, color)}</p>
              </div>
            </section>

            {/* ---------- choices (only when there is a real choice) ---------- */}
            {canMove && (
              <section className="glass p-4" aria-label={t('legalMoves')}>
                <h2 className="panel-title">{t('legalMoves')}</h2>
                <p className="mb-3 text-sm text-muted">{t('legalHelp')}</p>
                <ul className="space-y-2">
                  {choices.map((m) => (
                    <li key={m.piece}>
                      <button
                        className="move-btn"
                        onClick={() => void ctl.move(m.piece)}
                        onMouseEnter={() => setHover(m.piece)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(m.piece)}
                        onBlur={() => setHover(null)}
                      >
                        <PawnIcon color={color} size={26} />
                        <span className="min-w-0 flex-1">{describeMove(m, t)}</span>
                        {m.capture && (
                          <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
                            {t('tagCapture')}
                          </span>
                        )}
                        {m.kind === 'goal' && (
                          <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                            {t('tagHome')}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ---------- players ---------- */}
            <section className="glass p-4" aria-label={t('playersTitle')}>
              <h2 className="panel-title">{t('playersTitle')}</h2>
              <ul className="space-y-2">
                {COLORS.map((c, i) => {
                  const seat = game.seats[i]
                  const rank = game.finished.indexOf(c)
                  const home = piecesInGoal(game, c)
                  const active = i === game.turn && !over
                  return (
                    <li
                      key={c}
                      className="player-row"
                      aria-current={active ? 'true' : undefined}
                      style={{ ['--ring' as string]: COLOR_HEX[c] }}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: COLOR_HEX[c] }}>
                        <PawnIcon color={c} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-bold">{seatName(seat, t)}</span>
                          {seat.kind === 'ai' && <span className="badge" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>{t('cpu')}</span>}
                        </span>
                        <span className="mt-1 flex items-center gap-1" role="img" aria-label={t('homeCount', { n: home })}>
                          {[0, 1, 2, 3].map((k) => (
                            <span key={k} className="pip" style={k < home ? { background: COLOR_HEX[c] } : undefined} />
                          ))}
                        </span>
                      </span>
                      {rank >= 0 ? (
                        <span className="badge" style={{ background: COLOR_HEX[c], color: COLOR_INK[c] }}>
                          {t(ORD[rank])}
                        </span>
                      ) : (
                        active && (
                          <span className="badge" style={{ background: COLOR_HEX[c], color: COLOR_INK[c] }}>
                            {t('turnBadge')}
                          </span>
                        )
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* ---------- log ---------- */}
            <section className="glass p-4" aria-label={t('logTitle')}>
              <h2 className="panel-title">{t('logTitle')}</h2>
              <ol className="max-h-48 space-y-2 overflow-y-auto text-sm" aria-live="polite" aria-relevant="additions">
                {log
                  .slice(-8)
                  .reverse()
                  .map((entry, i) => {
                    const c = entryColor(entry)
                    return (
                      <li key={`${log.length}-${i}`} className="flex gap-2" style={{ opacity: Math.max(0.45, 1 - i * 0.1) }}>
                        <span className="log-dot" style={{ background: c ? COLOR_HEX[c] : 'var(--field-line)' }} aria-hidden="true" />
                        <span className={i === 0 ? 'font-bold' : ''}>{describeEvent(entry, game.seats, t)}</span>
                      </li>
                    )
                  })}
              </ol>
            </section>
          </aside>
        </div>
      </div>

      {over && <EndScreen game={game} onRematch={ctl.rematch} onNew={ctl.quit} />}
      {showSettings && <SettingsPanel settings={settings} reduced={ctl.reduced} onChange={ctl.setSettings} onClose={closeSettings} />}
    </main>
  )
}

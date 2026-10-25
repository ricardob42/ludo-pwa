import { COLORS, type GameState } from '../lib/ludo/rules'
import { COLOR_HEX, COLOR_INK } from '../lib/ludo/theme'
import { colorName, seatName } from '../lib/i18n'
import { useT } from '../hooks/useLang'
import { PawnIcon } from './PieceShape'

const MEDAL = ['#f5c518', '#cbd5e1', '#d08a4b', '#94a3b8']
const ORD = ['ord1', 'ord2', 'ord3', 'ord4'] as const

function Trophy() {
  return (
    <svg viewBox="-2 -2 4 4.2" width="96" height="100" aria-hidden="true" className="mx-auto drop-shadow-lg">
      <defs>
        <linearGradient id="gold" x1="0" x2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f5c518" />
          <stop offset="1" stopColor="#b7791f" />
        </linearGradient>
      </defs>
      <path d="M-1.5 -1.1 h3 v1 a1.5 1.5 0 0 1 -3 0 z" fill="url(#gold)" stroke="#8a5a0b" strokeWidth="0.06" />
      <path d="M-1.5 -0.8 q-0.9 0 -0.9 0.7 q0 0.8 1 0.9 M1.5 -0.8 q0.9 0 0.9 0.7 q0 0.8 -1 0.9" fill="none" stroke="#d99a16" strokeWidth="0.2" strokeLinecap="round" />
      <rect x="-0.2" y="1.2" width="0.4" height="0.55" fill="url(#gold)" />
      <rect x="-0.85" y="1.7" width="1.7" height="0.35" rx="0.1" fill="url(#gold)" stroke="#8a5a0b" strokeWidth="0.05" />
      <path d="M0 -0.55 l0.2 0.45 0.5 0.05 -0.38 0.33 0.12 0.5 -0.44 -0.27 -0.44 0.27 0.12 -0.5 -0.38 -0.33 0.5 -0.05z" fill="#fff7d1" opacity="0.9" />
    </svg>
  )
}

export function EndScreen({ game, onRematch, onNew }: { game: GameState; onRematch: () => void; onNew: () => void }) {
  const t = useT()
  const winner = game.seats.find((s) => s.color === game.finished[0])
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="end-title" className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black/55 p-4 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="confetti"
            style={{ left: `${(i * 37) % 100}%`, background: COLOR_HEX[COLORS[i % 4]], animationDelay: `${(i % 9) * 0.35}s`, animationDuration: `${2.6 + (i % 5) * 0.4}s` }}
          />
        ))}
      </div>
      <div className="glass relative w-full max-w-md space-y-5 p-6 text-center">
        <Trophy />
        <div>
          <p className="panel-title !mb-1">{t('champion')}</p>
          <h2 id="end-title" className="text-3xl font-black tracking-tight">
            {t('wins', { name: winner ? seatName(winner, t) : '' })}
          </h2>
        </div>
        <ol className="space-y-2 text-left">
          {game.finished.map((c, i) => {
            const seat = game.seats.find((s) => s.color === c)!
            return (
              <li key={c} className="player-row" style={{ ['--ring' as string]: COLOR_HEX[c] }} aria-current={i === 0 ? 'true' : undefined}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black text-gray-900" style={{ background: MEDAL[i] }}>
                  {t(ORD[i])}
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: COLOR_HEX[c] }}>
                  <PawnIcon color={c} size={18} />
                </span>
                <span className="min-w-0 flex-1 truncate font-bold">{seatName(seat, t)}</span>
                <span className="badge" style={{ background: COLOR_HEX[c], color: COLOR_INK[c] }}>
                  {colorName(t, c)}
                </span>
              </li>
            )
          })}
        </ol>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="cta !min-h-12 !text-base sm:flex-1" onClick={onRematch} autoFocus>
            {t('rematch')}
          </button>
          <button className="btn btn-secondary sm:flex-1" onClick={onNew}>
            {t('newGame')}
          </button>
        </div>
      </div>
    </div>
  )
}

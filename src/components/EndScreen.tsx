import type { GameState } from '../lib/ludo/rules'
import { COLOR_HEX, COLOR_INK, COLOR_SHAPE, SHAPE_GLYPH } from '../lib/ludo/theme'
import { cap } from '../lib/ludo/setup'

const place = ['1st', '2nd', '3rd', '4th']

export function EndScreen({ game, onRematch, onNew }: { game: GameState; onRematch: () => void; onNew: () => void }) {
  const winner = game.seats.find((s) => s.color === game.finished[0])
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="end-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-md space-y-4 text-center">
        <h2 id="end-title" className="text-3xl font-extrabold">
          {winner?.name} wins! 🎉
        </h2>
        <ol className="space-y-2 text-left">
          {game.finished.map((c, i) => {
            const seat = game.seats.find((s) => s.color === c)!
            return (
              <li key={c} className="flex items-center gap-3 rounded-lg p-2 font-semibold" style={{ background: COLOR_HEX[c], color: COLOR_INK[c] }}>
                <span className="w-10">{place[i]}</span>
                <span aria-hidden="true">{SHAPE_GLYPH[COLOR_SHAPE[c]]}</span>
                <span>
                  {seat.name} ({cap(c)})
                </span>
              </li>
            )
          })}
        </ol>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn flex-1" onClick={onRematch} autoFocus>
            Rematch
          </button>
          <button className="btn btn-secondary flex-1" onClick={onNew}>
            New game
          </button>
        </div>
      </div>
    </div>
  )
}

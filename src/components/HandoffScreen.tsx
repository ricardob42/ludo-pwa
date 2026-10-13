import { useEffect, useRef } from 'react'
import type { Seat } from '../lib/ludo/rules'
import { COLOR_HEX, COLOR_INK, COLOR_SHAPE, SHAPE_GLYPH } from '../lib/ludo/theme'

/** Covers the board so the previous player's dice and pieces are hidden until the next player taps Ready. */
export function HandoffScreen({ seat, onReady }: { seat: Seat; onReady: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="handoff-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center"
      style={{ background: COLOR_HEX[seat.color], color: COLOR_INK[seat.color] }}
    >
      <p className="text-6xl" aria-hidden="true">
        {SHAPE_GLYPH[COLOR_SHAPE[seat.color]]}
      </p>
      <h2 id="handoff-title" className="text-3xl font-extrabold">
        Pass the device to {seat.name}
      </h2>
      <p className="text-lg">You play {seat.color}. Make sure nobody else needs to see the screen.</p>
      <button ref={ref} className="btn !bg-white text-lg !text-blue-900 hover:!bg-blue-50" onClick={onReady}>
        Ready
      </button>
    </div>
  )
}

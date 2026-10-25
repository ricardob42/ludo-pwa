import { useEffect, useState, type CSSProperties } from 'react'
import type { Color } from '../lib/ludo/rules'

const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
  6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
}
// Opposite faces add up to 7.
const FACES: { v: number; t: string }[] = [
  { v: 1, t: 'translateZ(var(--h))' },
  { v: 6, t: 'rotateY(180deg) translateZ(var(--h))' },
  { v: 2, t: 'rotateY(90deg) translateZ(var(--h))' },
  { v: 5, t: 'rotateY(-90deg) translateZ(var(--h))' },
  { v: 3, t: 'rotateX(90deg) translateZ(var(--h))' },
  { v: 4, t: 'rotateX(-90deg) translateZ(var(--h))' },
]
// Cube rotation that brings face v to the front.
const ORIENT: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
}

/** A real 3D cube. When `value` is given it tumbles and settles with that face toward the player. */
export function DieCube({ size, value = 1, settleMs = 1000, idle = false }: { size: number; value?: number; settleMs?: number; idle?: boolean }) {
  const [t, setT] = useState('rotateX(-40deg) rotateY(30deg)')
  useEffect(() => {
    if (idle) return
    const o = ORIENT[value]
    const sx = 2 + Math.floor(Math.random() * 2)
    const sy = 2 + Math.floor(Math.random() * 2)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setT(`rotateX(${o.x + 360 * sx}deg) rotateY(${o.y + 360 * sy}deg)`)))
    return () => cancelAnimationFrame(id)
  }, [value, idle])

  const cube: CSSProperties = idle
    ? ({ '--h': `${size / 2}px` } as CSSProperties)
    : ({ '--h': `${size / 2}px`, transform: t, transition: `transform ${settleMs}ms cubic-bezier(.12,.7,.2,1)` } as CSSProperties)

  return (
    <div className="die-scene" style={{ width: size, height: size, perspective: size * 5 }} aria-hidden="true">
      <div className="die-tilt" style={{ transform: 'rotateX(-22deg) rotateY(-28deg)' }}>
        <div className={idle ? 'die-cube die-idle' : 'die-cube'} style={cube}>
          {FACES.map((f) => (
            <div key={f.v} className="die-face" style={{ transform: f.t }}>
              <svg viewBox="0 0 4 4" width="100%" height="100%">
                {PIPS[f.v].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={0.3} fill="#111827" />
                ))}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export interface Thrown {
  id: number
  value: number
  color: Color
}
const FROM: Record<Color, { x: number; y: number }> = {
  yellow: { x: 0, y: 1 },
  blue: { x: -1, y: 0 },
  red: { x: 0, y: -1 },
  green: { x: 1, y: 0 },
}

/** The die is thrown in from the rolling player's side of the table, bounces and settles on the board. */
export function DiceThrow({ thrown, width, rollMs }: { thrown: Thrown; width: number; rollMs: number }) {
  const size = Math.max(44, Math.round(width * 0.12))
  const dir = FROM[thrown.color]
  const vars = {
    width: size,
    height: size,
    marginLeft: -size / 2,
    marginTop: -size / 2,
    '--sx': `${dir.x * width * 0.8}px`,
    '--sy': `${dir.y * width * 0.8}px`,
    '--bx': `${(dir.y !== 0 ? -dir.y : dir.x) * size * 0.45}px`,
    '--by': `${-size * 0.9}px`,
    animation: `dice-throw ${rollMs}ms cubic-bezier(.25,.55,.45,1) both, dice-fade 450ms ${rollMs + 800}ms forwards`,
  } as CSSProperties
  return (
    <div key={thrown.id} className="pointer-events-none absolute left-1/2 top-1/2 z-20" style={vars}>
      <DieCube size={size} value={thrown.value} settleMs={rollMs} />
    </div>
  )
}

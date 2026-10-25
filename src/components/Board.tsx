import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  BASE,
  COLORS,
  GOAL,
  LAST_OUTER,
  isDouble,
  isSafeSquare,
  squareKey,
  type Color,
  type GameState,
  type Move,
} from '../lib/ludo/rules'
import { GRID, TRACK_PTS, baseCentre, baseRect, baseSlots, centreTriangle, lanePt, piecePoint, type Pt } from '../lib/ludo/geometry'
import { COLOR_DEEP, COLOR_HEX, COLOR_INK } from '../lib/ludo/theme'
import { cap } from '../lib/ludo/setup'
import { VIEW_3D, VIEW_FLAT, localScale, projectBoardPoint, unprojectScreenPoint } from '../lib/ludo/view'
import { Pawn, PawnDefs } from './PieceShape'
import { DiceThrow, type Thrown } from './Die3D'
import type { Anim } from '../hooks/useGameController'

interface Props {
  game: GameState
  anim: Anim | null
  moves: Move[]
  highlight: number | null
  interactive: boolean
  stepMs: number
  view: '3d' | 'flat'
  thrown: Thrown | null
  rollMs: number
  onPick: (piece: number) => void
  onHover: (piece: number | null) => void
}

interface Drawn {
  color: Color
  piece: number
  p: number
  pt: Pt
  moving: boolean
}

const DROP_RADIUS = 1.1 // how close (in board cells) a dropped pawn must be to its target

// ---- shape helpers, all in board units (0..15) ----
const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
]
const circPts = (cx: number, cy: number, r: number, n = 32): Pt[] =>
  Array.from({ length: n }, (_, i) => ({ x: cx + r * Math.cos((i / n) * 2 * Math.PI), y: cy + r * Math.sin((i / n) * 2 * Math.PI) }))
function roundRectPts(x: number, y: number, w: number, h: number, r: number, seg = 6): Pt[] {
  const out: Pt[] = []
  const corners: [number, number, number][] = [
    [x + w - r, y + r, -90],
    [x + w - r, y + h - r, 0],
    [x + r, y + h - r, 90],
    [x + r, y + r, 180],
  ]
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= seg; i++) {
      const a = ((a0 + (i / seg) * 90) * Math.PI) / 180
      out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
    }
  return out
}
function starPts(cx: number, cy: number, r: number): Pt[] {
  return Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? r : r * 0.45
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) }
  })
}

const cellStyle = { fill: 'var(--cell)', stroke: 'var(--cell-line)' }
const FRAME = 0.55

export function Board({ game, anim, moves, highlight, interactive, stepMs, view, thrown, rollMs, onPick, onHover }: Props) {
  const rules = game.rules
  const turnColor = COLORS[game.turn]
  const svgRef = useRef<SVGSVGElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(400)
  const [drag, setDrag] = useState<{ piece: number; pt: Pt } | null>(null)
  const is3d = view === '3d'
  const vb = is3d ? VIEW_3D : VIEW_FLAT

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.getBoundingClientRect().width || 400))
    ro.observe(el)
    setW(el.getBoundingClientRect().width || 400)
    return () => ro.disconnect()
  }, [])

  // Board point -> SVG point. In 3D the perspective is baked into the coordinates (plain vector drawing).
  const proj = (p: Pt): Pt => (is3d ? projectBoardPoint(p, GRID) : { x: p.x - GRID / 2, y: p.y - GRID / 2 })
  const pts = (ps: Pt[]): string => ps.map((p) => proj(p)).map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(' ')
  const scaleAt = (p: Pt): number => (is3d ? localScale(p.y) : 1)
  /** CSS transform that stands a pawn-sized object on board point `p`. */
  const stand = (p: Pt, extra = 1): string => {
    const q = proj(p)
    return `translate(${q.x}px, ${q.y}px) scale(${scaleAt(p) * extra})`
  }
  const lift = is3d ? 'translate(0 -0.3)' : undefined // in 3D the pawn's foot sits on the square

  const drawn = useMemo(() => {
    const list: Drawn[] = []
    const groups = new Map<string, Drawn[]>()
    for (const color of COLORS) {
      game.pieces[color].forEach((real, piece) => {
        const moving = !!anim && anim.color === color && anim.piece === piece
        const p = moving ? anim!.p : real
        const d: Drawn = { color, piece, p, pt: piecePoint(color, p, piece, rules), moving }
        list.push(d)
        const key = squareKey(color, p, rules)
        if (key) groups.set(key, [...(groups.get(key) ?? []), d])
      })
    }
    // Pawns sharing a square are drawn side by side.
    for (const g of groups.values()) {
      if (g.length < 2) continue
      const spread = Math.min(0.3, 0.9 / (g.length - 1))
      g.forEach((d, i) => (d.pt = { x: d.pt.x + (i - (g.length - 1) / 2) * spread * 1.4, y: d.pt.y }))
    }
    // Farther pawns first (so nearer ones overlap them); the moving pawn is always on top.
    return list.sort((a, b) => Number(a.moving) - Number(b.moving) || a.pt.y - b.pt.y)
  }, [game.pieces, anim, rules])

  const doubleCells = useMemo(() => {
    const occ = new Map<string, { color: Color; piece: number; p: number }[]>()
    for (const c of COLORS)
      game.pieces[c].forEach((p, piece) => {
        const k = squareKey(c, p, rules)
        if (k) occ.set(k, [...(occ.get(k) ?? []), { color: c, piece, p }])
      })
    const out: Pt[] = []
    for (const list of occ.values()) {
      const first = list[0]
      if (isDouble(list) && first.p <= LAST_OUTER) out.push(piecePoint(first.color, first.p, first.piece, rules))
    }
    return out
  }, [game.pieces, rules])

  const targets = moves.map((m) => ({ m, pt: piecePoint(turnColor, m.to, m.piece, rules) }))
  const legalPieces = new Set(moves.map((m) => m.piece))

  /** Pointer position -> board units. */
  const toBoard = (e: PointerEvent): Pt => {
    const m = svgRef.current?.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return is3d ? unprojectScreenPoint({ x: p.x, y: p.y }, GRID) : { x: p.x + GRID / 2, y: p.y + GRID / 2 }
  }
  const startDrag = (e: PointerEvent, piece: number) => {
    e.preventDefault()
    svgRef.current?.setPointerCapture(e.pointerId)
    setDrag({ piece, pt: toBoard(e) })
    onHover(piece)
  }
  const moveDrag = (e: PointerEvent) => {
    if (drag) setDrag({ piece: drag.piece, pt: toBoard(e) })
  }
  const endDrag = (drop: boolean) => {
    if (drag && drop) {
      const t = targets.find((x) => x.m.piece === drag.piece)
      if (t && Math.hypot(t.pt.x - drag.pt.x, t.pt.y - drag.pt.y) <= DROP_RADIUS) onPick(drag.piece)
    }
    setDrag(null)
    onHover(null)
  }

  const label = (d: Drawn) => {
    const where =
      d.p === BASE ? 'in the yard' : d.p === GOAL ? 'at home' : d.p > LAST_OUTER ? 'in the home column' : `${d.p} squares from its start`
    return `${cap(d.color)} pawn ${d.piece + 1}, ${where}`
  }

  const seatTag = (c: Color) => (
    <div key={c} className="min-w-0 truncate rounded-lg px-2 py-1 text-center text-base font-extrabold shadow" style={{ background: COLOR_HEX[c], color: COLOR_INK[c] }}>
      {game.seats[COLORS.indexOf(c)].name}
    </div>
  )
  const topSeats: Color[] = ['blue', 'red']
  const bottomSeats: Color[] = ['yellow', 'green']

  const frameOuter = roundRectPts(-FRAME, -FRAME, GRID + 2 * FRAME, GRID + 2 * FRAME, 0.8)
  const boardEdge = roundRectPts(0, 0, GRID, GRID, 0.25)
  const slabLayers = [6, 5, 4, 3, 2, 1].map((k) => k)
  const slabShade = ['#2b1a09', '#33200c', '#3d260f', '#472d12', '#523416', '#5b3a1a']
  const slabStep = is3d ? 0.085 : 0.05

  return (
    <div className="scene mx-auto w-full max-w-[min(100%,96dvh)]">
      <div className="mb-2 grid grid-cols-2 gap-2">{topSeats.map(seatTag)}</div>
      <div ref={stageRef} className="relative w-full" style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          role="group"
          aria-label="Ludo board"
          className="block h-full w-full select-none"
          style={{ touchAction: interactive ? 'none' : 'manipulation', overflow: 'visible' }}
          onPointerMove={moveDrag}
          onPointerUp={() => endDrag(true)}
          onPointerCancel={() => endDrag(false)}
        >
          <PawnDefs />
          <defs>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
              <feGaussianBlur stdDeviation="0.35" />
            </filter>
          </defs>

          {/* table shadow, wooden slab edge, frame and playing surface */}
          <polygon points={pts(frameOuter.map((p) => ({ x: p.x + 0.2, y: p.y + 0.9 })))} fill="rgba(0,0,0,0.38)" filter="url(#soft-shadow)" />
          {slabLayers.map((k, i) => (
            <polygon key={k} points={pts(frameOuter)} transform={`translate(0 ${(k * slabStep).toFixed(3)})`} fill={slabShade[i]} />
          ))}
          <polygon points={pts(frameOuter)} fill="#8b5a2b" stroke="#5b3a1a" strokeWidth={0.06} />
          <polygon points={pts(boardEdge)} style={{ fill: 'var(--board-bg)' }} />

          {/* corner yards */}
          {COLORS.map((c) => {
            const r = baseRect(c)
            const ctr = baseCentre(c)
            return (
              <g key={`base-${c}`}>
                <polygon points={pts(roundRectPts(r.x + 0.1, r.y + 0.1, r.w - 0.2, r.h - 0.2, 0.5))} fill={COLOR_HEX[c]} stroke={COLOR_DEEP[c]} strokeWidth={0.12} />
                <polygon points={pts(circPts(ctr.x, ctr.y, 2.45, 48))} fill={COLOR_DEEP[c]} opacity={0.85} />
                {baseSlots(c).map((s, i) => (
                  <polygon key={i} points={pts(circPts(s.x, s.y, 0.6, 24))} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth={0.06} />
                ))}
              </g>
            )
          })}

          {/* outer track */}
          {TRACK_PTS.map((pt, i) => {
            const startOf = COLORS.find((c) => rules.entrySquares[c] === i)
            const safe = isSafeSquare(i, rules)
            return (
              <g key={`t${i}`}>
                <polygon points={pts(rectPts(pt.x - 0.5, pt.y - 0.5, 1, 1))} style={startOf ? { fill: COLOR_HEX[startOf], stroke: 'var(--cell-line)' } : cellStyle} strokeWidth={0.05} />
                {safe && <polygon points={pts(starPts(pt.x, pt.y, 0.38))} style={{ fill: startOf ? COLOR_INK[startOf] : 'var(--star)' }} aria-hidden="true" />}
              </g>
            )
          })}

          {/* home columns */}
          {COLORS.map((c) =>
            Array.from({ length: 5 }, (_, i) => {
              const pt = lanePt(c, 51 + i)
              return <polygon key={`l${c}${i}`} points={pts(rectPts(pt.x - 0.5, pt.y - 0.5, 1, 1))} fill={COLOR_HEX[c]} stroke="var(--cell-line)" strokeWidth={0.05} />
            }),
          )}

          {/* centre home triangles */}
          {COLORS.map((c) => (
            <polygon key={`c${c}`} points={pts(centreTriangle(c))} fill={COLOR_HEX[c]} stroke="var(--cell-line)" strokeWidth={0.06} />
          ))}

          {doubleCells.map((pt, i) => (
            <polygon key={`d${i}`} points={pts(circPts(pt.x, pt.y, 0.62, 28))} fill="none" stroke="var(--ink)" strokeWidth={0.09} strokeDasharray="0.18 0.12" aria-hidden="true" />
          ))}

          {/* legal destinations: dashed circles; the active pawn also gets a path line and a ghost pawn */}
          {interactive &&
            targets.map(({ m, pt }) => {
              const active = (drag?.piece ?? highlight) === m.piece
              const near = drag?.piece === m.piece && Math.hypot(pt.x - drag.pt.x, pt.y - drag.pt.y) <= DROP_RADIUS
              const from = piecePoint(turnColor, m.from, m.piece, rules)
              const a = proj(from)
              const b = proj(pt)
              const r = near ? 0.72 : active ? 0.62 : 0.48
              return (
                <g key={`tg${m.piece}`} pointerEvents="none" aria-hidden="true">
                  {active && (
                    <>
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={0.22} strokeLinecap="round" opacity={0.8} />
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#111827" strokeWidth={0.1} strokeLinecap="round" strokeDasharray="0.25 0.18" />
                    </>
                  )}
                  <polygon
                    className={active ? undefined : 'target'}
                    points={pts(circPts(pt.x, pt.y, r, 28))}
                    fill={near ? 'rgba(255,255,255,0.75)' : active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}
                    stroke="#111827"
                    strokeWidth={active ? 0.14 : 0.09}
                    strokeDasharray="0.2 0.12"
                  />
                  {m.capture && (
                    <path d={`M ${b.x - 0.2} ${b.y - 0.2} L ${b.x + 0.2} ${b.y + 0.2} M ${b.x + 0.2} ${b.y - 0.2} L ${b.x - 0.2} ${b.y + 0.2}`} stroke="#991b1b" strokeWidth={0.12} strokeLinecap="round" />
                  )}
                  {active && (
                    <g style={{ transform: stand(pt, 0.95) }} opacity={0.55}>
                      <g transform={lift}>
                        <Pawn color={turnColor} />
                      </g>
                    </g>
                  )}
                </g>
              )
            })}

          {/* pawns */}
          {drawn.map((d) => {
            const canPick = interactive && d.color === turnColor && legalPieces.has(d.piece) && !d.moving
            const dragging = canPick && drag?.piece === d.piece
            const active = canPick && (drag?.piece ?? highlight) === d.piece
            const at = dragging ? drag!.pt : d.pt
            const extra = dragging ? 1.2 : d.p === GOAL ? 0.55 : d.p === BASE ? 1.05 : 0.95
            return (
              <g
                key={`${d.color}${d.piece}`}
                style={{
                  transform: stand(at, extra),
                  transition: stepMs > 0 && !dragging ? `transform ${Math.max(stepMs - 20, 40)}ms linear` : 'none',
                }}
              >
                <g
                  className={canPick ? 'piece-g' : undefined}
                  style={canPick ? { cursor: dragging ? 'grabbing' : 'grab' } : undefined}
                  role={canPick ? 'button' : undefined}
                  tabIndex={canPick ? 0 : undefined}
                  aria-label={canPick ? `${label(d)}. Press Enter to move it, or drag it.` : undefined}
                  aria-hidden={canPick ? undefined : true}
                  onPointerDown={canPick ? (e) => startDrag(e, d.piece) : undefined}
                  onKeyDown={
                    canPick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onPick(d.piece)
                          }
                        }
                      : undefined
                  }
                  onMouseEnter={canPick ? () => onHover(d.piece) : undefined}
                  onMouseLeave={canPick && !drag ? () => onHover(null) : undefined}
                  onFocus={canPick ? () => onHover(d.piece) : undefined}
                  onBlur={canPick ? () => onHover(null) : undefined}
                >
                  <g transform={lift}>
                    {/* generous invisible hit area */}
                    <circle r={0.8} fill="transparent" />
                    {canPick && !active && <ellipse className="halo" cy={0.1} rx={0.52} ry={0.7} fill="none" stroke="#f59e0b" strokeWidth={0.1} />}
                    {active && (
                      <>
                        <ellipse cy={0.1} rx={0.56} ry={0.74} fill="none" stroke="#111827" strokeWidth={0.2} />
                        <ellipse cy={0.1} rx={0.56} ry={0.74} fill="none" stroke="#fff" strokeWidth={0.1} />
                      </>
                    )}
                    {d.moving && <ellipse cy={0.1} rx={0.56} ry={0.74} fill="none" stroke="#fff" strokeWidth={0.1} />}
                    <Pawn color={d.color} />
                  </g>
                </g>
              </g>
            )
          })}
        </svg>
        {thrown && rollMs > 0 && (
          <div className="pointer-events-none absolute left-0 w-full" style={{ top: `${(-vb.y / vb.h) * 100}%`, height: 0 }}>
            <DiceThrow thrown={thrown} width={W} rollMs={rollMs} />
          </div>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">{bottomSeats.map(seatTag)}</div>
    </div>
  )
}

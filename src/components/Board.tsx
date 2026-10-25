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
import {
  GRID,
  TRACK_PTS,
  baseCentre,
  baseRect,
  baseSlots,
  centreTriangle,
  lanePt,
  piecePoint,
  type Pt,
} from '../lib/ludo/geometry'
import { COLOR_DEEP, COLOR_HEX, COLOR_INK } from '../lib/ludo/theme'
import { cap } from '../lib/ludo/setup'
import { Pawn, PawnDefs } from './PieceShape'
import { DiceThrow, type Thrown } from './Die3D'
import { PERSPECTIVE, STAGE_RATIO, TILT_DEG, TILT_SCALE, UPRIGHT, unprojectScreenPoint } from '../lib/ludo/view'

/** Five-point star path centred on (cx, cy). Drawn as a shape so it never depends on a font. */
function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(3)},${(cy + rad * Math.sin(a)).toFixed(3)}`)
  }
  return pts.join(' ')
}
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

const cell = { fill: 'var(--cell)', stroke: 'var(--cell-line)' }

export function Board({ game, anim, moves, highlight, interactive, stepMs, view, thrown, rollMs, onPick, onHover }: Props) {
  const rules = game.rules
  const turnColor = COLORS[game.turn]
  const svgRef = useRef<SVGSVGElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(400)
  const is3d = view === '3d'
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.getBoundingClientRect().width || 400))
    ro.observe(el)
    setW(el.getBoundingClientRect().width || 400)
    return () => ro.disconnect()
  }, [])
  // Pawns stand upright: undo the foreshortening of the tilted board plane.
  const stand = is3d ? `translate(0 0.44) scale(1 ${UPRIGHT.toFixed(3)}) translate(0 -0.44)` : undefined
  const [drag, setDrag] = useState<{ piece: number; pt: Pt } | null>(null)

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
    // Lower pawns are drawn on top; the moving pawn is always on top.
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

  const toBoard = (e: PointerEvent): Pt => {
    if (is3d && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect()
      return unprojectScreenPoint({ x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) }, r.width)
    }
    const m = svgRef.current?.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
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

  const targets = moves.map((m) => ({ m, pt: piecePoint(turnColor, m.to, m.piece, rules) }))
  const legalPieces = new Set(moves.map((m) => m.piece))

  const label = (d: Drawn) => {
    const where =
      d.p === BASE ? 'in the yard' : d.p === GOAL ? 'at home' : d.p > LAST_OUTER ? 'in the home column' : `${d.p} squares from its start`
    return `${cap(d.color)} pawn ${d.piece + 1}, ${where}`
  }

  const seatTag = (c: Color) => (
    <div
      key={c}
      className="min-w-0 truncate rounded-lg px-2 py-1 text-center text-base font-extrabold shadow"
      style={{ background: COLOR_HEX[c], color: COLOR_INK[c] }}
    >
      {game.seats[COLORS.indexOf(c)].name}
    </div>
  )
  const topSeats: Color[] = ['blue', 'red']
  const bottomSeats: Color[] = ['yellow', 'green']

  return (
    <div className="scene mx-auto w-full max-w-[min(100%,96dvh)]">
      <div className="mb-2 grid grid-cols-2 gap-2">{topSeats.map(seatTag)}</div>
      <div
        ref={stageRef}
        className="relative"
        style={is3d ? { height: W * STAGE_RATIO, perspective: W * PERSPECTIVE } : { aspectRatio: '1 / 1' }}
      >
        <div
          style={
            is3d
              ? { position: 'absolute', left: 0, top: '50%', width: '100%', aspectRatio: '1 / 1', marginTop: '-50%', transform: `scale(${TILT_SCALE}) rotateX(${TILT_DEG}deg)`, transformOrigin: '50% 50%' }
              : { width: '100%', height: '100%' }
          }
        >
    <svg
      ref={svgRef}
      viewBox={`0 0 ${GRID} ${GRID}`}
      role="group"
      aria-label="Ludo board"
      className="board-slab block h-full w-full select-none rounded-2xl"
      style={{ touchAction: interactive ? 'none' : 'manipulation' }}
      onPointerMove={moveDrag}
      onPointerUp={() => endDrag(true)}
      onPointerCancel={() => endDrag(false)}
    >
      <PawnDefs />
      <rect width={GRID} height={GRID} style={{ fill: 'var(--board-bg)' }} />

      {/* corner yards */}
      {COLORS.map((c) => {
        const r = baseRect(c)
        const ctr = baseCentre(c)
        return (
          <g key={`base-${c}`}>
            <rect x={r.x + 0.1} y={r.y + 0.1} width={r.w - 0.2} height={r.h - 0.2} rx={0.5} fill={COLOR_HEX[c]} stroke={COLOR_DEEP[c]} strokeWidth={0.12} />
            <circle cx={ctr.x} cy={ctr.y} r={2.45} fill={COLOR_DEEP[c]} opacity={0.85} />
            {baseSlots(c).map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={0.6} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth={0.06} />
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
            <rect
              x={pt.x - 0.5}
              y={pt.y - 0.5}
              width={1}
              height={1}
              style={startOf ? { fill: COLOR_HEX[startOf], stroke: 'var(--cell-line)' } : cell}
              strokeWidth={0.05}
            />
            {safe && (
              <polygon points={starPoints(pt.x, pt.y, 0.38)} style={{ fill: startOf ? COLOR_INK[startOf] : 'var(--star)' }} aria-hidden="true" />
            )}
          </g>
        )
      })}

      {/* home columns */}
      {COLORS.map((c) =>
        Array.from({ length: 5 }, (_, i) => {
          const pt = lanePt(c, 51 + i)
          return <rect key={`l${c}${i}`} x={pt.x - 0.5} y={pt.y - 0.5} width={1} height={1} fill={COLOR_HEX[c]} stroke="var(--cell-line)" strokeWidth={0.05} />
        }),
      )}

      {/* centre home triangles */}
      {COLORS.map((c) => (
        <polygon key={`c${c}`} points={centreTriangle(c).map((p) => `${p.x},${p.y}`).join(' ')} fill={COLOR_HEX[c]} stroke="var(--cell-line)" strokeWidth={0.06} />
      ))}

      {doubleCells.map((pt, i) => (
        <circle key={`d${i}`} cx={pt.x} cy={pt.y} r={0.62} fill="none" stroke="var(--ink)" strokeWidth={0.09} strokeDasharray="0.18 0.12" aria-hidden="true" />
      ))}

      {/* legal destinations: dashed circles; the active pawn also gets a path line and a ghost pawn */}
      {interactive &&
        targets.map(({ m, pt }) => {
          const active = (drag?.piece ?? highlight) === m.piece
          const near = drag?.piece === m.piece && Math.hypot(pt.x - drag.pt.x, pt.y - drag.pt.y) <= DROP_RADIUS
          const from = piecePoint(turnColor, m.from, m.piece, rules)
          return (
            <g key={`tg${m.piece}`} pointerEvents="none" aria-hidden="true">
              {active && (
                <>
                  <line x1={from.x} y1={from.y} x2={pt.x} y2={pt.y} stroke="#fff" strokeWidth={0.22} strokeLinecap="round" opacity={0.8} />
                  <line x1={from.x} y1={from.y} x2={pt.x} y2={pt.y} stroke="#111827" strokeWidth={0.1} strokeLinecap="round" strokeDasharray="0.25 0.18" />
                  <g style={{ transform: `translate(${pt.x}px, ${pt.y}px) scale(0.95)` }} opacity={0.55}>
                    <g transform={stand}>
                      <Pawn color={turnColor} />
                    </g>
                  </g>
                </>
              )}
              <circle
                className={active ? undefined : 'target'}
                cx={pt.x}
                cy={pt.y}
                r={near ? 0.72 : active ? 0.62 : 0.48}
                fill={near ? 'rgba(255,255,255,0.75)' : active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}
                stroke="#111827"
                strokeWidth={active ? 0.14 : 0.09}
                strokeDasharray="0.2 0.12"
              />
              {m.capture && (
                <path d={`M ${pt.x - 0.2} ${pt.y - 0.2} L ${pt.x + 0.2} ${pt.y + 0.2} M ${pt.x + 0.2} ${pt.y - 0.2} L ${pt.x - 0.2} ${pt.y + 0.2}`} stroke="#991b1b" strokeWidth={0.12} strokeLinecap="round" />
              )}
            </g>
          )
        })}

      {/* pawns */}
      {drawn.map((d) => {
        const canPick = interactive && d.color === turnColor && legalPieces.has(d.piece) && !d.moving
        const dragging = canPick && drag?.piece === d.piece
        const active = canPick && (drag?.piece ?? highlight) === d.piece
        const pt = dragging ? drag!.pt : d.pt
        const scale = dragging ? 1.2 : d.p === GOAL ? 0.55 : d.p === BASE ? 1.05 : 0.95
        return (
          <g
            key={`${d.color}${d.piece}`}
            style={{
              transform: `translate(${pt.x}px, ${pt.y}px) scale(${scale})`,
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
              <g transform={stand}>
              {/* generous invisible hit area */}
              <circle r={0.8} fill="transparent" />
              {/* glow: every movable pawn pulses amber; the one you are about to move gets a strong white/black ring */}
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
        </div>
        {thrown && rollMs > 0 && <DiceThrow thrown={thrown} width={W} rollMs={rollMs} />}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">{bottomSeats.map(seatTag)}</div>
    </div>
  )
}

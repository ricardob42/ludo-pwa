import { useMemo } from 'react'
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
  baseLabelPt,
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
import type { Anim } from '../hooks/useGameController'

interface Props {
  game: GameState
  anim: Anim | null
  moves: Move[]
  highlight: number | null
  interactive: boolean
  stepMs: number
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

const cell = { fill: 'var(--cell)', stroke: 'var(--cell-line)' }

export function Board({ game, anim, moves, highlight, interactive, stepMs, onPick, onHover }: Props) {
  const rules = game.rules
  const turnColor = COLORS[game.turn]

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

  const targets = moves.map((m) => ({ m, pt: piecePoint(turnColor, m.to, m.piece, rules) }))
  const legalPieces = new Set(moves.map((m) => m.piece))

  const label = (d: Drawn) => {
    const where =
      d.p === BASE ? 'in the yard' : d.p === GOAL ? 'at home' : d.p > LAST_OUTER ? 'in the home column' : `${d.p} squares from its start`
    return `${cap(d.color)} pawn ${d.piece + 1}, ${where}`
  }

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      role="group"
      aria-label="Ludo board"
      className="mx-auto block h-auto w-full max-w-[min(100%,78dvh)] touch-manipulation select-none rounded-2xl shadow-lg"
    >
      <PawnDefs />
      <rect width={GRID} height={GRID} style={{ fill: 'var(--board-bg)' }} />

      {/* corner yards */}
      {COLORS.map((c) => {
        const r = baseRect(c)
        const ctr = baseCentre(c)
        const lab = baseLabelPt(c)
        return (
          <g key={`base-${c}`}>
            <rect x={r.x + 0.1} y={r.y + 0.1} width={r.w - 0.2} height={r.h - 0.2} rx={0.5} fill={COLOR_HEX[c]} stroke={COLOR_DEEP[c]} strokeWidth={0.12} />
            <circle cx={ctr.x} cy={ctr.y} r={2.45} fill={COLOR_DEEP[c]} opacity={0.85} />
            {baseSlots(c).map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={0.6} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth={0.06} />
            ))}
            <text x={lab.x} y={lab.y + 0.2} textAnchor="middle" fontSize={0.62} fontWeight={800} fill={COLOR_INK[c]}>
              {game.seats[COLORS.indexOf(c)].name.slice(0, 12)}
            </text>
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
              <text x={pt.x} y={pt.y + 0.25} textAnchor="middle" fontSize={0.72} style={{ fill: startOf ? COLOR_INK[startOf] : 'var(--star)' }} aria-hidden="true">
                ★
              </text>
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

      {/* legal destinations */}
      {interactive &&
        targets.map(({ m, pt }) => (
          <g key={`tg${m.piece}`} onClick={() => onPick(m.piece)} style={{ cursor: 'pointer' }} aria-hidden="true">
            <circle
              className="target"
              cx={pt.x}
              cy={pt.y}
              r={highlight === m.piece ? 0.6 : 0.48}
              fill={highlight === m.piece ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'}
              stroke="#111827"
              strokeWidth={highlight === m.piece ? 0.14 : 0.09}
              strokeDasharray="0.2 0.12"
            />
            {m.capture && (
              <text x={pt.x} y={pt.y + 0.2} textAnchor="middle" fontSize={0.6} fontWeight={800} fill="#991b1b">
                ✕
              </text>
            )}
          </g>
        ))}

      {/* pawns */}
      {drawn.map((d) => {
        const canPick = interactive && d.color === turnColor && legalPieces.has(d.piece) && !d.moving
        const scale = d.p === GOAL ? 0.55 : d.p === BASE ? 1.05 : 0.95
        return (
          <g
            key={`${d.color}${d.piece}`}
            style={{
              transform: `translate(${d.pt.x}px, ${d.pt.y}px) scale(${scale})`,
              transition: stepMs > 0 ? `transform ${Math.max(stepMs - 20, 40)}ms linear` : 'none',
            }}
          >
            <g
              className={canPick ? 'piece-g' : undefined}
              role={canPick ? 'button' : undefined}
              tabIndex={canPick ? 0 : undefined}
              aria-label={canPick ? `${label(d)}. Move it.` : undefined}
              aria-hidden={canPick ? undefined : true}
              onClick={canPick ? () => onPick(d.piece) : undefined}
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
              onMouseLeave={canPick ? () => onHover(null) : undefined}
              onFocus={canPick ? () => onHover(d.piece) : undefined}
              onBlur={canPick ? () => onHover(null) : undefined}
            >
              {/* generous invisible hit area */}
              <circle r={0.8} fill="transparent" />
              {canPick && <ellipse className="focus-ring" cy={0.1} rx={0.5} ry={0.68} fill="none" stroke="#1d4ed8" strokeWidth={0.1} />}
              <Pawn color={d.color} label={d.piece + 1} />
            </g>
          </g>
        )
      })}
    </svg>
  )
}

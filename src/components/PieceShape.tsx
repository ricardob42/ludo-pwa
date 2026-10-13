import { COLORS, type Color } from '../lib/ludo/rules'
import { COLOR_DEEP, COLOR_HEX, COLOR_INK, COLOR_SHAPE, COLOR_SHINE, SHAPE_GLYPH } from '../lib/ludo/theme'

/** Shared gradients for the pawns. Render once inside the board <svg>. */
export function PawnDefs() {
  return (
    <defs>
      {COLORS.map((c) => (
        <linearGradient key={c} id={`pawn-${c}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={COLOR_SHINE[c]} />
          <stop offset="0.35" stopColor={COLOR_HEX[c]} />
          <stop offset="1" stopColor={COLOR_DEEP[c]} />
        </linearGradient>
      ))}
    </defs>
  )
}

/**
 * A classic game pawn (cone body + round head) centred around (0,0).
 * The head carries the colour's mark (circle / square / triangle / diamond) so colour is never the only cue.
 */
export function Pawn({ color, label }: { color: Color; label: number }) {
  const fill = `url(#pawn-${color})`
  const stroke = COLOR_DEEP[color]
  return (
    <g>
      <ellipse cx={0} cy={0.44} rx={0.34} ry={0.1} fill="rgba(0,0,0,0.3)" />
      <path d="M -0.32 0.42 Q -0.3 0.18 -0.1 -0.06 L 0.1 -0.06 Q 0.3 0.18 0.32 0.42 Q 0 0.5 -0.32 0.42 Z" fill={fill} stroke={stroke} strokeWidth={0.035} />
      <circle cx={0} cy={-0.2} r={0.21} fill={fill} stroke={stroke} strokeWidth={0.035} />
      <ellipse cx={-0.07} cy={-0.28} rx={0.07} ry={0.045} fill="#fff" opacity={0.7} />
      <text x={0} y={-0.135} textAnchor="middle" fontSize={0.2} fontWeight={800} fill={COLOR_INK[color]} pointerEvents="none" aria-hidden="true">
        {SHAPE_GLYPH[COLOR_SHAPE[color]]}
      </text>
      <text x={0} y={0.33} textAnchor="middle" fontSize={0.3} fontWeight={800} fill={COLOR_INK[color]} pointerEvents="none">
        {label}
      </text>
    </g>
  )
}

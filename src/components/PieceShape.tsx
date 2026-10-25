import { COLORS, type Color } from '../lib/ludo/rules'
import { COLOR_DEEP, COLOR_HEX, COLOR_SHINE } from '../lib/ludo/theme'

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

/** A plain game pawn (cone body + round head), centred around (0,0). No numbers or marks. */
export function Pawn({ color }: { color: Color }) {
  const fill = `url(#pawn-${color})`
  const stroke = COLOR_DEEP[color]
  return (
    <g>
      <ellipse cx={0} cy={0.44} rx={0.34} ry={0.1} fill="rgba(0,0,0,0.3)" />
      <path d="M -0.32 0.42 Q -0.3 0.18 -0.1 -0.06 L 0.1 -0.06 Q 0.3 0.18 0.32 0.42 Q 0 0.5 -0.32 0.42 Z" fill={fill} stroke={stroke} strokeWidth={0.035} />
      <circle cx={0} cy={-0.2} r={0.21} fill={fill} stroke={stroke} strokeWidth={0.035} />
      <ellipse cx={-0.07} cy={-0.28} rx={0.07} ry={0.045} fill="#fff" opacity={0.7} />
    </g>
  )
}

/** A small standalone pawn icon for the UI around the board (uses the gradients defined by the board). */
export function PawnIcon({ color, size = 28 }: { color: Color; size?: number }) {
  return (
    <svg viewBox="-0.42 -0.44 0.84 1.02" width={size} height={size * (1.02 / 0.84)} aria-hidden="true" className="shrink-0">
      <Pawn color={color} />
    </svg>
  )
}

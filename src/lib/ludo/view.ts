import { GRID, type Pt } from './geometry'

/** Camera for the 3D board: the board plane is tilted back and viewed with perspective. */
export const TILT_DEG = 30
/** Uniform shrink so the nearest (bottom) edge still fits the container width. */
export const TILT_SCALE = 0.84
/** Perspective distance as a multiple of the board width. */
export const PERSPECTIVE = 1.6
/** Height of the 3D stage as a fraction of its width. */
export const STAGE_RATIO = 0.86
/** Pawns are stretched vertically by this much so they look upright despite the tilt. */
export const UPRIGHT = 1 / Math.cos((TILT_DEG * Math.PI) / 180)

const rad = (TILT_DEG * Math.PI) / 180

/** Board point (0..GRID) -> pixels relative to the stage centre, for a board that is `W` px wide. */
export function projectBoardPoint(u: Pt, W: number): Pt {
  const x = (u.x / GRID - 0.5) * W
  const y = (u.y / GRID - 0.5) * W
  const d = PERSPECTIVE * W
  const f = d / (d - y * Math.sin(rad))
  return { x: x * TILT_SCALE * f, y: y * Math.cos(rad) * TILT_SCALE * f }
}

/** Inverse of projectBoardPoint: pixels relative to the stage centre -> board point. Used for dragging. */
export function unprojectScreenPoint(s: Pt, W: number): Pt {
  const d = PERSPECTIVE * W
  const y = (s.y * d) / (TILT_SCALE * Math.cos(rad) * d + s.y * Math.sin(rad))
  const x = (s.x * (d - y * Math.sin(rad))) / (TILT_SCALE * d)
  return { x: (x / W + 0.5) * GRID, y: (y / W + 0.5) * GRID }
}

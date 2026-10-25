import { GRID, type Pt } from './geometry'

/** Camera for the 3D board: the board plane is tilted back and viewed with perspective. */
export const TILT_DEG = 30
/** Uniform shrink so the nearest (bottom) edge still fits the container width. */
export const TILT_SCALE = 0.8
/** Perspective distance as a multiple of the board width. */
export const PERSPECTIVE = 1.6
/**
 * The board is drawn as plain 2D vector shapes whose corners are already projected (no CSS 3D transform),
 * so it stays razor sharp in every browser. These are the SVG viewBoxes, centred on the board centre.
 */
export const VIEW_3D = { x: -8.1, y: -5.1, w: 16.2, h: 13.2 }
export const VIEW_FLAT = { x: -8.1, y: -8.1, w: 16.2, h: 16.2 }

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

/** Size factor of things standing on the board at board-row `boardY` (nearer = bigger). */
export function localScale(boardY: number): number {
  const d = PERSPECTIVE * GRID
  const z = (boardY - GRID / 2) * Math.sin(rad)
  return (TILT_SCALE * d) / (d - z)
}

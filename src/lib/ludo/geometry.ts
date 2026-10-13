import { BASE, GOAL, LAST_OUTER, TRACK_LEN, absSquare, colorIndex, type Color, type RulesConfig } from './rules'

/**
 * Classic 15x15 Ludo board: a cross with 3-wide arms, 6 cells long.
 * Yellow's arm is at the bottom; blue, red and green follow clockwise (left, top, right).
 */
export const GRID = 15
export interface Pt {
  x: number
  y: number
}

/** Rotate a point 90 degrees clockwise `k` times around the board centre. */
export function rotPt(p: Pt, k: number): Pt {
  let { x, y } = p
  for (let i = 0; i < k; i++) [x, y] = [GRID - y, x]
  return { x, y }
}

// The 13 outer squares of the bottom (yellow) arm, in travel order:
// down the right-hand column, across the end, up the left-hand column.
const arm: Pt[] = []
for (let i = 0; i < 5; i++) arm.push({ x: 8.5, y: 9.5 + i })
for (const x of [8.5, 7.5, 6.5]) arm.push({ x, y: 14.5 })
for (let i = 0; i < 5; i++) arm.push({ x: 6.5, y: 13.5 - i })

/** Centre of each of the 52 outer squares. The middle of an arm's end is the last square before its home column. */
export const TRACK_PTS: Pt[] = Array.from({ length: TRACK_LEN }, () => ({ x: 0, y: 0 }))
for (let k = 0; k < 4; k++) for (let j = 0; j < 13; j++) TRACK_PTS[(13 * k + j) % TRACK_LEN] = rotPt(arm[j], k)

export function lanePt(color: Color, p: number): Pt {
  return rotPt({ x: 7.5, y: 13.5 - (p - 51) }, colorIndex(color))
}

const BASE_SLOTS: Pt[] = [
  { x: 2, y: 11 },
  { x: 4, y: 11 },
  { x: 2, y: 13 },
  { x: 4, y: 13 },
]
const GOAL_SLOTS: Pt[] = [
  { x: 6.95, y: 8.55 },
  { x: 8.05, y: 8.55 },
  { x: 7.25, y: 8.05 },
  { x: 7.75, y: 8.05 },
]

export function piecePoint(color: Color, p: number, index: number, rules: RulesConfig): Pt {
  const k = colorIndex(color)
  if (p === BASE) return rotPt(BASE_SLOTS[index], k)
  if (p === GOAL) return rotPt(GOAL_SLOTS[index], k)
  if (p <= LAST_OUTER) return TRACK_PTS[absSquare(color, p, rules) as number]
  return lanePt(color, p)
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** The 6x6 corner yard of a colour. */
export function baseRect(color: Color): Rect {
  const k = colorIndex(color)
  const a = rotPt({ x: 0, y: 9 }, k)
  const b = rotPt({ x: 6, y: 15 }, k)
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }
}

export function baseCentre(color: Color): Pt {
  return rotPt({ x: 3, y: 12 }, colorIndex(color))
}

export function baseSlots(color: Color): Pt[] {
  return BASE_SLOTS.map((p) => rotPt(p, colorIndex(color)))
}

export function baseLabelPt(color: Color): Pt {
  return rotPt({ x: 3, y: 9.75 }, colorIndex(color))
}

export function centreTriangle(color: Color): Pt[] {
  return [
    { x: 6, y: 9 },
    { x: 9, y: 9 },
    { x: 7.5, y: 7.5 },
  ].map((p) => rotPt(p, colorIndex(color)))
}

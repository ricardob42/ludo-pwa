import {
  COLORS,
  GOAL,
  LANE_START,
  LAST_OUTER,
  TRACK_LEN,
  absSquare,
  applyBoardMove,
  isSafeSquare,
  legalMoves,
  movesFor,
  squareKey,
  type Color,
  type GameState,
  type Move,
  type Pieces,
  type RulesConfig,
} from './rules'
import type { Difficulty } from './setup'

export type Rng = () => number

/** Opponent pieces that can reach `abs` with a single die value (1-6). */
function attackers(pieces: Pieces, rules: RulesConfig, victim: Color, abs: number): number {
  let n = 0
  for (const o of COLORS) {
    if (o === victim) continue
    for (const q of pieces[o]) {
      if (q < 0 || q > LAST_OUTER) continue
      const b = absSquare(o, q, rules) as number
      const d = (abs - b + TRACK_LEN) % TRACK_LEN
      if (d >= 1 && d <= 6 && q + d <= LAST_OUTER) n++
    }
  }
  return n
}

/** Sum over own pieces of (how many enemies can hit it) x (what it is worth). */
export function exposure(pieces: Pieces, rules: RulesConfig, color: Color): number {
  let total = 0
  for (const p of pieces[color]) {
    if (p < 0 || p > LAST_OUTER) continue
    const abs = absSquare(color, p, rules) as number
    if (isSafeSquare(abs, rules)) continue
    if (pieces[color].filter((x) => x === p).length >= 2) continue // barrier
    total += attackers(pieces, rules, color, abs) * (40 + p * 1.5)
  }
  return total
}

/** One-ply lookahead: expected loss from opponents' best capture on each die value. */
export function threatLoss(pieces: Pieces, rules: RulesConfig, color: Color): number {
  const board = { pieces, rules }
  let loss = 0
  for (const opp of COLORS) {
    if (opp === color) continue
    for (let v = 1; v <= 6; v++) {
      let worst = 0
      for (const m of movesFor(board, opp, v)) {
        if (m.capture && m.capture.color === color) {
          worst = Math.max(worst, 60 + pieces[color][m.capture.piece] * 2)
        }
      }
      loss += worst / 6
    }
  }
  return loss
}

export function scoreMove(
  state: GameState,
  move: Move,
  level: 'medium' | 'hard',
  lossBefore = 0,
): number {
  const color = COLORS[state.turn]
  const rules = state.rules
  const before = state.pieces
  const after = applyBoardMove(before, color, move)
  let s = 0

  if (move.to === GOAL) s += 1000
  if (move.capture) s += 600 + Math.max(0, before[move.capture.color][move.capture.piece]) * 3
  if (move.kind === 'exit') s += 500

  // Moving out of danger / not leaving pieces exposed.
  const exDelta = exposure(before, rules, color) - exposure(after, rules, color)
  s += exDelta * (level === 'hard' ? 0.5 : 1.5)
  if (move.from >= 0 && move.from <= LAST_OUTER) {
    const fromAbs = absSquare(color, move.from, rules) as number
    const wasThreatened = !isSafeSquare(fromAbs, rules) && attackers(before, rules, color, fromAbs) > 0
    if (wasThreatened && move.to > LAST_OUTER) s += 150
  }

  // Safe squares, home lane, blockades.
  const abs = absSquare(color, move.to, rules)
  if (abs !== null && isSafeSquare(abs, rules) && move.kind !== 'exit') s += 150
  if (move.to >= LANE_START && move.to < GOAL) s += 180
  const key = squareKey(color, move.to, rules)
  const ownThere = before[color].filter((p, i) => i !== move.piece && squareKey(color, p, rules) === key && key !== null).length
  if (ownThere === 1) s += 120
  const ownAtFrom = before[color].filter((p, i) => i !== move.piece && p === move.from && move.from >= 0 && move.from <= LAST_OUTER).length
  if (ownAtFrom === 1) s -= 50 // breaking up a blockade

  // Mild preference for advancing.
  s += move.to * 0.4

  if (level === 'hard') {
    s += (lossBefore - threatLoss(after, rules, color)) * 2
  }
  return s
}

export function chooseMove(state: GameState, level: Difficulty, rng: Rng = Math.random): Move {
  const moves = legalMoves(state)
  if (moves.length === 0) throw new Error('No legal moves')
  if (moves.length === 1) return moves[0]
  const pick = <T>(xs: T[]): T => xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))]

  if (level === 'easy') {
    const good = moves.filter((m) => m.capture || m.to === GOAL)
    if (good.length > 0 && rng() < 0.5) return pick(good)
    return pick(moves)
  }

  const color = COLORS[state.turn]
  const lossBefore = level === 'hard' ? threatLoss(state.pieces, state.rules, color) : 0
  let best = moves[0]
  let bestScore = -Infinity
  for (const m of moves) {
    const noise = level === 'medium' ? rng() * 80 : rng() * 2
    const sc = scoreMove(state, m, level, lossBefore) + noise
    if (sc > bestScore) {
      bestScore = sc
      best = m
    }
  }
  return best
}

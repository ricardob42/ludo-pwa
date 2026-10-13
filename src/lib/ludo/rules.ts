/**
 * Ludo rules engine. Pure TypeScript: no React, no DOM, no randomness
 * (dice values are passed in), so it is trivial to unit test.
 *
 * Piece progress `p`:
 *   -1        in base (yard)
 *   0..50     on the 52-square outer track (0 = the colour's start square)
 *   51..55    on the colour's 5-square home column
 *   56        on the centre home triangle (goal)
 */
export const COLORS = ['yellow', 'blue', 'red', 'green'] as const
export type Color = (typeof COLORS)[number]

export const TRACK_LEN = 52
export const BASE = -1
export const LAST_OUTER = 50
export const LANE_START = 51
export const GOAL = 56
export const PIECES_PER_PLAYER = 4

/** Every house rule lives in this one object. */
export interface RulesConfig {
  /** Dice values that bring a piece out of the yard. */
  exitRolls: number[]
  /** If an exit roll is made and a piece can leave the yard, the player must do that. */
  forcedExit: boolean
  /** Master switch: rolling a value in `extraRollOn` grants another roll. */
  extraRollEnabled: boolean
  extraRollOn: number[]
  /** Capturing an opponent grants another roll. */
  captureGivesRoll: boolean
  /** Bringing a piece home grants another roll. */
  goalGivesRoll: boolean
  /** Rolling this many sixes in a row forfeits the turn (0 = rule off). */
  maxConsecutiveSixes: number
  /** Two or more same-colour pieces on a normal square cannot be captured (opponents cannot land there). */
  doublesProtected: boolean
  /** A double also stops opponents from passing it. */
  blockadesBlockPassing: boolean
  /** Keep playing after the first finisher to rank 2nd and 3rd. */
  continueRanking: boolean
  /** Safe squares (0-indexed outer track): the four start squares and the four star squares. */
  safeSquares: number[]
  /** Start square of each colour (0-indexed outer track). */
  entrySquares: Record<Color, number>
}

export const DEFAULT_RULES: RulesConfig = {
  exitRolls: [6],
  forcedExit: false,
  extraRollEnabled: true,
  extraRollOn: [6],
  captureGivesRoll: true,
  goalGivesRoll: true,
  maxConsecutiveSixes: 3,
  doublesProtected: true,
  blockadesBlockPassing: false,
  continueRanking: true,
  safeSquares: [8, 16, 21, 29, 34, 42, 47, 3],
  entrySquares: { yellow: 8, blue: 21, red: 34, green: 47 },
}

export type SeatKind = 'human' | 'ai'
export interface Seat {
  color: Color
  name: string
  kind: SeatKind
}
export interface Occupant {
  color: Color
  piece: number
}
export type MoveKind = 'exit' | 'move' | 'lane' | 'goal'
export interface Move {
  piece: number
  from: number
  to: number
  kind: MoveKind
  capture?: Occupant
}
export type Pieces = Record<Color, number[]>
export type Phase = 'roll' | 'move' | 'over'

export type GameEvent =
  | { type: 'roll'; color: Color; value: number }
  | { type: 'pass'; color: Color; value: number }
  | { type: 'penalty'; color: Color }
  | { type: 'exit'; color: Color; piece: number }
  | { type: 'move'; color: Color; piece: number; from: number; to: number; steps: number }
  | { type: 'capture'; color: Color; piece: number; victim: Color; victimPiece: number }
  | { type: 'goal'; color: Color; piece: number }
  | { type: 'extra'; color: Color }
  | { type: 'finish'; color: Color; rank: number }
  | { type: 'gameover'; ranking: Color[] }

export interface GameState {
  rules: RulesConfig
  /** Always 4 seats, in COLORS order (= clockwise turn order). */
  seats: Seat[]
  pieces: Pieces
  /** Index into seats / COLORS of the player to act. */
  turn: number
  phase: Phase
  /** Current die value while phase === 'move'. */
  roll: number | null
  /** The current player will roll again after this move. */
  extra: boolean
  /** Consecutive sixes rolled by the current player. */
  sixes: number
  /** Colours in finishing order. */
  finished: Color[]
}

export interface StepResult {
  state: GameState
  events: GameEvent[]
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

export const colorIndex = (c: Color): number => COLORS.indexOf(c)

export function createGame(seats: Seat[], rules: RulesConfig = DEFAULT_RULES, firstTurn = 0): GameState {
  if (seats.length !== 4) throw new Error('A game always has exactly 4 seats')
  COLORS.forEach((c, i) => {
    if (seats[i].color !== c) throw new Error('Seats must be in colour order')
  })
  const pieces = {} as Pieces
  for (const c of COLORS) pieces[c] = Array(PIECES_PER_PLAYER).fill(BASE)
  return {
    rules: clone(rules),
    seats: clone(seats),
    pieces,
    turn: firstTurn,
    phase: 'roll',
    roll: null,
    extra: false,
    sixes: 0,
    finished: [],
  }
}

/** Absolute outer-track square (0..51) for progress p, or null when off the outer track. */
export function absSquare(color: Color, p: number, rules: RulesConfig = DEFAULT_RULES): number | null {
  if (p < 0 || p > LAST_OUTER) return null
  return (rules.entrySquares[color] + p) % TRACK_LEN
}

export function isSafeSquare(abs: number, rules: RulesConfig = DEFAULT_RULES): boolean {
  return rules.safeSquares.includes(abs)
}

/** Unique key for a physical square a piece can stand on; null for the yard and the goal. */
export function squareKey(color: Color, p: number, rules: RulesConfig = DEFAULT_RULES): string | null {
  if (p < 0 || p >= GOAL) return null
  if (p <= LAST_OUTER) return `o${absSquare(color, p, rules)}`
  return `l${color}${p}`
}

function occupancy(pieces: Pieces, rules: RulesConfig): Map<string, Occupant[]> {
  const map = new Map<string, Occupant[]>()
  for (const color of COLORS) {
    pieces[color].forEach((p, piece) => {
      const key = squareKey(color, p, rules)
      if (!key) return
      const list = map.get(key)
      if (list) list.push({ color, piece })
      else map.set(key, [{ color, piece }])
    })
  }
  return map
}

/** Two or more pieces of the same colour on one square. */
export function isDouble(occupants: Occupant[] | undefined): boolean {
  return !!occupants && occupants.length >= 2 && occupants.every((o) => o.color === occupants[0].color)
}

function landing(
  color: Color,
  to: number,
  occ: Map<string, Occupant[]>,
  rules: RulesConfig,
): { capture?: Occupant } | null {
  const key = squareKey(color, to, rules)
  if (!key) return {} // home triangle: any number of pieces may finish
  const others = (occ.get(key) ?? []).filter((o) => o.color !== color)
  if (others.length === 0) return {}
  const abs = absSquare(color, to, rules)
  if (abs !== null && isSafeSquare(abs, rules)) return {} // safe squares are shared peacefully
  if (others.length >= 2 && rules.doublesProtected) return null // a double cannot be captured
  return { capture: others[0] }
}

/** All legal moves for `color` with die value `value` on the given board. */
export function movesFor(state: Pick<GameState, 'pieces' | 'rules'>, color: Color, value: number): Move[] {
  const { pieces, rules } = state
  const occ = occupancy(pieces, rules)
  const out: Move[] = []
  pieces[color].forEach((p, piece) => {
    if (p === GOAL) return
    let to: number
    if (p === BASE) {
      if (!rules.exitRolls.includes(value)) return
      to = 0
    } else {
      to = p + value
      if (to > GOAL) return // an exact roll is needed to reach home
      if (rules.blockadesBlockPassing) {
        for (let q = p + 1; q <= to; q++) {
          const key = squareKey(color, q, rules)
          const here = key ? occ.get(key) : undefined
          if (key && key.startsWith('o') && isDouble(here) && here![0].color !== color) return
        }
      }
    }
    const res = landing(color, to, occ, rules)
    if (!res) return
    const kind: MoveKind = p === BASE ? 'exit' : to === GOAL ? 'goal' : to > LAST_OUTER ? 'lane' : 'move'
    out.push({ piece, from: p, to, kind, capture: res.capture })
  })
  if (rules.forcedExit && rules.exitRolls.includes(value)) {
    const exits = out.filter((m) => m.kind === 'exit')
    if (exits.length > 0) return exits
  }
  return out
}

/** Legal moves for the current player and current die value. Empty unless phase === 'move'. */
export function legalMoves(state: GameState): Move[] {
  if (state.phase !== 'move' || state.roll === null) return []
  return movesFor(state, COLORS[state.turn], state.roll)
}

/** Apply a move to a bare board (no turn logic). Used by the AI for lookahead. */
export function applyBoardMove(pieces: Pieces, color: Color, move: Move): Pieces {
  const next = clone(pieces)
  next[color][move.piece] = move.to
  if (move.capture) next[move.capture.color][move.capture.piece] = BASE
  return next
}

export function nextTurn(s: GameState): void {
  do {
    s.turn = (s.turn + 1) % 4
  } while (s.finished.includes(COLORS[s.turn]))
  s.phase = 'roll'
  s.roll = null
  s.extra = false
  s.sixes = 0
}

/** Register a die roll. Passes the turn automatically when there is no legal move. */
export function applyRoll(state: GameState, value: number): StepResult {
  if (state.phase !== 'roll') throw new Error('Not in roll phase')
  if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error('Die value must be 1-6')
  const s = clone(state)
  const color = COLORS[s.turn]
  const events: GameEvent[] = [{ type: 'roll', color, value }]
  s.sixes = value === 6 ? s.sixes + 1 : 0
  if (s.rules.maxConsecutiveSixes > 0 && s.sixes >= s.rules.maxConsecutiveSixes) {
    events.push({ type: 'penalty', color }) // too many sixes in a row: the turn is forfeited
    nextTurn(s)
    return { state: s, events }
  }
  s.roll = value
  s.extra = s.rules.extraRollEnabled && s.rules.extraRollOn.includes(value)
  if (movesFor(s, color, value).length === 0) {
    events.push({ type: 'pass', color, value })
    nextTurn(s)
  } else {
    s.phase = 'move'
  }
  return { state: s, events }
}

/** Play the chosen piece (identified by `piece` index) with the current roll. */
export function applyMove(state: GameState, chosen: Pick<Move, 'piece'>): StepResult {
  if (state.phase !== 'move') throw new Error('Not in move phase')
  const move = legalMoves(state).find((m) => m.piece === chosen.piece)
  if (!move) throw new Error('Illegal move')
  const s = clone(state)
  const color = COLORS[s.turn]
  const events: GameEvent[] = []
  s.pieces[color][move.piece] = move.to
  if (move.kind === 'exit') events.push({ type: 'exit', color, piece: move.piece })
  else events.push({ type: 'move', color, piece: move.piece, from: move.from, to: move.to, steps: move.to - move.from })

  if (move.capture) {
    s.pieces[move.capture.color][move.capture.piece] = BASE
    events.push({ type: 'capture', color, piece: move.piece, victim: move.capture.color, victimPiece: move.capture.piece })
    if (s.rules.captureGivesRoll) s.extra = true
  }
  if (move.to === GOAL) {
    events.push({ type: 'goal', color, piece: move.piece })
    if (s.rules.goalGivesRoll) s.extra = true
  }

  if (s.pieces[color].every((p) => p === GOAL)) {
    s.finished.push(color)
    events.push({ type: 'finish', color, rank: s.finished.length })
    const target = s.rules.continueRanking ? 3 : 1
    if (s.finished.length >= target) {
      const last = COLORS.find((c) => !s.finished.includes(c))
      if (s.rules.continueRanking && last) s.finished.push(last)
      s.phase = 'over'
      s.roll = null
      events.push({ type: 'gameover', ranking: [...s.finished] })
      return { state: s, events }
    }
    nextTurn(s)
    return { state: s, events }
  }

  if (s.extra) {
    events.push({ type: 'extra', color })
    s.phase = 'roll'
    s.roll = null
    s.extra = false
  } else {
    nextTurn(s)
  }
  return { state: s, events }
}

export const piecesInGoal = (state: GameState, color: Color): number =>
  state.pieces[color].filter((p) => p === GOAL).length

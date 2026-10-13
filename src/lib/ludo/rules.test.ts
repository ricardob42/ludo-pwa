import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RULES,
  GOAL,
  absSquare,
  applyMove,
  applyRoll,
  createGame,
  legalMoves,
  movesFor,
  type GameState,
  type RulesConfig,
  type Seat,
} from './rules'
import { buildSeats } from './setup'

const seats: Seat[] = [
  { color: 'yellow', name: 'Ana', kind: 'human' },
  { color: 'blue', name: 'Ben', kind: 'human' },
  { color: 'red', name: 'Cy', kind: 'ai' },
  { color: 'green', name: 'Di', kind: 'ai' },
]

function game(over: Partial<RulesConfig> = {}): GameState {
  return createGame(seats, { ...DEFAULT_RULES, ...over })
}

/** Blue progress that sits on absolute square `abs`. */
const blueAt = (abs: number) => (abs - DEFAULT_RULES.entrySquares.blue + 52) % 52

describe('leaving the yard', () => {
  it('needs a 6 to leave the yard', () => {
    const g = game()
    for (const v of [1, 2, 3, 4, 5]) expect(movesFor(g, 'yellow', v)).toEqual([])
    const m = movesFor(g, 'yellow', 6)
    expect(m).toHaveLength(4)
    expect(m.every((x) => x.kind === 'exit' && x.to === 0)).toBe(true)
  })

  it('a piece leaving the yard lands on its own start square and the player rolls again', () => {
    let g = game()
    g = applyRoll(g, 6).state
    expect(g.phase).toBe('move')
    const r = applyMove(g, { piece: 0 })
    expect(r.state.pieces.yellow[0]).toBe(0)
    expect(absSquare('yellow', 0)).toBe(8)
    expect(r.state.turn).toBe(0)
    expect(r.state.phase).toBe('roll')
  })

  it('by default the player may choose a normal move instead of leaving the yard', () => {
    const g = game()
    g.pieces.yellow = [-1, 10, 20, 30]
    expect(movesFor(g, 'yellow', 6)).toHaveLength(4)
  })

  it('forcedExit makes leaving the yard compulsory', () => {
    const g = game({ forcedExit: true })
    g.pieces.yellow = [-1, 10, 20, 30]
    const m = movesFor(g, 'yellow', 6)
    expect(m).toHaveLength(1)
    expect(m[0].kind).toBe('exit')
  })

  it('an opponent on your start square is not captured (start squares are safe)', () => {
    const g = game()
    g.pieces.blue = [blueAt(8), -1, -1, -1]
    expect(movesFor(g, 'yellow', 6)[0].capture).toBeUndefined()
  })

  it('if the start square is not safe, leaving the yard captures', () => {
    const g = game({ safeSquares: [] })
    g.pieces.blue = [blueAt(8), -1, -1, -1]
    expect(movesFor(g, 'yellow', 6)[0].capture).toEqual({ color: 'blue', piece: 0 })
  })
})

describe('captures and safe squares', () => {
  it('captures a single opponent on a normal square, sends it home and grants a roll', () => {
    let g = game()
    g.pieces.yellow = [2, -1, -1, -1] // abs 10
    g.pieces.blue = [blueAt(13), -1, -1, -1] // abs 13 is a normal square
    g = applyRoll(g, 3).state
    const [m] = legalMoves(g)
    expect(m.capture).toEqual({ color: 'blue', piece: 0 })
    const r = applyMove(g, m)
    expect(r.state.pieces.blue[0]).toBe(-1)
    expect(r.state.pieces.yellow[0]).toBe(5)
    expect(r.events.some((e) => e.type === 'capture')).toBe(true)
    expect(r.state.turn).toBe(0)
    expect(r.state.phase).toBe('roll')
  })

  it('capture does not grant a roll when the option is off', () => {
    let g = game({ captureGivesRoll: false })
    g.pieces.yellow = [2, -1, -1, -1]
    g.pieces.blue = [blueAt(13), -1, -1, -1]
    g = applyRoll(g, 3).state
    expect(applyMove(g, { piece: 0 }).state.turn).toBe(1)
  })

  it('cannot capture on a star square; both pieces share it', () => {
    let g = game()
    g.pieces.yellow = [4, -1, -1, -1] // abs 12
    g.pieces.blue = [blueAt(16), -1, -1, -1] // abs 16 is a star square
    g = applyRoll(g, 4).state
    const [m] = legalMoves(g)
    expect(m.capture).toBeUndefined()
    const r = applyMove(g, m)
    expect(r.state.pieces.blue[0]).toBe(blueAt(16))
    expect(r.state.pieces.yellow[0]).toBe(8)
  })
})

describe('doubles', () => {
  it('a double cannot be captured, so an opponent cannot land on it', () => {
    const g = game()
    g.pieces.yellow = [2, -1, -1, -1]
    g.pieces.blue = [blueAt(13), blueAt(13), -1, -1]
    expect(movesFor(g, 'yellow', 3)).toEqual([])
  })

  it('doublesProtected off lets a piece capture on a double', () => {
    const g = game({ doublesProtected: false })
    g.pieces.yellow = [2, -1, -1, -1]
    g.pieces.blue = [blueAt(13), blueAt(13), -1, -1]
    expect(movesFor(g, 'yellow', 3)[0].capture).toBeDefined()
  })

  it('doubles can be passed by default but block passing when configured', () => {
    let g = game()
    g.pieces.yellow = [2, -1, -1, -1]
    g.pieces.blue = [blueAt(13), blueAt(13), -1, -1]
    expect(movesFor(g, 'yellow', 5)).toHaveLength(1)
    g = game({ blockadesBlockPassing: true })
    g.pieces.yellow = [2, -1, -1, -1]
    g.pieces.blue = [blueAt(13), blueAt(13), -1, -1]
    expect(movesFor(g, 'yellow', 5)).toEqual([])
    expect(movesFor(g, 'yellow', 1)).toHaveLength(1)
  })

  it('own pieces may stack on a square', () => {
    const g = game()
    g.pieces.yellow = [5, 2, -1, -1]
    expect(movesFor(g, 'yellow', 3).some((m) => m.piece === 1 && m.to === 5)).toBe(true)
  })
})

describe('home column and exact finish', () => {
  it('turns into the home column after the last outer square', () => {
    const g = game()
    g.pieces.yellow = [48, -1, -1, -1]
    expect(movesFor(g, 'yellow', 3)[0]).toMatchObject({ to: 51, kind: 'lane' })
  })

  it('reaches the home triangle with an exact roll', () => {
    const g = game()
    g.pieces.yellow = [53, -1, -1, -1]
    expect(movesFor(g, 'yellow', 3)[0]).toMatchObject({ to: GOAL, kind: 'goal' })
  })

  it('rejects a roll that overshoots home', () => {
    const g = game()
    g.pieces.yellow = [53, GOAL, GOAL, GOAL]
    expect(movesFor(g, 'yellow', 4)).toEqual([])
    expect(movesFor(g, 'yellow', 6)).toEqual([])
  })

  it('getting a piece home grants another roll', () => {
    let g = game()
    g.pieces.yellow = [53, 10, -1, -1]
    g = applyRoll(g, 3).state
    const r = applyMove(g, { piece: 0 })
    expect(r.state.turn).toBe(0)
    expect(r.state.phase).toBe('roll')
  })

  it('first player with 4 pieces home ends the game when ranking is off', () => {
    let g = game({ continueRanking: false })
    g.pieces.yellow = [GOAL, GOAL, GOAL, 53]
    g = applyRoll(g, 3).state
    const r = applyMove(g, { piece: 3 })
    expect(r.state.phase).toBe('over')
    expect(r.state.finished).toEqual(['yellow'])
  })

  it('with ranking on, play continues and finished players are skipped', () => {
    let g = game()
    g.pieces.yellow = [GOAL, GOAL, GOAL, 53]
    g = applyRoll(g, 3).state
    const r = applyMove(g, { piece: 3 })
    expect(r.state.phase).toBe('roll')
    expect(r.state.finished).toEqual(['yellow'])
    expect(r.state.turn).toBe(1)
  })
})

describe('extra rolls, sixes and passes', () => {
  it('a 6 grants another roll to the same player', () => {
    let g = game()
    g.pieces.yellow = [10, -1, -1, -1]
    g = applyRoll(g, 6).state
    const r = applyMove(g, { piece: 0 })
    expect(r.state.phase).toBe('roll')
    expect(r.state.turn).toBe(0)
    expect(r.events.some((e) => e.type === 'extra')).toBe(true)
  })

  it('a normal roll passes the turn clockwise', () => {
    let g = game()
    g.pieces.yellow = [10, -1, -1, -1]
    g = applyRoll(g, 3).state
    expect(applyMove(g, { piece: 0 }).state.turn).toBe(1)
  })

  it('extra rolls on 6 can be switched off', () => {
    let g = game({ extraRollEnabled: false })
    g.pieces.yellow = [10, -1, -1, -1]
    g = applyRoll(g, 6).state
    expect(applyMove(g, { piece: 0 }).state.turn).toBe(1)
  })

  it('three sixes in a row forfeit the turn', () => {
    let g = game()
    g.pieces.yellow = [10, -1, -1, -1]
    g = applyMove(applyRoll(g, 6).state, { piece: 0 }).state
    g = applyMove(applyRoll(g, 6).state, { piece: 0 }).state
    const r = applyRoll(g, 6)
    expect(r.events.some((e) => e.type === 'penalty')).toBe(true)
    expect(r.state.turn).toBe(1)
    expect(r.state.phase).toBe('roll')
  })

  it('a non-six resets the six counter', () => {
    let g = game()
    g.pieces.yellow = [10, -1, -1, -1]
    g = applyMove(applyRoll(g, 6).state, { piece: 0 }).state
    expect(g.sixes).toBe(1)
    g = applyRoll(g, 2).state
    expect(g.sixes).toBe(0)
  })

  it('forced pass: no legal move passes the turn', () => {
    const r = applyRoll(game(), 3)
    expect(r.state.phase).toBe('roll')
    expect(r.state.turn).toBe(1)
    expect(r.events.map((e) => e.type)).toEqual(['roll', 'pass'])
  })

  it('a pass on a 6 gives no extra roll', () => {
    const g = game()
    g.pieces.yellow = [55, 55, 55, 55]
    expect(applyRoll(g, 6).state.turn).toBe(1)
  })

  it('rejects illegal moves', () => {
    const g = applyRoll(game(), 6).state
    expect(() => applyMove(g, { piece: 9 })).toThrow()
  })
})

describe('setup', () => {
  it('always yields 4 seats; 1 human means 3 AIs; 4 humans means no AI', () => {
    const one = buildSeats({ humans: 1, names: ['Ana'], colors: ['red'], randomColors: false })
    expect(one.filter((s) => s.kind === 'ai')).toHaveLength(3)
    expect(one.find((s) => s.color === 'red')?.name).toBe('Ana')
    const four = buildSeats({ humans: 4, names: ['a', 'b', 'c', 'd'], colors: [], randomColors: true })
    expect(four.every((s) => s.kind === 'human')).toBe(true)
    expect(new Set(four.map((s) => s.color)).size).toBe(4)
  })

  it('repairs duplicate colour picks', () => {
    const s = buildSeats({ humans: 2, names: ['a', 'b'], colors: ['blue', 'blue'], randomColors: false })
    expect(s.filter((x) => x.kind === 'human')).toHaveLength(2)
  })
})

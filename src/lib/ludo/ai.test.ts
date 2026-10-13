import { describe, expect, it } from 'vitest'
import { chooseMove } from './ai'
import { DEFAULT_RULES, GOAL, applyRoll, createGame, legalMoves, type GameState, type Seat } from './rules'

const seats: Seat[] = [
  { color: 'yellow', name: 'A', kind: 'ai' },
  { color: 'blue', name: 'B', kind: 'ai' },
  { color: 'red', name: 'C', kind: 'ai' },
  { color: 'green', name: 'D', kind: 'ai' },
]
const blueAt = (abs: number) => (abs - 21 + 52) % 52
const zero = () => 0

function inMovePhase(setup: (g: GameState) => void, roll: number): GameState {
  const g = createGame(seats, DEFAULT_RULES)
  setup(g)
  return applyRoll(g, roll).state
}

describe('AI', () => {
  it('prefers bringing a piece home (medium & hard)', () => {
    const g = inMovePhase((s) => (s.pieces.yellow = [53, 10, -1, -1]), 3)
    expect(chooseMove(g, 'medium', zero).piece).toBe(0)
    expect(chooseMove(g, 'hard', zero).piece).toBe(0)
    expect(legalMoves(g).find((m) => m.piece === 0)?.to).toBe(GOAL)
  })

  it('prefers a capture over a plain move', () => {
    const g = inMovePhase((s) => {
      s.pieces.yellow = [2, 30, -1, -1]
      s.pieces.blue = [blueAt(13), -1, -1, -1]
    }, 3)
    expect(chooseMove(g, 'medium', zero).piece).toBe(0)
    expect(chooseMove(g, 'hard', zero).piece).toBe(0)
  })

  it('prefers leaving the yard on a 6 over a small advance', () => {
    const g = inMovePhase((s) => (s.pieces.yellow = [-1, 20, -1, -1]), 6)
    expect(chooseMove(g, 'medium', zero).piece).toBe(0)
  })

  it("hard avoids stepping into an enemy's range", () => {
    const g = inMovePhase((s) => {
      s.pieces.yellow = [0, 30, -1, -1] // piece 0 on its safe start square, would step to abs 11
      s.pieces.blue = [blueAt(9), -1, -1, -1] // enemy 2 squares behind abs 11
    }, 3)
    expect(chooseMove(g, 'hard', zero).piece).toBe(1)
  })

  it('moves a threatened piece to a star square when possible', () => {
    const g = inMovePhase((s) => {
      s.pieces.yellow = [6, 30, -1, -1] // piece 0 on abs 14, threatened by blue on abs 12
      s.pieces.blue = [blueAt(12), -1, -1, -1]
    }, 2) // abs 16 is a star square
    expect(chooseMove(g, 'medium', zero).piece).toBe(0)
  })

  it('easy always returns a legal move', () => {
    const g = inMovePhase((s) => (s.pieces.yellow = [10, 20, 30, 40]), 4)
    const legal = legalMoves(g).map((m) => m.piece)
    for (let i = 0; i < 50; i++) expect(legal).toContain(chooseMove(g, 'easy', Math.random).piece)
  })

  it('easy picks a capture when its dice of fate allow', () => {
    const g = inMovePhase((s) => {
      s.pieces.yellow = [2, 30, -1, -1]
      s.pieces.blue = [blueAt(13), -1, -1, -1]
    }, 3)
    expect(chooseMove(g, 'easy', () => 0).piece).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
import { projectBoardPoint, unprojectScreenPoint } from './view'

describe('3D board projection', () => {
  it('maps the board centre to the stage centre', () => {
    const p = projectBoardPoint({ x: 7.5, y: 7.5 }, 500)
    expect(Math.abs(p.x) < 1e-9 && Math.abs(p.y) < 1e-9).toBe(true)
  })

  it('unproject is the inverse of project', () => {
    for (const W of [320, 500, 780]) {
      for (const [x, y] of [[0.5, 0.5], [14.5, 0.5], [3.2, 11.7], [7.5, 14.5], [10, 4]]) {
        const back = unprojectScreenPoint(projectBoardPoint({ x, y }, W), W)
        expect(Math.abs(back.x - x) < 1e-6 && Math.abs(back.y - y) < 1e-6).toBe(true)
      }
    }
  })

  it('keeps the nearest edge inside the stage width', () => {
    const W = 400
    const corner = projectBoardPoint({ x: 15, y: 15 }, W)
    expect(corner.x <= W / 2).toBe(true)
  })
})

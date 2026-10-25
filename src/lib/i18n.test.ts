import { describe, expect, it } from 'vitest'
import { DEFAULT_LANG, seatName, translator } from './i18n'
import { buildSeats } from './ludo/setup'

describe('i18n', () => {
  it('defaults to Spanish', () => {
    expect(DEFAULT_LANG).toBe('es')
    expect(translator('es')('startGame')).toBe('Empezar partida')
  })

  it('has an English translation and fills in {variables}', () => {
    expect(translator('en')('startGame')).toBe('Start game')
    expect(translator('es')('logRoll', { name: 'Ana', n: 6 })).toBe('Ana sacó un 6')
    expect(translator('en')('logRoll', { name: 'Ana', n: 6 })).toBe('Ana rolled a 6')
  })

  it('translates CPU and default player names with the language', () => {
    const seats = buildSeats({ humans: 1, names: [''], colors: ['yellow'], randomColors: false })
    const human = seats.find((s) => s.kind === 'human')!
    const cpu = seats.find((s) => s.color === 'blue')!
    expect(seatName(human, translator('es'))).toBe('Jugador 1')
    expect(seatName(human, translator('en'))).toBe('Player 1')
    expect(seatName(cpu, translator('es'))).toBe('CPU Azul')
    expect(seatName(cpu, translator('en'))).toBe('CPU Blue')
  })

  it('keeps names typed by the player as they are', () => {
    const seats = buildSeats({ humans: 1, names: ['Ana'], colors: ['red'], randomColors: false })
    expect(seatName(seats.find((s) => s.color === 'red')!, translator('es'))).toBe('Ana')
  })
})

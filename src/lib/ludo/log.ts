import { type GameEvent, type Seat, colorIndex } from './rules'
import { cap } from './setup'

const ordinal = (n: number): string => ['', '1st', '2nd', '3rd', '4th'][n] ?? `${n}th`

/** Human-readable log line for an engine event (null = not worth logging). */
export function describeEvent(e: GameEvent, seats: Seat[]): string | null {
  const name = (c: Parameters<typeof colorIndex>[0]) => seats[colorIndex(c)].name
  switch (e.type) {
    case 'roll':
      return `${name(e.color)} rolled a ${e.value}`
    case 'pass':
      return `${name(e.color)} has no legal move`
    case 'exit':
      return `${name(e.color)} left the yard with piece ${e.piece + 1}`
    case 'move':
      return `${name(e.color)} moved piece ${e.piece + 1} by ${e.steps}`
    case 'capture':
      return `${name(e.color)} captured ${cap(e.victim)}'s piece`
    case 'goal':
      return `${name(e.color)} got piece ${e.piece + 1} home`
    case 'penalty':
      return `${name(e.color)} rolled too many sixes in a row and loses the turn`
    case 'extra':
      return `${name(e.color)} rolls again`
    case 'finish':
      return `${name(e.color)} finished ${ordinal(e.rank)}`
    case 'gameover':
      return 'Game over'
  }
}

import { type Color, type GameEvent, type Seat, colorIndex } from './rules'
import { colorName, seatName, type T } from '../i18n'

/** Log entries are stored as data (not text) so the log can be re-translated when the language changes. */
export type LogEntry = GameEvent | { type: 'start'; color: Color } | { type: 'rematch' }

export function describeEvent(e: LogEntry, seats: Seat[], t: T): string | null {
  const name = (c: Color) => seatName(seats[colorIndex(c)], t)
  switch (e.type) {
    case 'roll':
      return t('logRoll', { name: name(e.color), n: e.value })
    case 'pass':
      return t('logPass', { name: name(e.color) })
    case 'penalty':
      return t('logPenalty', { name: name(e.color) })
    case 'exit':
      return t('logExit', { name: name(e.color), n: e.piece + 1 })
    case 'move':
      return t('logMove', { name: name(e.color), n: e.piece + 1, steps: e.steps })
    case 'capture':
      return t('logCapture', { name: name(e.color), color: colorName(t, e.victim) })
    case 'goal':
      return t('logGoal', { name: name(e.color), n: e.piece + 1 })
    case 'extra':
      return t('logExtra', { name: name(e.color) })
    case 'finish':
      return t('logFinish', { name: name(e.color), place: t(`ord${e.rank}` as 'ord1') })
    case 'gameover':
      return t('logGameOver')
    case 'start':
      return t('logStart', { name: name(e.color) })
    case 'rematch':
      return t('logRematch')
  }
}

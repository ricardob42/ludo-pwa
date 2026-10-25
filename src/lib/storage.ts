import { COLORS, type GameState } from './ludo/rules'
import type { Difficulty } from './ludo/setup'
import type { LogEntry } from './ludo/log'
import { DEFAULT_LANG, type Lang } from './i18n'

export interface Settings {
  difficulty: Difficulty
  speed: 'normal' | 'fast' | 'off'
  sound: boolean
  extraRoll: boolean
  theme: 'system' | 'light' | 'dark'
  view: '3d' | 'flat'
  lang: Lang
}
export const DEFAULT_SETTINGS: Settings = { difficulty: 'medium', speed: 'normal', sound: false, extraRoll: true, theme: 'system', view: '3d', lang: DEFAULT_LANG }

export interface SavedGame {
  v: 1
  game: GameState
  log: LogEntry[]
  lastRoll: number | null
}

const GAME_KEY = 'ludo:game:v1'
const SETTINGS_KEY = 'ludo:settings:v1'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}
export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

function valid(g: unknown): g is GameState {
  const s = g as GameState
  return (
    !!s &&
    Array.isArray(s.seats) &&
    s.seats.length === 4 &&
    !!s.pieces &&
    COLORS.every((c) => Array.isArray(s.pieces[c]) && s.pieces[c].length === 4) &&
    typeof s.turn === 'number' &&
    !!s.rules
  )
}

export function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(GAME_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedGame
    if (parsed.v === 1 && valid(parsed.game) && parsed.game.phase !== 'over') {
      parsed.log = Array.isArray(parsed.log) ? parsed.log.filter((x) => !!x && typeof x === 'object') : []
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}
export function saveGame(s: SavedGame): void {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
export function clearSavedGame(): void {
  try {
    localStorage.removeItem(GAME_KEY)
  } catch {
    /* ignore */
  }
}

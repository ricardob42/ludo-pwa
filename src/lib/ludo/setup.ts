import { COLORS, type Color, type Seat } from './rules'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface SetupConfig {
  humans: number
  names: string[]
  colors: Color[]
  randomColors: boolean
}

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Turn the setup form into 4 seats in colour (= turn) order. */
export function buildSeats(cfg: SetupConfig, rng: () => number = Math.random): Seat[] {
  const n = Math.min(4, Math.max(1, Math.floor(cfg.humans)))
  let humanColors: Color[]
  if (cfg.randomColors) {
    humanColors = shuffle([...COLORS], rng).slice(0, n)
  } else {
    const used = new Set<Color>()
    humanColors = []
    for (let i = 0; i < n; i++) {
      let c: Color | undefined = cfg.colors[i]
      if (!c || used.has(c)) c = COLORS.find((x) => !used.has(x))
      used.add(c as Color)
      humanColors.push(c as Color)
    }
  }
  return COLORS.map((color) => {
    const i = humanColors.indexOf(color)
    if (i >= 0) return { color, name: cfg.names[i]?.trim() || `Player ${i + 1}`, kind: 'human' as const }
    return { color, name: `CPU ${cap(color)}`, kind: 'ai' as const }
  })
}

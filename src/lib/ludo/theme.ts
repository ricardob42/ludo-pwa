import type { Color } from './rules'

/** Saturated board colours (corner yards, start squares, home columns). */
export const COLOR_HEX: Record<Color, string> = {
  yellow: '#facc15',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
}
/** Darker shade used for the yard circle and pawn shading. */
export const COLOR_DEEP: Record<Color, string> = {
  yellow: '#ca8a04',
  blue: '#1e3a8a',
  red: '#7f1d1d',
  green: '#14532d',
}
/** Lighter shade used for pawn highlights. */
export const COLOR_SHINE: Record<Color, string> = {
  yellow: '#fef08a',
  blue: '#93c5fd',
  red: '#fca5a5',
  green: '#86efac',
}
/** Readable text colour on top of COLOR_HEX. */
export const COLOR_INK: Record<Color, string> = {
  yellow: '#111827',
  blue: '#ffffff',
  red: '#ffffff',
  green: '#ffffff',
}

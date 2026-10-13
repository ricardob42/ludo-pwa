import { useEffect, useState } from 'react'
import type { Settings } from '../lib/storage'

/** Applies the light/dark choice to <html> and the browser theme-color. Returns whether dark is active. */
export function useTheme(theme: Settings['theme']): boolean {
  const mq = () => window.matchMedia('(prefers-color-scheme: dark)')
  const [systemDark, setSystemDark] = useState(() => mq().matches)
  useEffect(() => {
    const m = mq()
    const on = () => setSystemDark(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f172a' : '#1e3a8a')
  }, [dark])
  return dark
}

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { DEFAULT_LANG, translator, type Lang, type T } from '../lib/i18n'

const Ctx = createContext<T>(translator(DEFAULT_LANG))

/** Provides the translator `t` to every component and keeps <html lang> in sync. */
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = useMemo(() => translator(lang), [lang])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return <Ctx.Provider value={t}>{children}</Ctx.Provider>
}

export const useT = (): T => useContext(Ctx)

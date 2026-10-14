import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chooseMove } from '../lib/ludo/ai'
import { describeEvent } from '../lib/ludo/log'
import {
  COLORS,
  DEFAULT_RULES,
  applyMove,
  applyRoll,
  createGame,
  legalMoves,
  type Color,
  type GameEvent,
  type GameState,
  type Move,
} from '../lib/ludo/rules'
import { buildSeats, type SetupConfig } from '../lib/ludo/setup'
import { playSound } from '../lib/sound'
import {
  clearSavedGame,
  loadSavedGame,
  loadSettings,
  saveGame,
  saveSettings,
  type SavedGame,
  type Settings,
} from '../lib/storage'

export interface Anim {
  color: Color
  piece: number
  p: number
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const LOG_MAX = 40

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function useGameController() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings)
  const [saved, setSaved] = useState<SavedGame | null>(loadSavedGame)
  const [game, setGame] = useState<GameState | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [anim, setAnim] = useState<Anim | null>(null)
  const [face, setFace] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)

  const reduced = usePrefersReducedMotion()
  const speed = reduced ? 'off' : settings.speed
  const stepMs = speed === 'normal' ? 170 : speed === 'fast' ? 70 : 0
  const rollMs = speed === 'normal' ? 700 : speed === 'fast' ? 350 : 0

  const gameRef = useRef<GameState | null>(null)
  const busyRef = useRef(false)
  const gen = useRef(0)
  const settingsRef = useRef(settings)
  gameRef.current = game
  settingsRef.current = settings

  const pushLog = useCallback((events: GameEvent[], g: GameState) => {
    const lines = events.map((e) => describeEvent(e, g.seats)).filter((x): x is string => !!x)
    if (lines.length) setLog((l) => [...l, ...lines].slice(-LOG_MAX))
  }, [])

  const setSettings = useCallback((next: Settings) => {
    setSettingsState(next)
    saveSettings(next)
    setGame((g) => (g ? { ...g, rules: { ...g.rules, extraRollEnabled: next.extraRoll } } : g))
  }, [])

  const beginGame = useCallback((g: GameState, lines: string[] = [], lastRoll: number | null = null) => {
    gen.current++
    busyRef.current = false
    setBusy(false)
    setAnim(null)
    setRolling(false)
    setFace(lastRoll)
    setLog(lines)
    setPaused(false)
    setGame(g)
  }, [])

  const start = useCallback(
    (cfg: SetupConfig) => {
      const seats = buildSeats(cfg)
      const rules = { ...DEFAULT_RULES, extraRollEnabled: settingsRef.current.extraRoll }
      clearSavedGame()
      setSaved(null)
      beginGame(createGame(seats, rules, 0), [`${seats[0].name} starts`])
    },
    [beginGame],
  )

  const rematch = useCallback(() => {
    const g = gameRef.current
    if (!g) return
    clearSavedGame()
    const rules = { ...DEFAULT_RULES, extraRollEnabled: settingsRef.current.extraRoll }
    beginGame(createGame(g.seats, rules, 0), ['Rematch!'])
  }, [beginGame])

  const resume = useCallback(() => {
    if (saved) beginGame(saved.game, saved.log, saved.lastRoll)
  }, [saved, beginGame])

  const quit = useCallback(() => {
    gen.current++
    busyRef.current = false
    setBusy(false)
    setAnim(null)
    const g = gameRef.current
    if (!g || g.phase === 'over') {
      clearSavedGame()
      setSaved(null)
    } else setSaved(loadSavedGame())
    setGame(null)
  }, [])

  const discardSaved = useCallback(() => {
    clearSavedGame()
    setSaved(null)
  }, [])

  // Persist every state change so a game can be resumed after closing the app.
  useEffect(() => {
    if (!game) return
    if (game.phase === 'over') clearSavedGame()
    else saveGame({ v: 1, game, log, lastRoll: face })
  }, [game, log, face])

  const roll = useCallback(async () => {
    const g = gameRef.current
    if (!g || g.phase !== 'roll' || busyRef.current) return
    const my = gen.current
    busyRef.current = true
    setBusy(true)
    const value = 1 + Math.floor(Math.random() * 6)
    playSound('roll', settingsRef.current.sound)
    if (rollMs > 0) {
      setRolling(true)
      const t0 = Date.now()
      while (Date.now() - t0 < rollMs) {
        setFace(1 + Math.floor(Math.random() * 6))
        await sleep(90)
      }
      if (gen.current !== my) return
      setRolling(false)
    }
    setFace(value)
    const r = applyRoll(g, value)
    setGame(r.state)
    pushLog(r.events, g)
    if (r.state.phase === 'roll') await sleep(rollMs > 0 ? 800 : 500) // no legal move: let the player see the die
    if (gen.current !== my) return
    busyRef.current = false
    setBusy(false)
  }, [rollMs, pushLog])

  const move = useCallback(
    async (piece: number) => {
      const g = gameRef.current
      if (!g || g.phase !== 'move' || busyRef.current) return
      const m = legalMoves(g).find((x) => x.piece === piece)
      if (!m) return
      const my = gen.current
      const color = COLORS[g.turn]
      busyRef.current = true
      setBusy(true)
      if (stepMs > 0) {
        const path: number[] = []
        if (m.kind === 'exit') path.push(0)
        else for (let p = m.from + 1; p <= m.to; p++) path.push(p)
        for (const p of path) {
          setAnim({ color, piece, p })
          playSound('move', settingsRef.current.sound)
          await sleep(stepMs)
          if (gen.current !== my) return
        }
      }
      const r = applyMove(g, m)
      setAnim(null)
      setGame(r.state)
      pushLog(r.events, g)
      const snd = r.events.some((e) => e.type === 'gameover')
        ? 'win'
        : r.events.some((e) => e.type === 'capture')
          ? 'capture'
          : r.events.some((e) => e.type === 'goal')
            ? 'goal'
            : null
      if (snd) playSound(snd, settingsRef.current.sound)
      await sleep(r.state.turn !== g.turn ? 450 : 150)
      if (gen.current !== my) return
      busyRef.current = false
      setBusy(false)
    },
    [stepMs, pushLog],
  )

  // Autoplay. Dice roll on their own. A single legal move is played without asking.
  // A human is only asked to choose when there are two or more legal moves. AI seats always choose themselves.
  useEffect(() => {
    if (!game || game.phase === 'over' || busy || paused) return
    const seat = game.seats[game.turn]
    const fast = speed === 'fast'
    const jitter = Math.random()
    if (game.phase === 'roll') {
      const delay = seat.kind === 'ai' ? (fast ? 300 : 600) + jitter * (fast ? 150 : 300) : fast ? 150 : 350
      const t = setTimeout(() => void roll(), delay)
      return () => clearTimeout(t)
    }
    if (seat.kind === 'ai') {
      const delay = (fast ? 300 : 600) + jitter * (fast ? 150 : 300)
      const t = setTimeout(() => void move(chooseMove(game, settingsRef.current.difficulty).piece), delay)
      return () => clearTimeout(t)
    }
    const legal = legalMoves(game)
    if (legal.length === 1) {
      const t = setTimeout(() => void move(legal[0].piece), fast ? 150 : 450)
      return () => clearTimeout(t)
    }
  }, [game, busy, paused, speed, roll, move])

  const current = game ? game.seats[game.turn] : null
  const moves = useMemo(() => (game ? legalMoves(game) : []), [game])

  return {
    settings,
    setSettings,
    saved,
    game,
    log,
    anim,
    face,
    rolling,
    busy,
    paused,
    setPaused,
    current,
    moves,
    start,
    rematch,
    resume,
    quit,
    discardSaved,
    roll,
    move,
    reduced,
    stepMs,
  }
}

export type Controller = ReturnType<typeof useGameController>

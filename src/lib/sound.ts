export type SoundKind = 'roll' | 'move' | 'capture' | 'goal' | 'win'

let ctx: AudioContext | null = null

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.08): void {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(vol, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
  o.connect(g).connect(ctx.destination)
  o.start(ctx.currentTime + start)
  o.stop(ctx.currentTime + start + dur + 0.02)
}

/** Tiny synthesized effects (no audio files, so nothing extra to cache). */
export function playSound(kind: SoundKind, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    if (kind === 'roll') [0, 0.07, 0.14].forEach((t, i) => tone(300 + i * 60, t, 0.06, 'square', 0.04))
    if (kind === 'move') tone(440, 0, 0.08, 'triangle')
    if (kind === 'capture') {
      tone(300, 0, 0.12, 'sawtooth', 0.06)
      tone(180, 0.1, 0.18, 'sawtooth', 0.06)
    }
    if (kind === 'goal') [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.12))
    if (kind === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.2))
  } catch {
    /* audio is optional */
  }
}

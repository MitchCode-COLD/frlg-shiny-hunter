import { useRef, useCallback } from 'react'

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const beep = useCallback(
    (freq = 880, durationSec = 0.12, volume = 0.35) => {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + durationSec + 0.01)
    },
    [getCtx]
  )

  return { beep }
}

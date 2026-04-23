import { useRef, useState, useCallback } from 'react'
import { useAudio } from './useAudio'

export type TimerPhase = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'done'

export interface TimerState {
  phase: TimerPhase
  remaining: number
  total: number
  stagesComplete: number[]
}

export function useTimer(delays: [number, number, number], calibOffset: number) {
  const { beep } = useAudio()
  const [state, setState] = useState<TimerState>({
    phase: 'idle',
    remaining: 0,
    total: 0,
    stagesComplete: [],
  })
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const stageRef = useRef<number>(0)
  const completedRef = useRef<number[]>([])
  const countdownRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearCountdowns() {
    countdownRefs.current.forEach(clearTimeout)
    countdownRefs.current = []
  }

  const runStage = useCallback(
    (stage: number) => {
      clearCountdowns()
      stageRef.current = stage
      const dur = stage === 3 ? delays[2] + calibOffset : delays[stage - 1]
      startRef.current = performance.now()

      // Stage-start beep — this is the "action" cue for this stage
      beep(660, 0.1)

      // 5-4-3-2-1 countdown at exact 1-second intervals — equal spacing = steady rhythm
      // Beat 6 is the action cue (next stage start beep or NOW! fanfare)
      const countBeats = [5000, 4000, 3000, 2000, 1000]
      countBeats.forEach((ms, i) => {
        if (dur > ms + 200) {
          const freq = 350 + i * 60  // 350→590 Hz, rising pitch builds tension
          countdownRefs.current.push(setTimeout(() => beep(freq, 0.08), dur - ms))
        }
      })

      const tick = () => {
        const elapsed = performance.now() - startRef.current
        const remaining = Math.max(0, dur - elapsed)

        setState({
          phase: `stage${stage}` as TimerPhase,
          remaining,
          total: dur,
          stagesComplete: [...completedRef.current],
        })

        if (remaining <= 0) {
          completedRef.current = [...completedRef.current, stage]
          if (stage < 3) {
            setTimeout(() => runStage(stage + 1), 50)
          } else {
            // 6th beep = NOW! — two quick high beeps then the big GO
            beep(1047, 0.15)
            setTimeout(() => beep(1047, 0.15), 120)
            setTimeout(() => beep(1568, 0.4), 240)
            setState({ phase: 'done', remaining: 0, total: dur, stagesComplete: [1, 2, 3] })
          }
          return
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [delays, calibOffset, beep]
  )

  const start = useCallback(() => {
    if (state.phase !== 'idle') return
    completedRef.current = []
    runStage(1)
  }, [state.phase, runStage])

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    clearCountdowns()
    completedRef.current = []
    setState({ phase: 'idle', remaining: 0, total: 0, stagesComplete: [] })
  }, [])

  return { state, start, reset }
}

import { useRef, useState, useCallback } from 'react'
import { useAudio } from './useAudio'

export type TimerPhase = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'done'

export interface TimerState {
  phase: TimerPhase
  remaining: number  // ms
  total: number      // ms for current stage
  stagesComplete: number[]  // 1-indexed
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

  const runStage = useCallback(
    (stage: number) => {
      stageRef.current = stage
      const dur = stage === 3 ? delays[2] + calibOffset : delays[stage - 1]
      startRef.current = performance.now()

      beep(660, 0.08)

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
            beep(440, 0.1)  // beep to signal stage completion
            setTimeout(() => runStage(stage + 1), 100)
          } else {
            // 6-beep countdown: 5, 4, 3, 2, 1, GO
            beep(880, 0.12)     // 5
            setTimeout(() => beep(880, 0.12), 130)   // 4
            setTimeout(() => beep(880, 0.12), 260)   // 3
            setTimeout(() => beep(880, 0.12), 390)   // 2
            setTimeout(() => beep(880, 0.12), 520)   // 1
            setTimeout(() => beep(1568, 0.3), 650)   // GO (higher pitch)
            setState({
              phase: 'done',
              remaining: 0,
              total: dur,
              stagesComplete: [1, 2, 3],
            })
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
    completedRef.current = []
    setState({ phase: 'idle', remaining: 0, total: 0, stagesComplete: [] })
  }, [])

  return { state, start, reset }
}

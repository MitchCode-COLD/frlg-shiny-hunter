import { useState, useRef, useCallback } from 'react'
import { useAudio } from '../hooks/useAudio'

interface Props {
  delays: [number, number, number]
  calibOffset: number
}

interface Hit {
  id: number
  errorMs: number
  errorFrames: number
  early: boolean
}

const FRAME_MS = 1000 / 119.4

export default function Practice(_props: Props) {
  const { beep } = useAudio()
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle')
  const [hits, setHits] = useState<Hit[]>([])
  const [countdown, setCountdown] = useState(0)
  const cueTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const countdownRefs = useRef<ReturnType<typeof setTimeout>[]>([])
  const hitIdRef = useRef(0)

  function clearCountdowns() {
    countdownRefs.current.forEach(clearTimeout)
    countdownRefs.current = []
  }

  const startRound = useCallback(() => {
    setPhase('waiting')
    const delay = 4000 + Math.random() * 4000  // 4-8s, gives room for 3-2-1
    const cueAt = performance.now() + delay
    cueTimeRef.current = cueAt

    // 5-4-3-2-1 at exact 1-second intervals — beat 6 is the tap cue
    clearCountdowns()
    const countBeats = [5000, 4000, 3000, 2000, 1000]
    countBeats.forEach((ms, i) => {
      if (delay > ms + 200) {
        const freq = 350 + i * 60
        countdownRefs.current.push(setTimeout(() => beep(freq, 0.08), delay - ms))
      }
    })

    const tick = () => {
      const now = performance.now()
      const rem = cueAt - now
      setCountdown(Math.max(0, rem))
      if (rem <= 0) {
        beep(880, 0.15)
        setPhase('ready')
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [beep])

  const handleTap = useCallback(() => {
    if (phase === 'idle' || phase === 'result') {
      startRound()
      return
    }
    if (phase === 'waiting') {
      cancelAnimationFrame(rafRef.current)
      clearCountdowns()
      const errorMs = performance.now() - cueTimeRef.current
      const errorFrames = Math.abs(errorMs) / FRAME_MS
      setHits(prev => [...prev, { id: hitIdRef.current++, errorMs, errorFrames, early: errorMs < 0 }])
      setPhase('result')
      return
    }
    if (phase === 'ready') {
      const errorMs = performance.now() - cueTimeRef.current
      const errorFrames = Math.abs(errorMs) / FRAME_MS
      beep(errorFrames <= 1 ? 1046 : errorFrames <= 5 ? 660 : 440, 0.1)
      setHits(prev => [...prev, { id: hitIdRef.current++, errorMs, errorFrames, early: errorMs < 0 }])
      setPhase('result')
    }
  }, [phase, startRound, beep])

  const avgError = hits.length
    ? hits.reduce((s, h) => s + h.errorFrames, 0) / hits.length
    : null

  function hitClass(h: Hit) {
    if (h.errorFrames <= 1) return 'practice-error-good'
    if (h.errorFrames <= 5) return 'practice-error-ok'
    return 'practice-error-bad'
  }

  const isReady = phase === 'ready'

  return (
    <>
      <div className="callout callout-blue">
        <strong>Timing practice:</strong> Wait for the 3-2-1 beeps, then tap when you hear the final high beep (or the button flashes). Measured in frames at Switch speed (1 frame ≈ 8.4ms). Aim for within 1–2 frames.
      </div>

      <div className="card practice-card">
        <button
          type="button"
          className={`practice-btn${isReady ? ' practice-btn-ready' : ''}`}
          onClick={handleTap}
        >
          {phase === 'idle' ? 'Tap to start'
            : phase === 'waiting' ? `Wait… ${(countdown / 1000).toFixed(1)}s`
            : phase === 'ready' ? '★ TAP NOW! ★'
            : 'Tap to try again'}
        </button>

        {phase === 'result' && hits.length > 0 && (() => {
          const last = hits[hits.length - 1]
          return (
            <div className="practice-result">
              {last.early ? 'Too early' : 'Too late'} by{' '}
              <span className={hitClass(last)}>
                {last.errorFrames.toFixed(1)} frames ({last.errorMs > 0 ? '+' : ''}{last.errorMs.toFixed(0)}ms)
              </span>
            </div>
          )
        })()}

        {avgError !== null && (
          <div className="practice-avg">
            Average: {avgError.toFixed(1)} frames over {hits.length} hit{hits.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {hits.length > 0 && (
        <div className="card">
          <div className="log-history-header">
            <div className="card-title log-history-title">Hit history</div>
            <button type="button" className="danger" onClick={() => setHits([])}>Clear</button>
          </div>
          {[...hits].reverse().map((h, i) => (
            <div className="practice-hit" key={h.id}>
              <span className="practice-hit-num">#{hits.length - i}</span>
              <span className={hitClass(h)}>
                {h.early ? '←' : '→'} {h.errorFrames.toFixed(1)} frames
              </span>
              <span className="practice-hit-ms">
                {h.early ? '-' : '+'}{Math.abs(h.errorMs).toFixed(0)}ms {h.early ? '(early)' : '(late)'}
              </span>
              <span>
                {h.errorFrames <= 1
                  ? <span className="badge badge-shiny">★ Perfect</span>
                  : h.errorFrames <= 3
                  ? <span className="badge badge-ok">Good</span>
                  : <span className="badge badge-no">Off</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

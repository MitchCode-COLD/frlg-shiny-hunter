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

const FRAME_MS = 1000 / 119.4  // ~8.38ms per frame on Switch

export default function Practice(_props: Props) {
  const { beep } = useAudio()
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'ready' | 'result'>('idle')
  const [hits, setHits] = useState<Hit[]>([])
  const [countdown, setCountdown] = useState(0)
  const cueTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const hitIdRef = useRef(0)

  const startRound = useCallback(() => {
    setPhase('waiting')
    const delay = 3000 + Math.random() * 3000  // 3-6s
    const cueAt = performance.now() + delay
    cueTimeRef.current = cueAt

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
      // Tapped too early — penalise
      cancelAnimationFrame(rafRef.current)
      const errorMs = performance.now() - cueTimeRef.current  // negative = early
      const absMs = Math.abs(errorMs)
      const errorFrames = absMs / FRAME_MS
      setHits(prev => [...prev, { id: hitIdRef.current++, errorMs, errorFrames, early: errorMs < 0 }])
      setPhase('result')
      return
    }
    if (phase === 'ready') {
      const errorMs = performance.now() - cueTimeRef.current
      const absMs = Math.abs(errorMs)
      const errorFrames = absMs / FRAME_MS
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

  return (
    <>
      <div className="callout callout-blue">
        <strong>Timing practice:</strong> Tap the big button when you hear the beep (or see it flash). Your reaction time is measured in frames at Switch speed (1 frame ≈ 8.4ms). Try to stay within 1–2 frames.
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <button
          className="primary"
          onClick={handleTap}
          style={{
            width: '100%',
            padding: '40px 20px',
            fontSize: 24,
            fontWeight: 700,
            background: phase === 'ready' ? 'var(--gold)' : undefined,
            color: phase === 'ready' ? '#000' : undefined,
            borderColor: phase === 'ready' ? 'var(--gold)' : undefined,
            transition: 'all 0.05s',
          }}
        >
          {phase === 'idle' ? 'Tap to start' : phase === 'waiting' ? `Wait… (${(countdown / 1000).toFixed(1)}s)` : phase === 'ready' ? '★ TAP NOW! ★' : 'Tap to try again'}
        </button>

        {phase === 'result' && hits.length > 0 && (() => {
          const last = hits[hits.length - 1]
          return (
            <div style={{ marginTop: 16, fontSize: 16 }}>
              {last.early ? 'Too early' : 'Too late'} by{' '}
              <span className={hitClass(last)}>
                {last.errorFrames.toFixed(1)} frames ({last.errorMs > 0 ? '+' : ''}{last.errorMs.toFixed(0)}ms)
              </span>
            </div>
          )
        })()}

        {avgError !== null && (
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--muted)' }}>
            Average error: {avgError.toFixed(1)} frames over {hits.length} hit{hits.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {hits.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>Hit history</div>
            <button className="danger" onClick={() => setHits([])}>Clear</button>
          </div>
          {[...hits].reverse().map((h, i) => (
            <div className="practice-hit" key={h.id}>
              <span style={{ color: 'var(--hint)' }}>#{hits.length - i}</span>
              <span className={hitClass(h)}>
                {h.early ? '←' : '→'} {h.errorFrames.toFixed(1)} frames
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                {h.early ? '-' : '+'}{Math.abs(h.errorMs).toFixed(0)}ms {h.early ? '(early)' : '(late)'}
              </span>
              <span style={{ fontSize: 12 }}>
                {h.errorFrames <= 1
                  ? <span className="badge badge-shiny">★ Perfect</span>
                  : h.errorFrames <= 3
                  ? <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text)' }}>Good</span>
                  : <span className="badge badge-no">Off</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

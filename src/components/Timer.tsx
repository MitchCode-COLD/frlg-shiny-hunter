import { useTimer } from '../hooks/useTimer'

interface Props {
  tid: number; sid: number; myTSV: number; targetAdvance: number; initialSeed: number
  delays: [number, number, number]; calibOffset: number
  setDelays: (v: [number, number, number]) => void; setCalibOffset: (v: number) => void
  setTid: (v: number) => void; setSid: (v: number) => void
  setTargetAdvance: (v: number) => void; setInitialSeed: (v: number) => void
  onFixOffset: () => void; onLog: () => void
}

const STAGE_LABELS = [
  { name: 'Boot → home menu', desc: 'Launch the game, then immediately press the home button to go back to the Switch home screen' },
  { name: 'Resume → continue screen', desc: 'Tap the game to resume it, then press A when you see "Continue"' },
  { name: 'Press A to grab your starter', desc: 'Walk up to the Poké Ball and press A at exactly the right moment — this is the critical press' },
]

export default function Timer({ delays, calibOffset, setDelays, setCalibOffset, onFixOffset, onLog }: Props) {
  const { state, start, reset } = useTimer(delays, calibOffset)

  function stageDotClass(n: number) {
    if (state.stagesComplete.includes(n)) return 'stage-dot done'
    if (state.phase === `stage${n}`) return 'stage-dot active'
    return 'stage-dot'
  }

  function stageDotLabel(n: number) {
    return state.stagesComplete.includes(n) ? '✓' : n
  }

  function stageTimeDisplay(n: number) {
    if (state.phase === `stage${n}`) return (state.remaining / 1000).toFixed(2) + 's'
    if (state.stagesComplete.includes(n)) return '✓'
    return '—'
  }

  const progress = state.phase === 'done' ? 100
    : state.phase === 'idle' ? 0
    : state.total > 0 ? Math.min(100, ((state.total - state.remaining) / state.total) * 100) : 0

  const timerDisplay = state.phase === 'done' ? 'NOW!'
    : state.phase === 'idle' ? '—'
    : (state.remaining / 1000).toFixed(2)

  const timerClass = 'big-timer' + (state.phase === 'done' || (state.remaining < 1000 && state.phase !== 'idle') ? ' go' : '')

  const statusText = state.phase === 'idle' ? "Press Start when you're ready"
    : state.phase === 'done' ? '★ Press A to grab your starter!'
    : `Stage ${state.phase.replace('stage', '')}: ${STAGE_LABELS[+(state.phase.replace('stage', '')) - 1].name}`

  return (
    <>
      <div className="callout callout-blue">
        <strong>How this works:</strong> Three countdown stages. Each beeps when it starts. The final "NOW!" triggers a fanfare. The Switch runs FRLG's RNG <strong>2× faster</strong> than GBA — use the offset to calibrate after each miss.
      </div>

      <div className="card">
        <div className="card-title">Stage delays</div>
        {([1, 2, 3] as const).map(n => (
          <div className="field" key={n}>
            <label htmlFor={`stage-delay-${n}`}>Stage {n}: {STAGE_LABELS[n - 1].name} (ms)</label>
            <input
              id={`stage-delay-${n}`}
              type="number"
              value={delays[n - 1]}
              min={100}
              step={50}
              onChange={e => {
                const v = Math.max(100, +e.target.value || 100)
                const next: [number, number, number] = [...delays] as [number, number, number]
                next[n - 1] = v
                setDelays(next)
              }}
            />
            <div className="hint">= {(delays[n - 1] / 1000).toFixed(2)} seconds</div>
          </div>
        ))}

        <div className="divider" />

        <label htmlFor="calib-offset">Calibration offset</label>
        <p className="hint calib-hint">
          Positive = pressing too late. Negative = pressing too early. 1 frame ≈ 8.4ms. Use "Fix Offset" after a miss to auto-calculate.
        </p>
        <div className="calib-row">
          <input
            id="calib-offset"
            type="range"
            title="Calibration offset in milliseconds"
            min={-500}
            max={500}
            value={calibOffset}
            step={10}
            onChange={e => setCalibOffset(+e.target.value)}
          />
          <span className="calib-val">{calibOffset >= 0 ? '+' : ''}{calibOffset} ms</span>
          {calibOffset !== 0 && (
            <button type="button" className="danger calib-reset" onClick={() => setCalibOffset(0)}>Reset</button>
          )}
        </div>
      </div>

      <div className="card">
        {STAGE_LABELS.map((s, i) => (
          <div className="stage" key={i}>
            <div className={stageDotClass(i + 1)}>{stageDotLabel(i + 1)}</div>
            <div className="stage-info">
              <div className="stage-name">{s.name}</div>
              <div className="stage-desc">{s.desc}</div>
            </div>
            <div className="stage-time">{stageTimeDisplay(i + 1)}</div>
          </div>
        ))}

        <div className={timerClass}>{timerDisplay}</div>
        <div className="timer-status">{statusText}</div>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="btn-row">
          <button type="button" className="primary" onClick={start} disabled={state.phase !== 'idle'}>
            Start timer
          </button>
          <button type="button" className="danger" onClick={reset}>Reset</button>
        </div>

        {state.phase === 'done' && (
          <div className="post-done-row">
            <button type="button" className="primary" onClick={() => { reset(); onLog() }}>
              ★ Got it! Log the win
            </button>
            <button type="button" onClick={() => { reset(); onFixOffset() }}>
              Missed? Fix offset →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

import type { LogEntry } from '../types'

interface Props {
  attempts: number
  onAdd: () => void
  onReset: () => void
  logs: LogEntry[]
}

export default function StatsBar({ attempts, onAdd, onReset, logs }: Props) {
  const withFrames = logs.filter(l => l.framesOff !== null)
  const absFrames = withFrames.map(l => Math.abs(l.framesOff!))

  const avg = absFrames.length
    ? (absFrames.reduce((s, v) => s + v, 0) / absFrames.length).toFixed(1)
    : null

  const best = absFrames.length ? Math.min(...absFrames) : null

  // Trend: compare last 3 vs previous average
  let trend: '↑' | '↓' | '→' | null = null
  if (absFrames.length >= 4) {
    const last3 = absFrames.slice(-3).reduce((s, v) => s + v, 0) / 3
    const prev = absFrames.slice(0, -3).reduce((s, v) => s + v, 0) / (absFrames.length - 3)
    if (last3 < prev - 0.5) trend = '↑'
    else if (last3 > prev + 0.5) trend = '↓'
    else trend = '→'
  }

  const trendClass = trend === '↑' ? 'trend-up' : trend === '↓' ? 'trend-down' : 'trend-flat'
  const trendLabel = trend === '↑' ? 'Improving' : trend === '↓' ? 'Getting worse' : 'Stable'

  return (
    <div className="stats-bar">
      <div className="stats-cell">
        <div className="stats-label">Resets</div>
        <div className="stats-value">{attempts}</div>
      </div>

      <div className="stats-cell">
        <div className="stats-label">Avg frames off</div>
        <div className="stats-value">{avg !== null ? `±${avg}` : '—'}</div>
      </div>

      <div className="stats-cell">
        <div className="stats-label">Best</div>
        <div className="stats-value stats-best">{best !== null ? `${best} fr` : '—'}</div>
      </div>

      {trend && (
        <div className="stats-cell">
          <div className="stats-label">Trend</div>
          <div className={`stats-value ${trendClass}`} title={trendLabel}>{trend} {trendLabel}</div>
        </div>
      )}

      <div className="stats-actions">
        <button type="button" className="primary stats-add-btn" onClick={onAdd} title="Count this reset">
          + Reset
        </button>
        <button type="button" className="danger stats-reset-btn" onClick={onReset} title="Reset counter">
          ✕
        </button>
      </div>
    </div>
  )
}

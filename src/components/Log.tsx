import { useState } from 'react'
import type { LogEntry } from '../types'

interface Props {
  logs: LogEntry[]
  setLogs: (logs: LogEntry[]) => void
  lastFrameMatch: number | null
}

export default function Log({ logs, setLogs, lastFrameMatch }: Props) {
  const [starter, setStarter] = useState('Bulbasaur')
  const [result, setResult] = useState<'no' | 'yes'>('no')
  const [framesOff, setFramesOff] = useState(lastFrameMatch !== null ? String(lastFrameMatch) : '')
  const [note, setNote] = useState('')

  function addLog() {
    const entry: LogEntry = {
      n: logs.length + 1,
      starter,
      isShiny: result === 'yes',
      framesOff: framesOff ? +framesOff : null,
      note,
      time: new Date().toLocaleTimeString(),
    }
    setLogs([...logs, entry])
    setFramesOff('')
    setNote('')
  }

  return (
    <>
      <div className="callout callout-blue">
        <strong>Track every attempt.</strong> Most people find their shiny in 5–15 tries once calibrated. Logging your frame offset shows whether you're converging.
      </div>

      <div className="card">
        <div className="card-title">Record this attempt</div>
        <div className="row">
          <div className="field">
            <label htmlFor="log-starter">Starter</label>
            <select id="log-starter" value={starter} onChange={e => setStarter(e.target.value)}>
              <option>Bulbasaur</option>
              <option>Charmander</option>
              <option>Squirtle</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="log-result">Shiny?</label>
            <select id="log-result" value={result} onChange={e => setResult(e.target.value as 'no' | 'yes')}>
              <option value="no">No — trying again</option>
              <option value="yes">Yes — got it!</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="log-frames">Frames off (from Fix Offset)</label>
            <input
              id="log-frames"
              type="number"
              value={framesOff}
              placeholder="e.g. 12 or -5"
              onChange={e => setFramesOff(e.target.value)}
            />
          </div>
        </div>
        <div className="field log-note-field">
          <label htmlFor="log-note">What did you adjust?</label>
          <input
            id="log-note"
            type="text"
            value={note}
            placeholder="e.g. moved offset to -200ms"
            onChange={e => setNote(e.target.value)}
          />
        </div>
        <div className="log-save-row">
          <button type="button" className="primary" onClick={addLog}>Save attempt</button>
        </div>
      </div>

      <div className="card">
        <div className="log-history-header">
          <div className="card-title log-history-title">Attempt history</div>
          <div className="log-count">{logs.length} attempt{logs.length !== 1 ? 's' : ''}</div>
        </div>
        {logs.length === 0
          ? <div className="empty">Nothing logged yet — your first attempt will appear here</div>
          : [...logs].reverse().map(l => (
            <div className="log-entry" key={l.n}>
              <div className="log-num">#{l.n}</div>
              <div className="log-body">
                <div className={`log-title${l.isShiny ? ' log-shiny' : ''}`}>
                  {l.isShiny ? '★ Shiny! ' : ''}{l.starter}
                </div>
                {l.framesOff !== null && <div className="log-sub">Frame offset: {l.framesOff}</div>}
                {l.note && <div className="log-sub">{l.note}</div>}
              </div>
              <div className="log-time">{l.time}</div>
            </div>
          ))
        }
      </div>
    </>
  )
}

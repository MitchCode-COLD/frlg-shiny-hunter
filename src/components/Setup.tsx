import { useState } from 'react'
import { psv, generateFrames } from '../lib/rng'

interface Props {
  tid: number; sid: number; myTSV: number; targetAdvance: number; initialSeed: number
  setTid: (v: number) => void; setSid: (v: number) => void
  setTargetAdvance: (v: number) => void; setInitialSeed: (v: number) => void
  // unused in this component but keep signature consistent
  delays: [number, number, number]; calibOffset: number
  setDelays: (v: [number, number, number]) => void; setCalibOffset: (v: number) => void
}

export default function Setup({ tid, sid, myTSV, targetAdvance, initialSeed, setTid, setSid, setTargetAdvance, setInitialSeed }: Props) {
  const [pidInput, setPidInput] = useState('')

  const frames = generateFrames(initialSeed, targetAdvance, 4, myTSV)

  let pidCheck: string | null = null
  const pidRaw = pidInput.trim()
  if (pidRaw) {
    const pidVal = parseInt(pidRaw, 16)
    if (isNaN(pidVal)) {
      pidCheck = 'error'
    } else {
      const pv = psv(pidVal)
      pidCheck = pv === myTSV ? `shiny:${pv}` : `no:${pv}`
    }
  }

  function hex8(n: number) { return n.toString(16).toUpperCase().padStart(8, '0') }

  return (
    <>
      <div className="callout callout-gold">
        <strong>Before you start:</strong> Create a dummy save file with text speed set to <strong>Fast</strong>. This makes your timing consistent every boot.
      </div>

      <div className="card">
        <div className="card-title">Your Trainer IDs</div>
        <p className="hint" style={{ marginBottom: 12 }}>
          TID is shown in your Trainer Card. SID is hidden — use Lincoln's tool to find it from your initial seed.
        </p>
        <div className="row">
          <div className="field">
            <label>Trainer ID (TID)</label>
            <input type="number" value={tid} min={0} max={65535}
              onChange={e => setTid(Math.min(65535, Math.max(0, +e.target.value || 0)))} />
          </div>
          <div className="field">
            <label>Secret ID (SID)</label>
            <input type="number" value={sid} min={0} max={65535}
              onChange={e => setSid(Math.min(65535, Math.max(0, +e.target.value || 0)))} />
          </div>
          <div className="field">
            <label>Initial Seed (hex)</label>
            <input type="text" value={'0x' + initialSeed.toString(16).toUpperCase().padStart(4, '0')}
              style={{ fontFamily: 'monospace' }}
              onChange={e => {
                const v = parseInt(e.target.value.replace(/^0x/i, ''), 16)
                if (!isNaN(v)) setInitialSeed(v >>> 0)
              }} />
          </div>
        </div>
        <div className="divider" />
        <div className="card-title">Your Trainer Shiny Value (TSV)</div>
        <p className="hint" style={{ marginBottom: 10 }}>Any Pokémon whose PSV matches this will be shiny for you.</p>
        <div className="big-number">{myTSV}</div>
      </div>

      <div className="card">
        <div className="card-title">Target Advance</div>
        <p className="hint" style={{ marginBottom: 12 }}>
          The advance number from Lincoln's tool or RNG Reporter where your shiny starter is. Table uses proper Gen 3 LCG math.
        </p>
        <div className="field">
          <label>Target advance number</label>
          <input type="number" value={targetAdvance} min={0}
            onChange={e => setTargetAdvance(Math.max(0, +e.target.value || 0))} />
        </div>
        <div className="divider" />
        <div className="card-title">Frames around target</div>
        <p className="hint" style={{ marginBottom: 10 }}>
          Target highlighted blue. IVs shown are the actual Gen 3 Method 1 values for each advance.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="ftable">
            <thead>
              <tr>
                <th>Advance</th>
                <th>Seed</th>
                <th>PID</th>
                <th>PSV</th>
                <th>HP·Atk·Def·SpA·SpD·Spe</th>
                <th>Shiny?</th>
              </tr>
            </thead>
            <tbody>
              {frames.map(f => (
                <tr key={f.advance} className={f.advance === targetAdvance ? 'target' : f.isShiny ? 'shiny-match' : ''}>
                  <td>
                    {f.advance}
                    {f.advance === targetAdvance && <span className="badge badge-target" style={{ marginLeft: 6 }}>TARGET</span>}
                  </td>
                  <td className="mono">{hex8(f.seed)}</td>
                  <td className="mono">{hex8(f.pid)}</td>
                  <td>{f.pidSV}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{f.ivs.join('·')}</td>
                  <td>
                    {f.isShiny
                      ? <span className="badge badge-shiny">★ Shiny</span>
                      : <span className="badge badge-no">No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Check any Pokémon's PID (optional)</div>
        <div className="field">
          <label>Pokémon PID (hex, e.g. 1A2B3C4D)</label>
          <input type="text" value={pidInput} placeholder="Leave blank if not needed"
            style={{ fontFamily: 'monospace' }}
            onChange={e => setPidInput(e.target.value)} />
        </div>
        {pidCheck && (
          <div style={{ marginTop: 8, fontSize: 14 }}>
            {pidCheck === 'error' && <span style={{ color: 'var(--red)' }}>Not a valid hex number</span>}
            {pidCheck?.startsWith('shiny') && (
              <span style={{ color: 'var(--gold)' }}>★ This Pokémon IS shiny for you! (PSV {pidCheck.split(':')[1]} = TSV {myTSV})</span>
            )}
            {pidCheck?.startsWith('no') && (
              <span style={{ color: 'var(--muted)' }}>Not shiny for you. PSV {pidCheck.split(':')[1]}, your TSV {myTSV}.</span>
            )}
          </div>
        )}
      </div>
    </>
  )
}

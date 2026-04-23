import { useState } from 'react'
import { psv, generateFrames } from '../lib/rng'

interface Props {
  tid: number; sid: number; myTSV: number; targetAdvance: number; initialSeed: number
  setTid: (v: number) => void; setSid: (v: number) => void
  setTargetAdvance: (v: number) => void; setInitialSeed: (v: number) => void
  delays: [number, number, number]; calibOffset: number
  setDelays: (v: [number, number, number]) => void; setCalibOffset: (v: number) => void
}

export default function Setup({ tid, sid, myTSV, targetAdvance, initialSeed, setTid, setSid, setTargetAdvance, setInitialSeed }: Props) {
  const [pidInput, setPidInput] = useState('')

  const frames = generateFrames(initialSeed, targetAdvance, 4, myTSV)

  const seedHex = '0x' + tid.toString(16).toUpperCase().padStart(4, '0')

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

  function handleTidChange(v: number) {
    setTid(v)
    setInitialSeed(v)
  }

  return (
    <>
      <div className="callout callout-gold">
        <strong>Before you start:</strong> Create a dummy save file with text speed set to <strong>Fast</strong>. This makes your timing consistent every boot.
      </div>

      <div className="card">
        <div className="card-title">Your Trainer IDs</div>
        <div className="callout callout-blue setup-tip">
          <strong>How this works:</strong> In FRLG, your TID <em>is</em> your initial seed — the same number, just written in hex. Enter your TID (visible on your Trainer Card) and everything else is calculated automatically. Find your SID using <a href="https://lincoln-lm.github.io/JS-Finder/Gen3/IDs.html" target="_blank" rel="noopener noreferrer" className="setup-link">Lincoln's ID finder</a>.
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="setup-tid">Trainer ID (TID)</label>
            <input
              id="setup-tid"
              type="number"
              value={tid}
              min={0}
              max={65535}
              onChange={e => handleTidChange(Math.min(65535, Math.max(0, +e.target.value || 0)))}
            />
            <div className="hint">Initial seed: <strong className="setup-seed-val">{seedHex}</strong></div>
          </div>
          <div className="field">
            <label htmlFor="setup-sid">Secret ID (SID)</label>
            <input
              id="setup-sid"
              type="number"
              value={sid}
              min={0}
              max={65535}
              onChange={e => setSid(Math.min(65535, Math.max(0, +e.target.value || 0)))}
            />
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
          The advance number where your shiny starter is. Use the Seed Calc tab to find it. Table uses Gen 3 LCG math.
        </p>
        <div className="field">
          <label htmlFor="setup-target">Target advance number</label>
          <input
            id="setup-target"
            type="number"
            value={targetAdvance}
            min={0}
            onChange={e => setTargetAdvance(Math.max(0, +e.target.value || 0))}
          />
        </div>
        <div className="divider" />
        <div className="card-title">Frames around target</div>
        <p className="hint" style={{ marginBottom: 10 }}>
          Target highlighted blue. IVs are Gen 3 Method 1 values.
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
                    {f.advance === targetAdvance && <span className="badge badge-target setup-target-badge">TARGET</span>}
                  </td>
                  <td className="mono">{hex8(f.seed)}</td>
                  <td className="mono">{hex8(f.pid)}</td>
                  <td>{f.pidSV}</td>
                  <td className="mono setup-ivs">{f.ivs.join('·')}</td>
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
          <label htmlFor="setup-pid">Pokémon PID (hex, e.g. 1A2B3C4D)</label>
          <input
            id="setup-pid"
            type="text"
            value={pidInput}
            placeholder="Leave blank if not needed"
            className="mono-input"
            onChange={e => setPidInput(e.target.value)}
          />
        </div>
        {pidCheck && (
          <div className="pid-result">
            {pidCheck === 'error' && <span className="text-red">Not a valid hex number</span>}
            {pidCheck?.startsWith('shiny') && (
              <span className="text-gold">★ This Pokémon IS shiny for you! (PSV {pidCheck.split(':')[1]} = TSV {myTSV})</span>
            )}
            {pidCheck?.startsWith('no') && (
              <span className="muted">Not shiny for you. PSV {pidCheck.split(':')[1]}, your TSV {myTSV}.</span>
            )}
          </div>
        )}
      </div>
    </>
  )
}

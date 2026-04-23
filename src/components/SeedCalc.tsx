import { useState } from 'react'
import { findNextShiny } from '../lib/rng'

interface Props {
  tid: number; sid: number; myTSV: number; targetAdvance: number; initialSeed: number
  setInitialSeed: (v: number) => void; setTargetAdvance: (v: number) => void
  delays: [number, number, number]; calibOffset: number
  setTid: (v: number) => void; setSid: (v: number) => void
  setDelays: (v: [number, number, number]) => void; setCalibOffset: (v: number) => void
}

export default function SeedCalc({ tid, sid, myTSV, initialSeed, targetAdvance, setInitialSeed, setTargetAdvance }: Props) {
  const [searchMin, setSearchMin] = useState(0)
  const [searchMax, setSearchMax] = useState(10000)
  const [shinyResult, setShinyResult] = useState<{ advance: number; ivs: number[] } | null | 'none'>('none')

  function hex(n: number, pad = 8) { return '0x' + n.toString(16).toUpperCase().padStart(pad, '0') }

  // On Switch NSO, FRLG runs RNG at 2× speed (59.7fps × 2 = ~119.4 advances/sec)
  const SWITCH_APS = 119.4

  function doSearch() {
    const result = findNextShiny(initialSeed, searchMin, searchMax, myTSV)
    if (!result) { setShinyResult(null); return }
    setShinyResult({ advance: result.advance, ivs: result.ivs })
  }

  function useAsTarget(adv: number) {
    setTargetAdvance(adv)
  }

  // Time estimates for Switch (2× speed)
  function frameToTime(frames: number) {
    const seconds = frames / SWITCH_APS
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const m = Math.floor(seconds / 60)
    const s = (seconds % 60).toFixed(0)
    return `${m}m ${s}s`
  }

  return (
    <>
      <div className="callout callout-blue">
        <strong>Switch NSO timing:</strong> On Switch, FRLG advances the RNG at ~119.4 advances/second (2× GBA speed). Your target seed is <span className="mono">{hex(initialSeed, 4)}</span>. Use Lincoln's "10 Lines" tool to determine your boot timing to hit this seed.
      </div>

      <div className="card">
        <div className="card-title">Current Seed Info</div>
        <div className="seed-result">
          <div><strong style={{ color: 'var(--text)' }}>Initial seed:</strong> <span className="mono">{hex(initialSeed)}</span></div>
          <div><strong style={{ color: 'var(--text)' }}>Your TSV:</strong> {myTSV} (TID {tid} XOR SID {sid})</div>
          <div><strong style={{ color: 'var(--text)' }}>Switch advance rate:</strong> ~119.4 advances/sec</div>
          <div><strong style={{ color: 'var(--text)' }}>Target advance {targetAdvance}:</strong> ~{frameToTime(targetAdvance)} after seed sets</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label>Override initial seed (hex)</label>
          <input type="text"
            style={{ fontFamily: 'monospace' }}
            value={hex(initialSeed, 4)}
            onChange={e => {
              const v = parseInt(e.target.value.replace(/^0x/i, ''), 16)
              if (!isNaN(v)) setInitialSeed(v >>> 0)
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Find next shiny advance</div>
        <p className="hint" style={{ marginBottom: 12 }}>Search for the closest advance where your starter would be shiny, starting from your seed.</p>
        <div className="row">
          <div className="field">
            <label>Search from advance</label>
            <input type="number" value={searchMin} min={0} onChange={e => setSearchMin(+e.target.value || 0)} />
          </div>
          <div className="field">
            <label>Search to advance</label>
            <input type="number" value={searchMax} min={1} onChange={e => setSearchMax(+e.target.value || 1)} />
          </div>
        </div>
        <button className="primary" onClick={doSearch}>Search</button>

        {shinyResult !== 'none' && (
          <div className="seed-result" style={{ marginTop: 12 }}>
            {shinyResult === null ? (
              <span style={{ color: 'var(--red)' }}>No shiny found in that range. Try expanding the search.</span>
            ) : (
              <>
                <div><strong style={{ color: 'var(--gold)' }}>★ Shiny at advance {shinyResult.advance}</strong></div>
                <div>~{frameToTime(shinyResult.advance)} after seed initialization</div>
                <div style={{ marginTop: 8 }}>IVs: HP {shinyResult.ivs[0]} · Atk {shinyResult.ivs[1]} · Def {shinyResult.ivs[2]} · SpA {shinyResult.ivs[3]} · SpD {shinyResult.ivs[4]} · Spe {shinyResult.ivs[5]}</div>
                <div style={{ marginTop: 10 }}>
                  <button className="primary" onClick={() => useAsTarget(shinyResult.advance)}>
                    Use advance {shinyResult.advance} as my target
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">How Switch NSO timing works</div>
        <div className="callout callout-gold" style={{ marginBottom: 0 }}>
          <ol style={{ paddingLeft: 18, lineHeight: 2 }}>
            <li>Boot the game — the seed is set by system timing when the title loads</li>
            <li>Use Lincoln's "10 Lines" to identify your seed from the initial screen</li>
            <li>The RNG advances ~119 times per second (2× GBA rate) in the background</li>
            <li>You press A to grab your starter — this locks in the current advance</li>
            <li>Your goal: press A at exactly the advance where PSV = TSV</li>
          </ol>
        </div>
      </div>
    </>
  )
}

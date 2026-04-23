import { useState, useMemo } from 'react'
import { BASES, STAT_KEYS, STAT_NAMES, statRange, solveIV, StarterKey } from '../lib/ivCalc'
import { advanceN, genPID, genIVs } from '../lib/rng'

interface Props {
  targetAdvance: number
  initialSeed: number
  calibOffset: number
  onApply: (frameMatch: number) => void
}

const NATURES = [
  { label: 'Neutral (most common)', value: 1.0 },
  { label: 'Boosting (+10%)', value: 1.1 },
  { label: 'Hindering (-10%)', value: 0.9 },
]

export default function FixOffset({ targetAdvance, initialSeed, calibOffset, onApply }: Props) {
  const [starter, setStarter] = useState<StarterKey>('bulb')
  const [level, setLevel] = useState(6)
  const [nature, setNature] = useState(1.0)
  const [stats, setStats] = useState<Record<string, string>>({})

  const base = BASES[starter]

  const ranges = useMemo(() =>
    Object.fromEntries(
      STAT_KEYS.map(s => [s, statRange(base[s], level, s === 'hp', nature)])
    ), [base, level, nature])

  const ivs = useMemo(() => {
    const result: Record<string, number | null> = {}
    for (const s of STAT_KEYS) {
      const val = stats[s] ? +stats[s] : null
      if (val === null || isNaN(val)) { result[s] = null; continue }
      result[s] = solveIV(base[s], val, level, s === 'hp', nature)
    }
    return result
  }, [stats, base, level, nature])

  const allFilled = STAT_KEYS.every(s => stats[s] !== undefined && stats[s] !== '')
  const anyInvalid = allFilled && STAT_KEYS.some(s => ivs[s] === null)

  const frameMatch = useMemo(() => {
    if (!allFilled || anyInvalid) return null
    const actualIVs = STAT_KEYS.map(s => ivs[s] as number)
    for (let delta = -200; delta <= 200; delta++) {
      const adv = targetAdvance + delta
      if (adv < 0) continue
      const seed = advanceN(initialSeed, adv)
      const { seed: pidSeed } = genPID(seed)
      const { ivs: frameIVs } = genIVs(pidSeed)
      if (frameIVs.every((v, i) => v === actualIVs[i])) return delta
    }
    return null
  }, [ivs, allFilled, anyInvalid, targetAdvance, initialSeed])

  function ivClass(v: number | null) {
    if (v === null) return 'iv-none'
    if (v >= 25) return 'iv-high'
    if (v >= 11) return 'iv-mid'
    return 'iv-low'
  }

  const newOffset = frameMatch !== null ? calibOffset - Math.round(frameMatch * 8.4) : null

  return (
    <>
      <div className="callout callout-gold">
        <strong>After a miss:</strong> Level your starter to 6 or 7, enter its stats below. This finds which frame you actually hit and auto-applies the fix to the timer.
      </div>

      <div className="card">
        <div className="card-title">Step 1 — starter &amp; level</div>
        <div className="row">
          <div className="field">
            <label htmlFor="fix-starter">Starter</label>
            <select id="fix-starter" value={starter} onChange={e => { setStarter(e.target.value as StarterKey); setStats({}) }}>
              <option value="bulb">Bulbasaur</option>
              <option value="char">Charmander</option>
              <option value="squi">Squirtle</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="fix-level">Level</label>
            <select id="fix-level" value={level} onChange={e => { setLevel(+e.target.value); setStats({}) }}>
              <option value={6}>6</option>
              <option value={7}>7</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="fix-nature">Nature modifier</label>
            <select id="fix-nature" value={nature} onChange={e => setNature(+e.target.value)}>
              {NATURES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Step 2 — enter stats</div>
        <p className="hint" style={{ marginBottom: 12 }}>Open your starter's summary and enter each stat. Valid range shown in label.</p>
        <div className="row">
          {STAT_KEYS.map(s => {
            const r = ranges[s]
            return (
              <div className="field" key={s}>
                <label htmlFor={`fix-stat-${s}`}>{STAT_NAMES[s]} <span className="stat-range">({r.lo}–{r.hi})</span></label>
                <input
                  id={`fix-stat-${s}`}
                  type="number"
                  value={stats[s] ?? ''}
                  min={r.lo}
                  max={r.hi}
                  placeholder={`${r.lo}–${r.hi}`}
                  onChange={e => setStats(prev => ({ ...prev, [s]: e.target.value }))}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Step 3 — your IVs</div>
        <div className="iv-grid">
          {STAT_KEYS.map(s => (
            <div className="iv-cell" key={s}>
              <div className="iv-cell-lbl">{STAT_NAMES[s]}</div>
              <div className={`iv-cell-val ${ivClass(ivs[s] ?? null)}`}>
                {ivs[s] !== null && ivs[s] !== undefined ? ivs[s] : '?'}
              </div>
            </div>
          ))}
        </div>

        <div className="divider" />
        <div className="card-title">Step 4 — fix your timer</div>

        <div className="offset-display">
          {!allFilled && (
            <span className="muted">Enter all six stats to see your fix.</span>
          )}
          {allFilled && anyInvalid && (
            <span className="text-red">One or more stats are outside the valid range. Check you entered the right level and have no Vitamin EVs.</span>
          )}
          {allFilled && !anyInvalid && frameMatch === null && (
            <>
              <div className="fix-result-line">
                <strong>IVs found</strong> but couldn't match to a frame within ±200 of your target.
              </div>
              <div className="muted">Try checking your initial seed or target advance in Setup.</div>
            </>
          )}
          {allFilled && !anyInvalid && frameMatch !== null && newOffset !== null && (
            <>
              <div className="fix-result-line">
                <strong>Frame delta: {frameMatch > 0 ? '+' : ''}{frameMatch} frames</strong>
                {' · '}
                {frameMatch === 0
                  ? <span className="text-green">Perfect frame! Check TID/SID if it wasn't shiny.</span>
                  : frameMatch > 0
                  ? <span>Late by {frameMatch} frames (~{Math.round(frameMatch * 8.4)}ms)</span>
                  : <span>Early by {Math.abs(frameMatch)} frames (~{Math.round(Math.abs(frameMatch) * 8.4)}ms)</span>
                }
              </div>
              {frameMatch !== 0 && (
                <div className="fix-apply-row">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => onApply(frameMatch)}
                  >
                    Apply fix → offset becomes {newOffset >= 0 ? '+' : ''}{newOffset}ms
                  </button>
                </div>
              )}
              {frameMatch === 0 && (
                <div className="fix-apply-row">
                  <button type="button" onClick={() => onApply(0)}>← Back to Timer</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

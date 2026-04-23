import { useState } from 'react'
import { tsv } from './lib/rng'
import Setup from './components/Setup'
import SeedCalc from './components/SeedCalc'
import Timer from './components/Timer'
import FixOffset from './components/FixOffset'
import Practice from './components/Practice'
import Log from './components/Log'
import StatsBar from './components/StatsBar'
import type { LogEntry } from './types'

type Tab = 'setup' | 'seed' | 'timer' | 'fix' | 'practice' | 'log'

export default function App() {
  const [tab, setTab] = useState<Tab>('setup')
  const [tid, setTid] = useState(57562)
  const [sid, setSid] = useState(50534)
  const [targetAdvance, setTargetAdvance] = useState(3498)
  const [initialSeed, setInitialSeed] = useState(0x405D)
  const [delays, setDelays] = useState<[number, number, number]>([3000, 2000, 1500])
  const [calibOffset, setCalibOffset] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastFrameMatch, setLastFrameMatch] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)

  const myTSV = tsv(tid, sid)

  const sharedState = { tid, sid, myTSV, targetAdvance, initialSeed, delays, calibOffset }
  const setters = { setTid, setSid, setTargetAdvance, setInitialSeed, setDelays, setCalibOffset }

  return (
    <div className="app">
      <div className="header">
        <h1><span className="star">★</span> FRLG Shiny Starter Tool</h1>
        <p>FireRed &amp; LeafGreen · Nintendo Switch &amp; Switch 2 · No hacks required</p>
      </div>

      <StatsBar
        attempts={attempts}
        onAdd={() => setAttempts(a => a + 1)}
        onReset={() => setAttempts(0)}
        logs={logs}
      />

      <div className="tabs">
        {([
          ['setup', '1. Setup'],
          ['seed', '2. Seed Calc'],
          ['timer', '3. Timer'],
          ['fix', '4. Fix Offset'],
          ['practice', '5. Practice'],
          ['log', '6. Log'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={`tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'setup' && <Setup {...sharedState} {...setters} />}
      {tab === 'seed' && <SeedCalc {...sharedState} {...setters} />}
      {tab === 'timer' && (
        <Timer
          {...sharedState} {...setters}
          onFixOffset={() => setTab('fix')}
          onLog={() => setTab('log')}
        />
      )}
      {tab === 'fix' && (
        <FixOffset
          targetAdvance={targetAdvance}
          initialSeed={initialSeed}
          calibOffset={calibOffset}
          onApply={(delta) => {
            setCalibOffset(c => c - Math.round(delta * 8.4))
            setLastFrameMatch(delta)
            setTab('timer')
          }}
        />
      )}
      {tab === 'practice' && <Practice delays={delays} calibOffset={calibOffset} />}
      {tab === 'log' && <Log logs={logs} setLogs={setLogs} lastFrameMatch={lastFrameMatch} />}
    </div>
  )
}

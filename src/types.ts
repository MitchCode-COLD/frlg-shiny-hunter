export interface AppState {
  tid: number
  sid: number
  targetAdvance: number
  initialSeed: number  // 0x405D default
  delays: [number, number, number]  // ms per stage
  calibOffset: number  // ms
}

export interface LogEntry {
  n: number
  starter: string
  isShiny: boolean
  framesOff: number | null
  note: string
  time: string
}

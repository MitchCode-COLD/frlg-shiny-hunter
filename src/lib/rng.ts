// Gen 3 LCG: next = (seed * 0x41C64E6D + 0x6073) mod 2^32
export function advance(seed: number): number {
  // Math.imul handles 32-bit integer multiplication correctly
  return (Math.imul(seed, 0x41C64E6D) + 0x6073) >>> 0
}

export function advanceN(seed: number, n: number): number {
  let s = seed >>> 0
  for (let i = 0; i < n; i++) s = advance(s)
  return s
}

export function tsv(tid: number, sid: number): number {
  return ((tid ^ sid) >> 4) & 0xFFF
}

export function psv(pid: number): number {
  return (((pid >>> 16) ^ (pid & 0xFFFF)) >> 4) & 0xFFF
}

// Method 1 PID: two consecutive LCG calls, low word then high word
export function genPID(seed: number): { pid: number; seed: number } {
  const s1 = advance(seed)
  const s2 = advance(s1)
  const pid = (((s2 >>> 16) << 16) | (s1 >>> 16)) >>> 0
  return { pid, seed: s2 }
}

// IVs: next two calls after PID seed
// Word1 = next call >>> 16: bits [4:0]=HP, [9:5]=Atk, [14:10]=Def
// Word2 = next call >>> 16: bits [4:0]=SpA, [9:5]=SpD, [14:10]=Spe
export function genIVs(seed: number): { ivs: number[]; seed: number } {
  const s1 = advance(seed)
  const s2 = advance(s1)
  const w1 = s1 >>> 16
  const w2 = s2 >>> 16
  return {
    ivs: [
      w1 & 0x1F,
      (w1 >> 5) & 0x1F,
      (w1 >> 10) & 0x1F,
      w2 & 0x1F,
      (w2 >> 5) & 0x1F,
      (w2 >> 10) & 0x1F,
    ],
    seed: s2,
  }
}

export interface FrameResult {
  advance: number
  seed: number
  pid: number
  pidSV: number
  ivs: number[]
  isShiny: boolean
}

export function generateFrames(
  initialSeed: number,
  targetAdvance: number,
  radius: number,
  trainerTSV: number
): FrameResult[] {
  const results: FrameResult[] = []
  const start = Math.max(0, targetAdvance - radius)
  let seed = advanceN(initialSeed, start)
  for (let i = start; i <= targetAdvance + radius; i++) {
    const { pid, seed: pidSeed } = genPID(seed)
    const { ivs } = genIVs(pidSeed)
    results.push({
      advance: i,
      seed,
      pid,
      pidSV: psv(pid),
      ivs,
      isShiny: psv(pid) === trainerTSV,
    })
    seed = advance(seed)
  }
  return results
}

// Find the first advance >= minAdvance where isShiny
export function findNextShiny(
  initialSeed: number,
  minAdvance: number,
  maxAdvance: number,
  trainerTSV: number
): FrameResult | null {
  let seed = advanceN(initialSeed, minAdvance)
  for (let i = minAdvance; i <= maxAdvance; i++) {
    const { pid, seed: pidSeed } = genPID(seed)
    const { ivs } = genIVs(pidSeed)
    const pv = psv(pid)
    if (pv === trainerTSV) {
      return { advance: i, seed, pid, pidSV: pv, ivs, isShiny: true }
    }
    seed = advance(seed)
  }
  return null
}

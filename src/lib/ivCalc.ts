export const BASES = {
  bulb: { name: 'Bulbasaur', hp: 45, atk: 49, def: 45, spa: 65, spd: 65, spe: 45 },
  char: { name: 'Charmander', hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 },
  squi: { name: 'Squirtle', hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 },
} as const

export type StarterKey = keyof typeof BASES
export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const
export type StatKey = (typeof STAT_KEYS)[number]
export const STAT_NAMES: Record<StatKey, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
}

export function statHP(base: number, iv: number, lv: number): number {
  return Math.floor(((2 * base + iv) * lv) / 100) + lv + 10
}

export function statOther(base: number, iv: number, lv: number, nature: number): number {
  return Math.floor(Math.floor(((2 * base + iv) * lv) / 100 + 5) * nature)
}

export function solveIV(
  base: number,
  val: number,
  lv: number,
  isHP: boolean,
  nature: number
): number | null {
  for (let iv = 0; iv <= 31; iv++) {
    if ((isHP ? statHP(base, iv, lv) : statOther(base, iv, lv, nature)) === val) return iv
  }
  return null
}

export function statRange(base: number, lv: number, isHP: boolean, nature: number) {
  return {
    lo: isHP ? statHP(base, 0, lv) : statOther(base, 0, lv, nature),
    hi: isHP ? statHP(base, 31, lv) : statOther(base, 31, lv, nature),
  }
}

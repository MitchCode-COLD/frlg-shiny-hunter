# FRLG Shiny Hunter

A browser-based RNG manipulation tool for hunting shiny starter Pokémon in **Pokémon FireRed & LeafGreen** running on **Nintendo Switch Online (NSO)**.

Live: https://MitchCode-COLD.github.io/frlg-shiny-hunter/

---

## What it does

- Calculates your Trainer Shiny Value (TSV) from your TID/SID
- Searches your initial seed for the nearest shiny advance
- Runs a three-stage countdown timer calibrated to Switch NSO's 2× RNG speed
- Identifies which frame you hit from your starter's stats and auto-applies the timing fix
- Logs attempts and tracks your calibration convergence
- Includes a reaction-time practice mode

---

## How to use

1. **Setup** — Enter your TID, SID, and initial seed
2. **Seed Calc** — Find the advance where your starter is shiny
3. **Timer** — Run the countdown and press A at "NOW!"
4. **Fix Offset** — If you missed, enter your starter's stats to auto-calculate and apply the correction
5. Repeat until you hit the shiny frame

For initial seed identification, use [Lincoln's Ten Lines tool](https://lincoln-lm.github.io/ten-lines/).

---

## Credits & tools

This tool is built on the work of the Pokémon RNG research community:

- **[Lincoln's Ten Lines](https://lincoln-lm.github.io/ten-lines/)** by lincoln-lm — seed identification for FRLG NSO. Seed data farmed by blisy, po, HunarPG, 10Ben, Real96, Papa Jefé, and トノ.
- **[EonTimer](https://dasampharos.github.io/EonTimer/)** by DasAmpharos — timing tool that inspired the calibration offset workflow used here.
- **[PokeFinder](https://github.com/Admiral-Fish/PokeFinder)** / **PokeFinderCore** — the Gen 3 RNG algorithms and research this tool's math is based on.
- The broader Gen 3 RNG community at [Smogon](https://www.smogon.com/forums/threads/rng-manipulation.92305/) and the PokéRNG Discord.

---

## Disclaimer

This tool is an independent fan project and is **not affiliated with, endorsed by, or connected to** Nintendo, Game Freak, or The Pokémon Company in any way.

Pokémon, FireRed, LeafGreen, and Nintendo Switch are trademarks of their respective owners.

This tool does not modify game files, use emulators, or require any hardware modifications. It is intended purely for timing assistance with legitimately owned copies of the game.

---

## Running locally

```bash
npm install
npm run dev
```

Requires Node.js 18+.

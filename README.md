# SILENT DESCENT — Level 1: "Iron Tide"

A 2D tactical stealth-action side-scroller built with **Phaser 3** and **Vite** in the style of classic 2000s Gameloft mobile spy games (e.g. *Splinter Cell* Java/Symbian editions).

100% original IP, character, storyline, pixel art, procedural audio, and stealth-action mechanics.

---

## Story & Setting
A rogue arms manufacturing corporation, **KESTREL DYNAMICS**, is preparing to ship a stolen next-generation guidance chip from its coastal harbour facility under the cover of a stormy night.

The **NIGHTFALL Unit** deploys operative **Vikram "Ghost" Rao** via stealth helicopter insertion. Ghost must infiltrate the office complex and cargo warehouse, hack the security terminal, secure the guidance chip data drive, and extract from the pier without raising alarms.

---

## Core Stealth Systems & Mechanics
- **Light & Shadow System**:
  - Dynamic light calculations from sodium lamps, moonlight window shafts, and guard flashlights.
  - Tiles outside direct illumination are shadows.
  - Player visibility percentage ($0\text{--}100\%$) is displayed on the bottom HUD light meter.
  - Posture visibility multipliers: Sneak $\times 0.6$, Wall-Press $\times 0.2$, Pipe Hanging $\times 0.3$, Normal Standing $\times 1.0$.
- **Guard Vision & AI**:
  - $70^\circ$ vision cone with $120\text{ px}$ range (halved to $60\text{ px}$ when Ghost's visibility is $< 30\%$).
  - Suspicion meter fills over $0.8\text{--}1.5\text{ s}$; floating indicators: `?` (suspicious inspection) $\to$ `!` (alert combat).
  - States: **Patrol** $\to$ **Suspicious** $\to$ **Alert** $\to$ **Search** (15s sweep) $\to$ **Patrol**.
  - Guards discover knocked-out bodies if left in lit areas; bodies can be dragged into shadows.
- **Sound & Noise Propagation**:
  - Running and high landings emit $80\text{ px}$ circular noise rings that alert nearby guards. Sneak walking is completely silent.
- **Silenced Pistol**:
  - Suppressed pistol with limited ammo ($6$ base $+$ pickups).
  - Can shoot out sodium lamps to create dark paths and disable security cameras for 8 seconds.
- **Extra Level 1 Mechanics**:
  1. **Zip Line (Section A)**: Slide down steel cable from office roof to warehouse roof (hold $\uparrow$ to brake). Guards below only notice if passing through light.
  2. **Vent Crawl (Section C)**: Floor vent shortcut leading to a tight crawlspace above the office; slow, silent, dark with inspection grates.
  3. **Thermal Visor (V Key)**: Amber visor thermal mode for 6s ($10\text{ s}$ cooldown): screen shifts to dark blue, guards glow orange through walls, and hidden laser tripwires are revealed.
  4. **Hack Minigame (Section C Terminal)**: 10-second pattern puzzle connecting 4 matching nodes on a $4\times 4$ grid; disables Section D cameras and marks the Data Drive. Failing twice raises alarm level by 1.
  5. **Door Peek**: At closed doors, press $\uparrow$ to peek through the gap/viewfinder before opening.
  6. **Helicopter Skid Hang QTE (Section F)**: During the finale extraction cutscene, Ghost hangs from the helicopter skid; press Space at the QTE prompt to pull up onto the skid.

---

## Tactical Controls

| Action | Keyboard | Mobile On-Screen Touch |
| :--- | :--- | :--- |
| **Move Left / Right** | $\leftarrow$ / $\rightarrow$ or `A` / `D` | Left / Right D-Pad |
| **Climb / Peek / Brake** | $\uparrow$ or `W` | Up D-Pad |
| **Crouch / Drop / Wall-Press**| $\downarrow$ or `S` | Down D-Pad |
| **Jump** | `Space` | `JUMP` Button |
| **Sneak** | `Shift` (hold) | `SNEAK` Button |
| **Takedown / Interact / Hack**| `J` | `ACT` Button |
| **Silenced Pistol** | `K` (aim with $\uparrow$/$\downarrow$) | `GUN` Button |
| **Grab Guard** | `L` | Left Bumper / `ACT` |
| **Thermal Visor** | `V` | `VISOR` Button |
| **Tactical Pause** | `P` or `Esc` | Menu button |

---

## Rating & Rank Criteria
- **GHOST**: $0$ Alarms, $0$ Kills, completed under target time ($< 04:00$).
- **AGENT**: $\le 2$ Alarms, $\le 2$ Kills.
- **ROOKIE**: Completed with higher detection or casualties.

---

## Technical Specifications
- Resolution: $480 \times 270$ internal pixel art, scaled up with `Phaser.Scale.FIT`, `pixelArt: true`, `roundPixels: true`.
- Tile Size: $16\text{ px}$.
- Audio: Pure procedural WebAudio API synthesis (zero external audio files needed).
- Deployable to GitHub Pages with `./dist` build and `.github/workflows/deploy.yml`.

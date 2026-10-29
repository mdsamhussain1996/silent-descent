# NO TRACE — Level 1: "Iron Tide"

A 2D tactical stealth-action side-scroller built with **Phaser 3.87** and **Vite** in the authentic aesthetic of the finest 2000s mobile stealth-action classics (rich pixel art, moody lighting, multi-shade characters, dynamic weather, and tactical weapons systems).

100% original IP, character designs, storyline, master-palette pixel art, procedural WebAudio synthesizer, and stealth-action mechanics.

---

## Story & Setting
A rogue military-industrial conglomerate, **KESTREL DYNAMICS**, is staging a covert midnight shipment of a next-generation guidance chip from its coastal harbour installation under heavy rain and thunderstorms.

The **NO TRACE Strategic Division** deploys operative **Vikram "Ghost" Rao** via stealth helicopter insertion into Kestrel Yard. Operative directives:
1. Infiltrate the office facility and cargo warehouse.
2. Hack security terminals to disable surveillance networks and unlock high-security cages.
3. Secure the stolen Guidance Chip Data Drive.
4. Eliminate or bypass Kestrel security personnel using silenced firearms, gadgets, or silent takedowns.
5. Reach the stormy pier for emergency helicopter skid extraction.

---

## Visual & Atmosphere Overhaul (Phase 1)
- **Native Resolution & Scaling**: $480 \times 270$ native pixel resolution, integer pixel zoom, `pixelArt: true`.
- **48–64 Master Palette**: Curated dark night blues/teals, wet steel greys, sodium lamp orange, interior mahogany beige/brown, cyan CRT monitor glow, and red alert/laser accents. 1px dark contour outlines, 3–4 shade ramps, and hand-placed highlights on all sprites.
- **Detailed Environments by Section**:
  - **Section A (Sky & Insertion)**: Layered night sky with parallax storm clouds, moonlight rims, distant harbour crane lights, rain streaks, and stealth helicopter insertion with rotor blur and searchlight cone.
  - **Section B (Rooftop)**: Textured concrete roof with reflective puddles, animated AC units with spinning fan blades, water tank with shadow zone, roof ladder hatch, and security camera.
  - **Section C (Office Interior)**: Wallpaper wainscoting panels, wall sconces casting warm light pools, overhead pipe run for hand-over-hand hanging, laser tripwires, security terminals with 10s pattern hack minigame, and crawlspace air ducts.
  - **Section D (Cargo Warehouse)**: Industrial hazard stripes on platform edges, steel catwalks with truss supports and ladders, stacked crates with KESTREL stencils, sweeping ceiling searchlight, and Suppressed SMG weapon cache.
  - **Section E (Dock Exterior)**: Wooden pier planking, corrugated shipping containers in multiple colors (rust, teal, navy), dock guards patrolling with flashlights, and gap hazard over ocean waters.
  - **Section F (Extraction Finale)**: Stealth helicopter hovering with hanging rope ladder and QTE skid hang sequence.
- **Lighting & Weather**:
  - Dynamic darkness overlay with `ADD` blend light pools from sodium lamps, searchlights, and flashlight cones.
  - Multi-layer heavy rain system with ledge drips, surface splashes, and periodic lightning flashes with thunder every 20–40s.
  - Thermal Visor Mode (`V` key): Amber visor thermal mode reveals hidden lasers and illuminates guards through walls in bright thermal orange.
- **HUD (40px Bottom Bar)**:
  - Left: Agent pixel portrait, LIFE bar, and LIGHT meter with HIDDEN / SHADOW / ALERT status badges.
  - Center: 3-segment SECURITY STATUS alarm panel that pulses red during alerts.
  - Right: Active weapon icon, ammo count (`MAG / TOTAL`), tactical reload status, gadget icon with charge counts (`x3`), and thermal visor status.

---

## Weapons System & Arsenal (Phase 2)

| Weapon | Mag / Max | Fire Type | Noise Radius | Damage | Tactical Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Silenced Pistol** *(start)* | 8 / 32 | Semi-auto | 40 px | 35 | Silent shots. Instant down on headshots. Shoots out lights & disables cameras for 8s. |
| **Suppressed SMG** *(warehouse pickup)* | 24 / 96 | Full-auto (9/s) | 90 px | 18 | High rate of fire; sustained spread bloom while firing. |
| **Tactical Shotgun** *(Heavy guard drop)* | 5 / 20 | Pump (1.1s) | 220 px | 15×6 pellets | Devastating close-range blast; screen shake, knockback, shatters crates. Loud noise raises alarm. |
| **Stun Taser** *(gadget)* | 3 charges | Arc zap | 0 px | 6s Stun | Non-lethal electrical incapacitation within 60 px range. |
| **Noise Maker Lure** *(gadget)* | 2 charges | Throwable | Lure ring | — | Emits audio pulses that draw suspicious guards away from patrol posts. |

### Aiming & Combat Feel
- **Aiming**: Free 360° desktop mouse aiming with thin green laser sight line, or 3-angle keyboard aiming ($\uparrow$ / $\downarrow$). On mobile: auto-aim bracket locks onto nearest guard within 160 px.
- **Combat Effects**: Bouncing brass shell casings with gravity and angular rotation, muzzle flashes with dynamic light bursts, bullet tracers, metal sparks, wood splinters, concrete dust puffs, and bullet hole decals.
- **Headshot Mechanics**: Upper 30% of guard hitbox deals $\times 2.5$ critical damage; Silenced Pistol headshot equals instant elimination.
- **Cover System**: Press Down ($\downarrow$) adjacent to crates, desks, or railings to enter low cover (60% damage reduction). Pop out to shoot with Aim/Shoot.
- **Enemy Combat AI**:
  - **3 Guard Types**: Dock Guard (olive poncho, helmet, SMG), Office Guard (shirt, cap, pistol), Heavy Guard (ballistic armor, riot helmet, shotgun).
  - Guards telegraph incoming fire with a red laser sight for 0.6s before firing bursts or blasts.
  - Guards take cover behind objects, reload with a 1.5s vulnerability window, and investigate gunshot noise rings.
  - Bodies left in lit areas trigger facility alarms if discovered by patrolling guards.

---

## Tactical Controls

| Action | Desktop Keyboard / Mouse | Gamepad | Mobile Touch |
| :--- | :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or $\leftarrow$ / $\rightarrow$ | D-Pad / Left Stick | `◄` / `►` D-Pad |
| **Climb / Ladder / Brake** | `W` or $\uparrow$ | Up / Left Stick | `▲` D-Pad |
| **Crouch Cover / Wall-Press** | `S` or $\downarrow$ | Down / Left Stick | `▼` D-Pad |
| **Jump / Ledge Climb** | `Space` | `A` Button | `JUMP` Button |
| **Takedown / Interact / Hack** | `J` | `X` Button | `ACT` Button |
| **Fire Weapon** | `K` or Left Mouse Button | `R2` Trigger | `FIRE` Button |
| **Cycle Weapon** | `Q` (prev) / `E` (next) / Mouse Wheel | `L1` / `R1` Bumpers | `SWAP` Button |
| **Tactical Reload** | `R` | Left Stick Click | `RELOAD` Button |
| **Deploy Gadget** | `G` | Right Stick Click | `GADGET` Button |
| **Thermal Visor** | `V` | `Y` Button | `VISOR` Button |
| **Pause Mission** | `P` or `Esc` | Start Button | Header Pause |

---

## Rating & Rank Criteria
- **GHOST**: 0 Alarms, 0 Lethal Kills, completed under target time ($< 04:00$).
- **AGENT**: $\le 2$ Alarms, $\le 2$ Kills.
- **ROOKIE**: Heavy alarm escalation or loud firefights.

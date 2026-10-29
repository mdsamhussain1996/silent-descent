# CREDITS — SILENT DESCENT: LEVEL 1 "IRON TIDE"

## Original Concept & Game Design
- **Original IP & Game**: *Silent Descent*
- **Level**: Level 1 "Iron Tide"
- **Operative**: Vikram "Ghost" Rao
- **Agency**: NIGHTFALL Unit
- **Adversary Corporation**: Kestrel Dynamics

## Aesthetics & Art Style
- Inspired by classic 2000s Gameloft mobile spy 2D stealth-action games (e.g. Splinter Cell Java/Symbian editions).
- **100% Original Procedural Pixel Art**:
  - Authored dynamically via HTML5 Canvas 2D buffers adhering strictly to a curated 32-color industrial night palette (`#05070c`, `#1e2430`, `#f59e0b`, `#38bdf8`, `#ef4444`, etc.).
  - Ghost Operative: 24×32 frames (idle, tactical walk, sneak, sprint, jump, fall, ledge grab & climb, pipe hang & hand-over-hand, rope rappel, ladder, wall-press, silenced pistol aim & shoot, elbow strike knockout, guard grab, body drag, zip-line slide, vent crawl).
  - Kestrel Yard & Office Guards: poncho, combat helmets, flashlights, security caps, patrol, suspicious '?', alert '!', knockout ragdoll.
  - Environment Tiles & Props: industrial metal plates, hazard stripes, one-way catwalks, ladders, pipes, wet docks, water hazard, water tank, AC units, crates, security cameras, laser tripwires, sodium lamps, security terminals, floor vents, zip line cable, and NIGHTFALL "Kite" stealth helicopter.

## Audio & Music
- **Procedural WebAudio Synthesizer Engine** (`src/systems/Audio.js`):
  - Rain ambient loop with low-pass frequency filtering
  - Distant thunder rumble
  - Helicopter rotor thrum with distance attenuation
  - Dynamic stealth footsteps (soft sneak vs. loud running click)
  - Suppressed pistol shot ("thwip!")
  - Sodium light bulb pop and shattering glass tinkle
  - High-voltage laser tripwire electric hum
  - Facility alarm siren wail
  - Radio codec chatter blips
  - Dynamic adaptive stealth bassline that escalates through suspicion levels ('?' to '!') and triggers alert percussion drums.

## Frameworks & Tools
- Phaser 3 (pinned version 3.87.0)
- Vite (ES modules)
- Arcade Physics
- Google Fonts (`Share Tech Mono`, `Rajdhani`)

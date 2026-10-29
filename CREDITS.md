# CREDITS — NO TRACE: COVERT OPERATIONS CAMPAIGN

## Original Concept & Game Design
- **Original IP & Title**: *NO TRACE*
- **Campaign Structure**: 5 Espionage Operations (M1 "Iron Tide", M2 "Glass Tower", M3 "Monsoon Run", M4 "Deep Signal", M5 "Zero Hour")
- **Protagonist**: Operative Vikram "Ghost" Rao
- **Intelligence Handler**: Control (HQ Communications)
- **Defector Asset**: Dr. Meera Sen (Aerospace Guidance Specialist)
- **Hostile Syndicate**: Kestrel Dynamics Corporation

## Aesthetics, Backgrounds & Pixel Art
- Inspired by the moody, detailed atmosphere of premier 2000s mobile stealth-action classics (such as *Tom Clancy's Splinter Cell: Conviction* mobile editions).
- **100% Original Artwork & CC0 Compliance**:
  - High-resolution atmospheric panoramic pixel backdrops generated originally for NO TRACE:
    - `public/assets/campaign_world_map.jpg` — Strategic satellite covert operations theater map.
    - `public/assets/bg_rooftop.jpg` — Rainy concrete rooftop with antenna tower and city skyline.
    - `public/assets/bg_office.jpg` — Corporate tech executive suite with mahogany wainscoting and rainy windows.
    - `public/assets/bg_warehouse.jpg` — Heavy industrial warehouse with catwalk trusses, pipes, and cranes.
    - `public/assets/bg_harbor.jpg` — Stormy sea dockyard with cranes, blinking strobes, and pier trusses.
    - `public/assets/portrait_ghost.jpg` — Operative Vikram "Ghost" Rao with amber monocular visor.
    - `public/assets/portrait_control.jpg` — Intelligence handler Control with communications headset.
    - `public/assets/portrait_meera.jpg` — Dr. Meera Sen research scientist dossier photo.
    - `public/assets/evidence_manifest.jpg` — Classified military cargo manifest document.
    - `public/assets/mission_dossiers.jpg` — Multi-theater operations briefing dossier montage.
  - Procedural Canvas pixel art adhering strictly to 48–64 master palette:
    - 44–48 px tall tactical characters (Ghost, Dock Guard, Office Guard, Heavy Guard, Dr. Meera Sen).
    - 16×16 textured tilesets with rivets, scratches, hazard stripes, marble, wainscoting, and wood grain.
    - Animated props: 4-frame rooftop AC condenser fans, CCTV surveillance cameras with red LEDs, security terminals, destructible KESTREL crates, corrugated sea containers, tracking beacons, and extraction helicopters.
    - Slim 28px tactical dashboard HUD with real-time compass navigation marker.

## Audio Engineering
- **Custom WebAudio Synthesizer Engine** (`src/systems/Audio.js`):
  - Silenced firearm ballistics, shell casing bounces, bullet impacts (metal, wood, concrete).
  - Stun taser electrical discharges and acoustic noise maker lure pulses.
  - Atmospheric 2-layer rain, thunderclaps, and helicopter downwash.
  - Radio transmission chirps and terminal interface audio.
  - Adaptive suspicion and high-threat alarm sirens.

## Technology Stack
- Phaser 3.87.0
- Vite 5
- HTML5 Canvas & WebAudio API
- Google Fonts (`Share Tech Mono`, `Rajdhani`)

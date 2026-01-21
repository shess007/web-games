# World Design - Space Taxi Roguelike

## Setting

### The Universe
A retro-futuristic space frontier where independent taxi pilots ferry passengers between stations, platforms, and outposts scattered across dangerous sectors of space. The economy runs on quick deliveries and hazard pay.

### Tone
- **Genre**: Arcade sci-fi with roguelike tension
- **Mood**: Tense but not grim; danger with humor
- **Aesthetic**: Neon-lit stations against vast dark space
- **Scale**: Intimate (single taxi) within vast (infinite space)

### Time Period
A vaguely defined future where:
- Space travel is common but still dangerous
- Independent contractors (taxi pilots) fill transit gaps
- Alien species coexist with humans
- Magic and technology blend (Space Wizards, Void Vampires)

### The Taxi Economy
- **Shifts**: Pilots work 3-sector "shifts"
- **Contracts**: Passengers offer varying pay for varying risk
- **Base Stations**: Rest stops for repairs and refueling
- **Hazard Pay**: Dangerous routes command premium fares

## Environments

### Eight Visual Themes

| Theme | Description | Atmosphere |
|-------|-------------|------------|
| **Deep Space** | Classic starfield, dark blues and purples | Safe, familiar, tutorial |
| **Nebula Zone** | Pink/purple gas clouds, ethereal glow | Mysterious, beautiful |
| **Ice Fields** | Frozen asteroids, cyan crystalline structures | Cold, harsh, pristine |
| **Lava Sector** | Volcanic activity, orange/red ambient heat | Dangerous, oppressive |
| **Asteroid Belt** | Dense rock fields, gray/brown rocky terrain | Industrial, gritty |
| **Void Rift** | Dark purple tears in space, ominous energy | Final boss area, dread |
| **Solar Flare** | Bright yellows, intense radiation zones | Blinding, energetic |
| **Crystal Caves** | Teal crystalline formations, refractive light | Alien, otherworldly |

### Theme Assignment by Sector

| Sector | Theme | Reason |
|--------|-------|--------|
| 1 - Morning Shift | Deep Space (fixed) | Familiar, safe introduction |
| 2 - Rush Hour | Random (6 options) | Variety, unpredictability |
| 3 - Final Fare | Void Rift (fixed) | Ominous finale, high stakes |

### Ambient Particles by Theme

| Theme | Particle Effect |
|-------|-----------------|
| Deep Space | None (clean starfield) |
| Nebula Zone | Nebula wisps, floating gas |
| Ice Fields | Snow particles, ice crystals |
| Lava Sector | Embers, floating ash |
| Asteroid Belt | Dust particles |
| Void Rift | Void energy, dark matter |
| Solar Flare | Plasma bursts |
| Crystal Caves | Crystalline sparkles |

## Level Design

### Procedural Generation
Each sector is procedurally generated with constraints to ensure playability.

### Level Dimensions

| Sector | Width | Height | Total Area |
|--------|-------|--------|------------|
| 1 - Morning Shift | 1600px | 1200px | 1.92M px² |
| 2 - Rush Hour | 1800px | 1400px | 2.52M px² |
| 3 - Final Fare | 2000px | 1600px | 3.20M px² |

### Platform System

**Standard Platforms**
- **Size**: 110×22 pixels
- **Function**: Passenger pickup/dropoff points
- **Naming**: Universe-themed names from pool

**Fuel Stations**
- **Size**: 90×22 pixels
- **Function**: Refuel (0.5 fuel/frame) and repair ($100/HP)
- **Visual**: Distinct fuel pump iconography

**Platform Names Pool**
```
ALPHA BASE      NEBULA DOCK     ASTEROID HUB    COSMIC PORT
STELLAR BAY     VOID STATION    PULSAR PAD      QUASAR POINT
NOVA TERMINAL   ECLIPSE DECK    METEOR STOP     ORBIT PLAZA
ZENITH TOWER    DEEP SPACE 7    FRONTIER POST   DRIFT HAVEN
SOLAR FLARE     DARK MATTER     ION GATE        WARP ZONE
CRYO STATION    PLASMA PORT     GRAVITY WELL    SINGULARITY
PHOTON PIER     QUANTUM QUAY    NEUTRON NEST    COMET CORNER
STARFALL INN    VOID WALKER     LUNAR LEDGE     MARS DEPOT
```

**Fuel Station Names Pool**
```
FUEL DEPOT      GAS GIANT       ENERGY CORE     POWER CELL
REFUEL BAY      CHARGE POINT    TANK STATION    PLASMA PUMP
```

### Platform Placement Rules
- **Minimum Spacing**: 200 pixels between platforms
- **Spawn Platform**: Always at top-left (150×150 offset)
- **Reachability**: BFS pathfinding validates all platforms are accessible
- **Distribution**: Spread across level to encourage exploration

### Sector Content Scaling

| Element | Sector 1 | Sector 2 | Sector 3 |
|---------|----------|----------|----------|
| Platforms | 4 | 5 | 5 |
| Fuel Stations | 1 | 1 | 1 |
| Passengers | 2 | 3 | 1 (VIP) |
| Asteroids | 3 | 5 | 7 |
| Debris | 5 | 8 | 12 |
| Meteors | 0 | 2 | 4 |
| Enemies | 0 | 2 | 3 |
| Modifiers | 0 | 1 | 2 |

### Hazard Placement

**Asteroids**
- Large (30-80px radius), slow-moving obstacles
- Placed away from platforms with buffer zones
- Wrap around level edges

**Debris**
- Small (5-17px radius), faster-moving junk
- More numerous, harder to track
- Types: scrap, panel, pipe, crystal

**Meteors**
- Fast projectiles (2-5 speed) crossing the level
- Spawn from edges, travel across, respawn
- Fiery trails for visibility

**Enemies**
- Orbital patrol patterns (80-200px radius)
- Placed far from platforms and spawn
- Create "hazard zones" for Hazard Pay contracts

## Narrative/Lore

### The Pilot's Story
You are an independent space taxi operator working shifts in increasingly dangerous sectors. Each run is a single shift—survive three sectors and you've completed your day's work.

### Sector Narrative Arc

**Sector 1: Morning Shift**
- First fares of the day
- Familiar Deep Space territory
- Easy passengers, standard contracts
- *"Just another day on the job..."*

**Sector 2: Rush Hour**
- Peak demand, varied locations
- Random environment (could be anywhere)
- Tougher passengers, riskier contracts
- Modifiers represent changing conditions
- *"Things are heating up..."*

**Sector 3: Final Fare**
- Last job before shift ends
- Void Rift—the dangerous edge of known space
- Single VIP passenger, maximum stakes
- Double modifiers, heavy hazards
- *"One more fare and I'm done..."*

### World Implications

**The Passengers**
- 16 distinct character types suggest a diverse galaxy
- Aliens, robots, wizards—all need transit
- Each has places to be, business to conduct
- Their dialogue hints at larger stories

**The Hazards**
- Asteroids: Natural space debris
- Debris: Remnants of ships, stations, conflicts
- Meteors: Cosmic events, unpredictable
- Enemies: Space fauna, territorial creatures

**The Modifiers**
- Solar Storm: Stellar weather events
- Ion Clouds: Atmospheric anomalies
- Gravity Flux: Unstable space-time
- Fuel Leak: Equipment wear from hazards
- Scanner Jam: Electronic interference
- Lucky Stars: Cosmic fortune, good omens

### Radio Chatter Worldbuilding
Background transmissions hint at the larger universe:
- Other pilots working their routes
- Control towers coordinating traffic
- Weather warnings and sector alerts
- Snippets of news and gossip

## Points of Interest

### Base Station
The hub between sectors where pilots rest and resupply.

**Features**
- Taxi docking and damage display
- Hull repair service ($100/HP)
- Fuel pack purchases (Small/Medium/Large)
- Shift summary and score display
- "Start Shift" deployment

**Atmosphere**
- Safe haven between dangerous sectors
- Opportunity for strategic decisions
- Visual representation of taxi damage/wear
- Calm before the next storm

### Pickup/Dropoff Platforms
Where passengers wait and disembark.

**Visual Design**
- Glowing accent color matching theme
- Platform name displayed
- Passenger emoji visible when waiting
- Landing zone clearly marked

**Interaction**
- Land softly to pick up/deliver
- Contract selection appears at pickup
- Passenger comment plays on board/exit
- Cash reward on successful delivery

### Fuel Stations
Critical refueling points within sectors.

**Visual Design**
- Distinct from regular platforms
- Fuel pump iconography
- Different accent color (theme's fuelColor)

**Mechanics**
- Land to begin refueling (0.5 fuel/frame)
- Costs money ($0.1/frame)
- Also offers repair (slow, chance-based)
- Strategic resource management point

### Hazard Zones
Areas with concentrated danger, relevant for Hazard Pay contracts.

**Composition**
- Enemy patrol overlaps
- Dense asteroid clusters
- Meteor crossing paths
- High-risk, high-reward routes

**Purpose**
- Create meaningful route choices
- Reward skilled navigation
- Enable Hazard Pay contract fulfillment
- Add tension to otherwise open levels

### The Void Rift (Sector 3)
The ominous final sector, always the same theme.

**Atmosphere**
- Dark purple void energy
- Tears in space-time visible
- Highest hazard density
- Maximum modifier stacking

**Narrative Weight**
- Edge of known space
- Where the dangerous jobs go
- Final test of pilot skill
- Completing it means surviving the shift

### Parallax Star Layers
The backdrop that creates depth and movement.

**Structure**
- 4 depth layers
- Slower layers = farther distance
- Theme-specific star colors
- Creates sense of vast space

**Colors by Theme**
| Theme | Star Colors |
|-------|-------------|
| Deep Space | White, blue-tinted, red-tinted |
| Nebula Zone | Pink, blue, white |
| Ice Fields | Cyan, white, light blue |
| Lava Sector | Orange, amber, white |
| Asteroid Belt | Gray, light gray, white |
| Void Rift | Purple, dark blue, white |
| Solar Flare | Yellow, orange, white |
| Crystal Caves | Cyan, magenta, white |

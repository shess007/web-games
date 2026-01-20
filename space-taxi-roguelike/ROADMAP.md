# Space Taxi Roguelike - Implementation Plan

## Overview
A roguelike version of Space Taxi with short 4-5 minute runs, permadeath (3-hit hull), contract choices, and sector modifiers.

## Core Design Decisions
- **Run Length**: 3 sectors (~4-5 min per run)
- **Death System**: 3 HP hull (walls=1 dmg, enemies=2 dmg, repair=$100 at fuel stations)
- **Variety**: Contract choices + sector modifiers (both systems)
- **Progression**: Skill-based, no permanent upgrades

---

## Run Structure: 3 Sectors

| Sector | Theme | Passengers | Enemies | Contracts | Modifiers |
|--------|-------|------------|---------|-----------|-----------|
| 1 "Morning Shift" | Deep Space | 2 | 0 | 2 choices | 0 |
| 2 "Rush Hour" | Random | 3 | 2 | 3 choices | 1 |
| 3 "Final Fare" | Void Rift | 1 VIP | 3 | 1 (VIP only) | 2 |

**Win Condition**: Complete all 3 sectors
**Score**: Total cash + hull bonus

---

## Key Systems

### 1. Contract System
Choose which passengers to pick up. Each has risk/reward tradeoffs:

| Contract | Payout | Requirement |
|----------|--------|-------------|
| Standard | $100 | Normal delivery |
| Express | $150 | 30-second time limit |
| Hazard Pay | $200 | Route through enemies |
| VIP | $300 | No wall bumps, soft landing |
| Fragile | $180 | Max speed 2.0 throughout |

### 2. Sector Modifiers
Random effects applied to sectors 2-3:

| Modifier | Effect |
|----------|--------|
| Solar Storm | Thrust reduced 30%, screen shake |
| Ion Clouds | Random drift |
| Gravity Flux | Gravity oscillates 0.02-0.06 |
| Fuel Leak | Fuel drains 20% faster |
| Scanner Jam | Minimap disabled |
| Lucky Stars | All payouts +25% |

### 3. Hull/Damage System
```
maxHull: 3
wallDamage: 1
enemyDamage: 2
repairCost: $100 (at fuel stations)
hardLandingThreshold: 1.2 speed = 1 damage
```

### 4. Scoring System
```
score = totalCash + hullRemaining * 100
```

---

## File Structure

```
/space-taxi-roguelike/
├── index.html              # UI with roguelike overlays
├── css/
│   └── style.css           # Styling
├── js/
│   ├── config.js           # Sector configs, contracts, modifiers
│   ├── main.js             # Game class with roguelike mechanics
│   ├── ui.js               # Roguelike UI methods
│   └── engine/
│       ├── renderer.js     # Rendering with theme support
│       ├── audio.js        # Sound effects
│       └── postfx.js       # Post-processing effects
└── ROADMAP.md              # This file
```

---

## Controls

- **Arrow Keys / WASD**: Movement
- **1/2/3**: Select contract
- **Gamepad**: Full support with vibration feedback

---

## Economy Balance

| Item | Value |
|------|-------|
| Standard contract | $100 |
| Express contract | $150 |
| Hazard contract | $200 |
| VIP contract | $300 |
| Repair cost | $100 |
| Fuel cost | $0.1/frame |
| Hull bonus | $100/remaining hull |

**Target scores**:
- Beginner run: $300-500
- Good run: $600-900
- Expert run: $1000+

---

## Implementation Status

- [x] Project setup and file structure
- [x] Run state and sector system
- [x] Hull/damage system
- [x] Contract selection system
- [x] Modifier effects
- [x] UI for roguelike features
- [x] Run summary and scoring
- [ ] Testing and polish
- [ ] High score persistence (localStorage)

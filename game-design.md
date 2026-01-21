# Game Design - Space Taxi Roguelike

## Overview

Space Taxi Roguelike is a 4-5 minute arcade-roguelike hybrid combining precision taxi-flying with roguelike mechanics (permadeath, meaningful choices, escalating difficulty). Players pilot a space taxi through 3 sectors, picking up passengers and delivering them while managing fuel, hull integrity, and navigating hazards.

### Design Pillars
1. **Every Run Tells a Story** - 4-5 minute arc from learning to high stakes
2. **Risk vs Reward** - Contract choices create meaningful decisions
3. **Skill-Based Progression** - No permanent upgrades, just player mastery
4. **Generous But Fair** - 3 HP forgives mistakes; fuel stations provide recovery

## Core Mechanics

### Flight Physics
- **Thrust System**: Up thrust (0.24 velocity, 0.18 fuel), Side thrust (0.19 velocity, 0.07 fuel)
- **Gravity**: Constant 0.04 per frame downward acceleration
- **Friction**: Velocity dampens by 0.98 per frame
- **Auto-angle**: When idle, taxi angle returns to level (angle × 0.85)

### Landing System
- **Soft Landing**: Speed ≤ 1.0, angle ≤ 0.25 radians - safe delivery
- **Hard Landing**: Speed 1.0-1.2 - bounces, no damage
- **Crash Landing**: Speed > 1.2 - 1 HP damage, bounces taxi

### Fuel Management
- **Max Fuel**: 100 units
- **Base Drain**: 0.1 per frame (~16.7 seconds of coasting)
- **Refueling**: Land at fuel stations, 0.5 fuel/frame at $0.1/frame
- **Fuel Packs**: Small (+25/$30), Medium (+50/$50), Large (+100/$80)

### Hull/Damage System
- **Starting Hull**: 3 HP
- **Damage Sources**:
  - Wall/asteroid collision: 1 HP
  - Meteor impact: 2 HP
  - Enemy collision: 2 HP
  - Hard landing: 1 HP
  - Stranded (no fuel): Instant death
- **Repair**: $100 per HP at base station

## Gameplay Loop

### Run Structure
```
START → BASE → SECTOR 1 → BASE → SECTOR 2 → BASE → SECTOR 3 → VICTORY/DEATH
```

### Sector Flow
```
Passenger spawns → Contract selection (5s) → Fly to pickup → Board passenger →
Fly to destination → Deliver → Repeat for all passengers → Sector complete
```

### Three Sectors

| Sector | Name | Passengers | Enemies | Hazards | Modifiers | Level Size |
|--------|------|------------|---------|---------|-----------|------------|
| 1 | Morning Shift | 2 | 0 | Light | 0 | 1600×1200 |
| 2 | Rush Hour | 3 | 2 | Medium | 1 | 1800×1400 |
| 3 | Final Fare | 1 (VIP) | 3 | Heavy | 2 | 2000×1600 |

## Controls

### Keyboard
- **Arrow Up / W**: Main thrust
- **Arrow Left / A**: Left thrust
- **Arrow Right / D**: Right thrust
- **1/2/3**: Contract selection

### Gamepad
- **Left Stick / D-pad**: Movement
- **A / Y / Triangle**: Up thrust
- **LB/RB**: Side thrust
- **Start**: Begin run
- **Vibration Feedback**: Thrust, landing, damage, explosions

## Progression System

### Contract Types

| Type | Payout | Requirement | Risk |
|------|--------|-------------|------|
| Standard | $100 | Pickup → Dropoff | Low |
| Express | $150 | Complete in 30 seconds | Medium |
| Fragile | $180 | Max speed 2.0 throughout | Medium |
| Hazard Pay | $200 | Route through enemy patrols | High |
| VIP | $300 | Zero bumps + soft landing | High |

- **Contract Selection**: 5-second window with 2-3 choices
- **Failed Contracts**: Pay 50% of base payout
- **Sector 3**: VIP contract only (mandatory)

### Modifier System

| Modifier | Effect |
|----------|--------|
| Solar Storm ☀️ | Thrust -30% |
| Ion Clouds ⚡ | Random drift ±3%/frame |
| Gravity Flux 🌀 | Gravity oscillates 0.02-0.06 |
| Fuel Leak 💧 | Fuel drain +20% |
| Scanner Jam 📡 | Minimap disabled |
| Lucky Stars ⭐ | Payouts +25% |

- Sector 1: 0 modifiers
- Sector 2: 1 random modifier
- Sector 3: 2 stacking modifiers

## Difficulty

### Hazards

**Asteroids** (Large, slow)
- 30-80 pixel radius, 0.1-0.4 speed, 1 HP damage

**Debris** (Small, fast)
- 5-17 pixel radius, 0.2-0.7 speed, 1 HP damage

**Meteors** (Fast projectiles)
- 8-23 pixel radius, 2-5 speed, 2 HP damage, trails fire

**Enemies** (Orbital patrol)
- Circular patrol paths, 15-30 pixel size, 2 HP damage

### Difficulty Curve
- **Sector 1**: Tutorial-safe, learn controls, no enemies
- **Sector 2**: Challenge introduction, moderate hazards, 1 modifier
- **Sector 3**: Gauntlet, heavy hazards, 2 modifiers, VIP pressure

## Victory/Defeat Conditions

### Victory
- Complete all 3 sectors
- Deliver final VIP passenger

### Defeat
- Hull reaches 0 HP
- Stranded without fuel (no money for fuel packs)

### Scoring
```
Final Score = Total Cash Earned + (Remaining Hull × $100)
```

**Benchmarks**:
- Beginner: $200-400 (reaches Sector 2)
- Intermediate: $500-700 (completes with 1 HP)
- Advanced: $800-1000 (completes with 2-3 HP)
- Expert: $1000+ (perfect run, full hull)

### Example Perfect Run
- Sector 1: 2 Standard = $200
- Sector 2: Express + Hazard = $350
- Sector 3: VIP = $300
- Hull Bonus: 3 HP × $100 = $300
- **Total: $1150**

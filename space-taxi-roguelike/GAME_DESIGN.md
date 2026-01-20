# Space Taxi Roguelike - Game Design Document

## Core Concept

**Genre Blend**: Job Simulator + Roguelike

Take the satisfying loop of being a space taxi driver—picking up passengers, navigating hazards, managing fuel—and inject it with roguelike tension: permadeath, meaningful choices, and escalating difficulty across a short, replayable run.

---

## Design Pillars

### 1. Every Run Tells a Story
Each 4-5 minute run should feel like a complete narrative arc:
- **Morning Shift**: Learn the ropes, build confidence
- **Rush Hour**: Chaos escalates, modifiers add variety
- **Final Fare**: High-stakes VIP delivery, everything on the line

### 2. Risk vs Reward
Players constantly make meaningful choices:
- Take the Express contract for +50% pay, but can you make the timer?
- VIP pays triple, but one wall bump ruins everything
- Repair your hull or save cash for a higher score?

### 3. Skill-Based Progression
No permanent upgrades or unlocks. Getting better at the game means:
- Tighter flight control
- Better fuel management
- Reading contract requirements vs your skill level
- Adapting to modifier combinations

### 4. Generous But Fair
- 3 HP hull forgives mistakes without removing tension
- Fuel stations provide recovery opportunities
- Contract choice lets players match difficulty to skill
- Auto-select prevents decision paralysis

---

## The Taxi Driver Fantasy

You're not a hero saving the galaxy. You're a working-class pilot trying to survive your shift in a dangerous universe.

**Passengers are weird**: Aliens, robots, space wizards, void vampires—each with personality comments that add flavor without slowing gameplay.

**The universe is indifferent**: Solar storms don't care about your contract timer. Ion clouds drift through your route. Gravity fluctuates because space is strange.

**Money matters**: Every dollar counts toward your score. Repair costs hurt. Contract bonuses feel earned.

---

## Moment-to-Moment Gameplay

### The Pickup
1. Land at passenger platform
2. Contract selection appears (2-3 choices)
3. 5-second timer prevents overthinking
4. Choose based on skill confidence and current hull

### The Delivery
1. Navigate to destination
2. Manage contract requirements (timer, speed limit, no bumps)
3. Avoid enemies and walls
4. Soft landing required for completion

### The Tension
- Fuel depletes constantly
- Hull damage accumulates
- Modifiers add unpredictability
- Each sector increases stakes

---

## Why Roguelike?

Traditional Space Taxi is a score-attack arcade game. Adding roguelike elements transforms it:

| Classic Arcade | Roguelike Version |
|----------------|-------------------|
| Infinite continues | Permadeath (3 HP) |
| Same levels | Procedural sectors |
| Fixed difficulty | Escalating challenge |
| Pure skill test | Skill + choices |
| High score chase | Run completion + score |

The roguelike structure creates stories: "I almost won but took a bad Express contract in sector 3" or "Lucky Stars modifier saved my run."

---

## Difficulty Curve

```
Sector 1: Tutorial Zone
├── No enemies
├── Simple layouts
├── Basic contracts (Standard, Express)
└── Zero modifiers

Sector 2: The Test
├── 2 enemies patrol
├── Complex layouts
├── All contract types available
└── 1 random modifier

Sector 3: The Gauntlet
├── 3 enemies
├── Challenging layouts
├── VIP-only (hardest contract)
└── 2 modifiers stack
```

---

## Contract Design Philosophy

Each contract type tests a different skill:

| Contract | Tests | Risk Level |
|----------|-------|------------|
| Standard | Basic navigation | Low |
| Express | Speed + efficiency | Medium |
| Fragile | Precision control | Medium |
| Hazard | Route planning | Medium-High |
| VIP | Perfect execution | High |

Players learn which contracts match their playstyle.

---

## Modifier Design Philosophy

Modifiers add variety without being unfair:

**Movement Modifiers** (change how you fly)
- Solar Storm: Less thrust = more planning
- Ion Clouds: Random drift = constant correction
- Gravity Flux: Timing becomes crucial

**Resource Modifiers** (change what you manage)
- Fuel Leak: Faster depletion = tighter routes

**Information Modifiers** (change what you know)
- Scanner Jam: No minimap = memorize layouts

**Positive Modifiers** (occasional relief)
- Lucky Stars: +25% payouts = reward for surviving

---

## Scoring Philosophy

Score reflects skill, not grinding:

```
Final Score = Cash Earned + Hull Bonus

Cash: Sum of completed contracts
Hull Bonus: $100 per remaining HP
```

**Why no time bonus?**
Time pressure comes from Express contracts and fuel management. Adding a global time bonus would punish careful play.

**Why hull bonus?**
Rewards clean runs. A player who finishes with 3 HP played better than one who limped across with 1 HP.

---

## What Success Looks Like

**Beginner**: Reaches sector 2, earns $200-400
**Intermediate**: Completes run with 1 HP, earns $500-700
**Advanced**: Completes run with 2-3 HP, earns $800-1000+
**Expert**: Completes run with 3 HP, all contracts successful, $1000+

---

## Future Considerations

Potential additions that preserve core design:

- **Daily Seeds**: Same procedural generation for leaderboard competition
- **Unlockable Taxi Skins**: Cosmetic rewards for milestones
- **Challenge Modes**: "All Express" or "No Fuel Stations"
- **Statistics Tracking**: Runs completed, total earnings, favorite contracts

What to avoid:
- Permanent upgrades that trivialize difficulty
- New mechanics that slow down the core loop
- Content bloat that extends run length beyond 5 minutes

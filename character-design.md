# Character Design - Space Taxi Roguelike

## Player Character

### The Space Taxi
The player controls a space taxi rather than a humanoid character. The taxi serves as the player's avatar and primary means of expression.

**Physical Design**
- **Dimensions**: 34×22 pixels
- **Color**: Bright yellow (#ffff00) - classic taxi aesthetic
- **Shape**: Compact spacecraft with visible cockpit, thrusters, and landing gear

**Visual States**
- **Idle**: Neutral position, landing gear retracted
- **Thrusting**: Flame particles from rear/side thrusters
- **Landing**: Landing gear extended when near platforms
- **Damaged**: Visual degradation per HP lost (dents, sparks, smoke)
- **Destroyed**: Explosion particle effect

**Personality Through Mechanics**
- Responsive, nimble controls convey competence
- Vulnerability (3 HP) creates tension and care
- Sound design (engine hum, thrust bursts) gives the taxi "voice"

## NPCs

### Passengers (16 Types)

Each passenger has a unique emoji representation, name, and personality that affects their dialogue.

| Emoji | Name | Personality | Traits |
|-------|------|-------------|--------|
| 🧑‍🚀 | Astronaut | Professional | By-the-book, mission-focused |
| 👾 | Alien | Mysterious | Cryptic, prophetic undertones |
| 🤖 | Robot | Logical | Data-driven, efficiency-obsessed |
| 🕵️ | Agent | Secretive | Paranoid, hush-hush |
| 🧙 | Space Wizard | Eccentric | Wild, mystical enthusiasm |
| 🥷 | Ninja | Silent | Minimal words, dramatic pauses |
| 👽 | Grey | Curious | Inquisitive about humans |
| 🧛 | Void Vampire | Dramatic | Gothic, theatrical flair |
| 🤠 | Space Cowboy | Casual | Laid-back, folksy charm |
| 👩‍🔬 | Scientist | Nerdy | Physics enthusiast, analytical |
| 💀 | Skeleton | Spooky | Morbid humor, death puns |
| 🎃 | Pumpkin Head | Festive | Halloween-obsessed, cheerful |
| 🦊 | Fox Person | Sly | Cunning, watchful |
| 🐙 | Octopoid | Tentacular | Tentacle-based wordplay |
| 🌟 | Star Being | Radiant | Positive, encouraging |
| 🔮 | Fortune Teller | Prophetic | Predicts the obvious dramatically |

### Passenger Dialogue System

Each personality has 3 pickup lines and 3 dropoff lines, randomly selected.

**Pickup Comments (Examples)**

| Personality | Sample Lines |
|-------------|--------------|
| Professional | "Mission acknowledged." / "Coordinates locked." / "Proceed to destination." |
| Mysterious | "The stars align..." / "Interesting trajectory." / "I sense... turbulence." |
| Logical | "Efficiency at 73%." / "Route calculated." / "Fuel consumption nominal." |
| Secretive | "Don't ask questions." / "Keep it quiet." / "No detours." |
| Eccentric | "To infinity!" / "My crystals are tingling!" / "The cosmos calls!" |
| Silent | "..." / "*nods*" / "..." |
| Curious | "What is this vehicle?" / "Fascinating propulsion!" / "Your species is odd." |
| Dramatic | "The void awaits!" / "Darkness is my ally." / "Eternal night beckons!" |
| Casual | "Howdy, partner!" / "Let's ride!" / "Yee-haw, space style!" |
| Nerdy | "Interesting thrust vectors!" / "The physics here are wild!" / "Calculating G-forces..." |
| Spooky | "Boo." / "Cold in here..." / "I see dead planets." |
| Festive | "Trick or treat!" / "Spooky szn!" / "Got any candy?" |
| Sly | "Quick and quiet." / "No funny business." / "I'm watching you." |
| Tentacular | "All 8 arms ready." / "Grip secured." / "Tentacles crossed!" |
| Radiant | "Shine bright!" / "Stellar journey!" / "Glow mode: ON" |
| Prophetic | "I foresee... a landing." / "The cards say: bumpy." / "Destiny awaits!" |

**Dropoff Comments (Examples)**

| Personality | Sample Lines |
|-------------|--------------|
| Professional | "Mission complete." / "Satisfactory service." / "Payment processed." |
| Mysterious | "Until we meet again..." / "The prophecy continues." / "Farewell, mortal." |
| Logical | "Arrival confirmed." / "Trip efficiency: adequate." / "Transaction complete." |
| Secretive | "You saw nothing." / "Forget my face." / "This never happened." |
| Eccentric | "What a ride!" / "My aura is pleased!" / "Cosmic blessings!" |
| Silent | "..." / "*vanishes*" / "..." |
| Curious | "Adequate transport." / "Your world is strange." / "Most educational." |
| Dramatic | "The night embraces me!" / "Into the shadows!" / "MWAHAHAHA!" |
| Casual | "Much obliged!" / "See ya, space cowboy!" / "That was a hoot!" |
| Nerdy | "Smooth deceleration!" / "Great landing angle!" / "5 stars for physics!" |
| Spooky | "Rest in peace..." / "The haunting continues." / "BOO-bye!" |
| Festive | "Happy Halloween!" / "Pumpkin approved!" / "Spook-tacular ride!" |
| Sly | "Smooth operation." / "You're alright, pilot." / "Perhaps again sometime." |
| Tentacular | "Suction cups satisfied." / "8/8 would ride again." / "Tentastic!" |
| Radiant | "You're a star!" / "Keep shining!" / "Brilliant journey!" |
| Prophetic | "As I foresaw." / "Destiny delivered." / "The cards were right." |

### VIP Passengers
- Appear only in Sector 3 (Final Fare)
- Same passenger pool but with VIP contract attached
- Higher stakes: zero bumps required, soft landing mandatory
- $300 payout reflects their importance

### Radio Chatter (Ambient NPCs)
Background radio transmissions create sense of a living universe:
- Control tower announcements
- Other pilots reporting in
- Weather/hazard warnings
- Flavor text about the sector

## Enemies

### Orbital Creatures
Space-dwelling entities that patrol in circular patterns.

**Design**
- **Size**: 15-30 pixels diameter
- **Shape**: Circular/organic forms
- **Movement**: Orbital patrol around a center point
- **Behavior**: Non-aggressive but hazardous on contact

**Specifications**
- **Orbit Radius**: 80-200 pixels from center
- **Speed**: 0.001-0.002 orbital velocity (slow, predictable)
- **Damage**: 2 HP on collision
- **Placement**: Positioned away from platforms and spawn areas

**Sector Distribution**
| Sector | Enemy Count |
|--------|-------------|
| 1 - Morning Shift | 0 |
| 2 - Rush Hour | 2 |
| 3 - Final Fare | 3 |

**Design Philosophy**
- Enemies are environmental hazards, not aggressive pursuers
- Predictable patrol patterns reward observation
- Placed to create "hazard zones" for Hazard Pay contracts
- Visual telegraph of patrol path aids player planning

## Character Abilities

### Taxi Abilities
The taxi's "abilities" are its flight mechanics:

| Ability | Description | Cost |
|---------|-------------|------|
| Main Thrust | Upward acceleration (0.24/frame) | 0.18 fuel |
| Left Thrust | Leftward + rotation | 0.07 fuel |
| Right Thrust | Rightward + rotation | 0.07 fuel |
| Auto-Level | Passive angle correction when idle | Free |
| Soft Landing | Land at speed ≤1.0 for safe delivery | Skill |

### Passenger Influence
Passengers don't grant abilities but modify gameplay through contracts:

| Contract | Passenger Effect |
|----------|------------------|
| Standard | No special requirements |
| Express | Time pressure (30 seconds) |
| Fragile | Speed limit (max 2.0) |
| Hazard Pay | Must fly through danger zones |
| VIP | Perfect flight required |

## Character Progression

### No Permanent Upgrades
Following roguelike philosophy, characters don't level up:
- **Taxi**: Same stats every run (3 HP, same thrust values)
- **Passengers**: Random selection each sector
- **Enemies**: Fixed behavior patterns

### Run-Based Progression
Progression is skill-based and within-run only:

**Player Mastery**
- Learn landing precision
- Master fuel efficiency
- Memorize hazard patterns
- Optimize routes

**Economic Progression (Per Run)**
- Earn cash from deliveries
- Spend on repairs ($100/HP)
- Buy fuel packs at base
- Final score = cash + hull bonus

### Difficulty Scaling
Characters don't get stronger; the environment gets harder:

| Sector | Challenge Increase |
|--------|-------------------|
| 1 | Tutorial: No enemies, few hazards |
| 2 | Introduction: 2 enemies, 1 modifier |
| 3 | Gauntlet: 3 enemies, 2 modifiers, VIP pressure |

### Design Intent
- Every run starts equal
- Skill is the only upgrade
- Passengers add personality, not power
- Enemies are obstacles, not bosses

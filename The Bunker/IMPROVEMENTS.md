# The Bunker - Improvement Plan

A collection of potential improvements and features to enhance the game experience.

## Gameplay Enhancements

### Audio Cues
- [x] **Footstep sounds** - Audible steps that get louder as the opponent approaches
- [ ] **Heartbeat effect** - Pulsating heartbeat when enemy is nearby
- [ ] **Breathing sounds** - Heavy breathing while running

### Mechanics
- [ ] **Power-ups** - Temporary speed boosts or brief invisibility scattered in the maze
- [ ] **Hiding mechanic** - Closets or dark corners where players can hide
- [ ] **Stamina system** - Sprint ability with limited stamina that regenerates
- [ ] **Traps** - Placeable or environmental traps that slow down players

### Balance
- [ ] **Better win detection** - First to touch wins (not based on facing direction)
- [ ] **Spawn protection** - Brief invulnerability at game start
- [ ] **Catch cooldown** - Prevent immediate re-catches after near misses

---

## Visual Improvements

### Post-Processing Effects
- [ ] **Vignette** - Darkened screen edges for claustrophobic feel
- [ ] **Chromatic aberration** - Subtle color fringing for unease
- [ ] **Film grain** - Adds grittiness and horror atmosphere
- [ ] **Motion blur** - Subtle blur when turning quickly

### Particle Effects
- [ ] **Dust particles** - Floating dust visible in light beams
- [ ] **Lamp sparks** - Sparks from broken/flickering lamps
- [ ] **Fog wisps** - Low-lying fog that moves slowly

### Dynamic Elements
- [ ] **Screen shake** - On collisions or when opponent is very close
- [ ] **Dynamic shadows** - Moving shadows from swinging lamps
- [ ] **Flashlight flicker** - Occasional flashlight malfunction

### Creature Animations
- [ ] **Walk cycle** - Animated leg movement when moving
- [ ] **Idle animation** - Subtle breathing/swaying when standing
- [ ] **Head tracking** - Creature head follows movement direction
- [ ] **Attack animation** - Lunge animation when catching opponent

---

## Audio Enhancements

### Spatial Audio
- [ ] **3D positional audio** - Hear opponent's location in stereo
- [ ] **Distance-based volume** - Sounds fade with distance
- [ ] **Occlusion** - Walls muffle sounds realistically

### Environmental Sounds
- [ ] **Dripping water** - Random drips echoing in corridors
- [ ] **Creaking metal** - Structural sounds from the bunker
- [ ] **Distant rumbles** - Occasional deep thuds
- [ ] **Electrical buzzing** - From working lamps

### Feedback Sounds
- [ ] **Proximity warning** - Subtle rising tone when enemy approaches
- [ ] **Wall collision** - Thud sound when hitting walls
- [ ] **Map phase sounds** - Static/surveillance beep during map view

---

## New Features

### Game Modes
- [ ] **Hunter/Hunted** - Asymmetric roles, one hunts, one hides
- [ ] **Timed survival** - Survive for X minutes without being caught
- [ ] **Tag team** - Catching swaps roles instead of ending game
- [ ] **Darkness mode** - No lamps, only flashlights

### Multiplayer
- [ ] **Online multiplayer** - WebRTC peer-to-peer connection
- [ ] **Matchmaking** - Simple lobby system
- [ ] **Spectator mode** - Watch ongoing games

### Customization
- [ ] **Maze size selection** - Small (7x7), Medium (9x9), Large (13x13)
- [ ] **Difficulty settings** - Adjust fog density, lamp count, speed
- [ ] **Creature skins** - Different creature appearances
- [ ] **Control remapping** - Custom key bindings

### Meta Features
- [ ] **Round system** - Best of 3/5 rounds
- [ ] **Replay system** - Top-down replay after game ends
- [ ] **Statistics tracking** - Time played, distance traveled, wins/losses
- [ ] **Achievements** - Unlock badges for accomplishments

---

## Technical Improvements

### Performance
- [ ] **Level of detail (LOD)** - Simplified models at distance
- [ ] **Texture atlasing** - Combine textures for fewer draw calls
- [ ] **Object pooling** - Reuse objects instead of creating new ones
- [ ] **Frustum culling optimization** - Don't render off-screen objects

### Platform Support
- [ ] **Mobile touch controls** - Virtual joysticks for tablet/phone
- [ ] **Gamepad support** - Full controller support with rumble
- [ ] **Fullscreen API** - Proper fullscreen toggle
- [ ] **PWA support** - Installable as app, offline play

### Code Quality
- [ ] **TypeScript migration** - Type safety and better tooling
- [ ] **Unit tests** - Test core game logic
- [ ] **Build system** - Bundling and minification
- [ ] **Documentation** - JSDoc comments for all functions

---

## Polish

### UI/UX
- [ ] **Settings menu** - Volume, sensitivity, graphics options
- [ ] **Pause menu** - Pause game with menu overlay
- [ ] **Tutorial** - Brief interactive tutorial for new players
- [ ] **Loading screen** - Progress indicator while generating maze

### Visual Feedback
- [ ] **Catch indicator** - Visual flash when catching opponent
- [ ] **Damage vignette** - Red screen edge when caught
- [ ] **Victory celebration** - Particle effects for winner
- [ ] **Timer warnings** - Flashing timer in last 3 seconds

---

## Priority Recommendations

### High Impact, Low Effort
1. Footstep sounds with proximity volume
2. Screen vignette effect
3. Round system (best of 3)
4. Better win detection

### High Impact, Medium Effort
1. 3D spatial audio for opponent
2. Walk animation for creatures
3. Post-processing shader effects
4. Gamepad support

### High Impact, High Effort
1. Online multiplayer
2. Full creature animation system
3. Multiple game modes
4. Mobile touch controls

# Visuals - Space Taxi Roguelike

## Art Style

### Overall Aesthetic
- **Style**: Retro pixel-inspired with modern effects
- **Resolution**: 800×600 canvas viewport
- **Rendering**: HTML5 Canvas 2D with post-processing pipeline

### Taxi Design
- **Dimensions**: 34×22 pixels
- **Features**: Visible landing gear animation, thrust flames, damage states
- **Color**: Bright yellow (#ffff00) with metallic highlights

### Platform Design
- **Standard Platforms**: 110×22 pixels, glowing accent color per theme
- **Fuel Stations**: 90×22 pixels, distinct fuel pump visual
- **Names**: Universe-themed (Alpha Base, Nebula Dock, Void Station, etc.)

### Hazard Visuals
- **Asteroids**: Irregular 8-13 vertex polygons, rocky gray tones
- **Debris**: Small geometric shapes (scrap, panel, pipe, crystal)
- **Meteors**: Rounded with 15-point fiery trail, orange/red glow
- **Enemies**: Circular patrol creatures with orbital path indicators

## Color Palette

### Eight Environment Themes

| Theme | Background | Walls | Platform Accent | Star Colors |
|-------|------------|-------|-----------------|-------------|
| **Deep Space** | #050510 | #2a2a4a | #00ff41 (green) | Blue/purple tones |
| **Nebula Zone** | #100818 | #3a1a4a | #ff00ff (pink) | Purple nebula clouds |
| **Ice Fields** | #081018 | #2a4a6a | #00ffff (cyan) | Icy blue tones |
| **Lava Sector** | #180808 | #4a2a1a | #ff6600 (orange) | Hot reds/oranges |
| **Asteroid Belt** | #0a0a0a | #4a4a4a | #ffaa00 (gold) | Rocky grays |
| **Void Rift** | #080010 | #1a0a3a | #aa00ff (purple) | Dark void energy |
| **Solar Flare** | #181008 | #5a4a1a | #ffff00 (yellow) | Bright solar tones |
| **Crystal Caves** | #080818 | #2a3a5a | #44ffaa (teal) | Crystalline blues |

### Theme Assignment
- **Sector 1**: Always Deep Space (familiar, safe)
- **Sector 2**: Random theme (Nebula, Ice, Lava, Asteroid, Solar, Crystal)
- **Sector 3**: Always Void Rift (ominous finale)

### UI Colors
- **Fuel Gauge**: Green (>50) → Yellow (25-50) → Red (<25)
- **Speed Gauge**: Green (0-1.0) → Yellow (1.0-3.0) → Red (>3.0)
- **Landing Indicator**: Green "LAND OK" / Red "TOO FAST"
- **Hull Hearts**: ❤️ (full) / 🖤 (empty)
- **Cash**: Gold/yellow text
- **Damage Flash**: Red screen tint
- **Delivery Flash**: Yellow/white screen tint

## UI/UX Design

### Contract Selection Overlay
- Semi-transparent dark background
- 2-3 contract cards with type, payout, requirements
- 5-second countdown timer
- Keyboard hints (1/2/3) or gamepad navigation

### Base Station UI
- Central taxi with visible damage state
- Hull indicator with repair option ($100/HP)
- Fuel bar with purchase options
- Cash display
- "Start Shift" button

### Run Summary Screen
- Sector reached
- Passengers delivered
- Total cash earned
- Time elapsed
- Hull bonus calculation
- Final score

### Minimap
- **Size**: 160×120 pixels
- **Content**: Player position, platforms, hazards
- **Disabled**: When Scanner Jam modifier active

## Animations

### Taxi Animations
- **Thrust**: Flame particles emit from rear/sides
- **Landing Gear**: Extends when near platforms, retracts in flight
- **Damage**: Visual hull degradation per HP lost
- **Rotation**: Smooth angle interpolation with auto-level

### Passenger Animations
- **Pickup**: Emoji appears, boarding message displays
- **In-Transit**: Passenger emoji visible on HUD
- **Delivery**: Celebration effect, personality comment

### Hazard Animations
- **Asteroids**: Slow rotation, drifting movement
- **Debris**: Tumbling rotation, faster drift
- **Meteors**: Fast linear movement with fire trail
- **Enemies**: Circular orbital patrol pattern

### State Transitions
- **Sector Start**: Theme fade-in, platform reveal
- **Sector Complete**: Flash effect, transition overlay
- **Death**: Explosion animation, fade to summary
- **Victory**: Celebration particles, score tally

## Effects

### Particle Systems

**Thrust Particles**
- **Spawn Rate**: 2-4 per frame during thrust
- **Decay**: 0.04-0.07 per frame
- **Up Thrust**: Yellow (#ffff55), spreads downward
- **Side Thrust**: Cyan (#00ffff), spreads sideways
- **Size**: Small dots with fade-out

**Explosion Particles**
- **Count**: 60 major + 15 smoke particles
- **Colors**: Orange, red, yellow, white
- **Decay**: 0.01-0.03 per frame
- **Smoke**: Gray particles with gravity applied
- **Duration**: ~2 seconds total

**Meteor Trail**
- **Points**: 15-point trail behind meteor
- **Fade**: 0.21 seconds decay
- **Colors**: Orange core, red edges

### Screen Effects

**Screen Shake**
- **Trigger**: Damage, collisions, explosions
- **Decay**: Intensity × 0.9 per frame
- **Application**: Random offset to camera position

**Color Flash**
- **White**: Collision impact
- **Yellow**: Successful delivery
- **Red**: Damage taken
- **Duration**: Quick fade (0.1-0.2 seconds)

### Post-Processing
- Color grading per theme
- Vignette effect (subtle darkening at edges)
- Bloom on bright elements (thrust, explosions)

## Technical Specifications

### Rendering Pipeline
1. Clear canvas with theme background
2. Draw parallax star layers (4 layers, different speeds)
3. Draw level geometry (platforms, walls)
4. Draw hazards (asteroids, debris, meteors, enemies)
5. Draw taxi with effects
6. Draw particles
7. Apply post-processing
8. Draw HUD overlay

### Parallax Stars
- **Layers**: 4 depth layers
- **Movement**: Slower layers = farther depth
- **Colors**: Theme-specific star colors
- **Density**: Varied per layer for depth illusion

### Performance Targets
- **Frame Rate**: 60 FPS target
- **Canvas Size**: 800×600 (scalable)
- **Particle Limit**: ~200 active particles max
- **Draw Calls**: Batched where possible

### Camera System
- Follows taxi with smooth interpolation
- Constrained within level bounds
- Centered on 800×600 viewport
- Supports level sizes up to 2000×1600

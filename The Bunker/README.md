# The Bunker

A local multiplayer 3D first-person tag game set in a dark, abandoned underground maze.

## Game Principle

Two players are trapped in a procedurally generated bunker maze. Each player views the world through their own first-person camera in a split-screen setup. The goal is simple: **hunt and catch your opponent**. The first player to touch the other wins.

The twist: visibility is extremely limited. The bunker is dark, lit only by sparse ceiling lamps - some working, some flickering, some broken. Players must navigate by flashlight through the oppressive darkness, listening for footsteps and watching for the glow of their opponent's eyes.

Every 10 seconds, the game pauses and a surveillance map reveals both players' positions - a brief moment of knowledge before the hunt resumes.

## Game Mechanics

### Core Loop

| Phase | Duration | Description |
|-------|----------|-------------|
| **Hunt Phase** | 10 seconds | Players move freely through the maze in first-person view |
| **Map Phase** | 5 seconds | Game pauses, top-down map shows maze layout and both player positions |

The loop repeats until one player catches the other.

### Controls

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move Forward | W | Arrow Up |
| Move Backward | S | Arrow Down |
| Turn Left | A | Arrow Left |
| Turn Right | D | Arrow Right |

Gamepad support is also available.

### Win Condition

Touch your opponent. When players collide, the game determines the winner based on which player was facing toward the other (the "catcher").

### Environment

- **Maze**: 9x9 grid generated using depth-first search algorithm
- **Visibility**: Limited by exponential fog and sparse lighting
- **Lighting Sources**:
  - Player flashlights (follows view direction)
  - Ceiling lamps (60% normal, 25% flickering, 15% broken)
  - Player eye glow (blue for P1, red for P2)

### Player Characters

Players are represented as underground creatures with:
- Hunched humanoid body with spine bumps
- Elongated head with sunken eye sockets
- Glowing eyes (used for identification in darkness)
- Long arms with clawed hands
- Digitigrade legs

## Technology

### Engine & Libraries

- **Three.js r128** - 3D rendering engine (loaded via CDN)
- **Web Audio API** - Procedural ambient music and sound effects
- **HTML5 Canvas** - Map overlay rendering and procedural textures

### Rendering

| Feature | Implementation |
|---------|----------------|
| Split-screen | `renderer.setScissor()` and `renderer.setViewport()` |
| Fog | `THREE.FogExp2` with density 0.055 |
| Materials | `MeshStandardMaterial` with emissive properties |
| Textures | Procedurally generated via Canvas API |
| Shadows | Disabled for performance |
| Anti-aliasing | Disabled for performance |

### Procedural Generation

**Maze Algorithm**: Recursive Backtracker (Depth-First Search)
- Creates a perfect maze (exactly one path between any two points)
- Guarantees all areas are reachable

**Textures**: Generated at runtime using Canvas 2D
- Walls: Concrete with cracks, seams, and water stains
- Floor: Tiled concrete with dirt and puddles
- Ceiling: Dark panels with rust stains

### Audio System

All audio is procedurally generated using Web Audio API oscillators and filters:

| Sound | Generation Method |
|-------|-------------------|
| Bass Drone | Sawtooth oscillators (55Hz, 82.5Hz, 110Hz) with LFO modulation |
| Eerie Tone | Sine wave (440Hz) with pitch drift and volume modulation |
| Metallic Clangs | Square wave bursts through bandpass filter |
| Rumbles | Low sine waves (30-50Hz) with envelope |
| Wind/Breath | Filtered noise buffer |

Random creepy sounds play every 3-11 seconds.

### Camera Effects

- **Head Bob**: Sinusoidal vertical movement when walking
- **Roll Sway**: Subtle camera tilt synchronized with steps
- **First-Person View**: Camera height at 1.6 units (eye level)

### Collision Detection

- **Wall Collision**: Circle-AABB intersection test
- **Player Collision**: Distance check between player positions
- **Catch Distance**: 1.0 units

### Performance Optimizations

- Shadow mapping disabled
- Anti-aliasing disabled
- Pixel ratio capped at 1.5
- Reduced lamp count (~25% of cells)
- Simple collision geometry (AABB)

## File Structure

```
The Bunker/
├── index.html          # HTML structure
├── README.md           # Documentation
├── css/
│   └── style.css       # All styles
└── js/
    ├── main.js         # Entry point
    ├── config.js       # Game configuration constants
    ├── state.js        # Global state management
    ├── game.js         # Game loop and phase management
    ├── renderer.js     # Three.js setup and rendering
    ├── maze.js         # Maze generation (DFS algorithm)
    ├── textures.js     # Procedural texture generation
    ├── lamps.js        # Ceiling lamp system
    ├── creatures.js    # Player creature models
    ├── collision.js    # Collision detection
    ├── input.js        # Keyboard input handling
    ├── map.js          # Map overlay rendering
    └── audio.js        # Procedural audio system
```

The game uses ES6 modules for clean separation of concerns. No build process required - just serve the files.

## Running the Game

### Local
Simply open `index.html` in a modern web browser.

### Network (LAN)
Start a local server to play on other devices:

```bash
cd "The Bunker"
python3 -m http.server 8080
```

Then access via `http://<your-ip>:8080` from any device on the same network.

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

Requires WebGL support and Web Audio API.

# Space Taxi Roguelike - Visual Enhancements Guide

## Overview

This document describes the comprehensive visual enhancement system that transforms Space Taxi Roguelike into a stunning retro-futuristic experience, blending classic pixel art aesthetics with modern flashy effects inspired by 2026 design trends.

## Visual Style: Retro-Futurism

The game combines:
- **Retro Elements**: CRT scanlines, pixel-perfect rendering, limited color palette
- **Modern Effects**: Neon glows, particle systems, dynamic lighting, chromatic aberration
- **2026 Aesthetic**: Glassmorphism hints, neon sci-fi interfaces, Y3K hyperfuturism

## Color Scheme

### Primary Neon Palette
- **Dark Space Background**: `#0a0a1a` - Deep space void
- **Neon Cyan**: `#00FFFF` - Taxi window, UI highlights, friendly elements
- **Neon Magenta**: `#FF00FF` - Enemies, danger indicators
- **Neon Green**: `#00FF88` - Money, success, safe indicators
- **Neon Orange**: `#FF8800` - Warnings, fuel indicators
- **Neon Yellow**: `#FFDD00` - Taxi body, player elements

## Shader System

### 1. CRT Scanline Shader (`crt_scanline.gdshader`)

Creates authentic retro CRT monitor effect:

**Features:**
- Horizontal scanlines with adjustable frequency
- Screen curvature for CRT bulge effect
- Vignette darkening at edges
- Chromatic aberration (RGB split) for analog feel
- Film grain noise
- Bloom glow on bright areas

**Parameters:**
```gdscript
scanline_strength: 0.0 - 1.0  # Default: 0.3
scanline_frequency: 0 - 1000  # Default: 500
curvature_amount: 0.0 - 10.0  # Default: 2.0
vignette_strength: 0.0 - 1.0  # Default: 0.4
chromatic_aberration: 0.0 - 0.01  # Default: 0.002
noise_amount: 0.0 - 0.1  # Default: 0.02
glow_strength: 0.0 - 2.0  # Default: 0.3
```

**Usage:**
Apply to main camera or viewport for full-screen effect.

### 2. Neon Glow Shader (`neon_glow.gdshader`)

Adds pulsing neon outlines to UI and objects:

**Features:**
- Glowing outline detection
- Pulsing animation
- Adjustable glow color and intensity
- Perfect for buttons, HUD elements, important objects

**Parameters:**
```gdscript
glow_color: Color  # Default: Cyan
glow_strength: 0.0 - 5.0  # Default: 2.0
pulse_speed: 0.0 - 10.0  # Default: 2.0
pulse_amount: 0.0 - 1.0  # Default: 0.3
outline_thickness: 0.0 - 10.0  # Default: 3.0
enable_pulse: bool  # Default: true
```

### 3. Pixelate Shader (`pixelate.gdshader`)

Creates chunky pixel art style:

**Features:**
- Adjustable pixel size
- Color depth reduction
- Bayer matrix dithering
- Maintains crisp pixel boundaries

**Parameters:**
```gdscript
pixel_size: 1 - 16  # Default: 4
dither_enabled: bool  # Default: true
color_depth: 2 - 8  # Default: 5
```

### 4. Bloom Glow Shader (`bloom_glow.gdshader`)

Makes bright areas glow and bleed:

**Features:**
- Threshold-based bloom extraction
- Multi-sample blur
- Intensity control
- Performance-optimized

**Parameters:**
```gdscript
bloom_threshold: 0.0 - 1.0  # Default: 0.6
bloom_intensity: 0.0 - 3.0  # Default: 1.5
blur_size: 0.0 - 10.0  # Default: 3.0
```

### 5. Speed Lines Shader (`speed_lines.gdshader`)

Dynamic motion lines for high-speed gameplay:

**Features:**
- Radial speed lines from center
- Intensity based on velocity
- Animated line movement
- Configurable density and color

**Parameters:**
```gdscript
velocity_direction: Vector2
speed_intensity: 0.0 - 1.0
line_color: Color  # Default: White with transparency
line_density: 0.0 - 100.0  # Default: 20.0
line_length: 0.0 - 1.0  # Default: 0.3
```

## Visual Effects System

### VisualEffects Class (`visual_effects.gd`)

Central hub for all particle and screen effects:

#### Screen Effects

**Screen Flash**
```gdscript
visual_effects.screen_flash(Color.WHITE, 0.5)
```
Brief full-screen color flash for impact.

**Damage Flash**
```gdscript
visual_effects.damage_flash()
```
Red flash with chromatic aberration for damage feedback.

**Explosion Flash**
```gdscript
visual_effects.explosion_flash(position)
```
Orange flash for explosions.

#### Particle Effects

**Neon Explosion**
```gdscript
visual_effects.spawn_neon_explosion(position, color, particle_count, scale)
```
- Multi-colored particles radiating outward
- Layered glow effects
- Complementary color mixing
- Screen flash integration

**Thrust Particles**
```gdscript
visual_effects.spawn_thrust_particles(position, direction, color)
```
- Directional particle emission
- Neon glow trails
- Short-lived, fast-moving

**Spark Burst**
```gdscript
visual_effects.spawn_spark_burst(position, count, color)
```
- Collision/landing sparks
- Gravity-affected
- High-intensity glow

**Pickup Effect**
```gdscript
visual_effects.spawn_pickup_effect(position)
```
- Ring of green particles
- Radiates outward
- Success feedback

**Landing Effect**
```gdscript
visual_effects.spawn_landing_effect(position, success)
```
- Green sparks for successful landing
- Red sparks for crash/damage
- Ground impact visual

#### Trail System

**Neon Trail**
```gdscript
visual_effects.add_trail_point(position, color)
```
- Smooth motion trail behind taxi
- Color interpolation based on speed
- Fades over time
- Glowing segments

**Text Popup**
```gdscript
visual_effects.spawn_text_popup(position, text, color)
```
- Floating text feedback
- Upward motion
- Glow effect
- Auto-fade

## Enhanced Starfield

### Features

**Multi-Layer Parallax**
- 4 depth layers with different scroll speeds
- Faster foreground, slower background
- Creates depth perception

**Colored Stars**
- White, blue, orange, purple, cyan star colors
- Variable brightness
- Individual twinkle speeds
- Size variation by layer

**Nebula Patches**
- Soft gradient clouds
- Purple, blue, magenta, cyan colors
- Pulsing animation
- Parallax movement
- Low-alpha ambient atmosphere

**Performance**
- Stars per layer: 100, 60, 40, 20 (total 220 stars)
- 8 nebula patches
- Wrapping for infinite scroll
- Efficient draw calls

### Configuration

```gdscript
const LAYER_COUNT = 4
const STARS_PER_LAYER = [100, 60, 40, 20]
const LAYER_SPEEDS = [0.05, 0.15, 0.35, 0.6]
const LAYER_SIZES = [0.8, 1.2, 2.0, 3.5]
const LAYER_BRIGHTNESS = [0.2, 0.4, 0.6, 0.9]
```

## Entity Visual Enhancements

### Taxi

**Base Visuals**
- Neon yellow body (#FFDD00)
- Cyan window highlight (#00FFFF)
- Dark wheels with subtle color

**Dynamic Effects**
- Neon trail based on velocity
- Color shifts from cyan (slow) to yellow (fast)
- Thrust particle emission
- Speed lines at high velocity
- Damage flash with red tint
- Invulnerability flicker

**Trail System**
- Spawns trail point every 0.05 seconds
- Width and opacity fade over time
- Glowing segments
- Smooth interpolation

### Platforms

**Landing Pads**
- Pulsing neon green indicators
- Mark safe landing zones
- Breathing animation (sin wave)

**Buildings**
- Darker industrial colors
- Neon cyan door accents
- Animated window lights
- Random flickering (5% chance per frame)
- Blue-tinted lit windows

**Fuel Stations**
- Neon green fuel pump indicator
- Glowing "FUEL" text
- Pulsing light effect

### Enemies

**Visual Style**
- Neon magenta spiky body (#FF00FF)
- Rotating animation
- Pulsing glow effect

**Orbit Path**
- Visible magenta trail showing movement path
- Semi-transparent
- Danger warning

**Collision Effects**
- Magenta explosion particles
- Screen flash
- Knockback with visual feedback

## Post-Processing System

### PostProcessing Class (`post_processing.gd`)

Layer-based screen-space effects:

**CRT Overlay**
- Full-screen scanline effect
- Screen curvature
- Vignette
- Toggleable

**Speed Lines Overlay**
- Dynamic based on player velocity
- Radial from screen center
- Intensity scales with speed

**Configuration Methods**
```gdscript
post_processing.toggle_crt(enabled: bool)
post_processing.toggle_scanlines(enabled: bool)
post_processing.set_scanline_intensity(intensity: float)
post_processing.set_speed(speed: float)
post_processing.set_chromatic_aberration(amount: float)
```

## Performance Optimization

### Best Practices

1. **Particle Pooling**
   - Reuse particle objects when possible
   - Limit max particles (500 recommended)
   - Auto-cleanup after lifetime

2. **Shader Optimization**
   - Use built-in hint types
   - Minimize texture lookups
   - Efficient blur algorithms

3. **Draw Call Reduction**
   - Batch similar effects
   - Use CanvasItem for custom drawing
   - Limit nested effects

4. **Mobile Considerations**
   - Reduce particle counts on low-end devices
   - Lower shader quality settings
   - Disable expensive post-processing

### Performance Settings

```gdscript
# Quality presets
const QUALITY_LOW = {
	"crt_enabled": false,
	"max_particles": 200,
	"trail_points": 15,
	"star_count": 0.5  # multiplier
}

const QUALITY_MEDIUM = {
	"crt_enabled": true,
	"max_particles": 350,
	"trail_points": 20,
	"star_count": 0.75
}

const QUALITY_HIGH = {
	"crt_enabled": true,
	"max_particles": 500,
	"trail_points": 30,
	"star_count": 1.0
}
```

## Integration Guide

### Adding to Existing Scenes

1. **Game Manager Setup**
```gdscript
# In _ready()
visual_effects = VisualEffects.new()
add_child(visual_effects)

post_processing = PostProcessing.new()
add_child(post_processing)
```

2. **Entity Connection**
```gdscript
# Connect entities to effects system
taxi.setup_visual_effects(visual_effects)
enemy.setup_visual_effects(visual_effects)
```

3. **Shader Application**
```gdscript
# Apply shader to sprite/polygon
var shader_material = ShaderMaterial.new()
shader_material.shader = load("res://shaders/neon_glow.gdshader")
sprite.material = shader_material
```

### Event-Based Effects

**On Pickup**
```gdscript
visual_effects.spawn_pickup_effect(position)
visual_effects.spawn_text_popup(position + Vector2(0, -40), "+PICKUP", Color.GREEN)
```

**On Delivery**
```gdscript
visual_effects.spawn_neon_explosion(position, Color.GREEN, 20, 0.5)
visual_effects.spawn_text_popup(position + Vector2(0, -40), "+$100", Color.GREEN)
```

**On Damage**
```gdscript
visual_effects.damage_flash()
visual_effects.spawn_spark_burst(position, 15, Color.RED)
post_processing.set_chromatic_aberration(0.01)
```

**On Landing**
```gdscript
var success = speed <= safe_speed and gear_extended
visual_effects.spawn_landing_effect(position, success)
```

## Customization

### Creating New Effects

1. **New Particle Type**
```gdscript
class CustomParticle extends Node2D:
	var velocity: Vector2
	var life: float
	var color: Color

	func _process(delta: float) -> void:
		position += velocity * delta
		life -= delta
		if life <= 0:
			queue_free()
		queue_redraw()

	func _draw() -> void:
		# Custom draw logic
		draw_circle(Vector2.ZERO, 5, color)
```

2. **New Shader Effect**
```glsl
shader_type canvas_item;

uniform float effect_strength : hint_range(0.0, 1.0) = 0.5;

void fragment() {
	vec4 color = texture(TEXTURE, UV);
	// Apply custom effect
	COLOR = color;
}
```

### Color Palette Swaps

Easily change the neon color scheme by modifying constants:

```gdscript
# In visual_effects.gd or game_config
const PALETTE_CYAN_PUNK = {
	"primary": Color(0.0, 1.0, 1.0),    # Cyan
	"danger": Color(1.0, 0.0, 1.0),     # Magenta
	"success": Color(0.0, 1.0, 0.5),    # Green
	"warning": Color(1.0, 0.5, 0.0)     # Orange
}

const PALETTE_VAPOR_WAVE = {
	"primary": Color(1.0, 0.0, 1.0),    # Magenta
	"danger": Color(1.0, 1.0, 0.0),     # Yellow
	"success": Color(0.5, 0.0, 1.0),    # Purple
	"warning": Color(0.0, 1.0, 1.0)     # Cyan
}
```

## Future Enhancements

### Potential Additions

- **Holographic UI**: Glassmorphism overlays for menus
- **Dynamic Lighting**: Per-pixel lights from engines and buildings
- **Weather Effects**: Neon rain, space dust storms
- **More Shaders**: Glitch effect, distortion waves
- **Advanced Particles**: GPU particle systems for better performance
- **Reflection Effects**: Mirror/chrome reflections on taxi
- **Screen Space Reflections**: Water/glass surface reflections

### Experimental Features

- **Pixel Art + 3D Hybrid**: Voxel-style 3D elements
- **Reactive Audio**: Visuals pulse with music beats
- **Procedural Animations**: Shader-based character animation
- **VFX Graph**: Node-based particle system editor

## Troubleshooting

### Common Issues

**Shaders not appearing**
- Ensure shader files are in `res://shaders/` directory
- Check that shaders compile without errors
- Verify material is applied to correct node

**Performance drops**
- Reduce particle count
- Disable CRT effect on low-end devices
- Lower star count in starfield
- Decrease trail point limit

**Flickering effects**
- Check z_index values
- Ensure proper layer ordering
- Verify alpha blending settings

**Colors look wrong**
- Confirm Color values use 0.0-1.0 range
- Check monitor gamma/HDR settings
- Verify shader color space

## Credits & Inspiration

Visual design inspired by:
- 2026 design trends: Glassmorphism, Neon UI, Y3K aesthetics
- Classic arcade games: Asteroids, Space Taxi
- Cyberpunk aesthetic: Blade Runner, Tron
- Modern indie games: Neon Drive, Geometry Wars

Shader techniques based on:
- CRT shader tutorials by various Godot community members
- Post-processing examples from Godot documentation
- Real-time VFX principles

---

**Version**: 1.0
**Last Updated**: January 2026
**Godot Version**: 4.5+

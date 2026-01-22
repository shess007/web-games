# Visual Effects - Quick Reference Card

## 🎨 Common Color Values

```gdscript
# Copy-paste ready color constants
const NEON_CYAN = Color(0.0, 1.0, 1.0)        # #00FFFF
const NEON_MAGENTA = Color(1.0, 0.0, 1.0)    # #FF00FF
const NEON_GREEN = Color(0.0, 1.0, 0.533)    # #00FF88
const NEON_ORANGE = Color(1.0, 0.533, 0.0)   # #FF8800
const NEON_YELLOW = Color(1.0, 0.867, 0.0)   # #FFDD00
const DARK_SPACE = Color(0.04, 0.04, 0.1)    # #0a0a1a
```

## ⚡ Most Used Effect Calls

```gdscript
# Screen flash
visual_effects.screen_flash(Color.WHITE, 0.5)

# Damage feedback
visual_effects.damage_flash()
visual_effects.spawn_spark_burst(position, 15, Color.RED)

# Explosion
visual_effects.spawn_neon_explosion(position, Color.ORANGE, 30, 1.0)

# Pickup feedback
visual_effects.spawn_pickup_effect(position)
visual_effects.spawn_text_popup(position + Vector2(0, -40), "+PICKUP", Color.GREEN)

# Trail (call every frame when moving)
visual_effects.add_trail_point(position, Color.CYAN)

# Thrust particles
visual_effects.spawn_thrust_particles(position, direction, Color.YELLOW)

# Landing sparks
visual_effects.spawn_landing_effect(position, success_bool)

# Money text
visual_effects.spawn_text_popup(position + Vector2(0, -40), "+$%d" % amount, Color.GREEN)
```

## 🎮 Shader Application

```gdscript
# Apply neon glow to any CanvasItem
var material = ShaderMaterial.new()
material.shader = load("res://shaders/neon_glow.gdshader")
material.set_shader_parameter("glow_color", Color.CYAN)
material.set_shader_parameter("glow_strength", 2.0)
node.material = material

# Apply CRT effect to viewport
var crt_material = ShaderMaterial.new()
crt_material.shader = load("res://shaders/crt_scanline.gdshader")
viewport_rect.material = crt_material

# Quick pixelation
var pixel_material = ShaderMaterial.new()
pixel_material.shader = load("res://shaders/pixelate.gdshader")
pixel_material.set_shader_parameter("pixel_size", 4)
sprite.material = pixel_material
```

## 🔧 Quick Settings Adjustments

```gdscript
# Access via VisualConfig autoload
VisualConfig.set_quality_preset(VisualConfig.Quality.MEDIUM)
VisualConfig.set_color_palette("vaporwave")
VisualConfig.toggle_effect("crt", false)

# Get colors from active palette
var color = VisualConfig.get_color("success")

# Check if effect enabled
if VisualConfig.is_effect_enabled("trail"):
    # spawn trail
```

## 📊 Performance Limits

```gdscript
# Recommended maximums
const MAX_PARTICLES = 500
const MAX_TRAIL_POINTS = 30
const MAX_STARS = 220
const PARTICLE_LIFETIME_MAX = 2.0

# If performance drops:
VisualConfig.set_quality_preset(VisualConfig.Quality.LOW)
# OR manually:
VisualConfig.particle_settings.max_particles = 200
VisualConfig.trail_settings.max_points = 15
VisualConfig.crt_settings.enabled = false
```

## 🎯 Entity Setup Pattern

```gdscript
# In game manager _ready():
visual_effects = VisualEffects.new()
add_child(visual_effects)

# Pass to entities:
taxi.setup_visual_effects(visual_effects)
enemy.setup_visual_effects(visual_effects)

# In entity scripts:
var visual_effects: VisualEffects = null

func setup_visual_effects(effects: VisualEffects) -> void:
    visual_effects = effects

# Then use anywhere in entity:
if visual_effects:
    visual_effects.spawn_explosion(global_position, Color.RED)
```

## 🌟 Effect Intensity Guidelines

```gdscript
# Screen flashes (intensity 0.0-1.0)
0.2 - Subtle hint
0.4 - Noticeable
0.6 - Strong (damage)
0.8 - Very strong (major event)
1.0 - Full white (avoid, jarring)

# Glow strength (0.0-5.0)
0.5 - Subtle glow
1.5 - Noticeable neon
2.5 - Strong neon
4.0 - Very bright
5.0 - Maximum (may bloom)

# Particle counts
5-10   - Small burst
15-20  - Medium effect
30-50  - Large explosion
50+    - Boss/special events only
```

## 🎨 Shader Parameter Ranges

```gdscript
# CRT Effect
scanline_strength: 0.1-0.3 (subtle), 0.5+ (strong retro)
curvature_amount: 1.0-2.0 (subtle), 3.0+ (fish-eye)
chromatic_aberration: 0.001-0.003 (normal), 0.01+ (damage)
noise_amount: 0.01-0.02 (subtle), 0.05+ (heavy grain)

# Neon Glow
glow_strength: 1.0-2.0 (subtle), 3.0-5.0 (intense)
pulse_speed: 1.0-2.0 (slow), 5.0+ (fast)
outline_thickness: 2.0-4.0 (thin), 6.0+ (thick)

# Speed Lines
speed_intensity: 0.0 (off), 0.5 (visible), 1.0 (max)
line_density: 15-25 (sparse), 40+ (dense)
```

## 🚨 Common Mistakes to Avoid

```gdscript
# ❌ DON'T: Create effects every frame unconditionally
func _process(delta):
    visual_effects.spawn_explosion(position, Color.RED)  # BAD!

# ✅ DO: Create effects on events
func _on_collision():
    visual_effects.spawn_explosion(position, Color.RED)  # GOOD!

# ❌ DON'T: Forget to check if effects exist
visual_effects.spawn_explosion(position, Color.RED)  # May crash!

# ✅ DO: Always check before using
if visual_effects:
    visual_effects.spawn_explosion(position, Color.RED)

# ❌ DON'T: Create materials in _process()
func _process(delta):
    var mat = ShaderMaterial.new()  # Memory leak!

# ✅ DO: Create once in _ready()
var mat: ShaderMaterial
func _ready():
    mat = ShaderMaterial.new()
    mat.shader = load("res://shaders/neon_glow.gdshader")

# ❌ DON'T: Use raw color values everywhere
sprite.color = Color(0.0, 1.0, 1.0)  # Hard to maintain

# ✅ DO: Use VisualConfig
sprite.color = VisualConfig.get_color("taxi_window")
```

## 🔍 Debug Visualization

```gdscript
# Toggle effects for debugging
func _input(event):
    if event.is_action_pressed("debug_toggle_crt"):
        VisualConfig.toggle_effect("crt", not VisualConfig.crt_settings.enabled)

    if event.is_action_pressed("debug_toggle_particles"):
        visual_effects.visible = not visual_effects.visible

    if event.is_action_pressed("debug_show_fps"):
        $DebugLabel.text = "FPS: %d" % Engine.get_frames_per_second()

    if event.is_action_pressed("debug_quality_cycle"):
        var qualities = [VisualConfig.Quality.LOW, VisualConfig.Quality.MEDIUM, VisualConfig.Quality.HIGH]
        var current_index = qualities.find(VisualConfig.current_quality)
        var next_index = (current_index + 1) % qualities.size()
        VisualConfig.set_quality_preset(qualities[next_index])
```

## 📱 Mobile Optimization Quick-Fix

```gdscript
# Detect mobile and adjust
func _ready():
    if OS.get_name() in ["Android", "iOS"]:
        VisualConfig.set_quality_preset(VisualConfig.Quality.LOW)
        VisualConfig.crt_settings.enabled = false
        VisualConfig.particle_settings.max_particles = 200
        VisualConfig.starfield_settings.stars_per_layer = [50, 30, 20, 10]
```

## 🎯 Testing Checklist (1 Minute)

```gdscript
# Add to test scene
func test_visual_effects():
    print("Testing visual effects...")

    # 1. Explosion
    visual_effects.spawn_neon_explosion(Vector2(100, 100), Color.ORANGE, 20)
    await get_tree().create_timer(1.0).timeout

    # 2. Screen flash
    visual_effects.screen_flash(Color.RED, 0.5)
    await get_tree().create_timer(1.0).timeout

    # 3. Pickup
    visual_effects.spawn_pickup_effect(Vector2(200, 100))
    await get_tree().create_timer(1.0).timeout

    # 4. Text popup
    visual_effects.spawn_text_popup(Vector2(150, 150), "+TEST", Color.GREEN)
    await get_tree().create_timer(1.0).timeout

    print("Visual effects test complete!")
```

## 💡 Pro Tips

```gdscript
# Combine effects for impact
func big_explosion(pos: Vector2):
    visual_effects.spawn_neon_explosion(pos, Color.ORANGE, 40, 1.5)
    visual_effects.explosion_flash(pos)
    visual_effects.spawn_text_popup(pos + Vector2(0, -50), "BOOM!", Color.YELLOW)

# Create custom color transitions
func speed_based_color(speed_ratio: float) -> Color:
    var slow_color = VisualConfig.get_color("taxi_window")
    var fast_color = VisualConfig.get_color("taxi_body")
    return slow_color.lerp(fast_color, speed_ratio)

# Batch similar effects
var positions = [pos1, pos2, pos3]
for pos in positions:
    visual_effects.spawn_spark_burst(pos, 10, Color.CYAN)

# Use easing for smooth effects
var alpha = ease(time_ratio, 0.5)  # Smooth in-out
particle.modulate.a = alpha
```

## 📦 Import to New Project

```gdscript
# Minimal setup in new scene:
1. Copy /shaders/ folder
2. Copy /scripts/systems/visual_effects.gd
3. Add to scene:
   var visual_effects = VisualEffects.new()
   add_child(visual_effects)
4. Start using effects!

# Full setup:
1. Copy all shader files
2. Copy all system scripts
3. Copy visual_config.gd to autoload
4. Add VisualConfig to Project Settings > Autoload
5. Integrate with game_manager.gd
```

---

## 🆘 Emergency Fixes

**Effects not showing:**
```gdscript
# Check z_index
visual_effects.z_index = 100

# Check visibility
visual_effects.visible = true

# Check layer
visual_effects.show_behind_parent = false
```

**Performance issues:**
```gdscript
# Immediate fix
VisualConfig.set_quality_preset(VisualConfig.Quality.LOW)
```

**Colors look wrong:**
```gdscript
# Reset to default palette
VisualConfig.set_color_palette("neon")
```

---

**This card covers 90% of daily visual effect usage!**

# Space Taxi Roguelike - Color Palette Reference

## Primary Neon Palette (Default)

### Core Colors

| Color Name | Hex | RGB | GDScript | Usage |
|------------|-----|-----|----------|-------|
| **Dark Space** | `#0a0a1a` | `10, 10, 26` | `Color(0.04, 0.04, 0.1)` | Background, space void |
| **Neon Cyan** | `#00ffff` | `0, 255, 255` | `Color(0.0, 1.0, 1.0)` | Taxi window, UI primary, friendly |
| **Neon Magenta** | `#ff00ff` | `255, 0, 255` | `Color(1.0, 0.0, 1.0)` | Enemies, danger, warnings |
| **Neon Green** | `#00ff88` | `0, 255, 136` | `Color(0.0, 1.0, 0.533)` | Money, success, pickups |
| **Neon Orange** | `#ff8800` | `255, 136, 0` | `Color(1.0, 0.533, 0.0)` | Warnings, fuel, explosions |
| **Neon Yellow** | `#ffdd00` | `255, 221, 0` | `Color(1.0, 0.867, 0.0)` | Taxi body, player elements |

### Supporting Colors

| Color Name | Hex | RGB | GDScript | Usage |
|------------|-----|-----|----------|-------|
| **Red Alert** | `#ff0055` | `255, 0, 85` | `Color(1.0, 0.0, 0.333)` | Damage, critical warnings |
| **Dark Platform** | `#262640` | `38, 38, 64` | `Color(0.15, 0.15, 0.25)` | Platform surfaces |
| **Dark Building** | `#1a1a26` | `26, 26, 38` | `Color(0.1, 0.1, 0.15)` | Building structures |
| **Window Blue** | `#80ccff` | `128, 204, 255` | `Color(0.5, 0.8, 1.0)` | Lit windows |
| **Border Cyan** | `#0080cc` | `0, 128, 204` | `Color(0.0, 0.5, 0.8)` | World boundaries |

## Color Psychology & Usage

### Neon Cyan (#00FFFF)
**Feel:** Futuristic, clean, friendly, technological
**Used For:**
- Taxi window (player identification)
- UI highlights and buttons
- Safe/neutral indicators
- Platform door accents
- Friendly particle effects

**When to Use:** Player-related elements, successful actions, UI navigation

### Neon Magenta (#FF00FF)
**Feel:** Dangerous, alien, hostile, intense
**Used For:**
- Enemy bodies and trails
- Danger zones
- Boss elements
- Threatening UI elements

**When to Use:** Hazards, enemies, warnings about danger

### Neon Green (#00FF88)
**Feel:** Success, growth, money, positive
**Used For:**
- Cash pickups and displays
- Successful landings
- Pickup effects
- Delivery confirmation
- Landing pad indicators

**When to Use:** Rewards, money, successful actions, safe zones

### Neon Orange (#FF8800)
**Feel:** Warning, energy, heat, caution
**Used For:**
- Low fuel warnings
- Speed warnings
- Explosion colors
- Timer urgency
- Fuel station markers

**When to Use:** Cautions, explosions, energy-related elements

### Neon Yellow (#FFDD00)
**Feel:** Attention, player, highlight, arcade
**Used For:**
- Taxi body (main player element)
- Important pickups
- High scores
- Achievement highlights

**When to Use:** Main player character, critical information

### Red Alert (#FF0055)
**Feel:** Danger, damage, critical, urgent
**Used For:**
- Damage flash effects
- Hull warnings
- Game over states
- Critical failure

**When to Use:** Damage, failures, critical warnings

## Complementary Color Combinations

### High Contrast Pairs (Best for UI)
1. **Cyan + Magenta** - Maximum neon pop, sci-fi aesthetic
2. **Yellow + Dark Space** - Maximum readability
3. **Green + Red** - Classic success/failure
4. **Orange + Cyan** - Energetic contrast

### Harmonious Pairs (Visual Appeal)
1. **Cyan + Yellow** - Retro arcade feel
2. **Magenta + Orange** - Sunset cyberpunk
3. **Green + Cyan** - Cool tech palette
4. **Yellow + Orange** - Warm energy

### Gradient Suggestions
1. **Speed Gradient**: Cyan → Yellow (slow to fast)
2. **Damage Gradient**: Orange → Red (light to heavy)
3. **Success Gradient**: Cyan → Green (start to finish)
4. **Danger Gradient**: Yellow → Orange → Red (warning to critical)

## Alternative Palettes

### Vaporwave Aesthetic
More purple/pink focused, dreamy and nostalgic

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Deep Purple | `#1a001a` | Darker purple space |
| Primary | Hot Magenta | `#ff00ff` | Main UI |
| Secondary | Cyan | `#00ffff` | Highlights |
| Success | Purple | `#8000ff` | Different success feel |
| Warning | Pink | `#ff80cc` | Softer warnings |

### Cyberpunk Green
Matrix-inspired, hacker aesthetic

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Black-Green | `#000d00` | Very dark |
| Primary | Bright Green | `#00ff00` | Matrix green |
| Secondary | Teal | `#00ccff` | Accents |
| Danger | Red | `#ff0000` | High contrast danger |
| Warning | Yellow | `#ffcc00` | Alert state |

## Usage Guidelines

### Readability Rules
1. **Text on Dark Space**: Use colors at 100% brightness
2. **Text on Platforms**: Use cyan or yellow for contrast
3. **UI Elements**: Minimum 4.5:1 contrast ratio
4. **Small Text**: Use cyan or yellow, avoid magenta

### Glow Intensity by Color
- **Cyan**: 2.0-2.5x glow (bright, clean)
- **Magenta**: 2.5-3.0x glow (intense, threatening)
- **Green**: 2.0x glow (clear, positive)
- **Orange**: 2.5x glow (energetic, warm)
- **Yellow**: 1.5-2.0x glow (already bright)

### Animation Guidelines
- **Pulse Speed**:
  - Slow (1-2 Hz): Idle states, ambient
  - Medium (3-4 Hz): Active elements, warnings
  - Fast (5+ Hz): Alerts, critical states

- **Color Transitions**:
  - Use `lerp()` for smooth color blends
  - Transition time: 0.3-0.5s for UI, 0.1-0.2s for effects

### Particle Color Mixing
When spawning particles, add variety:
```gdscript
# Example: Orange explosion with yellow highlights
var base = Color(1.0, 0.533, 0.0)  # Orange
var highlight = Color(1.0, 0.867, 0.0)  # Yellow
var particle_color = base.lerp(highlight, randf() * 0.5)
```

## Accessibility Considerations

### Colorblind Support
- **Don't rely solely on color** - Use icons, text, patterns
- **Cyan vs Magenta** - Good contrast for most types
- **Green alternatives** - Also use brightness differences

### High Contrast Mode (Optional)
If implementing high contrast mode:
- Increase contrast ratios to 7:1
- Reduce glow effects
- Thicker outlines
- Larger UI elements

### Photosensitivity
- **Flash Duration**: < 0.25 seconds
- **Flash Frequency**: < 3 Hz
- **Flash Coverage**: < 25% of screen
- **Intensity**: < 80% opacity for large flashes

## Color in Different Lighting Conditions

### Bright Environment (Mobile/Outdoor)
- Increase saturation by 10-20%
- Reduce glow effects
- Thicker outlines
- Higher contrast

### Dark Environment (Ideal)
- Standard palette works best
- Full glow effects
- Optimal neon appearance

## Technical Color Specifications

### Godot Color Constructor
```gdscript
# From hex
Color("#00ffff")

# From RGB (0-255)
Color(0/255.0, 255/255.0, 255/255.0)

# From float (0.0-1.0) - Most efficient
Color(0.0, 1.0, 1.0)

# With alpha
Color(0.0, 1.0, 1.0, 0.8)
```

### Shader Color Parameters
```glsl
// In shaders, use vec4 (RGBA)
uniform vec4 glow_color : source_color = vec4(0.0, 1.0, 1.0, 1.0);

// Or vec3 (RGB) if alpha not needed
uniform vec3 neon_color = vec3(0.0, 1.0, 1.0);
```

### Color Modulation Tips
```gdscript
# Brighten
color = color.lightened(0.2)

# Darken
color = color.darkened(0.3)

# Adjust saturation
color.s = 1.0  # Full saturation

# Adjust hue (for color shifts)
color.h += 0.1  # Shift hue
if color.h > 1.0:
    color.h -= 1.0

# Adjust alpha
color.a = 0.8
```

## Export Formats

### For External Tools

**Hex Values (CSS/Web)**
```css
--neon-cyan: #00ffff;
--neon-magenta: #ff00ff;
--neon-green: #00ff88;
--neon-orange: #ff8800;
--neon-yellow: #ffdd00;
--dark-space: #0a0a1a;
```

**RGB Values (Graphics Software)**
```
Cyan: R:0 G:255 B:255
Magenta: R:255 G:0 B:255
Green: R:0 G:255 B:136
Orange: R:255 G:136 B:0
Yellow: R:255 G:221 B:0
Dark Space: R:10 G:10 B:26
```

**HSV Values (Color Theory)**
```
Cyan: H:180° S:100% V:100%
Magenta: H:300° S:100% V:100%
Green: H:152° S:100% V:100%
Orange: H:32° S:100% V:100%
Yellow: H:52° S:100% V:100%
Dark Space: H:240° S:62% V:10%
```

## Quick Reference: Color by Game Element

| Element | Primary Color | Secondary Color | Glow |
|---------|--------------|-----------------|------|
| Taxi Body | Yellow | - | 1.5x |
| Taxi Window | Cyan | - | 2.5x |
| Enemy | Magenta | - | 3.0x |
| Platform | Dark Platform | Cyan (accents) | 1.0x |
| Landing Pad | Green | - | 2.5x |
| Fuel Station | Green | Orange | 2.0x |
| Pickup | Green | Cyan | 2.5x |
| Damage | Red | Orange | 2.0x |
| Explosion | Orange | Yellow | 2.5x |
| Trail | Cyan→Yellow | - | 2.0x |
| UI Primary | Cyan | - | 2.0x |
| UI Danger | Magenta | Red | 2.5x |
| Stars (far) | White | Blue tint | 0.5x |
| Stars (near) | White | Various | 1.5x |
| Nebula | Purple/Blue/Cyan | - | 0.3x |

---

## Tips for Designers

1. **Stay within palette** - Resist adding new neon colors
2. **Use alpha** - Vary transparency for depth
3. **Layer glows** - Multiple glow layers = depth
4. **Contrast is key** - Dark space makes neons pop
5. **Animate saturation** - More impactful than hue
6. **Test in motion** - Colors look different when moving
7. **Consider afterimages** - Bright colors leave trails in vision

## Testing Your Colors

```gdscript
# Quick color tester
func test_color_palette():
    var colors = {
        "Cyan": Color(0.0, 1.0, 1.0),
        "Magenta": Color(1.0, 0.0, 1.0),
        "Green": Color(0.0, 1.0, 0.533),
        "Orange": Color(1.0, 0.533, 0.0),
        "Yellow": Color(1.0, 0.867, 0.0),
    }

    for color_name in colors:
        var sprite = ColorRect.new()
        sprite.color = colors[color_name]
        sprite.size = Vector2(100, 100)
        # Position and add to scene...
```

---

**Remember: Consistency is more important than variety. Stick to the core 6 colors for a cohesive retro-futuristic aesthetic!**

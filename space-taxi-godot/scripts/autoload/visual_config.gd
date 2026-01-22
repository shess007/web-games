extends Node
## Visual configuration and presets for the retro-futuristic aesthetic

# ============================================================================
# COLOR PALETTES
# ============================================================================

## Primary neon color scheme (default)
const NEON_COLORS = {
	"background": Color(0.04, 0.04, 0.1),      # Dark space #0a0a1a
	"taxi_body": Color(1.0, 0.867, 0.0),       # Neon yellow #FFDD00
	"taxi_window": Color(0.0, 1.0, 1.0),       # Neon cyan #00FFFF
	"enemy": Color(1.0, 0.0, 1.0),             # Neon magenta #FF00FF
	"success": Color(0.0, 1.0, 0.533),         # Neon green #00FF88
	"warning": Color(1.0, 0.533, 0.0),         # Neon orange #FF8800
	"danger": Color(1.0, 0.0, 0.3),            # Red alert
	"platform": Color(0.15, 0.15, 0.25),       # Dark platform
	"building": Color(0.1, 0.1, 0.15),         # Building base
	"ui_primary": Color(0.0, 1.0, 1.0),        # UI cyan
	"ui_secondary": Color(1.0, 0.0, 1.0),      # UI magenta
}

## Alternative: Vaporwave aesthetic
const VAPORWAVE_COLORS = {
	"background": Color(0.1, 0.0, 0.15),
	"taxi_body": Color(1.0, 0.0, 1.0),
	"taxi_window": Color(0.0, 1.0, 1.0),
	"enemy": Color(1.0, 1.0, 0.0),
	"success": Color(0.5, 0.0, 1.0),
	"warning": Color(1.0, 0.5, 0.8),
	"danger": Color(1.0, 0.2, 0.5),
	"platform": Color(0.2, 0.0, 0.25),
	"building": Color(0.15, 0.0, 0.2),
	"ui_primary": Color(1.0, 0.0, 1.0),
	"ui_secondary": Color(0.0, 1.0, 1.0),
}

## Alternative: Cyberpunk green
const CYBERPUNK_COLORS = {
	"background": Color(0.0, 0.05, 0.0),
	"taxi_body": Color(0.0, 1.0, 0.0),
	"taxi_window": Color(0.0, 0.8, 1.0),
	"enemy": Color(1.0, 0.0, 0.0),
	"success": Color(0.0, 1.0, 0.5),
	"warning": Color(1.0, 0.8, 0.0),
	"danger": Color(1.0, 0.0, 0.0),
	"platform": Color(0.0, 0.15, 0.1),
	"building": Color(0.0, 0.1, 0.05),
	"ui_primary": Color(0.0, 1.0, 0.0),
	"ui_secondary": Color(0.0, 1.0, 0.5),
}

# Current active palette
var active_palette: Dictionary = NEON_COLORS

# ============================================================================
# EFFECT SETTINGS
# ============================================================================

## CRT Effect Settings
var crt_settings = {
	"enabled": true,
	"scanline_strength": 0.2,
	"scanline_frequency": 400.0,
	"curvature_amount": 1.5,
	"vignette_strength": 0.3,
	"chromatic_aberration": 0.001,
	"noise_amount": 0.01,
	"glow_strength": 0.4,
}

## Particle System Settings
var particle_settings = {
	"max_particles": 500,
	"thrust_count": 3,
	"explosion_count": 30,
	"spark_count": 15,
	"pickup_count": 20,
}

## Trail Settings
var trail_settings = {
	"enabled": true,
	"max_points": 30,
	"lifetime": 0.5,
	"spawn_interval": 0.05,
	"width": 3.0,
	"glow_multiplier": 2.5,
}

## Starfield Settings
var starfield_settings = {
	"layer_count": 4,
	"stars_per_layer": [100, 60, 40, 20],
	"layer_speeds": [0.05, 0.15, 0.35, 0.6],
	"nebula_count": 8,
	"twinkle_enabled": true,
}

## Glow/Bloom Settings
var glow_settings = {
	"enabled": true,
	"threshold": 0.6,
	"intensity": 1.5,
	"blur_size": 3.0,
}

## Speed Lines Settings
var speed_lines_settings = {
	"enabled": true,
	"activation_threshold": 0.6,  # % of max speed
	"density": 25.0,
	"length": 0.4,
	"color": Color(1.0, 1.0, 1.0, 0.2),
}

## Platform Visual Settings
var platform_settings = {
	"landing_pad_pulse_speed": 3.0,
	"window_flicker_chance": 0.05,
	"window_flicker_interval": 0.1,
	"building_window_color": Color(0.5, 0.8, 1.0, 0.8),
}

## Enemy Visual Settings
var enemy_settings = {
	"pulse_speed": 3.0,
	"rotation_speed": 0.02,
	"orbit_path_alpha": 0.3,
	"collision_particle_count": 15,
}

# ============================================================================
# QUALITY PRESETS
# ============================================================================

const QUALITY_LOW = {
	"crt_enabled": false,
	"max_particles": 200,
	"trail_points": 15,
	"star_multiplier": 0.5,
	"glow_enabled": false,
	"speed_lines_enabled": false,
	"scanline_strength": 0.0,
}

const QUALITY_MEDIUM = {
	"crt_enabled": true,
	"max_particles": 350,
	"trail_points": 20,
	"star_multiplier": 0.75,
	"glow_enabled": true,
	"speed_lines_enabled": true,
	"scanline_strength": 0.15,
}

const QUALITY_HIGH = {
	"crt_enabled": true,
	"max_particles": 500,
	"trail_points": 30,
	"star_multiplier": 1.0,
	"glow_enabled": true,
	"speed_lines_enabled": true,
	"scanline_strength": 0.2,
}

# Current quality level
enum Quality { LOW, MEDIUM, HIGH }
var current_quality: Quality = Quality.HIGH

# ============================================================================
# METHODS
# ============================================================================

func _ready() -> void:
	# Load saved preferences if available
	load_preferences()

func set_color_palette(palette_name: String) -> void:
	"""Switch between color palettes"""
	match palette_name:
		"neon":
			active_palette = NEON_COLORS
		"vaporwave":
			active_palette = VAPORWAVE_COLORS
		"cyberpunk":
			active_palette = CYBERPUNK_COLORS
		_:
			push_warning("Unknown palette: " + palette_name)
			return

	# Broadcast palette change
	palette_changed.emit(active_palette)

func set_quality_preset(quality: Quality) -> void:
	"""Apply quality preset"""
	current_quality = quality

	var preset: Dictionary
	match quality:
		Quality.LOW:
			preset = QUALITY_LOW
		Quality.MEDIUM:
			preset = QUALITY_MEDIUM
		Quality.HIGH:
			preset = QUALITY_HIGH

	# Apply preset settings
	crt_settings.enabled = preset.crt_enabled
	crt_settings.scanline_strength = preset.scanline_strength
	particle_settings.max_particles = preset.max_particles
	trail_settings.max_points = preset.trail_points
	glow_settings.enabled = preset.glow_enabled
	speed_lines_settings.enabled = preset.speed_lines_enabled

	# Adjust star count
	var multiplier = preset.star_multiplier
	for i in range(starfield_settings.stars_per_layer.size()):
		var base_count = [100, 60, 40, 20][i]
		starfield_settings.stars_per_layer[i] = int(base_count * multiplier)

	quality_changed.emit(quality)

func get_color(color_name: String) -> Color:
	"""Get color from active palette"""
	if active_palette.has(color_name):
		return active_palette[color_name]
	push_warning("Color not found in palette: " + color_name)
	return Color.WHITE

func is_effect_enabled(effect_name: String) -> bool:
	"""Check if specific effect is enabled"""
	match effect_name:
		"crt":
			return crt_settings.enabled
		"glow":
			return glow_settings.enabled
		"speed_lines":
			return speed_lines_settings.enabled
		"trail":
			return trail_settings.enabled
		_:
			return true

func toggle_effect(effect_name: String, enabled: bool) -> void:
	"""Toggle specific effect on/off"""
	match effect_name:
		"crt":
			crt_settings.enabled = enabled
		"glow":
			glow_settings.enabled = enabled
		"speed_lines":
			speed_lines_settings.enabled = enabled
		"trail":
			trail_settings.enabled = enabled

	effect_toggled.emit(effect_name, enabled)

func save_preferences() -> void:
	"""Save visual preferences to file"""
	var config = ConfigFile.new()

	# Save palette
	config.set_value("visual", "palette", _get_palette_name())

	# Save quality
	config.set_value("visual", "quality", current_quality)

	# Save individual settings
	config.set_value("effects", "crt_enabled", crt_settings.enabled)
	config.set_value("effects", "scanline_strength", crt_settings.scanline_strength)
	config.set_value("effects", "trail_enabled", trail_settings.enabled)
	config.set_value("effects", "glow_enabled", glow_settings.enabled)

	config.save("user://visual_preferences.cfg")

func load_preferences() -> void:
	"""Load visual preferences from file"""
	var config = ConfigFile.new()
	var err = config.load("user://visual_preferences.cfg")

	if err != OK:
		return  # Use defaults

	# Load palette
	var palette = config.get_value("visual", "palette", "neon")
	set_color_palette(palette)

	# Load quality
	var quality = config.get_value("visual", "quality", Quality.HIGH)
	set_quality_preset(quality)

	# Load individual settings
	crt_settings.enabled = config.get_value("effects", "crt_enabled", true)
	crt_settings.scanline_strength = config.get_value("effects", "scanline_strength", 0.2)
	trail_settings.enabled = config.get_value("effects", "trail_enabled", true)
	glow_settings.enabled = config.get_value("effects", "glow_enabled", true)

func _get_palette_name() -> String:
	"""Get name of current palette"""
	if active_palette == NEON_COLORS:
		return "neon"
	elif active_palette == VAPORWAVE_COLORS:
		return "vaporwave"
	elif active_palette == CYBERPUNK_COLORS:
		return "cyberpunk"
	return "neon"

# ============================================================================
# SIGNALS
# ============================================================================

signal palette_changed(new_palette: Dictionary)
signal quality_changed(new_quality: Quality)
signal effect_toggled(effect_name: String, enabled: bool)

# ============================================================================
# HELPER METHODS
# ============================================================================

func get_particle_color_for_event(event_type: String) -> Color:
	"""Get appropriate particle color for game event"""
	match event_type:
		"pickup":
			return get_color("success")
		"delivery":
			return get_color("success")
		"damage":
			return get_color("danger")
		"explosion":
			return get_color("warning")
		"enemy_hit":
			return get_color("enemy")
		"landing_success":
			return get_color("success")
		"landing_fail":
			return get_color("danger")
		_:
			return Color.WHITE

func get_trail_color_for_speed(speed_ratio: float) -> Color:
	"""Get trail color based on speed (interpolates from cyan to yellow)"""
	var cyan = get_color("taxi_window")
	var yellow = get_color("taxi_body")
	return cyan.lerp(yellow, speed_ratio)

func should_spawn_trail() -> bool:
	"""Check if trail should spawn this frame"""
	return trail_settings.enabled and randf() < 0.8  # 80% chance for variation

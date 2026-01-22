extends Node2D
class_name Starfield
## Enhanced parallax scrolling starfield with nebula effects

var layers: Array[Array] = []
var camera: Camera2D
var world_size: Vector2 = Vector2(1600, 1200)
var nebula_patches: Array = []

const LAYER_COUNT = 4
const STARS_PER_LAYER = [100, 60, 40, 20]
const LAYER_SPEEDS = [0.05, 0.15, 0.35, 0.6]  # Parallax multiplier
const LAYER_SIZES = [0.8, 1.2, 2.0, 3.5]
const LAYER_BRIGHTNESS = [0.2, 0.4, 0.6, 0.9]

# Neon color palette for stars
const STAR_COLORS = [
	Color(1.0, 1.0, 1.0),      # White
	Color(0.5, 0.8, 1.0),       # Blue
	Color(1.0, 0.8, 0.5),       # Orange
	Color(0.8, 0.5, 1.0),       # Purple
	Color(0.5, 1.0, 0.8),       # Cyan
]

# Nebula colors for background ambiance
const NEBULA_COLORS = [
	Color(0.3, 0.1, 0.5, 0.15), # Purple
	Color(0.1, 0.3, 0.5, 0.15), # Blue
	Color(0.5, 0.2, 0.3, 0.15), # Magenta
	Color(0.1, 0.5, 0.4, 0.15), # Cyan
]

func _ready() -> void:
	_generate_stars()

func setup(cam: Camera2D, size: Vector2) -> void:
	camera = cam
	world_size = size
	_generate_stars()

func _generate_stars() -> void:
	layers.clear()
	nebula_patches.clear()

	# Generate star layers
	for layer_idx in range(LAYER_COUNT):
		var layer_stars: Array = []
		var count = STARS_PER_LAYER[layer_idx]

		for i in range(count):
			layer_stars.append({
				"position": Vector2(
					randf() * world_size.x * 1.5,
					randf() * world_size.y * 1.5
				),
				"size": LAYER_SIZES[layer_idx] * randf_range(0.8, 1.2),
				"brightness": LAYER_BRIGHTNESS[layer_idx] * randf_range(0.7, 1.0),
				"twinkle_offset": randf() * TAU,
				"color": STAR_COLORS[randi() % STAR_COLORS.size()],
				"twinkle_speed": randf_range(1.0, 3.0)
			})

		layers.append(layer_stars)

	# Generate nebula patches
	var nebula_count = 8
	for i in range(nebula_count):
		nebula_patches.append({
			"position": Vector2(
				randf() * world_size.x * 1.5,
				randf() * world_size.y * 1.5
			),
			"size": randf_range(200, 500),
			"color": NEBULA_COLORS[randi() % NEBULA_COLORS.size()],
			"rotation": randf() * TAU,
			"pulse_offset": randf() * TAU
		})

func _process(delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	if not camera:
		return

	var cam_pos = camera.position
	var time = Time.get_ticks_msec() / 1000.0

	# Draw nebula patches first (background layer)
	for nebula in nebula_patches:
		var parallax = 0.02  # Slowest parallax for distant nebula
		var offset = cam_pos * parallax
		var pos = nebula.position - offset

		# Wrap around
		pos.x = fmod(pos.x + world_size.x * 1.5, world_size.x * 1.5)
		pos.y = fmod(pos.y + world_size.y * 1.5, world_size.y * 1.5)

		# Pulsing nebula effect
		var pulse = 0.8 + 0.2 * sin(time * 0.5 + nebula.pulse_offset)
		var color = nebula.color
		color.a *= pulse

		# Draw nebula as soft gradient circle
		_draw_nebula_patch(pos, nebula.size * pulse, color)

	# Draw star layers
	for layer_idx in range(layers.size()):
		var layer_stars = layers[layer_idx]
		var parallax = LAYER_SPEEDS[layer_idx]

		for star in layer_stars:
			# Calculate parallax position
			var offset = cam_pos * parallax
			var pos = star.position - offset

			# Wrap around
			pos.x = fmod(pos.x + world_size.x * 1.5, world_size.x * 1.5)
			pos.y = fmod(pos.y + world_size.y * 1.5, world_size.y * 1.5)

			# Twinkle effect
			var twinkle = 0.6 + 0.4 * sin(time * star.twinkle_speed + star.twinkle_offset)
			var brightness = star.brightness * twinkle

			# Star color with brightness
			var color = star.color
			color.a = brightness

			# Draw star with glow
			draw_circle(pos, star.size, color)

			# Add glow for larger stars
			if star.size > 1.5:
				var glow_color = color
				glow_color.a *= 0.3
				draw_circle(pos, star.size * 2.0, glow_color)

func _draw_nebula_patch(pos: Vector2, size: float, color: Color) -> void:
	"""Draw a soft nebula patch with gradient falloff"""
	# Draw multiple circles with decreasing alpha for soft gradient
	var steps = 8
	for i in range(steps):
		var t = float(i) / float(steps)
		var radius = size * (1.0 - t * 0.7)
		var alpha = color.a * (1.0 - t)

		var draw_color = color
		draw_color.a = alpha

		draw_circle(pos, radius, draw_color)

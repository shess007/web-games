extends Node2D
class_name Starfield
## Parallax scrolling starfield background

var layers: Array[Array] = []
var camera: Camera2D
var world_size: Vector2 = Vector2(1600, 1200)

const LAYER_COUNT = 3
const STARS_PER_LAYER = [50, 30, 20]
const LAYER_SPEEDS = [0.1, 0.3, 0.5]  # Parallax multiplier
const LAYER_SIZES = [1.0, 1.5, 2.5]
const LAYER_BRIGHTNESS = [0.3, 0.5, 0.8]

func _ready() -> void:
	_generate_stars()

func setup(cam: Camera2D, size: Vector2) -> void:
	camera = cam
	world_size = size
	_generate_stars()

func _generate_stars() -> void:
	layers.clear()

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
				"twinkle_offset": randf() * TAU
			})

		layers.append(layer_stars)

func _process(delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	if not camera:
		return

	var cam_pos = camera.position
	var time = Time.get_ticks_msec() / 1000.0

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
			var twinkle = 0.7 + 0.3 * sin(time * 2.0 + star.twinkle_offset)
			var brightness = star.brightness * twinkle

			var color = Color(1, 1, 1, brightness)
			draw_circle(pos, star.size, color)

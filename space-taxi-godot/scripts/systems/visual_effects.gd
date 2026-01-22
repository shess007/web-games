extends Node2D
class_name VisualEffects
## Enhanced visual effects system with neon/retro-futuristic aesthetic

# Screen flash and post-processing
var flash_color: Color = Color.WHITE
var flash_alpha: float = 0.0
var flash_decay: float = 5.0

# Chromatic aberration on damage
var chromatic_offset: float = 0.0
var chromatic_decay: float = 10.0

# Speed lines effect
var speed_lines_intensity: float = 0.0

# Trail system
var trail_points: Array = []
const MAX_TRAIL_POINTS = 30
const TRAIL_LIFETIME = 0.5

# Particle pools for performance
var particle_pool: Array = []
const MAX_PARTICLES = 500

func _ready() -> void:
	z_index = 100  # Render on top

func _process(delta: float) -> void:
	# Decay effects
	if flash_alpha > 0:
		flash_alpha -= flash_decay * delta
		flash_alpha = max(0, flash_alpha)

	if chromatic_offset > 0:
		chromatic_offset -= chromatic_decay * delta
		chromatic_offset = max(0, chromatic_offset)

	if speed_lines_intensity > 0:
		speed_lines_intensity -= delta * 2.0
		speed_lines_intensity = max(0, speed_lines_intensity)

	# Update trail points
	_update_trails(delta)

	queue_redraw()

func _draw() -> void:
	var viewport_rect = get_viewport_rect()

	# Draw screen flash overlay
	if flash_alpha > 0:
		var color = flash_color
		color.a = flash_alpha
		draw_rect(viewport_rect, color)

	# Draw neon trails
	_draw_trails()

func screen_flash(color: Color = Color.WHITE, intensity: float = 0.5) -> void:
	"""Trigger a screen flash effect"""
	flash_color = color
	flash_alpha = intensity

func damage_flash() -> void:
	"""Specialized flash for damage with chromatic aberration"""
	screen_flash(Color(1.0, 0.2, 0.2), 0.6)
	chromatic_offset = 0.01

func explosion_flash(pos: Vector2) -> void:
	"""Flash for explosions"""
	screen_flash(Color(1.0, 0.6, 0.0), 0.4)

func spawn_neon_explosion(pos: Vector2, color: Color = Color(1.0, 0.6, 0.2), count: int = 30, scale: float = 1.0) -> void:
	"""Spawn explosion with neon particle effects"""
	for i in range(count):
		var particle = NeonParticle.new()
		particle.position = pos
		particle.color = color.lerp(_get_complementary_color(color), randf() * 0.5)
		particle.velocity = Vector2.from_angle(randf() * TAU) * randf_range(100, 300) * scale
		particle.life = randf_range(0.3, 0.8)
		particle.size = randf_range(3, 8) * scale
		particle.glow_strength = randf_range(1.5, 3.0)
		add_child(particle)

	# Add screen flash
	explosion_flash(pos)

func spawn_thrust_particles(pos: Vector2, direction: Vector2, color: Color = Color(1.0, 0.8, 0.2)) -> void:
	"""Spawn thrust particles with neon glow"""
	for i in range(3):
		var particle = NeonParticle.new()
		particle.position = pos + Vector2(randf_range(-5, 5), randf_range(-5, 5))
		particle.color = color
		particle.velocity = direction * randf_range(50, 150)
		particle.life = randf_range(0.1, 0.3)
		particle.size = randf_range(2, 5)
		particle.glow_strength = 2.0
		add_child(particle)

func spawn_spark_burst(pos: Vector2, count: int = 10, color: Color = Color.CYAN) -> void:
	"""Spawn sparks (for collisions, landing, etc)"""
	for i in range(count):
		var particle = NeonParticle.new()
		particle.position = pos
		particle.color = color
		particle.velocity = Vector2.from_angle(randf() * TAU) * randf_range(50, 200)
		particle.life = randf_range(0.2, 0.5)
		particle.size = randf_range(1, 3)
		particle.glow_strength = 3.0
		particle.gravity = 200.0
		add_child(particle)

func add_trail_point(pos: Vector2, color: Color = Color.CYAN) -> void:
	"""Add a point to the neon trail"""
	trail_points.append({
		"position": pos,
		"color": color,
		"life": TRAIL_LIFETIME,
		"max_life": TRAIL_LIFETIME
	})

	if trail_points.size() > MAX_TRAIL_POINTS:
		trail_points.pop_front()

func _update_trails(delta: float) -> void:
	"""Update trail lifetimes"""
	for i in range(trail_points.size() - 1, -1, -1):
		trail_points[i].life -= delta
		if trail_points[i].life <= 0:
			trail_points.remove_at(i)

func _draw_trails() -> void:
	"""Draw neon trails behind taxi"""
	if trail_points.size() < 2:
		return

	for i in range(trail_points.size() - 1):
		var point = trail_points[i]
		var next_point = trail_points[i + 1]

		var alpha = point.life / point.max_life
		var width = 3.0 * alpha

		var color = point.color
		color.a = alpha * 0.6

		# Draw line segment
		draw_line(point.position, next_point.position, color, width)

		# Draw glow around line
		var glow_color = point.color
		glow_color.a = alpha * 0.3
		draw_line(point.position, next_point.position, glow_color, width * 2.5)

func spawn_pickup_effect(pos: Vector2) -> void:
	"""Visual effect for picking up items"""
	for i in range(20):
		var angle = (i / 20.0) * TAU
		var particle = NeonParticle.new()
		particle.position = pos
		particle.color = Color(0.0, 1.0, 0.5)
		particle.velocity = Vector2.from_angle(angle) * 150
		particle.life = 0.6
		particle.size = 3
		particle.glow_strength = 2.5
		add_child(particle)

func spawn_landing_effect(pos: Vector2, success: bool = true) -> void:
	"""Visual feedback for landing"""
	var color = Color.GREEN if success else Color.RED
	spawn_spark_burst(pos, 15, color)

	if not success:
		damage_flash()

func spawn_text_popup(pos: Vector2, text: String, color: Color = Color.GREEN) -> void:
	"""Floating text effect for feedback"""
	var popup = TextPopup.new()
	popup.position = pos
	popup.text_content = text
	popup.color = color
	add_child(popup)

func set_speed_lines(intensity: float) -> void:
	"""Control speed lines intensity"""
	speed_lines_intensity = clamp(intensity, 0.0, 1.0)

func _get_complementary_color(color: Color) -> Color:
	"""Get complementary color for variety"""
	var h = color.h + 0.5
	if h > 1.0:
		h -= 1.0
	return Color.from_hsv(h, color.s, color.v)

# Neon particle class for effects
class NeonParticle extends Node2D:
	var velocity: Vector2 = Vector2.ZERO
	var life: float = 1.0
	var max_life: float = 1.0
	var color: Color = Color.CYAN
	var size: float = 4.0
	var glow_strength: float = 2.0
	var gravity: float = 0.0
	var drag: float = 0.95

	func _ready() -> void:
		max_life = life
		z_index = 50

	func _process(delta: float) -> void:
		# Update physics
		velocity.y += gravity * delta
		velocity *= drag
		position += velocity * delta

		# Update lifetime
		life -= delta

		if life <= 0:
			queue_free()
		else:
			queue_redraw()

	func _draw() -> void:
		var alpha = life / max_life
		var current_size = size * (0.5 + 0.5 * alpha)

		# Draw core
		var core_color = color
		core_color.a = alpha
		draw_circle(Vector2.ZERO, current_size, core_color)

		# Draw glow layers
		for i in range(3):
			var glow_size = current_size * (1.5 + i * 0.5)
			var glow_color = color
			glow_color.a = alpha * 0.3 * glow_strength / (i + 1)
			draw_circle(Vector2.ZERO, glow_size, glow_color)

# Floating text popup class
class TextPopup extends Node2D:
	var text_content: String = ""
	var color: Color = Color.GREEN
	var life: float = 1.5
	var velocity: Vector2 = Vector2(0, -50)

	func _ready() -> void:
		z_index = 100

	func _process(delta: float) -> void:
		position += velocity * delta
		life -= delta

		if life <= 0:
			queue_free()
		else:
			queue_redraw()

	func _draw() -> void:
		var alpha = clamp(life / 1.5, 0.0, 1.0)

		# Draw text with glow
		var font = ThemeDB.fallback_font
		var font_size = 24

		# Glow
		for x in range(-2, 3):
			for y in range(-2, 3):
				if x == 0 and y == 0:
					continue
				var glow_color = color
				glow_color.a = alpha * 0.3
				draw_string(font, Vector2(x, y), text_content, HORIZONTAL_ALIGNMENT_CENTER, -1, font_size, glow_color)

		# Main text
		var text_color = color
		text_color.a = alpha
		draw_string(font, Vector2.ZERO, text_content, HORIZONTAL_ALIGNMENT_CENTER, -1, font_size, text_color)

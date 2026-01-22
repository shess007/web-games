extends Node2D
class_name Effects
## Visual effects manager for particles, screen flash, and explosions

# Particle scenes (would be loaded)
var thrust_particle_scene: PackedScene
var explosion_particle_scene: PackedScene

# Screen flash
var flash_color: Color = Color.WHITE
var flash_alpha: float = 0.0
var flash_decay: float = 5.0

func _ready() -> void:
	pass

func _process(delta: float) -> void:
	# Decay flash
	if flash_alpha > 0:
		flash_alpha -= flash_decay * delta
		flash_alpha = max(0, flash_alpha)
		queue_redraw()

func _draw() -> void:
	# Draw screen flash overlay
	if flash_alpha > 0:
		var rect = get_viewport_rect()
		var color = flash_color
		color.a = flash_alpha
		draw_rect(rect, color)

func screen_flash(color: Color = Color.WHITE, intensity: float = 0.5) -> void:
	flash_color = color
	flash_alpha = intensity

func spawn_explosion(pos: Vector2, color: Color = Color(1, 0.6, 0.2), count: int = 20) -> void:
	for i in range(count):
		var particle = ExplosionParticle.new()
		particle.position = pos
		particle.color = color.lerp(Color.YELLOW, randf() * 0.5)
		particle.velocity = Vector2(randf_range(-3, 3), randf_range(-3, 3))
		particle.life = randf_range(0.5, 1.0)
		add_child(particle)

func spawn_thrust_particles(pos: Vector2, direction: Vector2, count: int = 5) -> void:
	for i in range(count):
		var particle = ThrustParticle.new()
		particle.position = pos
		particle.color = Color(1, 0.8, 0.2, 0.8)
		particle.velocity = direction * randf_range(2, 4) + Vector2(randf_range(-0.5, 0.5), randf_range(-0.5, 0.5))
		particle.life = randf_range(0.2, 0.4)
		add_child(particle)

# Inner class for explosion particles
class ExplosionParticle extends Node2D:
	var velocity: Vector2 = Vector2.ZERO
	var life: float = 1.0
	var max_life: float = 1.0
	var color: Color = Color.ORANGE
	var size: float = 4.0

	func _ready() -> void:
		max_life = life

	func _process(delta: float) -> void:
		position += velocity
		life -= delta

		if life <= 0:
			queue_free()
		else:
			queue_redraw()

	func _draw() -> void:
		var alpha = life / max_life
		var c = color
		c.a = alpha
		draw_circle(Vector2.ZERO, size * (0.5 + 0.5 * alpha), c)

# Inner class for thrust particles
class ThrustParticle extends Node2D:
	var velocity: Vector2 = Vector2.ZERO
	var life: float = 0.3
	var max_life: float = 0.3
	var color: Color = Color.YELLOW
	var size: float = 3.0

	func _ready() -> void:
		max_life = life

	func _process(delta: float) -> void:
		position += velocity
		life -= delta

		if life <= 0:
			queue_free()
		else:
			queue_redraw()

	func _draw() -> void:
		var alpha = life / max_life
		var c = color
		c.a = alpha * 0.8
		draw_circle(Vector2.ZERO, size * alpha, c)

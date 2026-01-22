extends Area2D
class_name Enemy
## Orbital enemy that circles around a fixed point

@onready var visual: Polygon2D = $Visual
@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var orbit_visual: Line2D = $OrbitVisual

var orbit_center: Vector2 = Vector2.ZERO
var orbit_radius: float = 150.0
var orbit_speed: float = 0.0015
var orbit_angle: float = 0.0
var enemy_size: float = 20.0

# Visual effects
var pulse_time: float = 0.0
var visual_effects: VisualEffects = null

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func setup_visual_effects(effects: VisualEffects) -> void:
	"""Connect to visual effects system"""
	visual_effects = effects

func setup(center: Vector2, radius: float = -1.0, speed: float = -1.0) -> void:
	orbit_center = center

	if radius < 0:
		orbit_radius = randf_range(
			GameConfig.ENEMIES.orbital.orbit_radius_min,
			GameConfig.ENEMIES.orbital.orbit_radius_max
		)
	else:
		orbit_radius = radius

	if speed < 0:
		orbit_speed = randf_range(
			GameConfig.ENEMIES.orbital.orbit_speed_min,
			GameConfig.ENEMIES.orbital.orbit_speed_max
		)
	else:
		orbit_speed = speed

	orbit_angle = randf() * TAU
	enemy_size = GameConfig.ENEMIES.orbital.size

	_create_visuals()
	_update_position()

func _create_visuals() -> void:
	# Enemy body - spiky creature with neon magenta
	var points = PackedVector2Array()
	var spikes = 6
	for i in range(spikes * 2):
		var angle = (i / float(spikes * 2)) * TAU
		var r = enemy_size if i % 2 == 0 else enemy_size * 0.6
		points.append(Vector2(cos(angle) * r, sin(angle) * r))

	visual.polygon = points
	visual.color = Color(1.0, 0.0, 1.0)  # Neon magenta (#FF00FF)

	# Collision shape
	var shape = CircleShape2D.new()
	shape.radius = enemy_size
	collision_shape.shape = shape

	# Orbit path visualization with neon glow
	orbit_visual.width = 2.0
	orbit_visual.default_color = Color(1.0, 0.0, 1.0, 0.3)  # Magenta with transparency
	var orbit_points = PackedVector2Array()
	for i in range(33):
		var angle = (i / 32.0) * TAU
		orbit_points.append(orbit_center + Vector2(cos(angle) * orbit_radius, sin(angle) * orbit_radius) - global_position)
	orbit_visual.points = orbit_points

func _process(delta: float) -> void:
	orbit_angle += orbit_speed
	if orbit_angle > TAU:
		orbit_angle -= TAU

	_update_position()

	# Rotate visual
	visual.rotation += 0.02

	# Pulsing glow effect
	pulse_time += delta * 3.0
	var pulse = 0.7 + 0.3 * sin(pulse_time)
	visual.modulate = Color(1.0, pulse * 0.3, 1.0, 1.0)

func _update_position() -> void:
	position = orbit_center + Vector2(
		cos(orbit_angle) * orbit_radius,
		sin(orbit_angle) * orbit_radius
	)

func _on_body_entered(body: Node2D) -> void:
	if body is Taxi:
		var taxi = body as Taxi
		taxi.take_damage(GameConfig.DAMAGE.enemy, "Enemy attack")
		taxi.apply_knockback(global_position, 5.0)

		# Visual feedback on collision
		if visual_effects:
			visual_effects.spawn_neon_explosion(global_position, Color(1.0, 0.0, 1.0), 15, 0.8)

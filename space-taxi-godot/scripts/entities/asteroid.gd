extends Area2D
class_name Asteroid
## Drifting asteroid obstacle

@onready var polygon: Polygon2D = $Polygon2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

var asteroid_radius: float = 50.0
var drift_velocity: Vector2 = Vector2.ZERO
var rotation_speed: float = 0.0

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func setup(radius: float = -1.0) -> void:
	if radius < 0:
		asteroid_radius = randf_range(
			GameConfig.OBSTACLES.asteroid.size_min,
			GameConfig.OBSTACLES.asteroid.size_max
		)
	else:
		asteroid_radius = radius

	# Random drift
	var angle = randf() * TAU
	var speed = randf_range(0.1, GameConfig.OBSTACLES.asteroid.drift_speed)
	drift_velocity = Vector2(cos(angle), sin(angle)) * speed

	# Random rotation
	rotation_speed = randf_range(-0.01, 0.01)

	_create_visuals()

func _create_visuals() -> void:
	# Generate irregular polygon shape
	var points = PackedVector2Array()
	var vertex_count = randi_range(
		GameConfig.OBSTACLES.asteroid.vertices_min,
		GameConfig.OBSTACLES.asteroid.vertices_max
	)

	for i in range(vertex_count):
		var angle = (i / float(vertex_count)) * TAU
		var variance = randf_range(0.7, 1.0)
		var r = asteroid_radius * variance
		points.append(Vector2(cos(angle) * r, sin(angle) * r))

	polygon.polygon = points
	polygon.color = Color(0.4, 0.35, 0.3)

	# Create collision shape
	var shape = CircleShape2D.new()
	shape.radius = asteroid_radius * 0.9
	collision_shape.shape = shape

func _process(delta: float) -> void:
	position += drift_velocity
	rotation += rotation_speed

func _on_body_entered(body: Node2D) -> void:
	if body is Taxi:
		var taxi = body as Taxi
		taxi.take_damage(GameConfig.DAMAGE.asteroid, "Asteroid collision")
		taxi.apply_knockback(global_position, 3.0)

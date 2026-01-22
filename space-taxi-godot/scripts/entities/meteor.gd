extends Area2D
class_name Meteor
## Fast-moving meteor with trail effect

@onready var visual: Polygon2D = $Visual
@onready var trail: Line2D = $Trail
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

var meteor_size: float = 15.0
var velocity: Vector2 = Vector2.ZERO
var trail_positions: Array[Vector2] = []
const MAX_TRAIL_LENGTH = 10

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func setup(size: float = -1.0, vel: Vector2 = Vector2.ZERO) -> void:
	if size < 0:
		meteor_size = randf_range(
			GameConfig.OBSTACLES.meteor.size_min,
			GameConfig.OBSTACLES.meteor.size_max
		)
	else:
		meteor_size = size

	if vel == Vector2.ZERO:
		var angle = randf() * TAU
		var speed = randf_range(
			GameConfig.OBSTACLES.meteor.speed_min,
			GameConfig.OBSTACLES.meteor.speed_max
		)
		velocity = Vector2(cos(angle), sin(angle)) * speed
	else:
		velocity = vel

	_create_visuals()

func _create_visuals() -> void:
	# Meteor body - circular
	var points = PackedVector2Array()
	var segments = 8
	for i in range(segments):
		var angle = (i / float(segments)) * TAU
		points.append(Vector2(cos(angle) * meteor_size, sin(angle) * meteor_size))

	visual.polygon = points
	visual.color = Color(1.0, 0.5, 0.2)  # Orange/fiery

	# Trail setup
	trail.width = meteor_size * 0.8
	trail.default_color = Color(1.0, 0.6, 0.1, 0.5)
	trail.gradient = Gradient.new()
	trail.gradient.set_color(0, Color(1.0, 0.6, 0.1, 0.8))
	trail.gradient.set_color(1, Color(1.0, 0.3, 0.0, 0.0))

	# Collision shape
	var shape = CircleShape2D.new()
	shape.radius = meteor_size
	collision_shape.shape = shape

func _process(delta: float) -> void:
	position += velocity

	# Update trail
	trail_positions.insert(0, global_position)
	if trail_positions.size() > MAX_TRAIL_LENGTH:
		trail_positions.resize(MAX_TRAIL_LENGTH)

	trail.clear_points()
	for pos in trail_positions:
		trail.add_point(pos - global_position)

func _on_body_entered(body: Node2D) -> void:
	if body is Taxi:
		var taxi = body as Taxi
		taxi.take_damage(GameConfig.DAMAGE.meteor, "Meteor strike")
		taxi.apply_knockback(global_position, 4.0)
		# Add meteor velocity to taxi
		taxi.custom_velocity += velocity * 0.3
		queue_free()  # Meteor is destroyed on impact

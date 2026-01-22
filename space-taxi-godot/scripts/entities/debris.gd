extends Area2D
class_name Debris
## Small debris obstacle

@onready var visual: ColorRect = $Visual
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

var debris_size: float = 8.0
var velocity: Vector2 = Vector2.ZERO
var rotation_speed: float = 0.0
var debris_type: String = "scrap"

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func setup(size: float = -1.0, vel: Vector2 = Vector2.ZERO) -> void:
	if size < 0:
		debris_size = randf_range(
			GameConfig.OBSTACLES.debris.size_min,
			GameConfig.OBSTACLES.debris.size_max
		)
	else:
		debris_size = size

	if vel == Vector2.ZERO:
		var angle = randf() * TAU
		var speed = randf_range(
			GameConfig.OBSTACLES.debris.speed_min,
			GameConfig.OBSTACLES.debris.speed_max
		)
		velocity = Vector2(cos(angle), sin(angle)) * speed
	else:
		velocity = vel

	rotation_speed = randf_range(-0.05, 0.05)
	debris_type = GameConfig.OBSTACLES.debris.types[randi() % GameConfig.OBSTACLES.debris.types.size()]

	_create_visuals()

func _create_visuals() -> void:
	visual.size = Vector2(debris_size, debris_size)
	visual.position = Vector2(-debris_size / 2.0, -debris_size / 2.0)

	# Color based on type
	match debris_type:
		"scrap":
			visual.color = Color(0.5, 0.5, 0.5)
		"panel":
			visual.color = Color(0.4, 0.4, 0.5)
		"pipe":
			visual.color = Color(0.6, 0.4, 0.3)
		"crystal":
			visual.color = Color(0.6, 0.8, 1.0)
		_:
			visual.color = Color(0.5, 0.5, 0.5)

	# Collision shape
	var shape = CircleShape2D.new()
	shape.radius = debris_size / 2.0
	collision_shape.shape = shape

func _process(delta: float) -> void:
	position += velocity
	rotation += rotation_speed

func _on_body_entered(body: Node2D) -> void:
	if body is Taxi:
		var taxi = body as Taxi
		taxi.take_damage(GameConfig.DAMAGE.debris, "Debris collision")
		taxi.apply_knockback(global_position, 1.5)
		queue_free()  # Debris is destroyed on impact

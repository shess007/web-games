extends CharacterBody2D
class_name Taxi
## Space Taxi - Player controlled vehicle with thrust-based physics

signal landed(platform: Node2D)
signal took_off()
signal gear_toggled(extended: bool)
signal collision_occurred(damage: int, source: String)
signal speed_changed(speed: float)

# Visual components
@onready var body_sprite: Polygon2D = $BodySprite
@onready var window_sprite: Polygon2D = $WindowSprite
@onready var left_wheel: Polygon2D = $LeftWheel
@onready var right_wheel: Polygon2D = $RightWheel
@onready var thrust_particles: GPUParticles2D = $ThrustParticles
@onready var collision_shape: CollisionShape2D = $CollisionShape

# Visual effects reference
var visual_effects: VisualEffects = null
var trail_spawn_timer: float = 0.0
const TRAIL_SPAWN_INTERVAL = 0.05

# State
var gear_extended: bool = false
var is_landed: bool = false
var landed_platform: Node2D = null
var invulnerable_timer: float = 0.0

# Physics state
var custom_velocity: Vector2 = Vector2.ZERO

# Visual state
var wheel_target_y: float = 0.0
var wheel_current_y: float = 0.0

const WHEEL_RETRACTED_Y = -5.0
const WHEEL_EXTENDED_Y = 8.0
const WHEEL_LERP_SPEED = 10.0

func _ready() -> void:
	# Set up collision
	collision_shape.shape = CircleShape2D.new()
	collision_shape.shape.radius = GameConfig.TAXI.collision_radius

	# Create taxi visuals
	_create_taxi_visuals()

	# Initialize wheel position
	wheel_current_y = WHEEL_RETRACTED_Y
	wheel_target_y = WHEEL_RETRACTED_Y

func _create_taxi_visuals() -> void:
	# Body - yellow ellipse-like shape with neon outline
	var body_points = PackedVector2Array()
	var segments = 16
	var width = GameConfig.TAXI.width / 2.0
	var height = GameConfig.TAXI.height / 2.0

	for i in range(segments):
		var angle = (i / float(segments)) * TAU
		body_points.append(Vector2(cos(angle) * width, sin(angle) * height))

	body_sprite.polygon = body_points
	body_sprite.color = Color(1.0, 0.85, 0.0)  # Neon yellow (#FFDD00)

	# Window - neon cyan rectangle on top
	window_sprite.polygon = PackedVector2Array([
		Vector2(-8, -8),
		Vector2(8, -8),
		Vector2(10, -3),
		Vector2(-10, -3)
	])
	window_sprite.color = Color(0.0, 1.0, 1.0)  # Neon cyan (#00FFFF)

	# Wheels with darker color
	var wheel_shape = PackedVector2Array([
		Vector2(-4, -3),
		Vector2(4, -3),
		Vector2(4, 3),
		Vector2(-4, 3)
	])
	left_wheel.polygon = wheel_shape
	left_wheel.color = Color(0.2, 0.2, 0.3)
	left_wheel.position = Vector2(-10, wheel_current_y)

	right_wheel.polygon = wheel_shape
	right_wheel.color = Color(0.2, 0.2, 0.3)
	right_wheel.position = Vector2(10, wheel_current_y)

func setup_visual_effects(effects: VisualEffects) -> void:
	"""Connect to visual effects system"""
	visual_effects = effects

func _physics_process(delta: float) -> void:
	if invulnerable_timer > 0:
		invulnerable_timer -= delta
		# Flash effect with neon color
		modulate = Color(1.0, 0.5, 0.5) if int(invulnerable_timer * 20.0) % 2 == 0 else Color.WHITE
	else:
		modulate = Color.WHITE

	if is_landed:
		_handle_landed_state(delta)
	else:
		_handle_flying_state(delta)

	# Update wheel animation
	_update_wheels(delta)

	# Emit speed for UI
	speed_changed.emit(custom_velocity.length())

	# Update visual effects
	_update_visual_effects(delta)

func _handle_flying_state(delta: float) -> void:
	# Get input
	var thrust_up = Input.is_action_pressed("thrust_up")
	var thrust_left = Input.is_action_pressed("thrust_left")
	var thrust_right = Input.is_action_pressed("thrust_right")

	# Toggle gear
	if Input.is_action_just_pressed("toggle_gear"):
		toggle_gear()

	# Calculate thrust multiplier
	var thrust_mult = GameState.get_thrust_multiplier()
	if gear_extended:
		thrust_mult *= GameConfig.TAXI.gear_thrust_multiplier

	# Apply thrust
	if thrust_up:
		custom_velocity.y -= GameConfig.TAXI.thrust_up * thrust_mult
		GameState.use_fuel(GameConfig.TAXI.fuel_drain_up * delta * 60.0)
		_emit_thrust_particles(Vector2(0, 1))

	if thrust_left:
		custom_velocity.x -= GameConfig.TAXI.thrust_side * thrust_mult
		GameState.use_fuel(GameConfig.TAXI.fuel_drain_side * delta * 60.0)
		_emit_thrust_particles(Vector2(1, 0))

	if thrust_right:
		custom_velocity.x += GameConfig.TAXI.thrust_side * thrust_mult
		GameState.use_fuel(GameConfig.TAXI.fuel_drain_side * delta * 60.0)
		_emit_thrust_particles(Vector2(-1, 0))

	# Apply gravity
	custom_velocity.y += GameState.get_gravity()

	# Apply drift (Ion Clouds modifier)
	custom_velocity += GameState.get_drift()

	# Apply friction
	custom_velocity *= GameConfig.WORLD.friction

	# Clamp velocity
	if custom_velocity.length() > GameConfig.WORLD.max_velocity:
		custom_velocity = custom_velocity.normalized() * GameConfig.WORLD.max_velocity

	# Check speed limit for contracts
	GameState.check_speed_limit(custom_velocity.length())

	# Apply movement
	velocity = custom_velocity * 60.0  # Convert to pixels per second
	move_and_slide()

	# Slight rotation based on horizontal velocity
	rotation = custom_velocity.x * 0.05

func _handle_landed_state(delta: float) -> void:
	# Lock position to platform
	if landed_platform:
		position.y = landed_platform.position.y - landed_platform.get_node("CollisionShape2D").shape.size.y / 2.0 - GameConfig.TAXI.height / 2.0

	custom_velocity = Vector2.ZERO
	rotation = 0.0

	# Take off when thrust up
	if Input.is_action_pressed("thrust_up"):
		take_off()

	# Toggle gear
	if Input.is_action_just_pressed("toggle_gear"):
		toggle_gear()

func toggle_gear() -> void:
	gear_extended = !gear_extended
	wheel_target_y = WHEEL_EXTENDED_Y if gear_extended else WHEEL_RETRACTED_Y
	gear_toggled.emit(gear_extended)

func _update_wheels(delta: float) -> void:
	wheel_current_y = lerp(wheel_current_y, wheel_target_y, WHEEL_LERP_SPEED * delta)
	left_wheel.position.y = wheel_current_y
	right_wheel.position.y = wheel_current_y

func _emit_thrust_particles(direction: Vector2) -> void:
	if thrust_particles:
		thrust_particles.emitting = true
		# Adjust particle direction based on thrust
		var mat = thrust_particles.process_material as ParticleProcessMaterial
		if mat:
			mat.direction = Vector3(direction.x, direction.y, 0)

	# Spawn neon thrust particles
	if visual_effects:
		var particle_pos = global_position + direction * -15.0
		visual_effects.spawn_thrust_particles(particle_pos, direction * 100, Color(1.0, 0.8, 0.2))

func _update_visual_effects(delta: float) -> void:
	"""Update visual effects like trails and speed lines"""
	if not visual_effects:
		return

	# Spawn neon trail when moving
	if not is_landed and custom_velocity.length() > 0.5:
		trail_spawn_timer += delta
		if trail_spawn_timer >= TRAIL_SPAWN_INTERVAL:
			trail_spawn_timer = 0.0
			var trail_color = Color.CYAN.lerp(Color.YELLOW, custom_velocity.length() / GameConfig.WORLD.max_velocity)
			visual_effects.add_trail_point(global_position, trail_color)

	# Update speed lines based on velocity
	var speed_ratio = custom_velocity.length() / GameConfig.WORLD.max_velocity
	if speed_ratio > 0.6:  # Only show when going fast
		visual_effects.set_speed_lines((speed_ratio - 0.6) / 0.4)

func land_on_platform(platform: Node2D) -> void:
	var landing_speed = custom_velocity.length()

	# Check landing conditions
	if landing_speed > GameConfig.WORLD.hard_landing_speed:
		# Hard landing - take damage
		take_damage(GameConfig.DAMAGE.hard_landing, "Hard landing")
		# Bounce back
		custom_velocity.y = -abs(custom_velocity.y) * 0.5
		return

	if not gear_extended:
		# No gear - take damage
		take_damage(GameConfig.DAMAGE.no_gear_landing, "Landing without gear")
		custom_velocity.y = -abs(custom_velocity.y) * 0.3
		return

	if landing_speed > GameConfig.WORLD.safe_landing_speed:
		# Rough landing but ok
		pass

	# Successful landing
	is_landed = true
	landed_platform = platform
	custom_velocity = Vector2.ZERO
	landed.emit(platform)

func take_off() -> void:
	if is_landed:
		is_landed = false
		landed_platform = null
		custom_velocity.y = -1.0  # Small upward boost
		took_off.emit()

func take_damage(amount: int, source: String = "") -> void:
	if invulnerable_timer > 0:
		return

	GameState.take_damage(amount, source)
	invulnerable_timer = 1.0  # 1 second invulnerability
	collision_occurred.emit(amount, source)

	# Visual effects for damage
	if visual_effects:
		visual_effects.damage_flash()
		visual_effects.spawn_spark_burst(global_position, 15, Color(1.0, 0.3, 0.3))

func apply_knockback(from_position: Vector2, strength: float = 2.0) -> void:
	var direction = (position - from_position).normalized()
	custom_velocity += direction * strength

func get_speed() -> float:
	return custom_velocity.length()

func is_safe_speed() -> bool:
	return custom_velocity.length() <= GameConfig.WORLD.safe_landing_speed

func is_caution_speed() -> bool:
	var speed = custom_velocity.length()
	return speed > GameConfig.WORLD.safe_landing_speed and speed <= GameConfig.WORLD.danger_speed

func is_danger_speed() -> bool:
	return custom_velocity.length() > GameConfig.WORLD.danger_speed

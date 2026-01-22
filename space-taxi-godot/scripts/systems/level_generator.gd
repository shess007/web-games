extends Node
class_name LevelGenerator
## Procedural sector/level generation system

const PLATFORM_SCENE = preload("res://scenes/entities/platform.tscn")
const ASTEROID_SCENE = preload("res://scenes/entities/asteroid.tscn")
const DEBRIS_SCENE = preload("res://scenes/entities/debris.tscn")
const METEOR_SCENE = preload("res://scenes/entities/meteor.tscn")
const ENEMY_SCENE = preload("res://scenes/entities/enemy.tscn")
const PASSENGER_SCENE = preload("res://scenes/entities/passenger.tscn")

var world_width: float = 1600.0
var world_height: float = 1200.0
var platforms: Array[Platform] = []
var asteroids: Array[Asteroid] = []
var debris_items: Array[Debris] = []
var meteors: Array[Meteor] = []
var enemies: Array[Enemy] = []
var passengers: Array[Passenger] = []
var used_platform_names: Array[String] = []

# Job queue
var pickup_queue: Array[Dictionary] = []
var current_job: Dictionary = {}

signal level_generated()
signal job_assigned(from_platform: Platform, to_platform: Platform, passenger: Passenger)
signal all_jobs_complete()

func generate_sector(sector_index: int, parent: Node2D) -> void:
	# Clear existing entities
	_clear_all()

	var config = GameConfig.get_sector_config(sector_index)
	world_width = config.world_width
	world_height = config.world_height

	# Generate platforms first
	_generate_platforms(config, parent)

	# Generate obstacles
	_generate_asteroids(config, parent)
	_generate_debris(config, parent)

	# Generate enemies
	_generate_enemies(config, parent)

	# Generate passenger jobs
	_generate_jobs(config, parent)

	# Meteor spawner is handled separately (they spawn during gameplay)

	level_generated.emit()

func _clear_all() -> void:
	for p in platforms:
		if is_instance_valid(p):
			p.queue_free()
	platforms.clear()

	for a in asteroids:
		if is_instance_valid(a):
			a.queue_free()
	asteroids.clear()

	for d in debris_items:
		if is_instance_valid(d):
			d.queue_free()
	debris_items.clear()

	for m in meteors:
		if is_instance_valid(m):
			m.queue_free()
	meteors.clear()

	for e in enemies:
		if is_instance_valid(e):
			e.queue_free()
	enemies.clear()

	for p in passengers:
		if is_instance_valid(p):
			p.queue_free()
	passengers.clear()

	used_platform_names.clear()
	pickup_queue.clear()
	current_job = {}

func _generate_platforms(config: Dictionary, parent: Node2D) -> void:
	var num_platforms = config.platforms
	var margin = 150.0
	var min_distance = 200.0

	# Always include a fuel station
	var fuel_station_index = randi() % num_platforms

	# Base port on first sector only (for returning)
	var base_port_index = -1
	if GameState.current_sector == 0:
		base_port_index = (fuel_station_index + 1) % num_platforms

	for i in range(num_platforms):
		var platform = PLATFORM_SCENE.instantiate() as Platform

		# Determine building type
		var building_type: int
		if i == fuel_station_index:
			building_type = GameConfig.BuildingType.FUEL_STATION
		elif i == base_port_index:
			building_type = GameConfig.BuildingType.BASE_PORT
		else:
			# Random building type (excluding special types)
			var regular_types = [
				GameConfig.BuildingType.SPACE_HOUSE,
				GameConfig.BuildingType.VILLA,
				GameConfig.BuildingType.FACTORY,
				GameConfig.BuildingType.DISCO,
				GameConfig.BuildingType.PUB
			]
			building_type = regular_types[randi() % regular_types.size()]

		# Find valid position
		var pos = _find_valid_position(margin, min_distance)

		# Get unique platform name
		var platform_name = _get_unique_platform_name()

		platform.position = pos
		parent.add_child(platform)

		# Setup must be called AFTER add_child so @onready vars are available
		platform.setup({
			"name": platform_name,
			"id": i,
			"building_type": building_type,
			"width": randf_range(120.0, 180.0),
			"height": 20.0
		})

		platforms.append(platform)

func _find_valid_position(margin: float, min_distance: float) -> Vector2:
	var max_attempts = 50
	var attempts = 0

	while attempts < max_attempts:
		var x = randf_range(margin, world_width - margin)
		var y = randf_range(margin + 200, world_height - margin)  # Keep platforms lower

		var pos = Vector2(x, y)
		var valid = true

		# Check distance from other platforms
		for p in platforms:
			if p.position.distance_to(pos) < min_distance:
				valid = false
				break

		if valid:
			return pos

		attempts += 1

	# Fallback to grid-based position
	var grid_x = (platforms.size() % 3) * (world_width / 3.0) + world_width / 6.0
	var grid_y = (platforms.size() / 3) * 300.0 + 400.0
	return Vector2(grid_x, grid_y)

func _get_unique_platform_name() -> String:
	var available = GameConfig.PLATFORM_NAMES.filter(func(n): return n not in used_platform_names)
	if available.is_empty():
		return "PLATFORM %d" % (platforms.size() + 1)

	var name = available[randi() % available.size()]
	used_platform_names.append(name)
	return name

func _generate_asteroids(config: Dictionary, parent: Node2D) -> void:
	for i in range(config.asteroids):
		var asteroid = ASTEROID_SCENE.instantiate() as Asteroid
		asteroid.position = Vector2(
			randf_range(100, world_width - 100),
			randf_range(100, world_height - 100)
		)
		parent.add_child(asteroid)
		asteroid.setup()
		asteroids.append(asteroid)

func _generate_debris(config: Dictionary, parent: Node2D) -> void:
	for i in range(config.debris):
		var debris = DEBRIS_SCENE.instantiate() as Debris
		debris.position = Vector2(
			randf_range(50, world_width - 50),
			randf_range(50, world_height - 50)
		)
		parent.add_child(debris)
		debris.setup()
		debris_items.append(debris)

func _generate_enemies(config: Dictionary, parent: Node2D) -> void:
	for i in range(config.enemies):
		var enemy = ENEMY_SCENE.instantiate() as Enemy

		# Find a position away from platforms
		var center = Vector2(
			randf_range(200, world_width - 200),
			randf_range(200, world_height - 200)
		)

		parent.add_child(enemy)
		enemy.setup(center)
		enemies.append(enemy)

func _generate_jobs(config: Dictionary, parent: Node2D) -> void:
	var num_passengers = config.passengers
	var is_vip_sector = config.get("vip", false)

	# Get available platforms (not fuel stations or base ports)
	var passenger_platforms = platforms.filter(func(p):
		return not p.is_fuel_station and not p.is_base_port
	)

	if passenger_platforms.size() < 2:
		push_warning("Not enough platforms for passengers!")
		return

	for i in range(num_passengers):
		# Create passenger data
		var passenger_data = GameConfig.get_random_passenger()

		# Pick random from/to platforms
		var from_idx = randi() % passenger_platforms.size()
		var from_platform = passenger_platforms[from_idx]

		var to_idx = (from_idx + 1 + randi() % (passenger_platforms.size() - 1)) % passenger_platforms.size()
		var to_platform = passenger_platforms[to_idx]

		# Create passenger
		var passenger = PASSENGER_SCENE.instantiate() as Passenger
		passenger.position = from_platform.get_door_position()
		parent.add_child(passenger)
		passenger.setup(passenger_data)
		passengers.append(passenger)

		# Add to pickup queue
		pickup_queue.append({
			"passenger": passenger,
			"from_platform": from_platform,
			"to_platform": to_platform,
			"is_vip": is_vip_sector and i == num_passengers - 1
		})

		# Mark platform as having a waiting passenger
		from_platform.spawn_passenger(passenger_data)

func get_next_job() -> Dictionary:
	if pickup_queue.is_empty():
		all_jobs_complete.emit()
		return {}

	current_job = pickup_queue.pop_front()
	job_assigned.emit(current_job.from_platform, current_job.to_platform, current_job.passenger)
	return current_job

func complete_current_job() -> void:
	current_job = {}

func get_world_bounds() -> Rect2:
	return Rect2(0, 0, world_width, world_height)

func spawn_meteor(parent: Node2D) -> void:
	var meteor = METEOR_SCENE.instantiate() as Meteor

	# Spawn from edge
	var edge = randi() % 4
	var pos: Vector2
	var vel: Vector2

	match edge:
		0:  # Top
			pos = Vector2(randf_range(0, world_width), -50)
			vel = Vector2(randf_range(-2, 2), randf_range(3, 6))
		1:  # Bottom
			pos = Vector2(randf_range(0, world_width), world_height + 50)
			vel = Vector2(randf_range(-2, 2), randf_range(-6, -3))
		2:  # Left
			pos = Vector2(-50, randf_range(0, world_height))
			vel = Vector2(randf_range(3, 6), randf_range(-2, 2))
		3:  # Right
			pos = Vector2(world_width + 50, randf_range(0, world_height))
			vel = Vector2(randf_range(-6, -3), randf_range(-2, 2))

	meteor.position = pos
	parent.add_child(meteor)
	meteor.setup(-1, vel)
	meteors.append(meteor)

func get_platform_by_id(id: int) -> Platform:
	for p in platforms:
		if p.platform_id == id:
			return p
	return null

func get_fuel_station() -> Platform:
	for p in platforms:
		if p.is_fuel_station:
			return p
	return null

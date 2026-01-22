extends StaticBody2D
class_name Platform
## Landing platform with building and optional features (fuel station, base port)

signal taxi_landed(taxi: Taxi)
signal taxi_left(taxi: Taxi)
signal passenger_waiting(passenger: Dictionary)

@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var platform_visual: ColorRect = $PlatformVisual
@onready var building_container: Node2D = $BuildingContainer
@onready var landing_zone: Area2D = $LandingZone
@onready var name_label: Label = $NameLabel
@onready var passenger_spawn: Marker2D = $PassengerSpawn

# Platform data
var platform_name: String = ""
var platform_id: int = 0
var building_type: int = GameConfig.BuildingType.SPACE_HOUSE
var is_fuel_station: bool = false
var is_base_port: bool = false
var platform_width: float = 150.0
var platform_height: float = 20.0

# Passenger data
var waiting_passenger: Dictionary = {}
var has_passenger: bool = false

# Current taxi
var taxi_on_platform: Taxi = null

# Visual effects
var window_nodes: Array = []
var landing_pad_left: ColorRect = null
var landing_pad_right: ColorRect = null
var window_flicker_timer: float = 0.0

func _ready() -> void:
	# Connect landing zone signals
	landing_zone.body_entered.connect(_on_landing_zone_entered)
	landing_zone.body_exited.connect(_on_landing_zone_exited)

func setup(config: Dictionary) -> void:
	platform_name = config.get("name", GameConfig.get_random_platform_name())
	platform_id = config.get("id", 0)
	building_type = config.get("building_type", GameConfig.BuildingType.SPACE_HOUSE)
	platform_width = config.get("width", 150.0)
	platform_height = config.get("height", 20.0)

	var building_config = GameConfig.BUILDINGS[building_type]
	is_fuel_station = building_config.get("is_fuel", false)
	is_base_port = building_config.get("is_base", false)

	_create_visuals()

func _create_visuals() -> void:
	# Set up collision shape
	var shape = RectangleShape2D.new()
	shape.size = Vector2(platform_width, platform_height)
	collision_shape.shape = shape

	# Platform visual - darker, more industrial
	platform_visual.size = Vector2(platform_width, platform_height)
	platform_visual.position = Vector2(-platform_width / 2.0, -platform_height / 2.0)
	platform_visual.color = Color(0.15, 0.15, 0.25)

	# Landing zone (slightly above platform)
	var landing_shape = RectangleShape2D.new()
	landing_shape.size = Vector2(platform_width - 20, 40)
	landing_zone.get_node("CollisionShape2D").shape = landing_shape
	landing_zone.position = Vector2(0, -30)

	# Add glowing landing pads
	_create_landing_pads()

	# Name label with neon style
	name_label.text = platform_name
	name_label.position = Vector2(-platform_width / 2.0, -platform_height / 2.0 - 20)
	name_label.add_theme_color_override("font_color", Color(0.0, 1.0, 1.0))  # Cyan

	# Passenger spawn point
	passenger_spawn.position = Vector2(-platform_width / 4.0, -platform_height / 2.0 - 10)

	# Create building
	_create_building()

func _create_landing_pads() -> void:
	"""Create glowing landing pad indicators"""
	# Left pad
	landing_pad_left = ColorRect.new()
	landing_pad_left.size = Vector2(15, 5)
	landing_pad_left.position = Vector2(-platform_width / 3.0, -platform_height / 2.0 - 3)
	landing_pad_left.color = Color(0.0, 1.0, 0.5)  # Neon green
	add_child(landing_pad_left)

	# Right pad
	landing_pad_right = ColorRect.new()
	landing_pad_right.size = Vector2(15, 5)
	landing_pad_right.position = Vector2(platform_width / 3.0 - 15, -platform_height / 2.0 - 3)
	landing_pad_right.color = Color(0.0, 1.0, 0.5)  # Neon green
	add_child(landing_pad_right)

func _create_building() -> void:
	var building_config = GameConfig.BUILDINGS[building_type]

	# Building base with darker colors
	var building = ColorRect.new()
	building.size = Vector2(building_config.width, building_config.height)
	building.position = Vector2(-building_config.width / 2.0, -platform_height / 2.0 - building_config.height)
	building.color = building_config.color.darkened(0.3)
	building_container.add_child(building)

	# Door with neon accent
	var door = ColorRect.new()
	door.size = Vector2(15, 25)
	door.position = Vector2(
		-building_config.width / 2.0 + building_config.door_offset,
		-platform_height / 2.0 - 25
	)
	door.color = Color(0.1, 0.1, 0.15)
	building_container.add_child(door)

	# Door light accent
	var door_light = ColorRect.new()
	door_light.size = Vector2(15, 2)
	door_light.position = door.position + Vector2(0, -2)
	door_light.color = Color(0.0, 1.0, 1.0)  # Cyan accent
	building_container.add_child(door_light)

	# Windows with neon glow
	window_nodes.clear()
	var window_count = int(building_config.width / 25)
	for i in range(window_count):
		var window = ColorRect.new()
		window.size = Vector2(12, 12)
		window.position = Vector2(
			-building_config.width / 2.0 + 15 + i * 25,
			-platform_height / 2.0 - building_config.height + 10
		)
		window.color = Color(0.5, 0.8, 1.0, 0.8)  # Neon blue window
		building_container.add_child(window)
		window_nodes.append(window)

	# Special decorations for fuel station
	if is_fuel_station:
		var pump = ColorRect.new()
		pump.size = Vector2(20, 30)
		pump.position = Vector2(platform_width / 4.0, -platform_height / 2.0 - 30)
		pump.color = Color(0.1, 0.4, 0.2)
		building_container.add_child(pump)

		# Glowing fuel indicator
		var fuel_light = ColorRect.new()
		fuel_light.size = Vector2(20, 5)
		fuel_light.position = Vector2(platform_width / 4.0, -platform_height / 2.0 - 35)
		fuel_light.color = Color(0.0, 1.0, 0.5)  # Neon green
		building_container.add_child(fuel_light)

		var fuel_label = Label.new()
		fuel_label.text = "FUEL"
		fuel_label.position = Vector2(platform_width / 4.0 - 10, -platform_height / 2.0 - 50)
		fuel_label.add_theme_color_override("font_color", Color(0.0, 1.0, 0.5))
		building_container.add_child(fuel_label)

func _on_landing_zone_entered(body: Node2D) -> void:
	if body is Taxi:
		var taxi = body as Taxi
		# Check if taxi is descending and slow enough
		if taxi.custom_velocity.y > 0 and taxi.get_speed() <= GameConfig.WORLD.hard_landing_speed * 1.5:
			taxi.land_on_platform(self)
			taxi_on_platform = taxi
			taxi_landed.emit(taxi)

func _on_landing_zone_exited(body: Node2D) -> void:
	if body is Taxi and body == taxi_on_platform:
		taxi_on_platform = null
		taxi_left.emit(body)

func spawn_passenger(passenger: Dictionary) -> void:
	waiting_passenger = passenger
	has_passenger = true
	passenger_waiting.emit(passenger)

func pickup_passenger() -> Dictionary:
	if not has_passenger:
		return {}

	var passenger = waiting_passenger
	waiting_passenger = {}
	has_passenger = false
	return passenger

func get_door_position() -> Vector2:
	var building_config = GameConfig.BUILDINGS[building_type]
	return global_position + Vector2(
		-building_config.width / 2.0 + building_config.door_offset + 7,
		-platform_height / 2.0 - 5
	)

func _process(delta: float) -> void:
	# Animate landing pads (pulsing glow)
	_animate_landing_pads(delta)

	# Animate windows (flickering)
	_animate_windows(delta)

	# Handle fueling when taxi is on platform
	if taxi_on_platform and is_fuel_station and taxi_on_platform.is_landed:
		if GameState.fuel < GameConfig.TAXI.max_fuel:
			var fuel_cost = GameConfig.FUEL_STATION.cost_per_frame * delta * 60.0
			if GameState.cash >= fuel_cost or true:  # Allow negative or free fuel for now
				GameState.refuel(
					GameConfig.FUEL_STATION.refuel_rate * delta * 60.0,
					fuel_cost
				)

func _animate_landing_pads(delta: float) -> void:
	"""Pulsing glow effect on landing pads"""
	var time = Time.get_ticks_msec() / 1000.0
	var pulse = 0.6 + 0.4 * sin(time * 3.0)

	if landing_pad_left:
		var color = Color(0.0, 1.0, 0.5)
		color.a = pulse
		landing_pad_left.color = color

	if landing_pad_right:
		var color = Color(0.0, 1.0, 0.5)
		color.a = pulse
		landing_pad_right.color = color

func _animate_windows(delta: float) -> void:
	"""Random flickering window lights"""
	window_flicker_timer += delta

	if window_flicker_timer >= 0.1:  # Update every 0.1 seconds
		window_flicker_timer = 0.0

		for window in window_nodes:
			# Random chance to flicker
			if randf() < 0.05:  # 5% chance
				var base_color = Color(0.5, 0.8, 1.0)
				window.color = base_color if randf() > 0.5 else base_color * 0.5

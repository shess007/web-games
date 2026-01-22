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

	# Platform visual
	platform_visual.size = Vector2(platform_width, platform_height)
	platform_visual.position = Vector2(-platform_width / 2.0, -platform_height / 2.0)
	platform_visual.color = Color(0.3, 0.3, 0.4)

	# Landing zone (slightly above platform)
	var landing_shape = RectangleShape2D.new()
	landing_shape.size = Vector2(platform_width - 20, 40)
	landing_zone.get_node("CollisionShape2D").shape = landing_shape
	landing_zone.position = Vector2(0, -30)

	# Name label
	name_label.text = platform_name
	name_label.position = Vector2(-platform_width / 2.0, -platform_height / 2.0 - 20)

	# Passenger spawn point
	passenger_spawn.position = Vector2(-platform_width / 4.0, -platform_height / 2.0 - 10)

	# Create building
	_create_building()

func _create_building() -> void:
	var building_config = GameConfig.BUILDINGS[building_type]

	# Building base
	var building = ColorRect.new()
	building.size = Vector2(building_config.width, building_config.height)
	building.position = Vector2(-building_config.width / 2.0, -platform_height / 2.0 - building_config.height)
	building.color = building_config.color
	building_container.add_child(building)

	# Door
	var door = ColorRect.new()
	door.size = Vector2(15, 25)
	door.position = Vector2(
		-building_config.width / 2.0 + building_config.door_offset,
		-platform_height / 2.0 - 25
	)
	door.color = Color(0.2, 0.2, 0.2)
	building_container.add_child(door)

	# Windows
	var window_count = int(building_config.width / 25)
	for i in range(window_count):
		var window = ColorRect.new()
		window.size = Vector2(12, 12)
		window.position = Vector2(
			-building_config.width / 2.0 + 15 + i * 25,
			-platform_height / 2.0 - building_config.height + 10
		)
		window.color = Color(0.8, 0.9, 1.0, 0.7)  # Lit window
		building_container.add_child(window)

	# Special decorations for fuel station
	if is_fuel_station:
		var pump = ColorRect.new()
		pump.size = Vector2(20, 30)
		pump.position = Vector2(platform_width / 4.0, -platform_height / 2.0 - 30)
		pump.color = Color(0.2, 0.7, 0.3)
		building_container.add_child(pump)

		var fuel_label = Label.new()
		fuel_label.text = "⛽ FUEL"
		fuel_label.position = Vector2(platform_width / 4.0 - 10, -platform_height / 2.0 - 50)
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
	# Handle fueling when taxi is on platform
	if taxi_on_platform and is_fuel_station and taxi_on_platform.is_landed:
		if GameState.fuel < GameConfig.TAXI.max_fuel:
			var fuel_cost = GameConfig.FUEL_STATION.cost_per_frame * delta * 60.0
			if GameState.cash >= fuel_cost or true:  # Allow negative or free fuel for now
				GameState.refuel(
					GameConfig.FUEL_STATION.refuel_rate * delta * 60.0,
					fuel_cost
				)

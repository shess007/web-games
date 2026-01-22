extends Node2D
class_name GameManager
## Main game manager - ties all systems together

const TAXI_SCENE = preload("res://scenes/entities/taxi.tscn")
const HUD_SCENE = preload("res://scenes/ui/hud.tscn")
const CONTRACT_SELECTION_SCENE = preload("res://scenes/ui/contract_selection.tscn")

# Nodes
@onready var game_world: Node2D = $GameWorld
@onready var background: Node2D = $Background
@onready var camera: Camera2D = $Camera2D

# Scene instances
var taxi: Taxi
var hud: HUD
var contract_selection: ContractSelection
var level_generator: LevelGenerator

# Game state
var current_job: Dictionary = {}
var meteor_spawn_timer: float = 0.0
var shake_timer: float = 0.0
var shake_intensity: float = 0.0

# Camera
var camera_target: Vector2 = Vector2.ZERO
const CAMERA_SMOOTHING = 5.0

func _ready() -> void:
	# Initialize level generator
	level_generator = LevelGenerator.new()
	add_child(level_generator)

	# Create HUD
	hud = HUD_SCENE.instantiate()
	add_child(hud)

	# Create contract selection overlay
	contract_selection = CONTRACT_SELECTION_SCENE.instantiate()
	contract_selection.contract_selected.connect(_on_contract_selected)
	add_child(contract_selection)

	# Connect signals
	level_generator.job_assigned.connect(_on_job_assigned)
	level_generator.all_jobs_complete.connect(_on_all_jobs_complete)

	GameState.game_over_triggered.connect(_on_game_over)
	GameState.run_complete_triggered.connect(_on_run_complete)

	# Start the game
	_start_new_run()

func _process(delta: float) -> void:
	if GameState.current_state != GameState.State.PLAYING:
		return

	# Update camera
	_update_camera(delta)

	# Screen shake
	_update_shake(delta)

	# Spawn meteors periodically in later sectors
	_update_meteor_spawning(delta)

	# Update HUD with taxi state
	if taxi:
		hud.update_velocity(taxi.get_speed())
		hud.update_landing_indicator(taxi.is_safe_speed(), taxi.gear_extended)

func _update_camera(delta: float) -> void:
	if not taxi:
		return

	# Smooth camera follow
	camera_target = taxi.position
	var bounds = level_generator.get_world_bounds()

	# Clamp camera to world bounds
	var half_size = get_viewport_rect().size / 2.0 / camera.zoom
	camera_target.x = clamp(camera_target.x, half_size.x, bounds.size.x - half_size.x)
	camera_target.y = clamp(camera_target.y, half_size.y, bounds.size.y - half_size.y)

	camera.position = camera.position.lerp(camera_target, CAMERA_SMOOTHING * delta)

func _update_shake(delta: float) -> void:
	# Get shake intensity from modifiers
	var modifier_shake = GameState.get_shake_intensity()

	if shake_timer > 0:
		shake_timer -= delta
		var offset = Vector2(
			randf_range(-shake_intensity, shake_intensity),
			randf_range(-shake_intensity, shake_intensity)
		)
		camera.offset = offset
	elif modifier_shake > 0:
		var offset = Vector2(
			randf_range(-modifier_shake, modifier_shake),
			randf_range(-modifier_shake, modifier_shake)
		)
		camera.offset = offset
	else:
		camera.offset = Vector2.ZERO

func _update_meteor_spawning(delta: float) -> void:
	var sector_config = GameConfig.get_sector_config(GameState.current_sector)
	if sector_config.meteors <= 0:
		return

	meteor_spawn_timer -= delta
	if meteor_spawn_timer <= 0:
		level_generator.spawn_meteor(game_world)
		meteor_spawn_timer = randf_range(5.0, 15.0)  # Random interval

func _start_new_run() -> void:
	GameState.start_run()
	_load_sector(0)

func _load_sector(sector_index: int) -> void:
	# Clear game world
	for child in game_world.get_children():
		child.queue_free()

	# Wait a frame for cleanup
	await get_tree().process_frame

	# Update game state
	GameState.start_sector(sector_index)

	# Generate new sector
	level_generator.generate_sector(sector_index, game_world)

	# Create taxi at first platform
	_spawn_taxi()

	# Create background
	_create_background()

	# Get first job
	current_job = level_generator.get_next_job()
	if not current_job.is_empty():
		_update_navigation()

	# Show sector message
	var sector_config = GameConfig.get_sector_config(sector_index)
	hud.show_message("SECTOR %d: %s" % [sector_index + 1, sector_config.name])

func _spawn_taxi() -> void:
	taxi = TAXI_SCENE.instantiate()

	# Find first platform for spawn
	if level_generator.platforms.size() > 0:
		var spawn_platform = level_generator.platforms[0]
		taxi.position = spawn_platform.position + Vector2(0, -50)
	else:
		taxi.position = Vector2(400, 300)

	taxi.landed.connect(_on_taxi_landed)
	taxi.took_off.connect(_on_taxi_took_off)
	taxi.collision_occurred.connect(_on_taxi_collision)
	taxi.gear_toggled.connect(_on_gear_toggled)

	game_world.add_child(taxi)
	camera.position = taxi.position

func _create_background() -> void:
	# Clear existing background
	for child in background.get_children():
		child.queue_free()

	var theme = GameConfig.get_random_theme()
	var bounds = level_generator.get_world_bounds()

	# Background color
	var bg_rect = ColorRect.new()
	bg_rect.color = theme.background
	bg_rect.size = bounds.size
	bg_rect.position = Vector2.ZERO
	background.add_child(bg_rect)

	# Stars
	for i in range(100):
		var star = ColorRect.new()
		star.size = Vector2(2, 2)
		star.position = Vector2(
			randf_range(0, bounds.size.x),
			randf_range(0, bounds.size.y)
		)
		star.color = theme.stars
		star.color.a = randf_range(0.3, 1.0)
		background.add_child(star)

	# World boundaries (visual)
	var border_color = Color(0.3, 0.3, 0.4, 0.5)
	var border_thickness = 10.0

	# Top border
	var top = ColorRect.new()
	top.size = Vector2(bounds.size.x, border_thickness)
	top.position = Vector2(0, 0)
	top.color = border_color
	background.add_child(top)

	# Bottom border
	var bottom = ColorRect.new()
	bottom.size = Vector2(bounds.size.x, border_thickness)
	bottom.position = Vector2(0, bounds.size.y - border_thickness)
	bottom.color = border_color
	background.add_child(bottom)

	# Left border
	var left = ColorRect.new()
	left.size = Vector2(border_thickness, bounds.size.y)
	left.position = Vector2(0, 0)
	left.color = border_color
	background.add_child(left)

	# Right border
	var right = ColorRect.new()
	right.size = Vector2(border_thickness, bounds.size.y)
	right.position = Vector2(bounds.size.x - border_thickness, 0)
	right.color = border_color
	background.add_child(right)

func _update_navigation() -> void:
	if current_job.is_empty():
		hud.update_navigation("—", "—")
		return

	var from_name = current_job.from_platform.platform_name if current_job.from_platform else "—"
	var to_name = current_job.to_platform.platform_name if current_job.to_platform else "—"
	hud.update_navigation(from_name, to_name)

func _on_taxi_landed(platform: Platform) -> void:
	AudioManager.play_sfx("land")

	# Check if this is the pickup platform
	if not current_job.is_empty() and platform == current_job.from_platform:
		if GameState.current_passenger.is_empty():
			_pickup_passenger()

	# Check if this is the dropoff platform
	elif not current_job.is_empty() and platform == current_job.to_platform:
		if not GameState.current_passenger.is_empty():
			_deliver_passenger()

func _on_taxi_took_off() -> void:
	AudioManager.play_sfx("takeoff")

func _on_taxi_collision(damage: int, source: String) -> void:
	AudioManager.play_sfx("damage")
	trigger_shake(damage * 3.0, 0.2)

func _on_gear_toggled(extended: bool) -> void:
	# Visual/audio feedback
	pass

func _pickup_passenger() -> void:
	var passenger_data = current_job.from_platform.pickup_passenger()
	if passenger_data.is_empty():
		passenger_data = GameConfig.get_random_passenger()

	GameState.pickup_passenger(passenger_data)

	# Show contract selection
	var is_vip = current_job.get("is_vip", false)
	contract_selection.show_contracts(is_vip)

	AudioManager.play_sfx("pickup")
	hud.show_message("PICKUP: " + passenger_data.get("name", "Passenger"))

	# Show passenger comment
	if current_job.has("passenger") and current_job.passenger:
		hud.show_passenger_comment(current_job.passenger.get_pickup_line())

func _on_contract_selected(contract_type: int) -> void:
	GameState.accept_contract(contract_type)
	AudioManager.play_sfx("contract_select")

func _deliver_passenger() -> void:
	GameState.deliver_passenger()
	AudioManager.play_sfx("dropoff")

	# Show passenger comment
	if current_job.has("passenger") and current_job.passenger:
		hud.show_passenger_comment(current_job.passenger.get_dropoff_line())

	# Get next job
	level_generator.complete_current_job()
	current_job = level_generator.get_next_job()
	_update_navigation()

func _on_job_assigned(from_platform: Platform, to_platform: Platform, passenger: Passenger) -> void:
	_update_navigation()

func _on_all_jobs_complete() -> void:
	# Move to next sector
	GameState.complete_sector()

	if GameState.current_state == GameState.State.SECTOR_TRANSITION:
		hud.show_message("SECTOR COMPLETE!")
		await get_tree().create_timer(2.0).timeout
		_load_sector(GameState.current_sector)

func _on_game_over(reason: String) -> void:
	AudioManager.play_sfx("game_over")
	hud.show_message("GAME OVER: " + reason, 5.0)
	# Would show game over screen here

func _on_run_complete(final_score: int) -> void:
	AudioManager.play_sfx("victory")
	hud.show_message("RUN COMPLETE! Score: $%d" % final_score, 5.0)
	# Would show victory screen here

func trigger_shake(intensity: float, duration: float) -> void:
	shake_intensity = intensity
	shake_timer = duration

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if GameState.current_state == GameState.State.PLAYING:
			GameState.pause_game()
			hud.show_message("PAUSED")
		elif GameState.current_state == GameState.State.PAUSED:
			GameState.resume_game()

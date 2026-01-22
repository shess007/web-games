extends Node
## Game State Manager - Manages run state, scoring, and game flow

signal hull_changed(new_hull: int)
signal cash_changed(new_cash: int)
signal fuel_changed(new_fuel: float)
signal sector_changed(new_sector: int)
signal passenger_picked_up(passenger: Dictionary)
signal passenger_delivered(passenger: Dictionary, payout: int)
signal contract_accepted(contract: Dictionary)
signal contract_failed(reason: String)
signal modifier_activated(modifier: int)
signal game_over_triggered(reason: String)
signal run_complete_triggered(final_score: int)

enum State { START, PLAYING, CONTRACT_SELECT, SECTOR_TRANSITION, BASE, PAUSED, DEAD, VICTORY }

# Current game state
var current_state: State = State.START

# Run state (persists across sectors within a run)
var hull: int = 3
var max_hull: int = 3
var cash: int = 0
var current_sector: int = 0
var passengers_delivered: int = 0
var run_time: float = 0.0
var death_reason: String = ""

# Level state (resets each sector)
var fuel: float = 100.0
var current_passenger: Dictionary = {}
var current_contract: Dictionary = {}
var active_modifiers: Array = []
var contract_timer: float = 0.0
var bumped_during_contract: bool = false
var exceeded_speed_during_contract: bool = false

# Statistics
var total_earnings: int = 0
var contracts_completed: int = 0
var contracts_failed: int = 0

func _ready() -> void:
	reset_run()

func _process(delta: float) -> void:
	if current_state == State.PLAYING:
		run_time += delta

		# Update contract timer if active
		if current_contract.has("time_limit") and current_contract.get("time_limit", 0) > 0:
			contract_timer -= delta
			if contract_timer <= 0:
				fail_contract("Time expired!")

func reset_run() -> void:
	hull = 3
	max_hull = 3
	cash = 0
	current_sector = 0
	passengers_delivered = 0
	run_time = 0.0
	death_reason = ""
	fuel = 100.0
	current_passenger = {}
	current_contract = {}
	active_modifiers = []
	contract_timer = 0.0
	bumped_during_contract = false
	exceeded_speed_during_contract = false
	total_earnings = 0
	contracts_completed = 0
	contracts_failed = 0

func start_run() -> void:
	reset_run()
	current_state = State.PLAYING
	sector_changed.emit(current_sector)

func start_sector(sector_index: int) -> void:
	current_sector = sector_index
	fuel = 100.0
	current_passenger = {}
	current_contract = {}
	bumped_during_contract = false
	exceeded_speed_during_contract = false

	# Apply modifiers for this sector
	var sector_config = GameConfig.get_sector_config(sector_index)
	if sector_config.modifiers > 0:
		active_modifiers = GameConfig.get_random_modifiers(sector_config.modifiers)
		for mod in active_modifiers:
			modifier_activated.emit(mod)
	else:
		active_modifiers = []

	sector_changed.emit(current_sector)
	fuel_changed.emit(fuel)

func take_damage(amount: int, source: String = "") -> void:
	hull -= amount
	hull = max(0, hull)
	hull_changed.emit(hull)

	# Check VIP contract failure
	if current_contract.has("no_bumps") and current_contract.get("no_bumps", false):
		bumped_during_contract = true
		fail_contract("VIP passenger was bumped!")
		return

	if hull <= 0:
		death_reason = source if source != "" else "Hull destroyed"
		_trigger_game_over(death_reason)

func repair_hull(amount: int) -> void:
	var cost = amount * GameConfig.BASE_PORT.repair_cost_per_hull
	if cash >= cost:
		cash -= cost
		hull = min(hull + amount, max_hull)
		hull_changed.emit(hull)
		cash_changed.emit(cash)

func use_fuel(amount: float) -> void:
	# Apply fuel leak modifier
	var multiplier = 1.0
	if GameConfig.ModifierType.FUEL_LEAK in active_modifiers:
		multiplier = GameConfig.MODIFIERS[GameConfig.ModifierType.FUEL_LEAK].drain_multiplier

	fuel -= amount * multiplier
	fuel = max(0, fuel)
	fuel_changed.emit(fuel)

	if fuel <= 0:
		death_reason = "Out of fuel"
		_trigger_game_over(death_reason)

func refuel(amount: float, cost: float = 0.0) -> void:
	if cost > 0 and cash < cost:
		return

	cash -= int(cost)
	fuel = min(fuel + amount, GameConfig.TAXI.max_fuel)
	fuel_changed.emit(fuel)
	cash_changed.emit(cash)

func add_cash(amount: int) -> void:
	# Apply lucky stars modifier
	var multiplier = 1.0
	if GameConfig.ModifierType.LUCKY_STARS in active_modifiers:
		multiplier = GameConfig.MODIFIERS[GameConfig.ModifierType.LUCKY_STARS].payout_multiplier

	var final_amount = int(amount * multiplier)
	cash += final_amount
	total_earnings += final_amount
	cash_changed.emit(cash)

func pickup_passenger(passenger: Dictionary) -> void:
	current_passenger = passenger
	passenger_picked_up.emit(passenger)
	current_state = State.CONTRACT_SELECT

func accept_contract(contract_type: int) -> void:
	current_contract = GameConfig.get_contract_config(contract_type).duplicate()
	current_contract["type"] = contract_type
	bumped_during_contract = false
	exceeded_speed_during_contract = false

	if current_contract.get("time_limit", 0) > 0:
		contract_timer = current_contract.get("time_limit", 0)

	contract_accepted.emit(current_contract)
	current_state = State.PLAYING

func deliver_passenger() -> void:
	if current_passenger.is_empty() or current_contract.is_empty():
		return

	# Check contract requirements
	if current_contract.has("no_bumps") and bumped_during_contract:
		fail_contract("VIP was bumped during ride!")
		return

	if current_contract.has("max_speed") and current_contract.get("max_speed", 0) > 0 and exceeded_speed_during_contract:
		fail_contract("Exceeded speed limit!")
		return

	var payout = current_contract.get("payout", 0)
	add_cash(payout)
	passengers_delivered += 1
	contracts_completed += 1

	passenger_delivered.emit(current_passenger, payout)

	current_passenger = {}
	current_contract = {}
	contract_timer = 0.0

func fail_contract(reason: String) -> void:
	contracts_failed += 1
	contract_failed.emit(reason)
	current_passenger = {}
	current_contract = {}
	contract_timer = 0.0

func check_speed_limit(current_speed: float) -> void:
	var max_speed = current_contract.get("max_speed", 0)
	if max_speed > 0:
		if current_speed > max_speed:
			exceeded_speed_during_contract = true

func complete_sector() -> void:
	current_sector += 1

	if current_sector >= GameConfig.SECTORS.size():
		_trigger_victory()
	else:
		current_state = State.SECTOR_TRANSITION

func _trigger_game_over(reason: String) -> void:
	death_reason = reason
	current_state = State.DEAD
	game_over_triggered.emit(reason)

func _trigger_victory() -> void:
	current_state = State.VICTORY
	var final_score = cash + (hull * GameConfig.SCORING.hull_bonus)
	run_complete_triggered.emit(final_score)

func get_final_score() -> int:
	return cash + (hull * GameConfig.SCORING.hull_bonus)

func pause_game() -> void:
	if current_state == State.PLAYING:
		current_state = State.PAUSED
		get_tree().paused = true

func resume_game() -> void:
	if current_state == State.PAUSED:
		current_state = State.PLAYING
		get_tree().paused = false

func get_thrust_multiplier() -> float:
	var multiplier = 1.0
	if GameConfig.ModifierType.SOLAR_STORM in active_modifiers:
		multiplier *= GameConfig.MODIFIERS[GameConfig.ModifierType.SOLAR_STORM].thrust_multiplier
	return multiplier

func get_gravity() -> float:
	var base_gravity = GameConfig.WORLD.gravity
	if GameConfig.ModifierType.GRAVITY_FLUX in active_modifiers:
		var config = GameConfig.MODIFIERS[GameConfig.ModifierType.GRAVITY_FLUX]
		var cycle = sin(run_time * config.cycle_speed * 1000.0)
		base_gravity = lerp(config.gravity_min, config.gravity_max, (cycle + 1.0) / 2.0)
	return base_gravity

func get_drift() -> Vector2:
	if GameConfig.ModifierType.ION_CLOUDS in active_modifiers:
		var amount = GameConfig.MODIFIERS[GameConfig.ModifierType.ION_CLOUDS].drift_amount
		return Vector2(randf_range(-amount, amount), randf_range(-amount, amount))
	return Vector2.ZERO

func get_shake_intensity() -> float:
	if GameConfig.ModifierType.SOLAR_STORM in active_modifiers:
		return GameConfig.MODIFIERS[GameConfig.ModifierType.SOLAR_STORM].shake_intensity
	return 0.0

func is_minimap_jammed() -> bool:
	return GameConfig.ModifierType.SCANNER_JAM in active_modifiers

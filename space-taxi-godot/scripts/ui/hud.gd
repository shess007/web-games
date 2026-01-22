extends CanvasLayer
class_name HUD
## Main game HUD with sidebars and gauges

# Left sidebar
@onready var hull_display: HBoxContainer = $LeftSidebar/HullDisplay
@onready var sector_label: Label = $LeftSidebar/SectorLabel
@onready var cash_label: Label = $LeftSidebar/CashLabel
@onready var fuel_gauge: ProgressBar = $LeftSidebar/FuelGauge
@onready var modifiers_container: VBoxContainer = $LeftSidebar/ModifiersContainer

# Right sidebar
@onready var passenger_emoji: Label = $RightSidebar/PassengerDisplay/PassengerEmoji
@onready var passenger_status: Label = $RightSidebar/PassengerDisplay/PassengerStatus
@onready var nav_from: Label = $RightSidebar/Navigation/FromLabel
@onready var nav_to: Label = $RightSidebar/Navigation/ToLabel
@onready var velocity_gauge: ProgressBar = $RightSidebar/VelocityGauge
@onready var velocity_label: Label = $RightSidebar/VelocityLabel
@onready var landing_indicator: Label = $RightSidebar/LandingIndicator
@onready var contract_info: VBoxContainer = $RightSidebar/ContractInfo
@onready var contract_type_label: Label = $RightSidebar/ContractInfo/ContractType
@onready var contract_payout_label: Label = $RightSidebar/ContractInfo/ContractPayout
@onready var contract_timer_bar: ProgressBar = $RightSidebar/ContractInfo/ContractTimer

# Center
@onready var center_message: Label = $CenterMessage
@onready var passenger_comment: Label = $PassengerComment

# Minimap
@onready var minimap: SubViewport = $MinimapContainer/MinimapViewport

var message_timer: float = 0.0
var comment_timer: float = 0.0

func _ready() -> void:
	# Connect to game state signals
	GameState.hull_changed.connect(_on_hull_changed)
	GameState.cash_changed.connect(_on_cash_changed)
	GameState.fuel_changed.connect(_on_fuel_changed)
	GameState.sector_changed.connect(_on_sector_changed)
	GameState.passenger_picked_up.connect(_on_passenger_picked_up)
	GameState.passenger_delivered.connect(_on_passenger_delivered)
	GameState.contract_accepted.connect(_on_contract_accepted)
	GameState.contract_failed.connect(_on_contract_failed)
	GameState.modifier_activated.connect(_on_modifier_activated)

	_update_hull(3)
	_update_sector(0)
	_update_cash(0)
	_update_fuel(100.0)

func _process(delta: float) -> void:
	# Update contract timer if active
	var time_limit = GameState.current_contract.get("time_limit", 0)
	if time_limit > 0:
		contract_timer_bar.visible = true
		contract_timer_bar.value = (GameState.contract_timer / time_limit) * 100.0
	else:
		contract_timer_bar.visible = false

	# Fade out messages
	if message_timer > 0:
		message_timer -= delta
		if message_timer <= 0:
			center_message.visible = false

	if comment_timer > 0:
		comment_timer -= delta
		if comment_timer <= 0:
			passenger_comment.visible = false

func _on_hull_changed(new_hull: int) -> void:
	_update_hull(new_hull)

func _on_cash_changed(new_cash: int) -> void:
	_update_cash(new_cash)

func _on_fuel_changed(new_fuel: float) -> void:
	_update_fuel(new_fuel)

func _on_sector_changed(new_sector: int) -> void:
	_update_sector(new_sector)

func _on_passenger_picked_up(passenger: Dictionary) -> void:
	passenger_emoji.text = passenger.get("emoji", "🧑")
	passenger_status.text = "IN TAXI"

func _on_passenger_delivered(passenger: Dictionary, payout: int) -> void:
	passenger_emoji.text = "—"
	passenger_status.text = "DELIVERED"
	show_message("+$%d" % payout)
	contract_info.visible = false

func _on_contract_accepted(contract: Dictionary) -> void:
	contract_info.visible = true
	contract_type_label.text = contract.name
	contract_payout_label.text = "$%d" % contract.payout
	contract_type_label.add_theme_color_override("font_color", contract.color)

func _on_contract_failed(reason: String) -> void:
	show_message("CONTRACT FAILED: " + reason)
	contract_info.visible = false

func _on_modifier_activated(modifier: int) -> void:
	var config = GameConfig.get_modifier_config(modifier)
	var label = Label.new()
	label.text = config.icon + " " + config.name
	modifiers_container.add_child(label)
	show_message("MODIFIER: " + config.name)

func _update_hull(hull: int) -> void:
	# Clear and recreate hull hearts
	for child in hull_display.get_children():
		child.queue_free()

	for i in range(3):
		var heart = Label.new()
		heart.text = "❤️" if i < hull else "🖤"
		hull_display.add_child(heart)

func _update_sector(sector: int) -> void:
	sector_label.text = "SECTOR %d / 3" % (sector + 1)

func _update_cash(cash: int) -> void:
	cash_label.text = "$%d" % cash

func _update_fuel(fuel: float) -> void:
	fuel_gauge.value = fuel

func update_velocity(speed: float) -> void:
	velocity_gauge.value = clamp(speed / 5.0 * 100.0, 0, 100)
	velocity_label.text = "%.1f u/s" % speed

	# Color based on speed
	if speed > GameConfig.WORLD.danger_speed:
		velocity_gauge.add_theme_stylebox_override("fill", _create_style(Color(0.9, 0.2, 0.2)))
	elif speed > GameConfig.WORLD.caution_speed:
		velocity_gauge.add_theme_stylebox_override("fill", _create_style(Color(0.9, 0.7, 0.2)))
	else:
		velocity_gauge.add_theme_stylebox_override("fill", _create_style(Color(0.2, 0.8, 0.3)))

func update_landing_indicator(can_land: bool, gear_extended: bool) -> void:
	if can_land and gear_extended:
		landing_indicator.text = "✅ READY TO LAND"
		landing_indicator.add_theme_color_override("font_color", Color(0.2, 0.9, 0.3))
	elif gear_extended:
		landing_indicator.text = "🔽 GEAR DOWN"
		landing_indicator.add_theme_color_override("font_color", Color(0.9, 0.7, 0.2))
	else:
		landing_indicator.text = "🔼 GEAR UP"
		landing_indicator.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))

func update_navigation(from_name: String, to_name: String) -> void:
	nav_from.text = "FROM: " + from_name
	nav_to.text = "TO: " + to_name

func show_message(text: String, duration: float = 2.0) -> void:
	center_message.text = text
	center_message.visible = true
	message_timer = duration

func show_passenger_comment(text: String, duration: float = 3.0) -> void:
	passenger_comment.text = "\"" + text + "\""
	passenger_comment.visible = true
	comment_timer = duration

func _create_style(color: Color) -> StyleBoxFlat:
	var style = StyleBoxFlat.new()
	style.bg_color = color
	return style

func set_minimap_visible(visible: bool) -> void:
	$MinimapContainer.visible = visible and not GameState.is_minimap_jammed()

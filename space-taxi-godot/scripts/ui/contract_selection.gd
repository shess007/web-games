extends CanvasLayer
class_name ContractSelection
## Contract selection overlay

signal contract_selected(contract_type: int)

@onready var container: VBoxContainer = $Panel/Container
@onready var title_label: Label = $Panel/Container/Title
@onready var contracts_container: HBoxContainer = $Panel/Container/ContractsContainer
@onready var timer_bar: ProgressBar = $Panel/Container/TimerBar
@onready var timer_label: Label = $Panel/Container/TimerLabel

var available_contracts: Array[int] = []
var auto_select_timer: float = 5.0
var is_active: bool = false

const AUTO_SELECT_TIME = 5.0

func _ready() -> void:
	visible = false

func _process(delta: float) -> void:
	if not is_active:
		return

	auto_select_timer -= delta
	timer_bar.value = (auto_select_timer / AUTO_SELECT_TIME) * 100.0
	timer_label.text = "Auto-select in %.1fs" % auto_select_timer

	if auto_select_timer <= 0:
		# Auto-select first contract
		_select_contract(0)

func show_contracts(is_vip: bool = false) -> void:
	# Clear previous contracts
	for child in contracts_container.get_children():
		child.queue_free()

	# Determine available contracts
	available_contracts.clear()

	if is_vip:
		available_contracts.append(GameConfig.ContractType.VIP)
	else:
		# Random selection of 2-3 contracts
		var all_contracts = [
			GameConfig.ContractType.STANDARD,
			GameConfig.ContractType.EXPRESS,
			GameConfig.ContractType.FRAGILE,
			GameConfig.ContractType.HAZARD
		]
		all_contracts.shuffle()

		# Always include standard
		available_contracts.append(GameConfig.ContractType.STANDARD)

		# Add 1-2 more
		var extra = randi_range(1, 2)
		for i in range(extra):
			if i < all_contracts.size() and all_contracts[i] != GameConfig.ContractType.STANDARD:
				available_contracts.append(all_contracts[i])

	# Create contract buttons
	for i in range(available_contracts.size()):
		var contract_type = available_contracts[i]
		var config = GameConfig.get_contract_config(contract_type)

		var button = _create_contract_button(i, config)
		contracts_container.add_child(button)

	auto_select_timer = AUTO_SELECT_TIME
	is_active = true
	visible = true
	get_tree().paused = true

func _create_contract_button(index: int, config: Dictionary) -> Button:
	var button = Button.new()
	button.custom_minimum_size = Vector2(180, 120)

	var vbox = VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER

	var name_label = Label.new()
	name_label.text = config.name
	name_label.add_theme_color_override("font_color", config.color)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	var payout_label = Label.new()
	payout_label.text = "$%d" % config.payout
	payout_label.add_theme_color_override("font_color", Color(0.2, 0.9, 0.3))
	payout_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	var desc_label = Label.new()
	desc_label.text = config.description
	desc_label.add_theme_font_size_override("font_size", 12)
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD

	var key_label = Label.new()
	key_label.text = "[%d]" % (index + 1)
	key_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	key_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	vbox.add_child(name_label)
	vbox.add_child(payout_label)
	vbox.add_child(desc_label)
	vbox.add_child(key_label)

	button.add_child(vbox)
	button.pressed.connect(_select_contract.bind(index))

	return button

func _input(event: InputEvent) -> void:
	if not is_active:
		return

	if event.is_action_pressed("select_1") and available_contracts.size() >= 1:
		_select_contract(0)
	elif event.is_action_pressed("select_2") and available_contracts.size() >= 2:
		_select_contract(1)
	elif event.is_action_pressed("select_3") and available_contracts.size() >= 3:
		_select_contract(2)

func _select_contract(index: int) -> void:
	if index < 0 or index >= available_contracts.size():
		return

	is_active = false
	visible = false
	get_tree().paused = false

	contract_selected.emit(available_contracts[index])

func hide_selection() -> void:
	is_active = false
	visible = false
	get_tree().paused = false

extends CanvasLayer
class_name RunSummary
## Run summary screen shown at end of game

signal restart_game()
signal quit_to_menu()

@onready var title_label: Label = $Panel/VBox/Title
@onready var stats_container: VBoxContainer = $Panel/VBox/Stats
@onready var score_label: Label = $Panel/VBox/Score
@onready var restart_button: Button = $Panel/VBox/Buttons/RestartButton
@onready var menu_button: Button = $Panel/VBox/Buttons/MenuButton

func _ready() -> void:
	restart_button.pressed.connect(_on_restart)
	menu_button.pressed.connect(_on_menu)
	visible = false

func show_summary(is_victory: bool) -> void:
	if is_victory:
		title_label.text = "SHIFT COMPLETE!"
		title_label.add_theme_color_override("font_color", Color(0.2, 0.9, 0.3))
	else:
		title_label.text = "SHIFT ENDED"
		title_label.add_theme_color_override("font_color", Color(0.9, 0.3, 0.2))

	# Clear previous stats
	for child in stats_container.get_children():
		child.queue_free()

	# Add stats
	_add_stat("Sectors Completed", "%d / 3" % (GameState.current_sector + (1 if is_victory else 0)))
	_add_stat("Passengers Delivered", str(GameState.passengers_delivered))
	_add_stat("Total Earnings", "$%d" % GameState.total_earnings)
	_add_stat("Hull Remaining", "%d / 3" % GameState.hull)
	_add_stat("Hull Bonus", "$%d" % (GameState.hull * GameConfig.SCORING.hull_bonus))

	if not is_victory and GameState.death_reason:
		_add_stat("Cause", GameState.death_reason)

	# Final score
	score_label.text = "FINAL SCORE: $%d" % GameState.get_final_score()

	visible = true

func _add_stat(label: String, value: String) -> void:
	var hbox = HBoxContainer.new()
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER

	var label_node = Label.new()
	label_node.text = label + ":"
	label_node.custom_minimum_size.x = 150

	var value_node = Label.new()
	value_node.text = value
	value_node.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0))

	hbox.add_child(label_node)
	hbox.add_child(value_node)
	stats_container.add_child(hbox)

func _on_restart() -> void:
	visible = false
	restart_game.emit()

func _on_menu() -> void:
	visible = false
	quit_to_menu.emit()

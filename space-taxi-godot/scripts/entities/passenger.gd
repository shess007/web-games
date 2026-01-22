extends Node2D
class_name Passenger
## Passenger entity with walking animation

signal boarding_complete()
signal exiting_complete()

@onready var emoji_label: Label = $EmojiLabel
@onready var name_label: Label = $NameLabel

enum State { WAITING, WALKING_TO_TAXI, IN_TAXI, WALKING_FROM_TAXI, DELIVERED }

var passenger_data: Dictionary = {}
var current_state: State = State.WAITING
var walk_start: Vector2 = Vector2.ZERO
var walk_end: Vector2 = Vector2.ZERO
var walk_progress: float = 0.0
const WALK_SPEED = 2.0  # Progress per second

func _ready() -> void:
	pass

func setup(data: Dictionary) -> void:
	passenger_data = data
	emoji_label.text = data.get("emoji", "🧑")
	name_label.text = data.get("name", "Passenger")

func get_pickup_line() -> String:
	var lines = passenger_data.get("pickup_lines", [])
	if lines.size() > 0:
		return lines[randi() % lines.size()]
	return "Hello!"

func get_dropoff_line() -> String:
	var lines = passenger_data.get("dropoff_lines", [])
	if lines.size() > 0:
		return lines[randi() % lines.size()]
	return "Thanks!"

func start_boarding(from_pos: Vector2, to_pos: Vector2) -> void:
	walk_start = from_pos
	walk_end = to_pos
	walk_progress = 0.0
	current_state = State.WALKING_TO_TAXI
	visible = true

func start_exiting(from_pos: Vector2, to_pos: Vector2) -> void:
	walk_start = from_pos
	walk_end = to_pos
	walk_progress = 0.0
	current_state = State.WALKING_FROM_TAXI
	visible = true

func board_taxi() -> void:
	current_state = State.IN_TAXI
	visible = false

func _process(delta: float) -> void:
	match current_state:
		State.WALKING_TO_TAXI:
			walk_progress += WALK_SPEED * delta
			if walk_progress >= 1.0:
				walk_progress = 1.0
				current_state = State.IN_TAXI
				visible = false
				boarding_complete.emit()
			else:
				global_position = walk_start.lerp(walk_end, walk_progress)

		State.WALKING_FROM_TAXI:
			walk_progress += WALK_SPEED * delta
			if walk_progress >= 1.0:
				walk_progress = 1.0
				current_state = State.DELIVERED
				exiting_complete.emit()
			else:
				global_position = walk_start.lerp(walk_end, walk_progress)

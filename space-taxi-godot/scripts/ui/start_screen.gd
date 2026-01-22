extends CanvasLayer
class_name StartScreen
## Start screen with cinematic intro

signal start_game()

@onready var title_label: Label = $Panel/VBox/Title
@onready var subtitle_label: Label = $Panel/VBox/Subtitle
@onready var start_button: Button = $Panel/VBox/StartButton
@onready var starfield: Control = $Starfield

var stars: Array[Dictionary] = []
const NUM_STARS = 100

func _ready() -> void:
	start_button.pressed.connect(_on_start_pressed)
	_create_starfield()

func _process(delta: float) -> void:
	# Animate starfield
	for star in stars:
		star.position.x -= star.speed * delta
		if star.position.x < 0:
			star.position.x = starfield.size.x
			star.position.y = randf() * starfield.size.y

	starfield.queue_redraw()

func _create_starfield() -> void:
	for i in range(NUM_STARS):
		stars.append({
			"position": Vector2(randf() * 1280, randf() * 720),
			"size": randf_range(1, 3),
			"speed": randf_range(20, 100),
			"brightness": randf_range(0.3, 1.0)
		})

func _draw_starfield() -> void:
	for star in stars:
		var color = Color(1, 1, 1, star.brightness)
		starfield.draw_circle(star.position, star.size, color)

func _on_start_pressed() -> void:
	start_game.emit()
	queue_free()

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("thrust_up") or event.is_action_pressed("toggle_gear"):
		_on_start_pressed()

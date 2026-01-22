extends CanvasLayer
class_name PostProcessing
## Post-processing effects manager for retro-futuristic visual style

var crt_overlay: ColorRect
var speed_lines_overlay: ColorRect

# Shader materials
var crt_material: ShaderMaterial
var speed_lines_material: ShaderMaterial

# Effect settings
var enable_crt: bool = true
var enable_pixelation: bool = false
var enable_scanlines: bool = true
var current_speed: float = 0.0

func _ready() -> void:
	layer = 100  # Render on top of everything

	# Load shaders
	_setup_crt_effect()
	_setup_speed_lines()

func _setup_crt_effect() -> void:
	"""Setup CRT scanline and screen curvature effect"""
	crt_overlay = ColorRect.new()
	crt_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	crt_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	crt_overlay.color = Color(1, 1, 1, 0)  # Transparent base color

	# Load CRT shader
	var crt_shader = load("res://shaders/crt_scanline.gdshader")
	if crt_shader:
		crt_material = ShaderMaterial.new()
		crt_material.shader = crt_shader

		# Configure CRT parameters
		crt_material.set_shader_parameter("scanline_strength", 0.2)
		crt_material.set_shader_parameter("scanline_frequency", 400.0)
		crt_material.set_shader_parameter("curvature_amount", 1.5)
		crt_material.set_shader_parameter("vignette_strength", 0.3)
		crt_material.set_shader_parameter("chromatic_aberration", 0.001)
		crt_material.set_shader_parameter("noise_amount", 0.01)
		crt_material.set_shader_parameter("glow_strength", 0.4)

		crt_overlay.material = crt_material
		add_child(crt_overlay)
		crt_overlay.visible = enable_crt
	else:
		# Don't add overlay if shader fails to load
		crt_overlay.queue_free()
		crt_overlay = null

func _setup_speed_lines() -> void:
	"""Setup dynamic speed lines effect"""
	speed_lines_overlay = ColorRect.new()
	speed_lines_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	speed_lines_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	speed_lines_overlay.color = Color(1, 1, 1, 0)  # Transparent base color

	# Load speed lines shader
	var speed_shader = load("res://shaders/speed_lines.gdshader")
	if speed_shader:
		speed_lines_material = ShaderMaterial.new()
		speed_lines_material.shader = speed_shader

		speed_lines_material.set_shader_parameter("speed_intensity", 0.0)
		speed_lines_material.set_shader_parameter("line_density", 25.0)
		speed_lines_material.set_shader_parameter("line_length", 0.4)
		speed_lines_material.set_shader_parameter("line_color", Color(1.0, 1.0, 1.0, 0.2))

		speed_lines_overlay.material = speed_lines_material
		add_child(speed_lines_overlay)
	else:
		# Don't add overlay if shader fails to load
		speed_lines_overlay.queue_free()
		speed_lines_overlay = null

func _process(delta: float) -> void:
	# Update speed lines based on velocity
	if speed_lines_material:
		speed_lines_material.set_shader_parameter("speed_intensity", current_speed)

func set_speed(speed: float) -> void:
	"""Update speed for speed lines effect"""
	current_speed = clamp(speed, 0.0, 1.0)

func set_chromatic_aberration(amount: float) -> void:
	"""Temporarily increase chromatic aberration (for damage)"""
	if crt_material:
		crt_material.set_shader_parameter("chromatic_aberration", amount)

func toggle_crt(enabled: bool) -> void:
	"""Toggle CRT effect on/off"""
	enable_crt = enabled
	if crt_overlay and is_instance_valid(crt_overlay):
		crt_overlay.visible = enabled

func toggle_scanlines(enabled: bool) -> void:
	"""Toggle scanlines on/off"""
	enable_scanlines = enabled
	if crt_material:
		var strength = 0.2 if enabled else 0.0
		crt_material.set_shader_parameter("scanline_strength", strength)

func set_scanline_intensity(intensity: float) -> void:
	"""Adjust scanline intensity"""
	if crt_material:
		crt_material.set_shader_parameter("scanline_strength", intensity)

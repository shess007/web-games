shader_type canvas_item;

// Neon Glow Effect for UI and Objects
// Creates pulsing neon outlines and glowing effects

uniform vec4 glow_color : source_color = vec4(0.0, 1.0, 1.0, 1.0);
uniform float glow_strength : hint_range(0.0, 5.0) = 2.0;
uniform float pulse_speed : hint_range(0.0, 10.0) = 2.0;
uniform float pulse_amount : hint_range(0.0, 1.0) = 0.3;
uniform float outline_thickness : hint_range(0.0, 10.0) = 3.0;
uniform bool enable_pulse = true;

void fragment() {
    vec4 color = texture(TEXTURE, UV);

    // Calculate outline by sampling around current pixel
    float outline = 0.0;
    vec2 pixel_size = TEXTURE_PIXEL_SIZE * outline_thickness;

    for (float x = -1.0; x <= 1.0; x += 1.0) {
        for (float y = -1.0; y <= 1.0; y += 1.0) {
            vec2 offset = vec2(x, y) * pixel_size;
            outline += texture(TEXTURE, UV + offset).a;
        }
    }

    outline = clamp(outline, 0.0, 1.0);
    outline = smoothstep(0.0, 0.5, outline) - color.a;

    // Pulse effect
    float pulse = 1.0;
    if (enable_pulse) {
        pulse = 1.0 + sin(TIME * pulse_speed) * pulse_amount;
    }

    // Add glow to object
    vec3 glow = glow_color.rgb * glow_strength * pulse;

    // Combine original color with glow
    COLOR.rgb = color.rgb + glow * color.a;
    COLOR.rgb += glow_color.rgb * outline * glow_strength * pulse;
    COLOR.a = max(color.a, outline);
}

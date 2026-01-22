shader_type canvas_item;

// Speed Lines Effect
// Dynamic motion lines based on velocity

uniform vec2 velocity_direction = vec2(1.0, 0.0);
uniform float speed_intensity : hint_range(0.0, 1.0) = 0.0;
uniform vec4 line_color : source_color = vec4(1.0, 1.0, 1.0, 0.3);
uniform float line_density : hint_range(0.0, 100.0) = 20.0;
uniform float line_length : hint_range(0.0, 1.0) = 0.3;

float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void fragment() {
    vec4 original = texture(TEXTURE, UV);

    if (speed_intensity < 0.01) {
        COLOR = original;
        return;
    }

    // Create radial lines from center
    vec2 center = vec2(0.5, 0.5);
    vec2 dir = UV - center;
    float angle = atan(dir.y, dir.x);
    float dist = length(dir);

    // Create line pattern
    float line_pattern = fract(angle * line_density + TIME * 2.0);
    line_pattern = smoothstep(0.4, 0.6, line_pattern);

    // Fade lines based on distance from center
    float fade = smoothstep(0.0, line_length, dist) * smoothstep(1.0, line_length, dist);

    // Apply speed lines
    vec3 speed_lines = line_color.rgb * line_pattern * fade * speed_intensity;

    COLOR.rgb = original.rgb + speed_lines;
    COLOR.a = original.a;
}

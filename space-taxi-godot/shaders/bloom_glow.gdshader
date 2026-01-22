shader_type canvas_item;

// Bloom/Glow Post-Process Effect
// Makes bright areas glow and bleed light

uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_linear_mipmap;
uniform float bloom_threshold : hint_range(0.0, 1.0) = 0.6;
uniform float bloom_intensity : hint_range(0.0, 3.0) = 1.5;
uniform float blur_size : hint_range(0.0, 10.0) = 3.0;

// Simple blur using multiple samples
vec4 blur(sampler2D tex, vec2 uv, vec2 pixel_size, float size) {
    vec4 result = vec4(0.0);
    float total_weight = 0.0;

    for (float x = -2.0; x <= 2.0; x += 1.0) {
        for (float y = -2.0; y <= 2.0; y += 1.0) {
            vec2 offset = vec2(x, y) * pixel_size * size;
            float weight = 1.0 / (1.0 + length(vec2(x, y)));
            result += texture(tex, uv + offset) * weight;
            total_weight += weight;
        }
    }

    return result / total_weight;
}

void fragment() {
    vec4 original = texture(TEXTURE, UV);

    // Extract bright areas
    float brightness = dot(original.rgb, vec3(0.299, 0.587, 0.114));
    vec4 bright = vec4(0.0);

    if (brightness > bloom_threshold) {
        bright = original * (brightness - bloom_threshold) / (1.0 - bloom_threshold);
    }

    // Blur bright areas
    vec4 blurred = blur(TEXTURE, UV, TEXTURE_PIXEL_SIZE, blur_size);
    blurred *= bloom_intensity;

    // Combine with original
    COLOR = original + blurred * bright.a;
    COLOR.a = original.a;
}

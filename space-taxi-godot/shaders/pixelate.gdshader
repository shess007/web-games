shader_type canvas_item;

// Pixel Art Style Shader
// Creates chunky pixels for retro aesthetic

uniform int pixel_size : hint_range(1, 16) = 4;
uniform bool dither_enabled = true;
uniform int color_depth : hint_range(2, 8) = 5;

// Bayer dithering matrix
float bayer2(vec2 pos) {
    mat2 bayer = mat2(
        vec2(0.0, 2.0),
        vec2(3.0, 1.0)
    );
    vec2 p = floor(mod(pos, 2.0));
    return bayer[int(p.x)][int(p.y)] / 4.0;
}

void fragment() {
    // Pixelate coordinates
    vec2 size = vec2(pixel_size) * TEXTURE_PIXEL_SIZE;
    vec2 pixelated_uv = floor(UV / size) * size + size * 0.5;

    vec4 color = texture(TEXTURE, pixelated_uv);

    // Reduce color depth for retro look
    float depth_scale = float(1 << color_depth);
    color.rgb = floor(color.rgb * depth_scale) / depth_scale;

    // Apply dithering
    if (dither_enabled) {
        float dither = bayer2(FRAGCOORD.xy) - 0.5;
        color.rgb += dither / depth_scale;
    }

    COLOR = color;
}

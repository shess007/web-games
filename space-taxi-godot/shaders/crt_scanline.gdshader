shader_type canvas_item;

// CRT Scanline and Screen Curvature Effect
// Perfect for retro-futuristic aesthetic

uniform float scanline_strength : hint_range(0.0, 1.0) = 0.3;
uniform float scanline_frequency : hint_range(0.0, 1000.0) = 500.0;
uniform float curvature_amount : hint_range(0.0, 10.0) = 2.0;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.4;
uniform float chromatic_aberration : hint_range(0.0, 0.01) = 0.002;
uniform float noise_amount : hint_range(0.0, 0.1) = 0.02;
uniform float glow_strength : hint_range(0.0, 2.0) = 0.3;

// Screen distortion for CRT effect
vec2 curve_screen(vec2 uv) {
    vec2 offset = uv * 2.0 - 1.0;
    offset *= offset * offset * curvature_amount * 0.01;
    return uv + offset * (uv - 0.5);
}

// Random noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void fragment() {
    vec2 curved_uv = curve_screen(UV);

    // Check if UV is out of bounds after curve
    if (curved_uv.x < 0.0 || curved_uv.x > 1.0 || curved_uv.y < 0.0 || curved_uv.y > 1.0) {
        COLOR = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic aberration (RGB split)
    float r = texture(TEXTURE, curved_uv + vec2(chromatic_aberration, 0.0)).r;
    float g = texture(TEXTURE, curved_uv).g;
    float b = texture(TEXTURE, curved_uv - vec2(chromatic_aberration, 0.0)).b;
    vec4 color = vec4(r, g, b, 1.0);

    // Scanlines
    float scanline = sin(curved_uv.y * scanline_frequency) * 0.5 + 0.5;
    scanline = mix(1.0, scanline, scanline_strength);

    // Vignette effect
    vec2 center_dist = curved_uv - vec2(0.5);
    float vignette = 1.0 - length(center_dist) * vignette_strength * 1.5;
    vignette = clamp(vignette, 0.0, 1.0);

    // Add subtle noise for analog feel
    float noise = random(curved_uv + TIME * 0.1) * noise_amount;

    // Add glow to bright areas
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 glow = color.rgb * brightness * glow_strength;

    // Combine effects
    COLOR.rgb = color.rgb * scanline * vignette + noise + glow;
    COLOR.a = 1.0;
}

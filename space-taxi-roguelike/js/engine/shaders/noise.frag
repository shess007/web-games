precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uIntensity;
uniform float uTime;

// Simple pseudo-random function
float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);

    // Generate noise based on position and time
    float noise = random(vTextureCoord + uTime) * 2.0 - 1.0;

    // Apply noise
    color.rgb += noise * uIntensity;

    gl_FragColor = color;
}

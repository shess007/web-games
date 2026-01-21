precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uIntensity;
uniform float uRadius;

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);

    // Calculate distance from center
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vTextureCoord, center);

    // Create vignette falloff
    float vignette = smoothstep(uRadius, uRadius - 0.3, dist);
    vignette = mix(1.0 - uIntensity, 1.0, vignette);

    color.rgb *= vignette;

    gl_FragColor = color;
}

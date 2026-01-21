precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uBloomIntensity;
uniform float uBloomThreshold;

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);

    // Calculate brightness
    float brightness = (color.r + color.g + color.b) / 3.0;

    // Apply threshold - only bloom bright pixels
    if (brightness > uBloomThreshold) {
        // Boost bright areas
        vec3 bloom = color.rgb * (brightness - uBloomThreshold) * uBloomIntensity;
        color.rgb += bloom;
    }

    gl_FragColor = color;
}

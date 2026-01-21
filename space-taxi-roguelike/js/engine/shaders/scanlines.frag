precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uIntensity;
uniform float uCount;
uniform vec2 uDimensions;
uniform float uTime;

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);

    // Calculate scanline position
    float y = vTextureCoord.y * uDimensions.y;
    float lineHeight = uDimensions.y / uCount;

    // Create scanline pattern
    float scanline = mod(y, lineHeight * 2.0);
    float darkLine = step(lineHeight, scanline);

    // Apply scanline darkening
    float darkness = 1.0 - (uIntensity * darkLine);

    // Add subtle phosphor glow on bright lines
    float brightLine = 1.0 - darkLine;
    float phosphor = brightLine * uIntensity * 0.1;

    color.rgb = color.rgb * darkness + phosphor;

    gl_FragColor = color;
}

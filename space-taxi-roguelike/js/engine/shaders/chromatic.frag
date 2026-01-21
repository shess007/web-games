precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uAmount;
uniform vec2 uDimensions;

void main(void) {
    vec2 offset = vec2(uAmount / uDimensions.x, 0.0);

    // Sample each color channel with offset
    float r = texture2D(uSampler, vTextureCoord - offset).r;
    float g = texture2D(uSampler, vTextureCoord).g;
    float b = texture2D(uSampler, vTextureCoord + offset).b;
    float a = texture2D(uSampler, vTextureCoord).a;

    gl_FragColor = vec4(r, g, b, a);
}

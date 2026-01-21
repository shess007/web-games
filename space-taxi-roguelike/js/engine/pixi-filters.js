/**
 * PixiJS v7 Custom Filters for Space Taxi Roguelike
 * CRT-style post-processing effects
 */

// Vertex shader shared by all filters (v7 style)
const defaultVertexShader = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat3 projectionMatrix;
    varying vec2 vTextureCoord;

    void main(void) {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
    }
`;

// ==================== VIGNETTE FILTER ====================

const vignetteFragmentShader = `
    precision mediump float;

    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float uIntensity;
    uniform float uRadius;

    void main(void) {
        vec4 color = texture2D(uSampler, vTextureCoord);
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vTextureCoord, center);
        float vignette = smoothstep(uRadius, uRadius - 0.3, dist);
        vignette = mix(1.0 - uIntensity, 1.0, vignette);
        color.rgb *= vignette;
        gl_FragColor = color;
    }
`;

class VignetteFilter extends PIXI.Filter {
    constructor(intensity = 0.4, radius = 0.85) {
        super(defaultVertexShader, vignetteFragmentShader);
        this.uniforms.uIntensity = intensity;
        this.uniforms.uRadius = radius;
    }

    get intensity() { return this.uniforms.uIntensity; }
    set intensity(value) { this.uniforms.uIntensity = value; }

    get radius() { return this.uniforms.uRadius; }
    set radius(value) { this.uniforms.uRadius = value; }
}

// ==================== POST-PROCESSING MANAGER ====================

class PostProcessingManager {
    constructor() {
        this.enabled = true;
        this.filters = {};

        // Try to create filters
        try {
            this.filters.vignette = new VignetteFilter(0.4, 0.85);
            console.log('[PostProcessingManager] Vignette filter created');
        } catch (e) {
            console.warn('[PostProcessingManager] Failed to create vignette filter:', e);
        }

        // Default enabled state for each filter
        this.filterEnabled = {
            vignette: false
        };

        this.time = 0;
    }

    getActiveFilters() {
        if (!this.enabled) return [];

        const active = [];
        if (this.filterEnabled.vignette && this.filters.vignette) {
            active.push(this.filters.vignette);
        }
        return active;
    }

    update(deltaTime = 0.016) {
        this.time += deltaTime;
    }

    enable(filterName) {
        if (this.filterEnabled.hasOwnProperty(filterName)) {
            this.filterEnabled[filterName] = true;
        }
    }

    disable(filterName) {
        if (this.filterEnabled.hasOwnProperty(filterName)) {
            this.filterEnabled[filterName] = false;
        }
    }

    toggle(filterName) {
        if (this.filterEnabled.hasOwnProperty(filterName)) {
            this.filterEnabled[filterName] = !this.filterEnabled[filterName];
            return this.filterEnabled[filterName];
        }
        return false;
    }

    setAll(enabled) {
        Object.keys(this.filterEnabled).forEach(key => {
            this.filterEnabled[key] = enabled;
        });
    }

    applyPreset(presetName) {
        switch (presetName) {
            case 'none':
                this.setAll(false);
                break;

            case 'subtle':
                this.setAll(false);
                if (this.filters.vignette) {
                    this.enable('vignette');
                    this.filters.vignette.intensity = 0.3;
                }
                break;

            case 'retro':
            case 'crt':
            case 'full':
                this.setAll(false);
                if (this.filters.vignette) {
                    this.enable('vignette');
                    this.filters.vignette.intensity = 0.4;
                }
                break;

            default:
                console.warn(`Unknown preset: ${presetName}`);
        }
    }
}

// Export
window.VignetteFilter = VignetteFilter;
window.PostProcessingManager = PostProcessingManager;

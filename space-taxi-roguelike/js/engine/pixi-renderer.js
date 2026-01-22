/**
 * PixiJS Renderer - GPU-accelerated rendering for Space Taxi Roguelike
 * Replaces the Canvas 2D renderer with WebGL-powered rendering
 *
 * This is the core module. Additional functionality is provided by mixins:
 * - PixiBackgroundMixin: Star field, nebulas, galaxies, cosmic dust
 * - PixiBuildingsMixin: Platform and building rendering
 * - PixiGameObjectsMixin: Asteroids, debris, meteors, enemies, passengers
 * - PixiParticlesMixin: Particles, trails, speed lines
 * - PixiTaxiMixin: Taxi rendering and animation
 * - PixiMinimapMixin: Minimap rendering (Canvas 2D)
 */
class PixiRenderer {
    constructor(canvas) {
        this.originalCanvas = canvas;
        this.app = null;
        this.initialized = false;
        this.time = 0;

        // Anime style toggle
        this.animeStyleEnabled = true;

        // Container hierarchy (set up in init)
        this.containers = {};

        // Background elements
        this.stars = [];
        this.starSprites = [];
        this.nebulaGradients = [];
        this.nebulaSprites = [];
        this.galaxyClusters = [];
        this.galaxyGraphics = [];
        this.cosmicDust = [];
        this.dustSprites = [];
        this.backgroundGradientSprite = null;

        // Game element sprites
        this.platformSprites = new Map();
        this.buildingSprites = new Map();
        this.currentSectorIndex = null; // Track level changes for cleanup
        this.asteroidSprites = new Map();
        this.debrisSprites = new Map();
        this.meteorSprites = new Map();
        this.enemySprites = new Map();
        this.passengerSprite = null;
        this.walkingPassengerContainer = null;

        // Taxi
        this.taxiContainer = null;
        this.taxiSprites = {};
        this.gearAnimProgress = 1.0; // 0 = retracted, 1 = extended

        // Particles
        this.particleSprites = [];
        this.particleTrails = [];
        this.trailSprites = [];

        // Speed lines
        this.speedLines = [];
        this.speedLineGraphics = null;

        // Effects
        this.screenFlash = null;
        this.flashIntensity = 0;
        this.flashColor = 0xffffff;

        // Minimap (still Canvas 2D)
        this.minimapCanvas = null;
        this.minimapCtx = null;

        // Textures cache
        this.textures = {};

        // Current theme
        this.currentTheme = null;

        // Post-processing manager
        this.postFX = null;

        // Camera state
        this.lastCameraX = 0;
        this.lastCameraY = 0;

        // Promise that resolves when initialized
        this.ready = this.init();
    }

    async init() {
        try {
            // Create PixiJS application (v7 API - constructor-based)
            this.app = new PIXI.Application({
                view: this.originalCanvas,
                width: WORLD_W,
                height: WORLD_H,
                backgroundColor: 0xFDEBD0, // Soft blush (cozy)
                antialias: false,
                resolution: 1,
                powerPreference: 'high-performance'
            });

            // Set up container hierarchy
            this.setupContainers();

            // Initialize anime FX system
            if (typeof PixiAnimeFXMixin !== 'undefined') {
                this.initAnimeFX();
            }

            // Generate reusable textures
            this.generateTextures();

            // Set up filters
            this.setupFilters();

            // Create screen flash overlay
            this.setupScreenFlash();

            this.initialized = true;
            console.log('[PixiRenderer] Initialized successfully (WebGL)');

            return true;
        } catch (error) {
            console.error('[PixiRenderer] Failed to initialize:', error);
            this.initialized = false;
            return false;
        }
    }

    // Wait for renderer to be ready
    async waitForReady() {
        return this.ready;
    }

    setupContainers() {
        // Create main container hierarchy as specified in the plan:
        // stage
        // ├── backgroundContainer (parallax 0.02)
        // ├── parallaxLayer1 (0.05-0.15 - dust/nebulas)
        // ├── parallaxLayer2 (0.2-1.0 - stars)
        // ├── gameContainer (1.0 - world space)
        // │   ├── asteroidsContainer
        // │   ├── debrisContainer
        // │   ├── meteorsContainer
        // │   ├── platformsContainer
        // │   ├── enemiesContainer
        // │   ├── passengerContainer
        // │   ├── particleContainer
        // │   └── taxiContainer
        // └── uiContainer (screen space)

        this.containers = {
            // Fixed background (screen space, never moves - for gradient overlay)
            fixedBackground: new PIXI.Container(),

            // Background layers with different parallax speeds
            background: new PIXI.Container(),
            parallaxLayer1: new PIXI.Container(), // Dust, nebulas (0.05-0.15)
            parallaxLayer2: new PIXI.Container(), // Stars (0.2-1.0)

            // Main game container (world space, moves with camera)
            game: new PIXI.Container(),

            // UI container (screen space, doesn't move)
            ui: new PIXI.Container()
        };

        // Add to stage in order (back to front)
        this.app.stage.addChild(this.containers.fixedBackground); // Fixed gradient (never moves)
        this.app.stage.addChild(this.containers.background);
        this.app.stage.addChild(this.containers.parallaxLayer1);
        this.app.stage.addChild(this.containers.parallaxLayer2);
        this.app.stage.addChild(this.containers.game);

        // Anime FX container (between game and ui for manga effects)
        this.containers.animeFX = new PIXI.Container();
        this.app.stage.addChild(this.containers.animeFX);

        this.app.stage.addChild(this.containers.ui);

        // Create game sub-containers
        this.containers.asteroids = new PIXI.Container();
        this.containers.debris = new PIXI.Container();
        this.containers.meteors = new PIXI.Container();
        this.containers.buildings = new PIXI.Container();
        this.containers.platforms = new PIXI.Container();
        this.containers.enemies = new PIXI.Container();
        this.containers.passenger = new PIXI.Container();
        this.containers.particles = new PIXI.Container();
        this.containers.taxi = new PIXI.Container();

        // Add game sub-containers in z-order
        this.containers.game.addChild(this.containers.asteroids);
        this.containers.game.addChild(this.containers.debris);
        this.containers.game.addChild(this.containers.meteors);
        this.containers.game.addChild(this.containers.buildings);
        this.containers.game.addChild(this.containers.platforms);
        this.containers.game.addChild(this.containers.enemies);
        this.containers.game.addChild(this.containers.passenger);
        this.containers.game.addChild(this.containers.particles);
        this.containers.game.addChild(this.containers.taxi);

        // Speed line graphics (in game container, drawn over everything)
        this.speedLineGraphics = new PIXI.Graphics();
        this.containers.game.addChild(this.speedLineGraphics);
    }

    generateTextures() {
        // Generate reusable textures for various game elements
        const renderer = this.app.renderer;

        // Particle textures (cozy colors)
        this.textures.particleYellow = this.createGlowTexture(16, 0xF9E79F, 0.7); // Butter yellow (cozy)
        this.textures.particleCyan = this.createGlowTexture(16, 0xE2D1F9, 0.7); // Lavender (cozy)
        this.textures.particleOrange = this.createGlowTexture(20, 0xF5B041, 0.7); // Warm orange (cozy)
        this.textures.particleWhite = this.createGlowTexture(20, 0xFFCDB2, 0.7); // Soft peach (cozy)

        // Trail textures (smaller, cozy colors)
        this.textures.trailYellow = this.createGlowTexture(8, 0xF9E79F, 0.5); // Butter yellow (cozy)
        this.textures.trailCyan = this.createGlowTexture(8, 0xE2D1F9, 0.5); // Lavender (cozy)
        this.textures.trailOrange = this.createGlowTexture(8, 0xF5B041, 0.5); // Warm orange (cozy)

        // Star textures (cozy pastel)
        this.textures.starSmall = this.createStarTexture(4, 0xF9E79F); // Butter yellow (cozy)
        this.textures.starMedium = this.createStarTexture(8, 0xFFCDB2); // Soft peach (cozy)
        this.textures.starLarge = this.createStarTexture(16, 0xE2D1F9); // Lavender (cozy)

        // Dust particle texture (cozy)
        this.textures.dust = this.createGlowTexture(8, 0xE2D1F9, 0.3); // Lavender (cozy)

        // Platform glow texture (cozy)
        this.textures.platformGlow = this.createGlowTexture(64, 0xB8E0D2, 0.4); // Soft mint (cozy)

        // Enemy glow texture (cozy)
        this.textures.enemyGlow = this.createGlowTexture(64, 0xF5B041, 0.5); // Warm orange (cozy)

        // Meteor glow texture (cozy)
        this.textures.meteorGlow = this.createGlowTexture(32, 0xF5B7B1, 0.6); // Soft coral (cozy)

        // Background gradient texture (matching start screen)
        this.textures.backgroundGradient = this.createBackgroundGradientTexture();
    }

    createBackgroundGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = WORLD_W;
        canvas.height = WORLD_H;
        const ctx = canvas.getContext('2d');

        // Main vertical gradient (like start screen: black -> dark blue -> slight purple)
        const mainGradient = ctx.createLinearGradient(0, 0, 0, WORLD_H);
        mainGradient.addColorStop(0, '#000000');
        mainGradient.addColorStop(0.4, '#050510');
        mainGradient.addColorStop(1, '#0a0a20');
        ctx.fillStyle = mainGradient;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // Add nebula-like radial glows (matching start screen)
        // Purple glow bottom-left
        const glow1 = ctx.createRadialGradient(
            WORLD_W * 0.2, WORLD_H * 0.8, 0,
            WORLD_W * 0.2, WORLD_H * 0.8, WORLD_H * 0.5
        );
        glow1.addColorStop(0, 'rgba(138, 43, 226, 0.15)');
        glow1.addColorStop(0.5, 'rgba(138, 43, 226, 0.05)');
        glow1.addColorStop(1, 'transparent');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // Cyan glow top-right
        const glow2 = ctx.createRadialGradient(
            WORLD_W * 0.8, WORLD_H * 0.2, 0,
            WORLD_W * 0.8, WORLD_H * 0.2, WORLD_H * 0.4
        );
        glow2.addColorStop(0, 'rgba(0, 210, 255, 0.1)');
        glow2.addColorStop(0.5, 'rgba(0, 210, 255, 0.03)');
        glow2.addColorStop(1, 'transparent');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // Red subtle glow center
        const glow3 = ctx.createRadialGradient(
            WORLD_W * 0.5, WORLD_H * 0.5, 0,
            WORLD_W * 0.5, WORLD_H * 0.5, WORLD_H * 0.4
        );
        glow3.addColorStop(0, 'rgba(255, 62, 62, 0.05)');
        glow3.addColorStop(0.4, 'rgba(255, 62, 62, 0.02)');
        glow3.addColorStop(1, 'transparent');
        ctx.fillStyle = glow3;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        return PIXI.Texture.from(canvas);
    }

    createGlowTexture(size, color, intensity) {
        const graphics = new PIXI.Graphics();
        const halfSize = size / 2;

        // Draw radial gradient using circles with smooth exponential falloff (v7 API)
        const steps = 25;
        for (let i = steps; i >= 1; i--) {
            const ratio = i / steps;
            const smoothRatio = Math.pow(ratio, 0.7);
            const alpha = intensity * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            graphics.beginFill(color, alpha);
            graphics.drawCircle(halfSize, halfSize, halfSize * smoothRatio);
            graphics.endFill();
        }

        // Bright core with gradient
        for (let i = 5; i >= 1; i--) {
            const ratio = i / 5;
            const alpha = intensity * (1 - ratio * 0.5);
            graphics.beginFill(0xffffff, alpha * 0.5);
            graphics.drawCircle(halfSize, halfSize, halfSize * 0.25 * ratio);
            graphics.endFill();
        }

        return this.app.renderer.generateTexture(graphics);
    }

    createStarTexture(size, color) {
        const graphics = new PIXI.Graphics();
        const halfSize = size / 2;

        // Check if anime style sparkles are enabled
        const useSparkle = typeof AnimeStyleConfig !== 'undefined' &&
                          AnimeStyleConfig.enabled &&
                          AnimeStyleConfig.background.sparkleStars;

        if (useSparkle) {
            // === RADICAL ANIME: 8-point sparkle star ===
            const armLength = halfSize * 1.1;
            const armWidth = halfSize * 0.15;
            const diagLength = halfSize * 0.7;
            const diagWidth = halfSize * 0.1;

            // Outer glow
            graphics.beginFill(color, 0.25);
            graphics.drawCircle(halfSize, halfSize, halfSize * 0.9);
            graphics.endFill();

            // Main vertical arm (longest)
            graphics.beginFill(color, 0.85);
            graphics.moveTo(halfSize, halfSize - armLength);
            graphics.lineTo(halfSize + armWidth, halfSize);
            graphics.lineTo(halfSize, halfSize + armLength);
            graphics.lineTo(halfSize - armWidth, halfSize);
            graphics.closePath();
            graphics.endFill();

            // Main horizontal arm
            graphics.beginFill(color, 0.85);
            graphics.moveTo(halfSize - armLength * 0.9, halfSize);
            graphics.lineTo(halfSize, halfSize + armWidth);
            graphics.lineTo(halfSize + armLength * 0.9, halfSize);
            graphics.lineTo(halfSize, halfSize - armWidth);
            graphics.closePath();
            graphics.endFill();

            // Diagonal arms (4 of them, shorter)
            const diagonals = [
                { angle: Math.PI / 4 },
                { angle: 3 * Math.PI / 4 },
                { angle: 5 * Math.PI / 4 },
                { angle: 7 * Math.PI / 4 }
            ];

            graphics.beginFill(color, 0.6);
            for (const diag of diagonals) {
                const cos = Math.cos(diag.angle);
                const sin = Math.sin(diag.angle);
                const perpCos = Math.cos(diag.angle + Math.PI / 2);
                const perpSin = Math.sin(diag.angle + Math.PI / 2);

                graphics.moveTo(halfSize + cos * diagLength, halfSize + sin * diagLength);
                graphics.lineTo(halfSize + perpCos * diagWidth, halfSize + perpSin * diagWidth);
                graphics.lineTo(halfSize - cos * diagLength * 0.3, halfSize - sin * diagLength * 0.3);
                graphics.lineTo(halfSize - perpCos * diagWidth, halfSize - perpSin * diagWidth);
                graphics.closePath();
            }
            graphics.endFill();

            // Bright center core
            graphics.beginFill(0xffffff, 1.0);
            graphics.drawCircle(halfSize, halfSize, size * 0.12);
            graphics.endFill();

            // Extra bright center point
            graphics.beginFill(0xffffff, 0.9);
            graphics.drawCircle(halfSize, halfSize, size * 0.06);
            graphics.endFill();
        } else {
            // Original: Smooth glow (v7 API)
            const steps = 15;
            for (let i = steps; i >= 1; i--) {
                const ratio = i / steps;
                const smoothRatio = Math.pow(ratio, 0.6);
                const alpha = 0.4 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
                if (alpha < 0.001) continue;
                graphics.beginFill(color, alpha);
                graphics.drawCircle(halfSize, halfSize, halfSize * smoothRatio);
                graphics.endFill();
            }

            // Core with bright center
            graphics.beginFill(0xffffff, 0.9);
            graphics.drawCircle(halfSize, halfSize, size * 0.12);
            graphics.endFill();
        }

        return this.app.renderer.generateTexture(graphics);
    }

    setupFilters() {
        // Set up post-processing filters using PostProcessingManager
        try {
            if (typeof PostProcessingManager !== 'undefined') {
                this.postFX = new PostProcessingManager();

                // Apply a subtle default preset (disable by default for now)
                this.postFX.applyPreset('none');

                // Apply filters to the stage
                this.updateStageFilters();

                console.log('[PixiRenderer] Post-processing filters initialized');
            }
        } catch (error) {
            console.warn('[PixiRenderer] Failed to initialize filters:', error);
            this.postFX = null;
        }
    }

    updateStageFilters() {
        if (this.postFX && this.app) {
            this.app.stage.filters = this.postFX.getActiveFilters();
        }
    }

    enableFilter(filterName) {
        if (this.postFX) {
            this.postFX.enable(filterName);
            this.updateStageFilters();
        }
    }

    disableFilter(filterName) {
        if (this.postFX) {
            this.postFX.disable(filterName);
            this.updateStageFilters();
        }
    }

    toggleFilter(filterName) {
        if (this.postFX) {
            const enabled = this.postFX.toggle(filterName);
            this.updateStageFilters();
            return enabled;
        }
        return false;
    }

    setFilterPreset(presetName) {
        if (this.postFX) {
            this.postFX.applyPreset(presetName);
            this.updateStageFilters();
        }
    }

    setupScreenFlash() {
        // Screen flash overlay (v7 API)
        this.screenFlash = new PIXI.Graphics();
        this.screenFlash.beginFill(0xffffff, 0);
        this.screenFlash.drawRect(0, 0, WORLD_W, WORLD_H);
        this.screenFlash.endFill();
        this.screenFlash.blendMode = PIXI.BLEND_MODES.ADD;
        this.containers.ui.addChild(this.screenFlash);
    }

    // ==================== UTILITY METHODS ====================

    parseHexColor(hex) {
        if (!hex) return 0xffffff;
        if (typeof hex === 'number') return hex;
        if (hex.startsWith('#')) hex = hex.slice(1);
        return parseInt(hex, 16);
    }

    lerpColor(color1, color2, t) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;

        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) | (g << 8) | b;
    }

    // ==================== MAIN DRAW LOOP ====================

    draw(state) {
        if (!this.initialized || !state.level) return;

        this.time += 0.016;

        // Update post-processing filters
        if (this.postFX) {
            this.postFX.update(0.016);
        }

        // Store theme
        this.currentTheme = state.level.theme || null;

        // Apply screen shake
        this.applyScreenShake(state.shake);

        // Update camera (move game container)
        this.updateCamera(state.camera);

        // Update background layers with parallax
        this.updateBackground(state.camera, state.level);

        // Update game elements
        this.updateBuildings(state);
        this.updatePlatforms(state);
        this.updateAsteroids(state.level.asteroids);
        this.updateDebris(state.level.debris);
        this.updateMeteors(state.level.meteors);
        this.updateEnemies(state.level.enemies);
        this.updatePassenger(state.activePassenger);
        this.updateParticles(state.particles);
        this.updateSpeedLines(state);
        this.updateTaxi(state.taxi, state.keys);

        // Update screen flash
        this.updateScreenFlash();

        // Update anime FX (speed lines, impact frames, etc.)
        if (this.animeStyleEnabled && typeof this.updateAnimeFX === 'function') {
            this.updateAnimeFX(state, 0.016);
        }

        // Update particle trails
        this.updateParticleTrails(state.particles);

        // Draw minimap (still Canvas 2D)
        if (this.minimapCtx) {
            this.drawMinimap(state);
        }
    }

    applyScreenShake(shake) {
        if (shake > 0) {
            this.app.stage.x = (Math.random() - 0.5) * shake;
            this.app.stage.y = (Math.random() - 0.5) * shake;
        } else {
            this.app.stage.x = 0;
            this.app.stage.y = 0;
        }
    }

    updateCamera(camera) {
        // Move game container to simulate camera
        this.containers.game.x = -camera.x;
        this.containers.game.y = -camera.y;

        this.lastCameraX = camera.x;
        this.lastCameraY = camera.y;
    }

    // ==================== EFFECTS ====================

    flash(color = '#ffffff', intensity = 0.5) {
        this.flashIntensity = intensity;
        this.flashColor = this.parseHexColor(color);
    }

    updateScreenFlash() {
        if (this.flashIntensity > 0) {
            // v7 API
            this.screenFlash.clear();
            this.screenFlash.beginFill(this.flashColor, this.flashIntensity);
            this.screenFlash.drawRect(0, 0, WORLD_W, WORLD_H);
            this.screenFlash.endFill();

            this.flashIntensity *= 0.85;
            if (this.flashIntensity < 0.01) {
                this.flashIntensity = 0;
            }
        }
    }
}

// Apply mixins to PixiRenderer prototype
// These add methods from the separate module files
if (typeof PixiBackgroundMixin !== 'undefined') {
    Object.assign(PixiRenderer.prototype, PixiBackgroundMixin);
}
if (typeof PixiBuildingsMixin !== 'undefined') {
    Object.assign(PixiRenderer.prototype, PixiBuildingsMixin);
}
if (typeof PixiGameObjectsMixin !== 'undefined') {
    Object.assign(PixiRenderer.prototype, PixiGameObjectsMixin);
}
if (typeof PixiParticlesMixin !== 'undefined') {
    Object.assign(PixiRenderer.prototype, PixiParticlesMixin);
}
if (typeof PixiTaxiMixin !== 'undefined') {
    Object.assign(PixiRenderer.prototype, PixiTaxiMixin);
}
if (typeof PixiMinimapMixin !== 'undefined') {
    Object.assign(PixiRenderer.prototype, PixiMinimapMixin);
}
if (typeof PixiAnimeFXMixin !== 'undefined') {
    Object.assign(PixiRenderer.prototype, PixiAnimeFXMixin);
}

// Export for use
window.PixiRenderer = PixiRenderer;

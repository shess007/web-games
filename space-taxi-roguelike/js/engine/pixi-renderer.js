/**
 * PixiJS Renderer - GPU-accelerated rendering for Space Taxi Roguelike
 * Replaces the Canvas 2D renderer with WebGL-powered rendering
 */
class PixiRenderer {
    constructor(canvas) {
        this.originalCanvas = canvas;
        this.app = null;
        this.initialized = false;
        this.time = 0;

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
                backgroundColor: 0x050510,
                antialias: false,
                resolution: 1,
                powerPreference: 'high-performance'
            });

            // Set up container hierarchy
            this.setupContainers();

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
        this.app.stage.addChild(this.containers.background);
        this.app.stage.addChild(this.containers.parallaxLayer1);
        this.app.stage.addChild(this.containers.parallaxLayer2);
        this.app.stage.addChild(this.containers.game);
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

        // Particle textures
        this.textures.particleYellow = this.createGlowTexture(16, 0xffff55, 0.8);
        this.textures.particleCyan = this.createGlowTexture(16, 0x00ffff, 0.8);
        this.textures.particleOrange = this.createGlowTexture(20, 0xff5500, 0.9);
        this.textures.particleWhite = this.createGlowTexture(20, 0xffffff, 0.9);

        // Trail textures (smaller)
        this.textures.trailYellow = this.createGlowTexture(8, 0xffff55, 0.5);
        this.textures.trailCyan = this.createGlowTexture(8, 0x00ffff, 0.5);
        this.textures.trailOrange = this.createGlowTexture(8, 0xff5500, 0.5);

        // Star textures
        this.textures.starSmall = this.createStarTexture(4, 0xffffff);
        this.textures.starMedium = this.createStarTexture(8, 0xffffff);
        this.textures.starLarge = this.createStarTexture(16, 0xffffff);

        // Dust particle texture
        this.textures.dust = this.createGlowTexture(8, 0xaaaadd, 0.3);

        // Platform glow texture
        this.textures.platformGlow = this.createGlowTexture(64, 0x00ff41, 0.5);

        // Enemy glow texture
        this.textures.enemyGlow = this.createGlowTexture(64, 0xff0000, 0.6);

        // Meteor glow texture
        this.textures.meteorGlow = this.createGlowTexture(32, 0xff6600, 0.7);
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

        // Smooth glow (v7 API)
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

    // ==================== MINIMAP (Canvas 2D) ====================

    setMinimapContainer(container) {
        if (!container) return;
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.width = 160;
        this.minimapCanvas.height = 120;
        this.minimapCanvas.style.width = '100%';
        this.minimapCanvas.style.height = '100%';
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        container.innerHTML = '';
        container.appendChild(this.minimapCanvas);
    }

    // ==================== INITIALIZATION ====================

    initStars(level) {
        if (!this.initialized || !level) return;

        // Clear existing background elements
        this.clearBackgroundElements();

        // Store current theme
        this.currentTheme = level.theme || null;

        // Generate galaxy clusters
        this.generateGalaxyClusters(level);

        // Generate cosmic dust
        this.generateCosmicDust(level);

        // Generate nebulas
        this.generateNebulas(level);

        // Generate stars with multiple parallax layers
        this.generateStars(level);

        // Update background color based on theme
        const theme = this.currentTheme;
        if (theme) {
            const bgColor = this.parseHexColor(theme.bgColor);
            this.app.renderer.background.color = bgColor;
        }
    }

    clearBackgroundElements() {
        // Clear stars
        this.starSprites.forEach(s => s.destroy());
        this.starSprites = [];
        this.stars = [];

        // Clear nebulas
        this.nebulaSprites.forEach(s => s.destroy());
        this.nebulaSprites = [];
        this.nebulaGradients = [];

        // Clear galaxy clusters
        this.galaxyGraphics.forEach(g => g.destroy());
        this.galaxyGraphics = [];
        this.galaxyClusters = [];

        // Clear dust
        this.dustSprites.forEach(s => s.destroy());
        this.dustSprites = [];
        this.cosmicDust = [];

        // Clear containers
        this.containers.background.removeChildren();
        this.containers.parallaxLayer1.removeChildren();
        this.containers.parallaxLayer2.removeChildren();
    }

    parseHexColor(hex) {
        if (hex.startsWith('#')) hex = hex.slice(1);
        return parseInt(hex, 16);
    }

    // ==================== BACKGROUND GENERATION ====================

    generateGalaxyClusters(level) {
        const clusterCount = 5 + Math.floor(Math.random() * 5);

        for (let i = 0; i < clusterCount; i++) {
            const starCount = 20 + Math.floor(Math.random() * 40);
            const centerX = Math.random() * level.w * 1.5 - level.w * 0.25;
            const centerY = Math.random() * level.h * 1.5 - level.h * 0.25;
            const spread = 50 + Math.random() * 150;

            const cluster = {
                x: centerX,
                y: centerY,
                stars: [],
                parallaxSpeed: 0.02 + Math.random() * 0.03,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.0001,
                coreColor: this.getGalaxyColor()
            };

            // Generate cluster stars in spiral pattern
            for (let j = 0; j < starCount; j++) {
                const angle = (j / starCount) * Math.PI * 4 + Math.random() * 0.5;
                const dist = (j / starCount) * spread + Math.random() * 20;
                cluster.stars.push({
                    offsetX: Math.cos(angle) * dist,
                    offsetY: Math.sin(angle) * dist * 0.6,
                    size: 0.5 + Math.random() * 1.5,
                    brightness: 0.2 + Math.random() * 0.4
                });
            }

            this.galaxyClusters.push(cluster);

            // Create graphics for this cluster
            const graphics = new PIXI.Graphics();
            graphics.cluster = cluster;
            this.galaxyGraphics.push(graphics);
            this.containers.background.addChild(graphics);
        }
    }

    getGalaxyColor() {
        const colors = [
            { r: 200, g: 140, b: 255 },
            { r: 140, g: 200, b: 255 },
            { r: 255, g: 220, b: 140 },
            { r: 140, g: 255, b: 200 },
            { r: 255, g: 160, b: 200 },
            { r: 255, g: 180, b: 120 },
            { r: 180, g: 255, b: 255 }
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateCosmicDust(level) {
        const dustLayers = [
            { count: 100, parallax: 0.05, opacity: 0.15, size: 1 },
            { count: 80, parallax: 0.1, opacity: 0.2, size: 1.5 },
            { count: 60, parallax: 0.15, opacity: 0.25, size: 2 }
        ];

        dustLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const dust = {
                    x: Math.random() * level.w * 1.2 - level.w * 0.1,
                    y: Math.random() * level.h * 1.2 - level.h * 0.1,
                    size: layer.size + Math.random() * layer.size,
                    opacity: layer.opacity * (0.5 + Math.random() * 0.5),
                    parallax: layer.parallax,
                    drift: {
                        x: (Math.random() - 0.5) * 0.02,
                        y: (Math.random() - 0.5) * 0.02
                    }
                };
                this.cosmicDust.push(dust);

                // Create sprite
                const sprite = new PIXI.Sprite(this.textures.dust);
                sprite.anchor.set(0.5);
                sprite.x = dust.x;
                sprite.y = dust.y;
                sprite.alpha = dust.opacity;
                sprite.scale.set(dust.size / 4);
                sprite.dust = dust;
                this.dustSprites.push(sprite);
                this.containers.parallaxLayer1.addChild(sprite);
            }
        });
    }

    generateNebulas(level) {
        const nebulaCount = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < nebulaCount; i++) {
            const nebula = {
                x: Math.random() * level.w,
                y: Math.random() * level.h,
                radius: 250 + Math.random() * 400,
                color1: this.getNebulaColorHex(),
                color2: this.getNebulaColorHex(),
                color3: this.getNebulaColorHex(),
                rotation: Math.random() * Math.PI * 2,
                drift: { x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1 },
                // Shape variation
                eccentricity: 0.4 + Math.random() * 0.4, // How elliptical
                irregularity: 0.1 + Math.random() * 0.2, // Edge variation
                // Sub-cloud offsets for layered look
                subClouds: [
                    { offsetX: (Math.random() - 0.5) * 100, offsetY: (Math.random() - 0.5) * 60, scale: 0.7 + Math.random() * 0.4 },
                    { offsetX: (Math.random() - 0.5) * 80, offsetY: (Math.random() - 0.5) * 50, scale: 0.5 + Math.random() * 0.3 },
                    { offsetX: (Math.random() - 0.5) * 60, offsetY: (Math.random() - 0.5) * 40, scale: 0.3 + Math.random() * 0.3 }
                ]
            };
            this.nebulaGradients.push(nebula);

            // Create nebula using pre-rendered texture for smoothest gradient
            const texture = this.createNebulaTexture(nebula);
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            sprite.blendMode = PIXI.BLEND_MODES.ADD;
            sprite.nebula = nebula;
            this.nebulaSprites.push(sprite);
            this.containers.parallaxLayer1.addChild(sprite);
        }
    }

    getNebulaColorHex() {
        const colors = [
            0x8c3cc8, // Purple
            0x3c8cdc, // Blue
            0xc83c8c, // Magenta
            0x3cc896, // Teal
            0xdc8c3c, // Orange
            0xb450dc, // Violet
            0x50b4dc, // Electric Blue
            0x6644aa, // Deep Purple
            0x4488cc, // Sky Blue
            0xaa44aa  // Plum
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createNebulaTexture(nebula) {
        const size = Math.ceil(nebula.radius * 2.5);
        const graphics = new PIXI.Graphics();
        const center = size / 2;

        // Draw multiple overlapping gradient clouds for smooth, organic look
        this.drawNebulaCloud(graphics, center, center, nebula.radius, nebula.color1, nebula.eccentricity, 0.12);

        // Secondary clouds with different colors
        nebula.subClouds.forEach((cloud, idx) => {
            const color = idx === 0 ? nebula.color2 : nebula.color3;
            const cloudRadius = nebula.radius * cloud.scale;
            this.drawNebulaCloud(
                graphics,
                center + cloud.offsetX,
                center + cloud.offsetY,
                cloudRadius,
                color,
                nebula.eccentricity * (0.8 + Math.random() * 0.4),
                0.08
            );
        });

        // Add bright core highlight
        this.drawNebulaCore(graphics, center, center, nebula.radius * 0.3, nebula.color1);

        return this.app.renderer.generateTexture(graphics);
    }

    drawNebulaCloud(graphics, cx, cy, radius, color, eccentricity, maxAlpha) {
        // Use many more steps for smooth gradient (50 steps instead of 10)
        const steps = 50;

        for (let i = steps; i >= 1; i--) {
            const ratio = i / steps;

            // Use smooth exponential falloff for natural gradient
            // This creates a much smoother transition than linear
            const smoothRatio = Math.pow(ratio, 0.7);
            const alpha = maxAlpha * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;

            if (alpha < 0.001) continue;

            graphics.beginFill(color, alpha);
            graphics.drawEllipse(cx, cy, radius * smoothRatio, radius * eccentricity * smoothRatio);
            graphics.endFill();
        }
    }

    drawNebulaCore(graphics, cx, cy, radius, color) {
        // Bright center core with very smooth falloff
        const steps = 30;

        for (let i = steps; i >= 1; i--) {
            const ratio = i / steps;
            const smoothRatio = Math.pow(ratio, 0.5);
            const alpha = 0.15 * Math.pow(1 - smoothRatio, 2);

            if (alpha < 0.001) continue;

            // Mix towards white for the core
            const coreColor = this.lerpColor(color, 0xffffff, (1 - ratio) * 0.5);

            graphics.beginFill(coreColor, alpha);
            graphics.drawCircle(cx, cy, radius * smoothRatio);
            graphics.endFill();
        }
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

    drawNebula(graphics, nebula) {
        // This method is now only used for fallback/dynamic updates
        graphics.clear();

        const steps = 40;
        for (let i = steps; i >= 1; i--) {
            const ratio = i / steps;
            const smoothRatio = Math.pow(ratio, 0.7);
            const alpha = 0.1 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;

            graphics.beginFill(nebula.color1, alpha);
            graphics.drawEllipse(0, 0, nebula.radius * smoothRatio, nebula.radius * nebula.eccentricity * smoothRatio);
            graphics.endFill();
        }

        graphics.x = nebula.x;
        graphics.y = nebula.y;
        graphics.rotation = nebula.rotation;
    }

    generateStars(level) {
        const layers = [
            { count: 80, sizeMin: 0.5, sizeMax: 1, speed: 0.2, opacity: 0.3, texture: 'starSmall' },
            { count: 60, sizeMin: 1, sizeMax: 2, speed: 0.5, opacity: 0.5, texture: 'starSmall' },
            { count: 40, sizeMin: 2, sizeMax: 3, speed: 0.8, opacity: 0.7, texture: 'starMedium' },
            { count: 15, sizeMin: 3, sizeMax: 5, speed: 1.0, opacity: 1.0, texture: 'starLarge' }
        ];

        layers.forEach((layer, layerIdx) => {
            for (let i = 0; i < layer.count; i++) {
                const star = {
                    x: Math.random() * level.w,
                    y: Math.random() * level.h,
                    s: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
                    o: layer.opacity * (0.5 + Math.random() * 0.5),
                    layer: layerIdx,
                    speed: layer.speed,
                    twinkleSpeed: 0.5 + Math.random() * 2,
                    twinkleOffset: Math.random() * Math.PI * 2,
                    color: Math.random() > 0.8 ? this.getStarColorTint() : 0xffffff
                };
                this.stars.push(star);

                // Create sprite
                const sprite = new PIXI.Sprite(this.textures[layer.texture]);
                sprite.anchor.set(0.5);
                sprite.x = star.x;
                sprite.y = star.y;
                sprite.alpha = star.o;
                sprite.scale.set(star.s / 8);
                sprite.tint = star.color;
                sprite.star = star;
                this.starSprites.push(sprite);
                this.containers.parallaxLayer2.addChild(sprite);
            }
        });
    }

    getStarColorTint() {
        const colors = [
            0xffcccc, // Red giant
            0xccccff, // Blue
            0xffffcc, // Yellow
            0xffcc99, // Orange
            0xccffff  // Cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
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

        // Update particle trails
        this.updateParticleTrails(state.particles);

        // Render (happens automatically with PixiJS ticker, but we can force it)
        // this.app.render();

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

    // ==================== BACKGROUND UPDATES ====================

    updateBackground(camera, level) {
        // Update galaxy clusters
        this.galaxyGraphics.forEach((graphics, idx) => {
            const cluster = this.galaxyClusters[idx];
            if (!cluster) return;

            // Update rotation
            cluster.rotation += cluster.rotationSpeed;

            // Calculate parallax position
            const parallaxX = cluster.x - camera.x * (1 - cluster.parallaxSpeed);
            const parallaxY = cluster.y - camera.y * (1 - cluster.parallaxSpeed);

            // Redraw cluster
            graphics.clear();

            // Core glow with smooth gradient (v7 API)
            const color = cluster.coreColor;
            const hexColor = (color.r << 16) | (color.g << 8) | color.b;

            // Use more steps and exponential falloff for smoother gradient
            const glowSteps = 20;
            for (let i = glowSteps; i >= 1; i--) {
                const ratio = i / glowSteps;
                const smoothRatio = Math.pow(ratio, 0.6);
                const alpha = 0.15 * Math.pow(1 - smoothRatio, 1.8) * smoothRatio;
                if (alpha < 0.001) continue;
                graphics.beginFill(hexColor, alpha);
                graphics.drawCircle(0, 0, 150 * smoothRatio);
                graphics.endFill();
            }

            // Draw stars with rotation (v7 API)
            cluster.stars.forEach(star => {
                const cos = Math.cos(cluster.rotation);
                const sin = Math.sin(cluster.rotation);
                const rotatedX = star.offsetX * cos - star.offsetY * sin;
                const rotatedY = star.offsetX * sin + star.offsetY * cos;

                const twinkle = 0.6 + Math.sin(this.time * 0.5 + star.offsetX * 0.1) * 0.4;

                // Draw star with small glow
                graphics.beginFill(hexColor, star.brightness * twinkle * 0.3);
                graphics.drawCircle(rotatedX, rotatedY, star.size * 2.5);
                graphics.endFill();
                graphics.beginFill(hexColor, star.brightness * twinkle);
                graphics.drawCircle(rotatedX, rotatedY, star.size);
                graphics.endFill();
            });

            graphics.x = parallaxX;
            graphics.y = parallaxY;
        });

        // Update cosmic dust with parallax
        this.dustSprites.forEach(sprite => {
            const dust = sprite.dust;
            if (!dust) return;

            // Apply drift
            dust.x += dust.drift.x;
            dust.y += dust.drift.y;

            // Parallax position
            const parallaxX = dust.x - camera.x * (1 - dust.parallax);
            const parallaxY = dust.y - camera.y * (1 - dust.parallax);

            // Pulsing
            const pulse = 0.7 + Math.sin(this.time * 0.3 + dust.x * 0.01) * 0.3;

            sprite.x = parallaxX;
            sprite.y = parallaxY;
            sprite.alpha = dust.opacity * pulse;
        });

        // Update nebulas with parallax
        this.nebulaSprites.forEach((sprite, idx) => {
            const nebula = this.nebulaGradients[idx];
            if (!nebula) return;

            const parallaxX = nebula.x - camera.x * 0.1;
            const parallaxY = nebula.y - camera.y * 0.1;

            sprite.x = parallaxX;
            sprite.y = parallaxY;
            sprite.rotation = nebula.rotation;

            // Subtle pulsing alpha for ethereal effect
            const pulse = 0.85 + Math.sin(this.time * 0.15 + idx * 1.5) * 0.15;
            sprite.alpha = pulse;
        });

        // Update stars with parallax and twinkling
        this.starSprites.forEach(sprite => {
            const star = sprite.star;
            if (!star) return;

            // Parallax position
            const parallaxX = star.x - camera.x * (1 - star.speed);
            const parallaxY = star.y - camera.y * (1 - star.speed);

            // Twinkle
            const twinkle = 0.5 + Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset) * 0.5;

            sprite.x = parallaxX;
            sprite.y = parallaxY;
            sprite.alpha = star.o * twinkle;
        });
    }

    // ==================== GAME ELEMENT UPDATES ====================

    updatePlatforms(state) {
        const platforms = state.level?.platforms;
        if (!platforms) return;

        // Platform colors
        // Fuel platforms are always green
        const fuelColor = 0x00ff41;
        // Passenger platforms use various non-green colors
        const passengerColors = [
            0xff6b9d,  // Pink
            0x00d2ff,  // Cyan
            0xff9500,  // Orange
            0xaa66ff,  // Purple
            0xff5555,  // Red
            0xffdd00,  // Yellow
            0x66aaff,  // Blue
            0xff66aa   // Magenta
        ];

        // Determine target platform
        const passengers = state.level.passengers || [];
        const passIdx = state.passengerIndex || 0;
        const currentPass = passengers[passIdx];
        let targetPlatformId = null;
        if (state.activePassenger && currentPass) {
            if (state.activePassenger.state === 'WAITING') {
                targetPlatformId = currentPass.f;
            } else if (state.activePassenger.state === 'IN_TAXI') {
                targetPlatformId = currentPass.t;
            }
        }

        platforms.forEach(p => {
            let platformGraphics = this.platformSprites.get(p.id);

            if (!platformGraphics) {
                // Create new platform graphics
                platformGraphics = new PIXI.Graphics();
                this.platformSprites.set(p.id, platformGraphics);
                this.containers.platforms.addChild(platformGraphics);
            }

            const isTarget = p.id === targetPlatformId;
            // Fuel platforms are green, passenger platforms get color based on their id
            const color = p.fuel ? fuelColor : passengerColors[p.id % passengerColors.length];
            const glowIntensity = isTarget ? 0.5 : 0.3;

            // Redraw platform
            platformGraphics.clear();

            // Glow underneath (v7 API)
            for (let i = 5; i >= 1; i--) {
                const ratio = i / 5;
                const alpha = glowIntensity * (1 - ratio) * 0.3;
                platformGraphics.beginFill(color, alpha);
                platformGraphics.drawEllipse(p.w / 2, 5, (p.w / 2 + 20) * ratio, 15 * ratio);
                platformGraphics.endFill();
            }

            // Platform body (v7 API)
            platformGraphics.beginFill(0x111111);
            platformGraphics.drawRect(0, 0, p.w, p.h);
            platformGraphics.endFill();

            // Top strip with pulse (v7 API)
            const pulse = 0.7 + Math.sin(this.time * 3) * 0.3;
            platformGraphics.beginFill(color, pulse);
            platformGraphics.drawRect(0, 0, p.w, 4);
            platformGraphics.endFill();

            // Light dots for target/fuel platforms (v7 API)
            if (isTarget || p.fuel) {
                for (let i = 0; i < 5; i++) {
                    const dotPulse = 0.3 + Math.sin(this.time * 4 + i) * 0.7;
                    platformGraphics.beginFill(color, dotPulse);
                    platformGraphics.drawRect(10 + i * (p.w - 20) / 4, p.h - 6, 3, 3);
                    platformGraphics.endFill();
                }
            }

            platformGraphics.x = p.x;
            platformGraphics.y = p.y;
        });
    }

    updateBuildings(state) {
        const platforms = state.level?.platforms;
        if (!platforms) return;

        // Clear buildings when sector changes
        const sectorIndex = state.level?.sectorIndex;
        if (sectorIndex !== this.currentSectorIndex) {
            // Remove all existing building sprites
            this.buildingSprites.forEach(sprite => {
                this.containers.buildings.removeChild(sprite);
                sprite.destroy({ children: true });
            });
            this.buildingSprites.clear();
            this.currentSectorIndex = sectorIndex;
        }

        platforms.forEach(p => {
            // Skip platforms without building types
            if (!p.buildingType) return;

            let buildingContainer = this.buildingSprites.get(p.id);

            if (!buildingContainer) {
                // Create new building
                buildingContainer = this.createBuildingGraphics(p);
                this.buildingSprites.set(p.id, buildingContainer);
                this.containers.buildings.addChild(buildingContainer);
            }

            // Update building window animations
            this.updateBuildingWindows(buildingContainer, p);
        });
    }

    createBuildingGraphics(platform) {
        const buildingType = BUILDING_TYPES[platform.buildingType];
        if (!buildingType) return new PIXI.Container();

        const container = new PIXI.Container();
        const graphics = new PIXI.Graphics();

        const { width, height, doorX, color, style } = buildingType;

        // Position building on LEFT side of platform, leaving right side for landing
        const buildingX = platform.x + 5; // Small margin from left edge
        const buildingY = platform.y - height;

        // Draw based on building style
        switch (style) {
            case 'residential':
                this.drawResidentialBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'luxury':
                this.drawLuxuryBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'industrial':
                this.drawIndustrialBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'entertainment':
                this.drawDiscoBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'hospitality':
                this.drawPubBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'fuel':
                this.drawFuelStationBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'base_port':
                this.drawBasePortBuilding(graphics, 0, 0, width, height, color);
                break;
            default:
                this.drawResidentialBuilding(graphics, 0, 0, width, height, color);
        }

        // Draw door
        graphics.beginFill(0x1a1a1a);
        graphics.drawRect(doorX - 5, height - 15, 10, 15);
        graphics.endFill();

        // Door frame highlight
        graphics.beginFill(0x333333);
        graphics.drawRect(doorX - 6, height - 16, 12, 2);
        graphics.endFill();

        container.addChild(graphics);
        container.x = buildingX;
        container.y = buildingY;
        container.buildingType = platform.buildingType;
        container.doorWorldX = buildingX + doorX;
        container.doorWorldY = platform.y - 2;

        return container;
    }

    drawResidentialBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 15, width, height - 15);
        graphics.endFill();

        // Triangular roof
        graphics.beginFill(this.lightenColor(color, 0.2));
        graphics.moveTo(x - 3, y + 15);
        graphics.lineTo(x + width / 2, y);
        graphics.lineTo(x + width + 3, y + 15);
        graphics.closePath();
        graphics.endFill();

        // Roof highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.moveTo(x - 3, y + 15);
        graphics.lineTo(x + width / 2, y);
        graphics.lineTo(x + width / 2, y + 5);
        graphics.lineTo(x, y + 15);
        graphics.closePath();
        graphics.endFill();

        // Windows (2x2 grid)
        this.drawWindows(graphics, x + 5, y + 20, 2, 2, 10, 8);

        // Chimney
        graphics.beginFill(this.darkenColor(color, 0.3));
        graphics.drawRect(x + width - 12, y - 5, 8, 20);
        graphics.endFill();
    }

    drawLuxuryBuilding(graphics, x, y, width, height, color) {
        // Main body with slight gradient effect
        graphics.beginFill(color);
        graphics.drawRect(x, y + 20, width, height - 20);
        graphics.endFill();

        // Body highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(x, y + 20, width * 0.4, height - 20);
        graphics.endFill();

        // Dome roof
        graphics.beginFill(this.lightenColor(color, 0.3));
        graphics.arc(x + width / 2, y + 20, width / 2, Math.PI, 0);
        graphics.endFill();

        // Dome highlight
        graphics.beginFill(0xffffff, 0.15);
        graphics.arc(x + width / 2, y + 20, width / 2 - 2, Math.PI, Math.PI + 0.8);
        graphics.endFill();

        // Large windows (3x2)
        this.drawWindows(graphics, x + 8, y + 28, 3, 2, 12, 10);

        // Decorative columns
        graphics.beginFill(this.lightenColor(color, 0.15));
        graphics.drawRect(x + 3, y + 25, 4, height - 25);
        graphics.drawRect(x + width - 7, y + 25, 4, height - 25);
        graphics.endFill();
    }

    drawIndustrialBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 5, width, height - 5);
        graphics.endFill();

        // Flat roof with edge
        graphics.beginFill(this.darkenColor(color, 0.2));
        graphics.drawRect(x - 2, y, width + 4, 8);
        graphics.endFill();

        // Industrial stripes
        graphics.beginFill(0xffaa00, 0.6);
        for (let i = 0; i < 3; i++) {
            graphics.drawRect(x, y + 12 + i * 15, width, 3);
        }
        graphics.endFill();

        // Large industrial windows
        this.drawWindows(graphics, x + 8, y + 18, 3, 2, 14, 8);

        // Chimney/smokestack
        graphics.beginFill(this.darkenColor(color, 0.4));
        graphics.drawRect(x + width - 18, y - 20, 12, 25);
        graphics.endFill();

        // Smoke rings
        graphics.beginFill(0x666666, 0.4);
        graphics.drawRect(x + width - 20, y - 22, 16, 4);
        graphics.endFill();

        // Second smaller chimney
        graphics.beginFill(this.darkenColor(color, 0.3));
        graphics.drawRect(x + width - 32, y - 10, 8, 15);
        graphics.endFill();
    }

    drawDiscoBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 10, width, height - 10);
        graphics.endFill();

        // Curved/dome roof
        graphics.beginFill(this.lightenColor(color, 0.2));
        graphics.arc(x + width / 2, y + 12, width / 2, Math.PI, 0);
        graphics.endFill();

        // Neon sign area at top
        graphics.beginFill(0xff00ff, 0.3);
        graphics.drawRect(x + 5, y + 2, width - 10, 12);
        graphics.endFill();

        // Neon border
        graphics.lineStyle(2, 0xff00ff, 0.8);
        graphics.drawRect(x + 4, y + 1, width - 8, 14);
        graphics.lineStyle(0);

        // Disco ball style windows (circular)
        const windowY = y + 20;
        for (let i = 0; i < 3; i++) {
            const wx = x + 8 + i * 15;
            graphics.beginFill(0x4444ff, 0.6);
            graphics.drawCircle(wx + 4, windowY + 10, 5);
            graphics.endFill();
        }

        // Second row
        for (let i = 0; i < 2; i++) {
            const wx = x + 15 + i * 15;
            graphics.beginFill(0xff44ff, 0.6);
            graphics.drawCircle(wx + 4, windowY + 25, 5);
            graphics.endFill();
        }
    }

    drawPubBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 8, width, height - 8);
        graphics.endFill();

        // Slanted roof
        graphics.beginFill(this.darkenColor(color, 0.3));
        graphics.moveTo(x - 2, y + 8);
        graphics.lineTo(x + width / 2, y);
        graphics.lineTo(x + width + 2, y + 8);
        graphics.closePath();
        graphics.endFill();

        // Sign hanging area
        graphics.beginFill(0x8b4513);
        graphics.drawRect(x + width - 15, y + 12, 12, 8);
        graphics.endFill();

        // Sign text placeholder (small yellow rectangle)
        graphics.beginFill(0xffdd00);
        graphics.drawRect(x + width - 13, y + 14, 8, 4);
        graphics.endFill();

        // Traditional windows (2x1)
        this.drawWindows(graphics, x + 5, y + 18, 2, 1, 12, 10);

        // Warm light from windows
        graphics.beginFill(0xffaa44, 0.3);
        graphics.drawRect(x + 5, y + 18, 12, 10);
        graphics.drawRect(x + 22, y + 18, 12, 10);
        graphics.endFill();
    }

    drawFuelStationBuilding(graphics, x, y, width, height, color) {
        // Main booth/kiosk
        graphics.beginFill(color);
        graphics.drawRect(x, y + 10, width * 0.5, height - 10);
        graphics.endFill();

        // Booth highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(x, y + 10, width * 0.2, height - 10);
        graphics.endFill();

        // Flat roof with overhang/canopy extending to the right
        graphics.beginFill(this.darkenColor(color, 0.2));
        graphics.drawRect(x - 3, y + 5, width + 6, 8);
        graphics.endFill();

        // Canopy support pillars
        graphics.beginFill(0x444444);
        graphics.drawRect(x + width - 8, y + 13, 4, height - 13);
        graphics.endFill();

        // Fuel pump (on the right side under canopy)
        graphics.beginFill(0x00aaff);
        graphics.drawRect(x + width - 18, y + height - 20, 12, 20);
        graphics.endFill();

        // Pump screen/display
        graphics.beginFill(0x001122);
        graphics.drawRect(x + width - 16, y + height - 18, 8, 6);
        graphics.endFill();

        // Pump nozzle holder
        graphics.beginFill(0x222222);
        graphics.drawRect(x + width - 17, y + height - 10, 10, 3);
        graphics.endFill();

        // Fuel hose (curved line effect)
        graphics.lineStyle(2, 0x222222, 1);
        graphics.moveTo(x + width - 12, y + height - 7);
        graphics.quadraticCurveTo(x + width - 5, y + height - 12, x + width - 2, y + height - 5);
        graphics.lineStyle(0);

        // Nozzle
        graphics.beginFill(0x00ccff);
        graphics.drawRect(x + width - 4, y + height - 7, 4, 7);
        graphics.endFill();

        // Booth window
        graphics.beginFill(0x88ccff, 0.6);
        graphics.drawRect(x + 4, y + 14, width * 0.4 - 8, 10);
        graphics.endFill();

        // Window shine
        graphics.beginFill(0xffffff, 0.3);
        graphics.drawRect(x + 5, y + 15, 5, 4);
        graphics.endFill();

        // "FUEL" sign - tall pole with sign on top
        // Pole
        graphics.beginFill(0x444444);
        graphics.drawRect(x + width - 25, y - 25, 3, 30);
        graphics.endFill();

        // Sign background
        graphics.beginFill(0x002244);
        graphics.drawRect(x + width - 38, y - 35, 30, 14);
        graphics.endFill();

        // Sign border glow
        for (let i = 4; i >= 1; i--) {
            graphics.beginFill(0x00ffff, 0.15);
            graphics.drawRect(x + width - 38 - i, y - 35 - i, 30 + i * 2, 14 + i * 2);
            graphics.endFill();
        }

        // "FUEL" text as blocks (4 letters)
        graphics.beginFill(0x00ffff);
        // F
        graphics.drawRect(x + width - 35, y - 32, 2, 8);
        graphics.drawRect(x + width - 35, y - 32, 5, 2);
        graphics.drawRect(x + width - 35, y - 28, 4, 2);
        // U
        graphics.drawRect(x + width - 28, y - 32, 2, 8);
        graphics.drawRect(x + width - 24, y - 32, 2, 8);
        graphics.drawRect(x + width - 28, y - 26, 6, 2);
        // E
        graphics.drawRect(x + width - 20, y - 32, 2, 8);
        graphics.drawRect(x + width - 20, y - 32, 5, 2);
        graphics.drawRect(x + width - 20, y - 28, 4, 2);
        graphics.drawRect(x + width - 20, y - 26, 5, 2);
        // L
        graphics.drawRect(x + width - 13, y - 32, 2, 8);
        graphics.drawRect(x + width - 13, y - 26, 5, 2);
        graphics.endFill();

        // Price display on booth
        graphics.beginFill(0x00ff00, 0.8);
        graphics.drawRect(x + 3, y + height - 12, 10, 6);
        graphics.endFill();
    }

    drawBasePortBuilding(graphics, x, y, width, height, color) {
        // Main hangar body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 15, width * 0.7, height - 15);
        graphics.endFill();

        // Hangar body highlight (left side)
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(x, y + 15, width * 0.15, height - 15);
        graphics.endFill();

        // Curved hangar roof
        graphics.beginFill(this.darkenColor(color, 0.15));
        graphics.arc(x + width * 0.35, y + 18, width * 0.38, Math.PI, 0);
        graphics.endFill();

        // Roof highlight
        graphics.beginFill(0xffffff, 0.08);
        graphics.arc(x + width * 0.35, y + 18, width * 0.35, Math.PI, Math.PI * 1.5);
        graphics.endFill();

        // Control tower (right side, taller)
        const towerX = x + width * 0.7;
        const towerW = width * 0.3;
        const towerH = height + 25;

        // Tower body
        graphics.beginFill(this.darkenColor(color, 0.2));
        graphics.drawRect(towerX, y - 25, towerW, towerH);
        graphics.endFill();

        // Tower highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(towerX, y - 25, towerW * 0.3, towerH);
        graphics.endFill();

        // Tower observation window (large)
        graphics.beginFill(0x001122);
        graphics.drawRect(towerX + 3, y - 20, towerW - 6, 12);
        graphics.endFill();

        // Window glass reflection
        graphics.beginFill(0x4488ff, 0.4);
        graphics.drawRect(towerX + 4, y - 19, towerW - 8, 10);
        graphics.endFill();

        // Window shine
        graphics.beginFill(0xffffff, 0.3);
        graphics.drawRect(towerX + 5, y - 18, 4, 3);
        graphics.endFill();

        // Antenna mast on tower
        graphics.beginFill(0x555555);
        graphics.drawRect(towerX + towerW / 2 - 2, y - 45, 4, 22);
        graphics.endFill();

        // Antenna dish
        graphics.beginFill(0x666666);
        graphics.arc(towerX + towerW / 2, y - 43, 8, Math.PI * 0.8, Math.PI * 0.2);
        graphics.endFill();

        // Beacon light on top (red warning light)
        for (let i = 3; i >= 1; i--) {
            graphics.beginFill(0xff0000, 0.2);
            graphics.drawCircle(towerX + towerW / 2, y - 47, i * 2 + 2);
            graphics.endFill();
        }
        graphics.beginFill(0xff3333);
        graphics.drawCircle(towerX + towerW / 2, y - 47, 3);
        graphics.endFill();

        // Large hangar door (where taxi comes from)
        graphics.beginFill(0x1a1a2a);
        graphics.drawRect(x + width * 0.25, y + 25, width * 0.35, height - 25);
        graphics.endFill();

        // Hangar door frame
        graphics.beginFill(0x444466);
        graphics.drawRect(x + width * 0.24, y + 23, width * 0.37, 3);
        graphics.drawRect(x + width * 0.24, y + 23, 3, height - 23);
        graphics.drawRect(x + width * 0.59, y + 23, 3, height - 23);
        graphics.endFill();

        // Hangar door horizontal lines (industrial look)
        graphics.beginFill(0x333344);
        for (let i = 0; i < 4; i++) {
            graphics.drawRect(x + width * 0.26, y + 32 + i * 8, width * 0.33, 2);
        }
        graphics.endFill();

        // Landing guide lights on hangar (green = clear)
        for (let i = 0; i < 3; i++) {
            // Glow
            graphics.beginFill(0x00ff00, 0.3);
            graphics.drawCircle(x + 8 + i * 12, y + height - 6, 4);
            graphics.endFill();
            // Light
            graphics.beginFill(0x00ff44);
            graphics.drawCircle(x + 8 + i * 12, y + height - 6, 2);
            graphics.endFill();
        }

        // "BASE" sign on hangar
        // Sign background
        graphics.beginFill(0x001133);
        graphics.drawRect(x + 5, y + 3, 32, 10);
        graphics.endFill();

        // Sign border glow (cyan)
        for (let i = 2; i >= 1; i--) {
            graphics.beginFill(0x00ccff, 0.2);
            graphics.drawRect(x + 5 - i, y + 3 - i, 32 + i * 2, 10 + i * 2);
            graphics.endFill();
        }

        // "BASE" text as pixel blocks
        graphics.beginFill(0x00ccff);
        // B
        graphics.drawRect(x + 7, y + 5, 2, 6);
        graphics.drawRect(x + 7, y + 5, 4, 1);
        graphics.drawRect(x + 7, y + 7, 4, 1);
        graphics.drawRect(x + 7, y + 10, 4, 1);
        graphics.drawRect(x + 10, y + 5, 1, 2);
        graphics.drawRect(x + 10, y + 8, 1, 2);
        // A
        graphics.drawRect(x + 13, y + 5, 4, 1);
        graphics.drawRect(x + 13, y + 6, 1, 5);
        graphics.drawRect(x + 16, y + 6, 1, 5);
        graphics.drawRect(x + 14, y + 8, 2, 1);
        // S
        graphics.drawRect(x + 19, y + 5, 4, 1);
        graphics.drawRect(x + 19, y + 6, 1, 2);
        graphics.drawRect(x + 19, y + 7, 4, 1);
        graphics.drawRect(x + 22, y + 8, 1, 2);
        graphics.drawRect(x + 19, y + 10, 4, 1);
        // E
        graphics.drawRect(x + 25, y + 5, 1, 6);
        graphics.drawRect(x + 25, y + 5, 4, 1);
        graphics.drawRect(x + 25, y + 7, 3, 1);
        graphics.drawRect(x + 25, y + 10, 4, 1);
        graphics.endFill();

        // Small windows on main hangar
        graphics.beginFill(0x88aaff, 0.4);
        graphics.drawRect(x + 5, y + 18, 8, 5);
        graphics.drawRect(x + width * 0.62, y + 18, 6, 5);
        graphics.endFill();
    }

    drawWindows(graphics, startX, startY, cols, rows, cellWidth, cellHeight) {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const wx = startX + col * (cellWidth + 4);
                const wy = startY + row * (cellHeight + 4);

                // Window frame
                graphics.beginFill(0x222222);
                graphics.drawRect(wx - 1, wy - 1, cellWidth + 2, cellHeight + 2);
                graphics.endFill();

                // Window glass (will be animated)
                graphics.beginFill(0x88aaff, 0.5);
                graphics.drawRect(wx, wy, cellWidth, cellHeight);
                graphics.endFill();
            }
        }
    }

    updateBuildingWindows(container, platform) {
        // Animate window lights based on time
        const windows = container.children.filter(c => c.isWindow);
        const pulse = 0.3 + Math.sin(this.time * 2 + platform.id) * 0.2;

        // For now, the windows are drawn statically
        // Future enhancement: add animated window sprites
    }

    lightenColor(color, amount) {
        const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(255 * amount));
        const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(255 * amount));
        const b = Math.min(255, (color & 0xff) + Math.floor(255 * amount));
        return (r << 16) | (g << 8) | b;
    }

    darkenColor(color, amount) {
        const r = Math.max(0, Math.floor(((color >> 16) & 0xff) * (1 - amount)));
        const g = Math.max(0, Math.floor(((color >> 8) & 0xff) * (1 - amount)));
        const b = Math.max(0, Math.floor((color & 0xff) * (1 - amount)));
        return (r << 16) | (g << 8) | b;
    }

    updateAsteroids(asteroids) {
        if (!asteroids) return;

        asteroids.forEach((a, idx) => {
            let sprite = this.asteroidSprites.get(idx);

            if (!sprite) {
                // Create asteroid graphics
                sprite = new PIXI.Graphics();
                this.asteroidSprites.set(idx, sprite);
                this.containers.asteroids.addChild(sprite);
            }

            sprite.clear();

            // Outer glow (v7 API)
            for (let i = 4; i >= 1; i--) {
                const ratio = i / 4;
                const alpha = 0.15 * (1 - ratio);
                sprite.beginFill(0x64503c, alpha);
                sprite.drawCircle(0, 0, a.size * 1.2 * ratio);
                sprite.endFill();
            }

            // Draw polygon shape (v7 API)
            if (a.vertices && a.vertices.length > 0) {
                // Parse asteroid color
                const asteroidColor = this.parseHSLColor(a.color) || 0x4a3a2a;
                sprite.beginFill(asteroidColor);
                sprite.lineStyle(2, 0x968264, 0.4);
                sprite.moveTo(a.vertices[0].x, a.vertices[0].y);
                for (let i = 1; i < a.vertices.length; i++) {
                    sprite.lineTo(a.vertices[i].x, a.vertices[i].y);
                }
                sprite.closePath();
                sprite.endFill();
            }

            // Craters (v7 API)
            sprite.beginFill(0x000000, 0.3);
            sprite.drawCircle(a.size * 0.2, a.size * 0.1, a.size * 0.15);
            sprite.endFill();
            sprite.beginFill(0x000000, 0.3);
            sprite.drawCircle(-a.size * 0.3, -a.size * 0.2, a.size * 0.1);
            sprite.endFill();

            sprite.x = a.x;
            sprite.y = a.y;
            sprite.rotation = a.rotation;
        });
    }

    parseHSLColor(hslString) {
        // Parse HSL string like "hsl(30, 25%, 35%)"
        if (!hslString || !hslString.startsWith('hsl')) return 0x4a3a2a;

        const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return 0x4a3a2a;

        const h = parseInt(match[1]) / 360;
        const s = parseInt(match[2]) / 100;
        const l = parseInt(match[3]) / 100;

        // HSL to RGB conversion
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
    }

    updateDebris(debris) {
        if (!debris) return;

        debris.forEach((d, idx) => {
            let sprite = this.debrisSprites.get(idx);

            if (!sprite) {
                sprite = new PIXI.Graphics();
                this.debrisSprites.set(idx, sprite);
                this.containers.debris.addChild(sprite);
            }

            sprite.clear();

            const color = this.parseHexColor(d.color) || 0x888888;

            switch (d.type) {
                case 'scrap':
                    // v7 API
                    sprite.beginFill(color);
                    sprite.lineStyle(1, 0xffffff, 0.3);
                    sprite.moveTo(-d.size, -d.size * 0.5);
                    sprite.lineTo(d.size * 0.5, -d.size);
                    sprite.lineTo(d.size, d.size * 0.3);
                    sprite.lineTo(-d.size * 0.3, d.size);
                    sprite.closePath();
                    sprite.endFill();
                    break;

                case 'panel':
                    // v7 API
                    sprite.beginFill(color);
                    sprite.lineStyle(1, 0xffffff, 0.2);
                    sprite.drawRect(-d.size, -d.size * 0.3, d.size * 2, d.size * 0.6);
                    sprite.endFill();
                    break;

                case 'pipe':
                    // v7 API
                    sprite.beginFill(color);
                    sprite.drawRect(-d.size * 1.5, -d.size * 0.25, d.size * 3, d.size * 0.5);
                    sprite.endFill();
                    sprite.beginFill(0xffffff, 0.2);
                    sprite.drawRect(-d.size * 1.5, -d.size * 0.25, d.size * 3, d.size * 0.15);
                    sprite.endFill();
                    break;

                case 'crystal':
                    // Diamond shape with glow (v7 API)
                    sprite.beginFill(0x7777ff);
                    sprite.moveTo(0, -d.size);
                    sprite.lineTo(d.size * 0.5, 0);
                    sprite.lineTo(0, d.size);
                    sprite.lineTo(-d.size * 0.5, 0);
                    sprite.closePath();
                    sprite.endFill();

                    // Add glow effect for crystals (v7 API)
                    for (let i = 3; i >= 1; i--) {
                        sprite.beginFill(0x7777ff, 0.1);
                        sprite.moveTo(0, -d.size * (1 + i * 0.2));
                        sprite.lineTo(d.size * 0.5 * (1 + i * 0.2), 0);
                        sprite.lineTo(0, d.size * (1 + i * 0.2));
                        sprite.lineTo(-d.size * 0.5 * (1 + i * 0.2), 0);
                        sprite.closePath();
                        sprite.endFill();
                    }
                    break;
            }

            sprite.x = d.x;
            sprite.y = d.y;
            sprite.rotation = d.rotation;
        });
    }

    updateMeteors(meteors) {
        if (!meteors) return;

        meteors.forEach((m, idx) => {
            let container = this.meteorSprites.get(idx);

            if (!container) {
                container = new PIXI.Container();
                container.trailGraphics = new PIXI.Graphics();
                container.bodyGraphics = new PIXI.Graphics();
                container.addChild(container.trailGraphics);
                container.addChild(container.bodyGraphics);
                this.meteorSprites.set(idx, container);
                this.containers.meteors.addChild(container);
            }

            // Draw trail (v7 API)
            const trail = container.trailGraphics;
            trail.clear();

            if (m.trail && m.trail.length > 1) {
                m.trail.forEach((t, ti) => {
                    if (t.life <= 0) return;
                    const size = m.size * t.life;

                    // Outer glow (v7 API)
                    for (let i = 3; i >= 1; i--) {
                        const ratio = i / 3;
                        const alpha = t.life * 0.3 * (1 - ratio);
                        trail.beginFill(0xff5000, alpha);
                        trail.drawCircle(t.x - m.x, t.y - m.y, size * 2 * ratio);
                        trail.endFill();
                    }
                });
            }

            // Draw meteor body (v7 API)
            const body = container.bodyGraphics;
            body.clear();

            // Glow (v7 API)
            for (let i = 5; i >= 1; i--) {
                const ratio = i / 5;
                const alpha = 0.3 * (1 - ratio);
                body.beginFill(0xff6400, alpha);
                body.drawCircle(0, 0, m.size * 2 * ratio);
                body.endFill();
            }

            // Body (v7 API)
            body.beginFill(0x993300);
            body.drawCircle(0, 0, m.size);
            body.endFill();

            // Gradient effect (lighter center) (v7 API)
            body.beginFill(0xff6600);
            body.drawCircle(-m.size * 0.3, -m.size * 0.3, m.size * 0.6);
            body.endFill();

            // Hot core (v7 API)
            body.beginFill(0xffffff, 0.8);
            body.drawCircle(-m.size * 0.2, -m.size * 0.2, m.size * 0.3);
            body.endFill();

            container.x = m.x;
            container.y = m.y;
            body.rotation = m.rotation;
        });
    }

    updateEnemies(enemies) {
        if (!enemies) return;

        enemies.forEach((e, idx) => {
            let container = this.enemySprites.get(idx);

            if (!container) {
                container = new PIXI.Graphics();
                this.enemySprites.set(idx, container);
                this.containers.enemies.addChild(container);
            }

            container.clear();

            const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.5;

            // Outer danger glow (v7 API)
            for (let i = 5; i >= 1; i--) {
                const ratio = i / 5;
                const alpha = 0.2 * pulse * (1 - ratio);
                container.beginFill(0xff0000, alpha);
                container.drawCircle(0, 0, e.size * 3 * ratio);
                container.endFill();
            }

            // Inner glow (v7 API)
            for (let i = 3; i >= 1; i--) {
                const ratio = i / 3;
                const alpha = 0.3 * pulse * (1 - ratio);
                container.beginFill(0xff6400, alpha);
                container.drawCircle(0, 0, e.size * ratio);
                container.endFill();
            }

            // Body (v7 API)
            container.beginFill(0xff3300);
            container.drawCircle(0, 0, e.size / 2);
            container.endFill();

            // Eyes (v7 API)
            container.beginFill(0xffffff);
            container.drawRect(-5, -3, 3, 3);
            container.endFill();
            container.beginFill(0xffffff);
            container.drawRect(2, -3, 3, 3);
            container.endFill();

            // Red pupils (v7 API)
            container.beginFill(0xff0000);
            container.drawRect(-4, -2, 1, 1);
            container.endFill();
            container.beginFill(0xff0000);
            container.drawRect(3, -2, 1, 1);
            container.endFill();

            // Animated tentacles (v7 API)
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + Date.now() / 300;
                const wave = Math.sin(Date.now() / 100 + i) * 5;
                const endX = Math.cos(a) * (e.size + wave);
                const endY = Math.sin(a) * (e.size + wave);
                const ctrlX = Math.cos(a + 0.3) * e.size * 0.5;
                const ctrlY = Math.sin(a + 0.3) * e.size * 0.5;

                container.lineStyle(3, 0xff5500, 1, 0.5, false);
                container.moveTo(0, 0);
                container.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
            }

            container.x = e.x;
            container.y = e.y;
        });
    }

    updatePassenger(passenger) {
        // Handle visibility based on state
        const visibleStates = ['WAITING', 'WALKING_TO_TAXI', 'WALKING_TO_BUILDING'];
        if (!passenger || !visibleStates.includes(passenger.state)) {
            if (this.passengerSprite) {
                this.passengerSprite.visible = false;
            }
            return;
        }

        if (!this.passengerSprite) {
            this.passengerSprite = new PIXI.Graphics();
            this.containers.passenger.addChild(this.passengerSprite);
        }

        this.passengerSprite.visible = true;
        this.passengerSprite.clear();

        // Draw based on current state
        if (passenger.state === 'WAITING') {
            this.drawWaitingPassenger(passenger);
        } else if (passenger.state === 'WALKING_TO_TAXI' || passenger.state === 'WALKING_TO_BUILDING') {
            this.drawWalkingPassenger(passenger);
        }

        this.passengerSprite.x = passenger.x;
        this.passengerSprite.y = passenger.y;
    }

    drawWaitingPassenger(passenger) {
        const p = passenger;
        const teleportPulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;

        // Teleport glow underneath (v7 API)
        for (let i = 4; i >= 1; i--) {
            const ratio = i / 4;
            const alpha = 0.2 * teleportPulse * (1 - ratio);
            this.passengerSprite.beginFill(0xf472b6, alpha);
            this.passengerSprite.drawEllipse(0, 0, 25 * ratio, 12 * ratio);
            this.passengerSprite.endFill();
        }

        // Body (v7 API)
        this.passengerSprite.beginFill(0xf472b6);
        this.passengerSprite.drawRect(-4, -12, 8, 12);
        this.passengerSprite.endFill();

        // Head (v7 API)
        this.passengerSprite.beginFill(0xfbcfe8);
        this.passengerSprite.drawRect(-3, -18, 6, 6);
        this.passengerSprite.endFill();

        // Bouncing arrow (v7 API)
        const bounce = Math.sin(Date.now() / 200) * 5;
        this.passengerSprite.beginFill(0xffffff);
        this.passengerSprite.moveTo(0, -25 + bounce);
        this.passengerSprite.lineTo(-5, -33 + bounce);
        this.passengerSprite.lineTo(5, -33 + bounce);
        this.passengerSprite.closePath();
        this.passengerSprite.endFill();

        // Pickup ring (v7 API)
        this.passengerSprite.lineStyle(2, 0xf472b6, teleportPulse);
        this.passengerSprite.drawCircle(0, -6, 15 + (1 - teleportPulse) * 10);
    }

    drawWalkingPassenger(passenger) {
        const p = passenger;
        const walkTime = Date.now() / 1000;
        const legSwing = Math.sin(walkTime * 10 * WALKING_CONFIG.legAnimationSpeed * 50) * 4;
        const bodyBob = Math.abs(Math.sin(walkTime * 10 * WALKING_CONFIG.legAnimationSpeed * 50)) * 2;
        const armSwing = -legSwing * 0.6;

        // Direction indicator (flipped based on walk direction)
        const dir = p.walkDirection || 1;

        // Shadow/ground contact
        this.passengerSprite.beginFill(0x000000, 0.2);
        this.passengerSprite.drawEllipse(0, 2, 6, 3);
        this.passengerSprite.endFill();

        // Legs (animated)
        // Back leg
        this.passengerSprite.beginFill(0xc04a8a);
        this.passengerSprite.drawRect(-2 + legSwing * 0.3, -3, 3, 5);
        this.passengerSprite.endFill();

        // Front leg
        this.passengerSprite.beginFill(0xf472b6);
        this.passengerSprite.drawRect(-1 - legSwing * 0.3, -3, 3, 5);
        this.passengerSprite.endFill();

        // Body (with bob)
        this.passengerSprite.beginFill(0xf472b6);
        this.passengerSprite.drawRect(-4, -12 - bodyBob, 8, 10);
        this.passengerSprite.endFill();

        // Arms (swinging opposite to legs)
        // Back arm
        this.passengerSprite.beginFill(0xc04a8a);
        this.passengerSprite.drawRect(-5 + armSwing * 0.2, -10 - bodyBob, 2, 6);
        this.passengerSprite.endFill();

        // Front arm
        this.passengerSprite.beginFill(0xf472b6);
        this.passengerSprite.drawRect(3 - armSwing * 0.2, -10 - bodyBob, 2, 6);
        this.passengerSprite.endFill();

        // Head (with slight bob)
        this.passengerSprite.beginFill(0xfbcfe8);
        this.passengerSprite.drawRect(-3, -18 - bodyBob, 6, 6);
        this.passengerSprite.endFill();

        // Direction indicator arrow (above head, pointing in walk direction)
        const arrowX = dir * 8;
        this.passengerSprite.beginFill(0x00ff88, 0.8);
        this.passengerSprite.moveTo(arrowX, -22 - bodyBob);
        this.passengerSprite.lineTo(arrowX - dir * 4, -25 - bodyBob);
        this.passengerSprite.lineTo(arrowX - dir * 4, -19 - bodyBob);
        this.passengerSprite.closePath();
        this.passengerSprite.endFill();

        // Walking dust particles (occasional)
        if (Math.random() < 0.1) {
            const dustX = (Math.random() - 0.5) * 8;
            this.passengerSprite.beginFill(0xaaaaaa, 0.3);
            this.passengerSprite.drawCircle(dustX, 2, 2);
            this.passengerSprite.endFill();
        }
    }

    updateParticles(particles) {
        if (!particles) return;

        // Remove excess sprites
        while (this.particleSprites.length > particles.length) {
            const sprite = this.particleSprites.pop();
            sprite.destroy();
        }

        // Update or create sprites
        particles.forEach((p, i) => {
            let sprite = this.particleSprites[i];

            if (!sprite) {
                sprite = new PIXI.Sprite(this.getParticleTexture(p.color));
                sprite.anchor.set(0.5);
                this.particleSprites.push(sprite);
                this.containers.particles.addChild(sprite);
            }

            sprite.x = p.x;
            sprite.y = p.y;
            sprite.alpha = p.life;
            sprite.scale.set(p.size / 10);
            sprite.tint = this.parseHexColor(p.color);
        });
    }

    getParticleTexture(color) {
        switch (color) {
            case '#ffff55': return this.textures.particleYellow;
            case '#00ffff': return this.textures.particleCyan;
            case '#ff5500':
            case '#ff8800':
            case '#ffaa00': return this.textures.particleOrange;
            default: return this.textures.particleWhite;
        }
    }

    updateParticleTrails(particles) {
        // Add current particles to trails
        if (particles) {
            particles.forEach(p => {
                if (p.life > 0.5) {
                    this.particleTrails.push({
                        x: p.x,
                        y: p.y,
                        color: p.color,
                        size: p.size * 0.5,
                        life: 0.5
                    });
                }
            });
        }

        // Update and remove dead trails
        for (let i = this.particleTrails.length - 1; i >= 0; i--) {
            this.particleTrails[i].life -= 0.03;
            if (this.particleTrails[i].life <= 0) {
                this.particleTrails.splice(i, 1);
            }
        }

        // Limit trail count
        if (this.particleTrails.length > 200) {
            this.particleTrails.splice(0, this.particleTrails.length - 200);
        }

        // Sync trail sprites
        while (this.trailSprites.length > this.particleTrails.length) {
            const sprite = this.trailSprites.pop();
            sprite.destroy();
        }

        this.particleTrails.forEach((t, i) => {
            let sprite = this.trailSprites[i];

            if (!sprite) {
                sprite = new PIXI.Sprite(this.getTrailTexture(t.color));
                sprite.anchor.set(0.5);
                this.trailSprites.push(sprite);
                this.containers.particles.addChild(sprite);
            }

            sprite.x = t.x;
            sprite.y = t.y;
            sprite.alpha = t.life * 0.3;
            sprite.scale.set(t.size / 6);
        });
    }

    getTrailTexture(color) {
        switch (color) {
            case '#ffff55': return this.textures.trailYellow;
            case '#00ffff': return this.textures.trailCyan;
            case '#ff5500':
            case '#ff8800':
            case '#ffaa00': return this.textures.trailOrange;
            default: return this.textures.trailYellow;
        }
    }

    updateSpeedLines(state) {
        const taxi = state.taxi;
        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);

        if (speed > 3) {
            const count = Math.floor(speed * 2);
            for (let i = 0; i < count; i++) {
                this.speedLines.push({
                    x: taxi.x + (Math.random() - 0.5) * 100,
                    y: taxi.y + (Math.random() - 0.5) * 100,
                    vx: -taxi.vx * 2,
                    vy: -taxi.vy * 2,
                    life: 1.0,
                    length: 10 + speed * 5
                });
            }
        }

        // Update and draw speed lines
        this.speedLineGraphics.clear();

        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.x += line.vx * 0.5;
            line.y += line.vy * 0.5;
            line.life -= 0.05;

            if (line.life <= 0) {
                this.speedLines.splice(i, 1);
                continue;
            }

            const angle = Math.atan2(line.vy, line.vx);
            const endX = line.x - Math.cos(angle) * line.length * line.life;
            const endY = line.y - Math.sin(angle) * line.length * line.life;

            // v7 API
            this.speedLineGraphics.lineStyle(1, 0xffffff, line.life * 0.5);
            this.speedLineGraphics.moveTo(line.x, line.y);
            this.speedLineGraphics.lineTo(endX, endY);
        }
    }

    updateTaxi(taxi, keys) {
        if (!this.taxiContainer) {
            this.createTaxiGraphics();
        }

        const thrustUp = keys && (keys['ArrowUp'] || keys['KeyW']);
        const thrustLeft = keys && (keys['ArrowLeft'] || keys['KeyA']);
        const thrustRight = keys && (keys['ArrowRight'] || keys['KeyD']);

        // Update taxi container position
        this.taxiContainer.x = taxi.x;
        this.taxiContainer.y = taxi.y;
        this.taxiSprites.body.rotation = taxi.angle || 0;

        // Update landing gear
        const gearOut = (typeof taxi.gearOut === 'undefined') ? true : taxi.gearOut;
        this.taxiSprites.gearLeft.visible = gearOut;
        this.taxiSprites.gearRight.visible = gearOut;

        // Update nav light blinking
        const blink = Math.sin(Date.now() / 200) > 0;
        this.taxiSprites.navLightRed.visible = blink;
        this.taxiSprites.navLightGreen.visible = blink;

        // Update engine glow visibility
        this.taxiSprites.engineGlow.visible = thrustUp;
        this.taxiSprites.sideGlowLeft.visible = thrustRight;
        this.taxiSprites.sideGlowRight.visible = thrustLeft;

        // Always show ambient glow
        this.taxiSprites.ambientGlow.alpha = 0.15;
    }

    createTaxiGraphics() {
        this.taxiContainer = new PIXI.Container();
        this.containers.taxi.addChild(this.taxiContainer);

        // Ambient glow (always visible) - smooth gradient (v7 API)
        const ambientGlow = new PIXI.Graphics();
        const ambientSteps = 15;
        for (let i = ambientSteps; i >= 1; i--) {
            const ratio = i / ambientSteps;
            const smoothRatio = Math.pow(ratio, 0.7);
            const alpha = 0.08 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            ambientGlow.beginFill(0xfbbf24, alpha);
            ambientGlow.drawCircle(0, 0, 50 * smoothRatio);
            ambientGlow.endFill();
        }
        this.taxiSprites.ambientGlow = ambientGlow;
        this.taxiContainer.addChild(ambientGlow);

        // Engine glow (when thrusting up) - smooth gradient (v7 API)
        const engineGlow = new PIXI.Graphics();
        const engineSteps = 20;
        for (let i = engineSteps; i >= 1; i--) {
            const ratio = i / engineSteps;
            const smoothRatio = Math.pow(ratio, 0.6);
            const alpha = 0.35 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            engineGlow.beginFill(0xffff64, alpha);
            engineGlow.drawEllipse(0, 18, 20 * smoothRatio, 35 * smoothRatio);
            engineGlow.endFill();
        }
        // Hot core
        engineGlow.beginFill(0xffffff, 0.6);
        engineGlow.drawEllipse(0, 16, 5, 8);
        engineGlow.endFill();
        engineGlow.visible = false;
        this.taxiSprites.engineGlow = engineGlow;
        this.taxiContainer.addChild(engineGlow);

        // Side glow left - smooth gradient (v7 API)
        const sideGlowLeft = new PIXI.Graphics();
        const sideSteps = 15;
        for (let i = sideSteps; i >= 1; i--) {
            const ratio = i / sideSteps;
            const smoothRatio = Math.pow(ratio, 0.6);
            const alpha = 0.3 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            sideGlowLeft.beginFill(0x00ffff, alpha);
            sideGlowLeft.drawCircle(-20, 0, 20 * smoothRatio);
            sideGlowLeft.endFill();
        }
        sideGlowLeft.beginFill(0xffffff, 0.5);
        sideGlowLeft.drawCircle(-20, 0, 4);
        sideGlowLeft.endFill();
        sideGlowLeft.visible = false;
        this.taxiSprites.sideGlowLeft = sideGlowLeft;
        this.taxiContainer.addChild(sideGlowLeft);

        // Side glow right - smooth gradient (v7 API)
        const sideGlowRight = new PIXI.Graphics();
        for (let i = sideSteps; i >= 1; i--) {
            const ratio = i / sideSteps;
            const smoothRatio = Math.pow(ratio, 0.6);
            const alpha = 0.3 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            sideGlowRight.beginFill(0x00ffff, alpha);
            sideGlowRight.drawCircle(20, 0, 20 * smoothRatio);
            sideGlowRight.endFill();
        }
        sideGlowRight.beginFill(0xffffff, 0.5);
        sideGlowRight.drawCircle(20, 0, 4);
        sideGlowRight.endFill();
        sideGlowRight.visible = false;
        this.taxiSprites.sideGlowRight = sideGlowRight;
        this.taxiContainer.addChild(sideGlowRight);

        // Taxi body container (rotates) (v7 API)
        const body = new PIXI.Graphics();

        // Shadow (elliptical for depth)
        body.beginFill(0x000000, 0.25);
        body.drawEllipse(0, 10, 14, 3);
        body.endFill();

        // Main body - sleek hover car shape
        // Lower body (darker yellow base)
        body.beginFill(0xd9a520);
        body.drawPolygon([
            -16, 2,     // left bottom
            -14, 6,     // left wheel well
            -8, 6,      // inner left
            -6, 4,      // center bottom curve
            6, 4,       // center bottom curve
            8, 6,       // inner right
            14, 6,      // right wheel well
            16, 2,      // right bottom
            14, -2,     // right side
            -14, -2,    // left side
        ]);
        body.endFill();

        // Upper body (main yellow)
        body.beginFill(0xfbbf24);
        body.drawPolygon([
            -14, -2,    // left bottom
            -15, -6,    // left side slant
            -12, -10,   // left top corner
            10, -10,    // right top front
            14, -6,     // right front slope
            14, -2,     // right bottom
        ]);
        body.endFill();

        // Hood/nose (front slope)
        body.beginFill(0xe5b020);
        body.drawPolygon([
            10, -10,    // top front
            14, -6,     // front slope
            16, -2,     // front bottom
            16, 2,      // nose bottom
            12, -4,     // nose curve
        ]);
        body.endFill();

        // Rear engine section
        body.beginFill(0x444444);
        body.drawPolygon([
            -15, -6,    // top
            -17, -4,    // rear top
            -17, 2,     // rear bottom
            -14, 4,     // bottom curve
            -14, -2,    // body connection
        ]);
        body.endFill();

        // Engine exhaust detail
        body.beginFill(0x333333);
        body.drawRect(-17, -2, 3, 4);
        body.endFill();
        body.beginFill(0x222222);
        body.drawRect(-18, -1, 2, 2);
        body.endFill();

        // Body highlight (top shine)
        body.beginFill(0xffffff, 0.25);
        body.drawPolygon([
            -12, -10,   // left top
            -11, -9,    // inner left
            8, -9,      // inner right
            10, -10,    // right top
        ]);
        body.endFill();

        // Side stripe (taxi detail)
        body.beginFill(0x000000, 0.6);
        body.drawPolygon([
            -10, -4,
            10, -4,
            12, -3,
            -10, -3,
        ]);
        body.endFill();

        // Cockpit windshield (angled)
        body.beginFill(0x00d2ff, 0.9);
        body.drawPolygon([
            2, -9,      // top left
            10, -9,     // top right
            12, -5,     // bottom right
            4, -5,      // bottom left
        ]);
        body.endFill();

        // Cockpit shine (reflection)
        body.beginFill(0xffffff, 0.5);
        body.drawPolygon([
            3, -8,
            6, -8,
            7, -6,
            4, -6,
        ]);
        body.endFill();

        // Side window
        body.beginFill(0x00b8e0, 0.7);
        body.drawPolygon([
            -8, -8,
            0, -8,
            0, -5,
            -6, -5,
        ]);
        body.endFill();

        // Roof light (taxi sign)
        body.beginFill(0xffff00);
        body.drawRoundedRect(-4, -12, 8, 3, 1);
        body.endFill();
        body.beginFill(0xffffff, 0.4);
        body.drawRect(-3, -11, 6, 1);
        body.endFill();

        // Front headlight
        body.beginFill(0xffffee);
        body.drawEllipse(15, -1, 2, 2);
        body.endFill();
        body.beginFill(0xffffff, 0.6);
        body.drawEllipse(15, -1, 1, 1);
        body.endFill();

        this.taxiSprites.body = body;
        this.taxiContainer.addChild(body);

        // Landing gear (separate so we can show/hide) (v7 API)
        const gearLeft = new PIXI.Graphics();
        // Landing strut
        gearLeft.beginFill(0x666666);
        gearLeft.drawPolygon([
            -10, 6,
            -8, 6,
            -7, 10,
            -11, 10,
        ]);
        gearLeft.endFill();
        // Landing pad
        gearLeft.beginFill(0x555555);
        gearLeft.drawRoundedRect(-13, 10, 8, 2, 1);
        gearLeft.endFill();
        // Landing light
        gearLeft.beginFill(0x00ff00);
        gearLeft.drawCircle(-9, 11, 1.5);
        gearLeft.endFill();
        this.taxiSprites.gearLeft = gearLeft;
        this.taxiContainer.addChild(gearLeft);

        const gearRight = new PIXI.Graphics();
        // Landing strut
        gearRight.beginFill(0x666666);
        gearRight.drawPolygon([
            8, 6,
            10, 6,
            11, 10,
            7, 10,
        ]);
        gearRight.endFill();
        // Landing pad
        gearRight.beginFill(0x555555);
        gearRight.drawRoundedRect(5, 10, 8, 2, 1);
        gearRight.endFill();
        // Landing light
        gearRight.beginFill(0x00ff00);
        gearRight.drawCircle(9, 11, 1.5);
        gearRight.endFill();
        this.taxiSprites.gearRight = gearRight;
        this.taxiContainer.addChild(gearRight);

        // Nav lights (blinking) (v7 API)
        const navLightRed = new PIXI.Graphics();
        // Glow effect
        navLightRed.beginFill(0xff0000, 0.3);
        navLightRed.drawCircle(-16, -4, 4);
        navLightRed.endFill();
        // Core light
        navLightRed.beginFill(0xff0000);
        navLightRed.drawCircle(-16, -4, 2);
        navLightRed.endFill();
        navLightRed.beginFill(0xffffff, 0.5);
        navLightRed.drawCircle(-16, -4, 1);
        navLightRed.endFill();
        this.taxiSprites.navLightRed = navLightRed;
        this.taxiContainer.addChild(navLightRed);

        const navLightGreen = new PIXI.Graphics();
        // Glow effect
        navLightGreen.beginFill(0x00ff00, 0.3);
        navLightGreen.drawCircle(16, -4, 4);
        navLightGreen.endFill();
        // Core light
        navLightGreen.beginFill(0x00ff00);
        navLightGreen.drawCircle(16, -4, 2);
        navLightGreen.endFill();
        navLightGreen.beginFill(0xffffff, 0.5);
        navLightGreen.drawCircle(16, -4, 1);
        navLightGreen.endFill();
        this.taxiSprites.navLightGreen = navLightGreen;
        this.taxiContainer.addChild(navLightGreen);
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

    // ==================== MINIMAP (Canvas 2D) ====================

    drawMinimap(state) {
        const mCtx = this.minimapCtx;
        const level = state.level;
        if (!level || !mCtx) return;

        const scaleW = 160 / level.w;
        const scaleH = 120 / level.h;

        // Dark background
        mCtx.fillStyle = 'rgba(0, 5, 15, 0.9)';
        mCtx.fillRect(0, 0, 160, 120);

        // Grid lines
        mCtx.strokeStyle = 'rgba(0, 100, 150, 0.2)';
        mCtx.lineWidth = 0.5;
        for (let i = 0; i < 160; i += 20) {
            mCtx.beginPath();
            mCtx.moveTo(i, 0);
            mCtx.lineTo(i, 120);
            mCtx.stroke();
        }
        for (let i = 0; i < 120; i += 20) {
            mCtx.beginPath();
            mCtx.moveTo(0, i);
            mCtx.lineTo(160, i);
            mCtx.stroke();
        }

        // Asteroids
        mCtx.fillStyle = '#6a5040';
        level.asteroids?.forEach(a => {
            const size = Math.max(3, a.size * scaleW * 0.8);
            mCtx.beginPath();
            mCtx.arc(a.x * scaleW, a.y * scaleH, size, 0, Math.PI * 2);
            mCtx.fill();
        });

        // Debris
        mCtx.fillStyle = '#555';
        level.debris?.forEach(d => {
            mCtx.fillRect(d.x * scaleW - 1, d.y * scaleH - 1, 2, 2);
        });

        // Meteors
        level.meteors?.forEach(m => {
            mCtx.fillStyle = '#ff6600';
            mCtx.beginPath();
            mCtx.arc(m.x * scaleW, m.y * scaleH, 3, 0, Math.PI * 2);
            mCtx.fill();

            mCtx.strokeStyle = '#ff9944';
            mCtx.lineWidth = 1;
            mCtx.beginPath();
            mCtx.moveTo(m.x * scaleW, m.y * scaleH);
            mCtx.lineTo((m.x - m.vx * 10) * scaleW, (m.y - m.vy * 10) * scaleH);
            mCtx.stroke();
        });

        // Platforms
        const passengers = level.passengers || [];
        const passIdx = state.passengerIndex || 0;
        const currentPass = passengers[passIdx];

        level.platforms?.forEach(p => {
            const isTarget = state.activePassenger && currentPass && (
                (state.activePassenger.state === 'WAITING' && p.id === currentPass.f) ||
                (state.activePassenger.state === 'IN_TAXI' && p.id === currentPass.t)
            );
            mCtx.fillStyle = isTarget ? '#fff' : (p.fuel ? '#00aaff' : '#444');
            mCtx.fillRect(p.x * scaleW, p.y * scaleH, p.w * scaleW, p.h * scaleH);

            if (isTarget) {
                mCtx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 150) * 0.5})`;
                mCtx.lineWidth = 1;
                mCtx.strokeRect(p.x * scaleW - 2, p.y * scaleH - 2, p.w * scaleW + 4, p.h * scaleH + 4);
            }
        });

        // Enemies
        level.enemies?.forEach(e => {
            mCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            mCtx.beginPath();
            mCtx.arc(e.x * scaleW, e.y * scaleH, 4, 0, Math.PI * 2);
            mCtx.fill();
            mCtx.fillStyle = '#ff0000';
            mCtx.fillRect(e.x * scaleW - 1, e.y * scaleH - 1, 2, 2);
        });

        // Taxi
        mCtx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        mCtx.fillRect(state.taxi.x * scaleW - 4, state.taxi.y * scaleH - 4, 8, 8);
        mCtx.fillStyle = '#fbbf24';
        mCtx.fillRect(state.taxi.x * scaleW - 2, state.taxi.y * scaleH - 2, 4, 4);

        // Border
        mCtx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(0, 0, 160, 120);
    }
}

// Export for use
window.PixiRenderer = PixiRenderer;

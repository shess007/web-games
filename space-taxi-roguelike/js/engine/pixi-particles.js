/**
 * PixiJS Particle Renderer - Proof of Concept
 *
 * This module provides GPU-accelerated particle rendering using PixiJS,
 * designed to work alongside the existing Canvas 2D renderer.
 *
 * Benefits over Canvas 2D:
 * - GPU-accelerated rendering via WebGL
 * - Can handle 10,000+ particles at 60fps (vs ~200 with Canvas 2D)
 * - Built-in particle batching
 * - Additive blending for better glow effects
 */

class PixiParticleRenderer {
    constructor(gameCanvas) {
        this.enabled = true;
        this.gameCanvas = gameCanvas;
        this.app = null;
        this.particleContainer = null;
        this.trailContainer = null;
        this.particles = [];
        this.trails = [];
        this.particleTextures = {};

        // Performance tracking
        this.stats = {
            particleCount: 0,
            trailCount: 0,
            drawTime: 0,
            fps: 0,
            lastFrameTime: performance.now(),
            frameCount: 0,
            lastFpsUpdate: performance.now()
        };

        // Stress test mode
        this.stressTestMode = false;
        this.stressTestParticles = [];

        this.init();
    }

    async init() {
        try {
            // Create PixiJS application with transparent background
            this.app = new PIXI.Application({
                width: WORLD_W,
                height: WORLD_H,
                backgroundAlpha: 0,
                transparent: true,
                antialias: false,
                resolution: 1,
                powerPreference: 'high-performance',
                clearBeforeRender: true
            });

            // Wait for the app to initialize (v7+ requirement)
            if (this.app.init) {
                await this.app.init();
            }

            // Get the canvas view
            const canvas = this.app.view || this.app.canvas;

            // Position the PixiJS canvas over the game canvas
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '10';
            canvas.style.background = 'transparent';

            // Insert after game canvas
            this.gameCanvas.parentNode.insertBefore(canvas, this.gameCanvas.nextSibling);

            // Store reference to canvas
            this.pixiCanvas = canvas;

            // Create containers for layering
            this.trailContainer = new PIXI.ParticleContainer(5000, {
                scale: true,
                position: true,
                alpha: true,
                tint: true
            });

            this.particleContainer = new PIXI.ParticleContainer(10000, {
                scale: true,
                position: true,
                alpha: true,
                tint: true
            });

            // Add glow container with additive blending
            this.glowContainer = new PIXI.Container();
            this.glowContainer.blendMode = PIXI.BLEND_MODES.ADD;

            this.app.stage.addChild(this.trailContainer);
            this.app.stage.addChild(this.glowContainer);
            this.app.stage.addChild(this.particleContainer);

            // Create particle textures
            this.createTextures();

            console.log('[PixiJS] Particle renderer initialized (WebGL)');
            console.log('[PixiJS] Max particles: 10,000 | Max trails: 5,000');

        } catch (error) {
            console.error('[PixiJS] Failed to initialize:', error);
            this.enabled = false;
        }
    }

    createTextures() {
        // Create a circular particle texture
        const createCircleTexture = (size, color, glow = false) => {
            const graphics = new PIXI.Graphics();

            if (glow) {
                // Glow effect - larger, softer
                graphics.beginFill(color, 0.3);
                graphics.drawCircle(size * 2, size * 2, size * 2);
                graphics.endFill();
                graphics.beginFill(color, 0.5);
                graphics.drawCircle(size * 2, size * 2, size);
                graphics.endFill();
            }

            // Core
            graphics.beginFill(0xffffff, 1);
            graphics.drawCircle(glow ? size * 2 : size, glow ? size * 2 : size, size * 0.5);
            graphics.endFill();

            graphics.beginFill(color, 0.9);
            graphics.drawCircle(glow ? size * 2 : size, glow ? size * 2 : size, size * 0.8);
            graphics.endFill();

            const texture = this.app.renderer.generateTexture(graphics);
            graphics.destroy();
            return texture;
        };

        // Create textures for different particle colors
        this.particleTextures = {
            // Thrust particles
            yellow: createCircleTexture(8, 0xffff55, true),
            cyan: createCircleTexture(8, 0x00ffff, true),

            // Explosion particles
            orange: createCircleTexture(10, 0xff5500, true),
            red: createCircleTexture(10, 0xff8800, true),
            white: createCircleTexture(10, 0xffffaa, true),

            // Trail particles (smaller, no glow)
            trailYellow: createCircleTexture(4, 0xffff55, false),
            trailCyan: createCircleTexture(4, 0x00ffff, false),
            trailOrange: createCircleTexture(4, 0xff5500, false),

            // Stress test particle
            stress: createCircleTexture(6, 0xff00ff, true)
        };
    }

    getTextureForColor(color) {
        const colorMap = {
            '#ffff55': 'yellow',
            '#00ffff': 'cyan',
            '#ff5500': 'orange',
            '#ff8800': 'red',
            '#ffaa00': 'red',
            '#ffffaa': 'white',
            '#ffffff': 'white'
        };
        return this.particleTextures[colorMap[color] || 'yellow'];
    }

    getTrailTextureForColor(color) {
        const colorMap = {
            '#ffff55': 'trailYellow',
            '#00ffff': 'trailCyan',
            '#ff5500': 'trailOrange',
            '#ff8800': 'trailOrange',
            '#ffaa00': 'trailOrange',
            '#ffffaa': 'trailYellow',
            '#ffffff': 'trailYellow'
        };
        return this.particleTextures[colorMap[color] || 'trailYellow'];
    }

    /**
     * Sync particles from game state to PixiJS
     */
    syncParticles(gameParticles, camera) {
        if (!this.enabled || !this.app) return;

        const startTime = performance.now();

        // Update camera offset for all containers
        this.particleContainer.x = -camera.x;
        this.particleContainer.y = -camera.y;
        this.trailContainer.x = -camera.x;
        this.trailContainer.y = -camera.y;
        this.glowContainer.x = -camera.x;
        this.glowContainer.y = -camera.y;

        // Sync main particles
        this.syncParticleArray(gameParticles, this.particles, this.particleContainer, false);

        // Update stats
        this.stats.particleCount = this.particles.length;
        this.stats.drawTime = performance.now() - startTime;
        this.updateFps();
    }

    /**
     * Sync trails from renderer to PixiJS
     */
    syncTrails(rendererTrails, camera) {
        if (!this.enabled || !this.app) return;

        // Update camera offset
        this.trailContainer.x = -camera.x;
        this.trailContainer.y = -camera.y;

        // Sync trail particles
        this.syncTrailArray(rendererTrails);

        this.stats.trailCount = this.trails.length;
    }

    syncParticleArray(sourceParticles, pixiParticles, container, isTrail) {
        if (!sourceParticles) return;

        // Remove excess sprites
        while (pixiParticles.length > sourceParticles.length) {
            const sprite = pixiParticles.pop();
            container.removeChild(sprite);
            sprite.destroy();
        }

        // Update or create sprites
        sourceParticles.forEach((p, i) => {
            let sprite = pixiParticles[i];

            if (!sprite) {
                // Create new sprite
                const texture = isTrail
                    ? this.getTrailTextureForColor(p.color)
                    : this.getTextureForColor(p.color);
                sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                container.addChild(sprite);
                pixiParticles.push(sprite);
            }

            // Update sprite properties
            sprite.x = p.x;
            sprite.y = p.y;
            sprite.alpha = p.life;
            sprite.scale.set(p.size / 16); // Normalize to texture size
        });
    }

    syncTrailArray(sourceTrails) {
        if (!sourceTrails) return;

        // Remove excess sprites
        while (this.trails.length > sourceTrails.length) {
            const sprite = this.trails.pop();
            this.trailContainer.removeChild(sprite);
            sprite.destroy();
        }

        // Update or create sprites
        sourceTrails.forEach((t, i) => {
            let sprite = this.trails[i];

            if (!sprite) {
                const texture = this.getTrailTextureForColor(t.color);
                sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                this.trailContainer.addChild(sprite);
                this.trails.push(sprite);
            }

            sprite.x = t.x;
            sprite.y = t.y;
            sprite.alpha = t.life * 0.3;
            sprite.scale.set(t.size / 8);
        });
    }

    updateFps() {
        this.stats.frameCount++;
        const now = performance.now();

        if (now - this.stats.lastFpsUpdate >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastFpsUpdate = now;
        }
    }

    // ==================== STRESS TEST ====================

    startStressTest(count = 5000) {
        this.stressTestMode = true;
        this.stressTestParticles = [];

        // Create stress test particles
        for (let i = 0; i < count; i++) {
            this.stressTestParticles.push({
                x: Math.random() * WORLD_W * 2,
                y: Math.random() * WORLD_H * 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 0.5 + Math.random() * 0.5,
                size: 4 + Math.random() * 8,
                color: ['#ffff55', '#00ffff', '#ff5500', '#ff8800'][Math.floor(Math.random() * 4)]
            });
        }

        console.log(`[PixiJS] Stress test started with ${count} particles`);
    }

    stopStressTest() {
        this.stressTestMode = false;

        // Clear stress test sprites
        this.stressTestParticles = [];
        while (this.particles.length > 0) {
            const sprite = this.particles.pop();
            this.particleContainer.removeChild(sprite);
            sprite.destroy();
        }

        console.log('[PixiJS] Stress test stopped');
    }

    updateStressTest(camera) {
        if (!this.stressTestMode) return;

        const startTime = performance.now();

        // Update particle positions (simulate movement)
        this.stressTestParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around
            if (p.x < 0) p.x = WORLD_W * 2;
            if (p.x > WORLD_W * 2) p.x = 0;
            if (p.y < 0) p.y = WORLD_H * 2;
            if (p.y > WORLD_H * 2) p.y = 0;

            // Pulse life for visual effect
            p.life = 0.5 + Math.sin(performance.now() / 500 + p.x) * 0.3;
        });

        // Sync to PixiJS
        this.syncParticleArray(this.stressTestParticles, this.particles, this.particleContainer, false);

        // Update camera
        this.particleContainer.x = -camera.x;
        this.particleContainer.y = -camera.y;

        this.stats.particleCount = this.stressTestParticles.length;
        this.stats.drawTime = performance.now() - startTime;
        this.updateFps();
    }

    // ==================== UTILITIES ====================

    toggle() {
        this.enabled = !this.enabled;
        if (this.pixiCanvas) {
            this.pixiCanvas.style.display = this.enabled ? 'block' : 'none';
        }
        console.log(`[PixiJS] Particle renderer ${this.enabled ? 'enabled' : 'disabled'}`);
        return this.enabled;
    }

    resize(width, height) {
        if (this.app) {
            this.app.renderer.resize(width, height);
        }
    }

    getStats() {
        return {
            ...this.stats,
            renderer: this.app ? 'WebGL' : 'None',
            enabled: this.enabled
        };
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true });
            this.app = null;
        }
    }
}

// Export for use
window.PixiParticleRenderer = PixiParticleRenderer;

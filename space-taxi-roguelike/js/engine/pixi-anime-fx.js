/**
 * PixiRenderer Anime FX Mixin
 * Handles manga-style visual effects: speed lines, impact frames, focus lines, screen tone
 */

const PixiAnimeFXMixin = {
    /**
     * Initialize anime FX system
     */
    initAnimeFX() {
        // Use the pre-created animeFX container from setupContainers
        this.animeFXContainer = this.containers.animeFX;

        // Speed lines graphics
        this.speedLinesGraphics = new PIXI.Graphics();
        this.animeFXContainer.addChild(this.speedLinesGraphics);

        // Impact frame graphics
        this.impactGraphics = new PIXI.Graphics();
        this.animeFXContainer.addChild(this.impactGraphics);

        // Focus lines graphics
        this.focusLinesGraphics = new PIXI.Graphics();
        this.animeFXContainer.addChild(this.focusLinesGraphics);

        // Screen tone overlay (halftone pattern)
        this.screenToneGraphics = new PIXI.Graphics();
        this.screenToneGraphics.visible = false; // Optional, disabled by default
        this.animeFXContainer.addChild(this.screenToneGraphics);

        // FX state
        this.animeFXState = {
            // Speed lines
            speedLinesActive: false,
            speedLinesIntensity: 0,
            speedLinesAngle: 0,

            // Impact frame
            impactActive: false,
            impactTimer: 0,
            impactDuration: 0.15,
            impactX: 0,
            impactY: 0,
            impactColor: 0xffffff,

            // Focus lines
            focusActive: false,
            focusTimer: 0,
            focusDuration: 0.5,
            focusX: 0,
            focusY: 0,
            focusColor: 0x00ffaa,
            focusMaxRadius: 200,

            // Screen tone
            screenToneEnabled: false
        };

        // Generate screen tone texture
        this.createScreenToneTexture();
    },

    /**
     * Create halftone dot pattern texture
     */
    createScreenToneTexture() {
        const size = 128;
        const dotSpacing = 4;
        const dotRadius = 1;

        const graphics = new PIXI.Graphics();

        for (let y = 0; y < size; y += dotSpacing) {
            for (let x = 0; x < size; x += dotSpacing) {
                // Offset every other row for classic halftone pattern
                const offsetX = (Math.floor(y / dotSpacing) % 2) * (dotSpacing / 2);
                graphics.beginFill(0x000000, 0.05);
                graphics.drawCircle(x + offsetX, y, dotRadius);
                graphics.endFill();
            }
        }

        this.screenToneTexture = this.app.renderer.generateTexture(graphics);
    },

    /**
     * Trigger impact frame effect (collision/damage)
     */
    triggerImpactFrame(x, y, color = 0xffffff) {
        if (!AnimeStyleConfig.enabled) return;

        this.animeFXState.impactActive = true;
        this.animeFXState.impactTimer = 0;
        this.animeFXState.impactX = x;
        this.animeFXState.impactY = y;
        this.animeFXState.impactColor = color;
    },

    /**
     * Trigger focus lines effect (pickup/dropoff)
     */
    triggerFocusLines(x, y, color = 0x00ffaa) {
        if (!AnimeStyleConfig.enabled) return;

        this.animeFXState.focusActive = true;
        this.animeFXState.focusTimer = 0;
        this.animeFXState.focusX = x;
        this.animeFXState.focusY = y;
        this.animeFXState.focusColor = color;
    },

    /**
     * Toggle screen tone overlay
     */
    toggleScreenTone(enabled) {
        this.animeFXState.screenToneEnabled = enabled;
        this.screenToneGraphics.visible = enabled;
    },

    /**
     * Main update loop for anime FX
     */
    updateAnimeFX(state, deltaTime) {
        if (!AnimeStyleConfig.enabled || !this.animeFXContainer) return;

        // Update speed lines based on taxi velocity
        this.updateSpeedLines(state, deltaTime);

        // Update impact frame
        this.updateImpactFrame(deltaTime);

        // Update focus lines
        this.updateFocusLines(deltaTime);

        // Update screen tone position if enabled
        if (this.animeFXState.screenToneEnabled) {
            this.updateScreenTone();
        }
    },

    /**
     * Update speed lines based on taxi movement
     */
    updateSpeedLines(state, deltaTime) {
        const taxi = state?.taxi;
        if (!taxi) return;

        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);
        const speedThreshold = 4.0;
        const maxSpeed = 10.0;

        this.speedLinesGraphics.clear();

        if (speed > speedThreshold) {
            // Calculate intensity (0-1)
            const intensity = Math.min(1, (speed - speedThreshold) / (maxSpeed - speedThreshold));
            this.animeFXState.speedLinesIntensity = intensity;

            // Calculate angle opposite to movement direction
            this.animeFXState.speedLinesAngle = Math.atan2(taxi.vy, taxi.vx) + Math.PI;

            // Draw speed lines centered on screen (in screen space)
            const centerX = WORLD_W / 2;
            const centerY = WORLD_H / 2;

            this.drawRadialSpeedLines(
                this.speedLinesGraphics,
                centerX,
                centerY,
                this.animeFXState.speedLinesAngle,
                intensity
            );
        }
    },

    /**
     * Draw radial speed lines emanating opposite to movement direction
     */
    drawRadialSpeedLines(graphics, centerX, centerY, angle, intensity) {
        const numLines = Math.floor(8 + intensity * 12);
        const spread = Math.PI * 0.6;
        const baseAlpha = 0.3 * intensity;

        for (let i = 0; i < numLines; i++) {
            const lineAngle = angle + (i / numLines - 0.5) * spread;
            const randomOffset = (Math.random() - 0.5) * 0.2;

            // Vary line properties
            const innerRadius = 80 + Math.random() * 40;
            const outerRadius = Math.min(WORLD_W, WORLD_H) * (0.4 + Math.random() * 0.3);
            const lineWidth = 1 + Math.random() * 2;
            const lineAlpha = baseAlpha * (0.5 + Math.random() * 0.5);

            graphics.lineStyle(lineWidth, 0xffffff, lineAlpha);

            const x1 = centerX + Math.cos(lineAngle + randomOffset) * innerRadius;
            const y1 = centerY + Math.sin(lineAngle + randomOffset) * innerRadius;
            const x2 = centerX + Math.cos(lineAngle + randomOffset) * outerRadius;
            const y2 = centerY + Math.sin(lineAngle + randomOffset) * outerRadius;

            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        }

        graphics.lineStyle(0);
    },

    /**
     * Update impact frame effect
     */
    updateImpactFrame(deltaTime) {
        this.impactGraphics.clear();

        if (!this.animeFXState.impactActive) return;

        this.animeFXState.impactTimer += deltaTime;

        if (this.animeFXState.impactTimer >= this.animeFXState.impactDuration) {
            this.animeFXState.impactActive = false;
            return;
        }

        const progress = this.animeFXState.impactTimer / this.animeFXState.impactDuration;
        const alpha = (1 - progress) * 0.6;

        // Screen flash
        this.impactGraphics.beginFill(this.animeFXState.impactColor, alpha * 0.3);
        this.impactGraphics.drawRect(0, 0, WORLD_W, WORLD_H);
        this.impactGraphics.endFill();

        // Radial burst lines from impact point
        const screenX = this.animeFXState.impactX - this.lastCameraX;
        const screenY = this.animeFXState.impactY - this.lastCameraY;

        const numBurstLines = 16;
        const burstRadius = 50 + progress * 150;
        const burstAlpha = alpha * 0.8;

        this.impactGraphics.lineStyle(3, this.animeFXState.impactColor, burstAlpha);

        for (let i = 0; i < numBurstLines; i++) {
            const angle = (i / numBurstLines) * Math.PI * 2;
            const innerR = burstRadius * 0.3;
            const outerR = burstRadius;

            const x1 = screenX + Math.cos(angle) * innerR;
            const y1 = screenY + Math.sin(angle) * innerR;
            const x2 = screenX + Math.cos(angle) * outerR;
            const y2 = screenY + Math.sin(angle) * outerR;

            this.impactGraphics.moveTo(x1, y1);
            this.impactGraphics.lineTo(x2, y2);
        }

        this.impactGraphics.lineStyle(0);

        // Central flash circle
        this.impactGraphics.beginFill(0xffffff, alpha * 0.5);
        this.impactGraphics.drawCircle(screenX, screenY, 20 * (1 - progress));
        this.impactGraphics.endFill();
    },

    /**
     * Update focus lines effect
     */
    updateFocusLines(deltaTime) {
        this.focusLinesGraphics.clear();

        if (!this.animeFXState.focusActive) return;

        this.animeFXState.focusTimer += deltaTime;

        if (this.animeFXState.focusTimer >= this.animeFXState.focusDuration) {
            this.animeFXState.focusActive = false;
            return;
        }

        const progress = this.animeFXState.focusTimer / this.animeFXState.focusDuration;

        // Convert world position to screen position
        const screenX = this.animeFXState.focusX - this.lastCameraX;
        const screenY = this.animeFXState.focusY - this.lastCameraY;

        // Animation: lines converge inward
        const maxRadius = this.animeFXState.focusMaxRadius;
        const currentRadius = maxRadius * (1 - progress * 0.7);
        const innerRadius = currentRadius * 0.2;

        const numLines = 24;
        const alpha = (1 - progress) * 0.5;

        this.focusLinesGraphics.lineStyle(2, this.animeFXState.focusColor, alpha);

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;

            const x1 = screenX + Math.cos(angle) * innerRadius;
            const y1 = screenY + Math.sin(angle) * innerRadius;
            const x2 = screenX + Math.cos(angle) * currentRadius;
            const y2 = screenY + Math.sin(angle) * currentRadius;

            this.focusLinesGraphics.moveTo(x1, y1);
            this.focusLinesGraphics.lineTo(x2, y2);
        }

        this.focusLinesGraphics.lineStyle(0);

        // Central glow
        const glowAlpha = (1 - progress) * 0.4;
        for (let i = 3; i >= 1; i--) {
            const glowRadius = 30 * (i / 3);
            this.focusLinesGraphics.beginFill(this.animeFXState.focusColor, glowAlpha / i);
            this.focusLinesGraphics.drawCircle(screenX, screenY, glowRadius);
            this.focusLinesGraphics.endFill();
        }
    },

    /**
     * Update screen tone overlay
     */
    updateScreenTone() {
        if (!this.screenToneTexture) return;

        this.screenToneGraphics.clear();

        // Tile the screen tone pattern across the screen
        const tileSize = 128;

        this.screenToneGraphics.beginTextureFill({
            texture: this.screenToneTexture,
            matrix: new PIXI.Matrix()
        });
        this.screenToneGraphics.drawRect(0, 0, WORLD_W, WORLD_H);
        this.screenToneGraphics.endFill();
    }
};

// Export for use
window.PixiAnimeFXMixin = PixiAnimeFXMixin;

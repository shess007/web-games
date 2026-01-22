/**
 * RADICAL PixiRenderer Anime FX Mixin
 * Dramatic manga-style effects: speed lines, impact frames, focus lines, action borders
 */

const PixiAnimeFXMixin = {
    /**
     * Initialize anime FX system
     */
    initAnimeFX() {
        // Use the pre-created animeFX container from setupContainers
        this.animeFXContainer = this.containers.animeFX;

        // Background action lines (behind everything in FX layer)
        this.actionBorderGraphics = new PIXI.Graphics();
        this.animeFXContainer.addChild(this.actionBorderGraphics);

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
        this.screenToneGraphics.visible = false;
        this.animeFXContainer.addChild(this.screenToneGraphics);

        // Vignette overlay
        this.vignetteGraphics = new PIXI.Graphics();
        this.animeFXContainer.addChild(this.vignetteGraphics);
        this.createVignetteOverlay();

        // FX state
        this.animeFXState = {
            // Speed lines
            speedLinesActive: false,
            speedLinesIntensity: 0,
            speedLinesAngle: 0,
            speedLinesTime: 0,

            // Impact frame
            impactActive: false,
            impactTimer: 0,
            impactDuration: 0.25,  // Longer duration
            impactX: 0,
            impactY: 0,
            impactColor: 0xffffff,
            impactIntensity: 1.0,

            // Focus lines
            focusActive: false,
            focusTimer: 0,
            focusDuration: 0.6,
            focusX: 0,
            focusY: 0,
            focusColor: 0x00ffaa,
            focusMaxRadius: 250,

            // Action border (persistent during action)
            actionBorderActive: false,
            actionBorderIntensity: 0,

            // Screen tone
            screenToneEnabled: false,

            // Zoom pulse
            zoomPulseActive: false,
            zoomPulseTimer: 0
        };

        // Generate screen tone texture
        this.createScreenToneTexture();
    },

    /**
     * Create dramatic vignette overlay
     */
    createVignetteOverlay() {
        if (!AnimeStyleConfig.background.vignetteEnabled) return;

        const g = this.vignetteGraphics;
        g.clear();

        const strength = AnimeStyleConfig.background.vignetteStrength;
        const centerX = WORLD_W / 2;
        const centerY = WORLD_H / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

        // Radial gradient vignette
        for (let i = 20; i >= 1; i--) {
            const ratio = i / 20;
            const radius = maxRadius * (0.5 + ratio * 0.5);
            const alpha = strength * Math.pow(ratio, 2);

            g.beginFill(0x000000, alpha);
            g.drawCircle(centerX, centerY, radius);
            g.endFill();
        }
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
                const offsetX = (Math.floor(y / dotSpacing) % 2) * (dotSpacing / 2);
                graphics.beginFill(0x000000, 0.05);
                graphics.drawCircle(x + offsetX, y, dotRadius);
                graphics.endFill();
            }
        }

        this.screenToneTexture = this.app.renderer.generateTexture(graphics);
    },

    /**
     * Trigger DRAMATIC impact frame effect
     */
    triggerImpactFrame(x, y, color = 0xff4444, intensity = 1.0) {
        if (!AnimeStyleConfig.enabled) return;

        this.animeFXState.impactActive = true;
        this.animeFXState.impactTimer = 0;
        this.animeFXState.impactX = x;
        this.animeFXState.impactY = y;
        this.animeFXState.impactColor = color;
        this.animeFXState.impactIntensity = intensity;

        // Trigger zoom pulse
        if (AnimeStyleConfig.action.zoomPulseEnabled) {
            this.animeFXState.zoomPulseActive = true;
            this.animeFXState.zoomPulseTimer = 0;
        }
    },

    /**
     * Trigger DRAMATIC focus lines effect
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

        // Update action border
        this.updateActionBorder(state, deltaTime);

        // Update zoom pulse
        this.updateZoomPulse(deltaTime);

        // Update screen tone if enabled
        if (this.animeFXState.screenToneEnabled) {
            this.updateScreenTone();
        }
    },

    /**
     * Update DRAMATIC speed lines
     */
    updateSpeedLines(state, deltaTime) {
        const taxi = state?.taxi;
        if (!taxi) return;

        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);
        const speedThreshold = 3.0;  // Lower threshold
        const maxSpeed = 8.0;

        this.speedLinesGraphics.clear();
        this.animeFXState.speedLinesTime += deltaTime;

        if (speed > speedThreshold) {
            const intensity = Math.min(1, (speed - speedThreshold) / (maxSpeed - speedThreshold));
            this.animeFXState.speedLinesIntensity = intensity;
            this.animeFXState.speedLinesAngle = Math.atan2(taxi.vy, taxi.vx) + Math.PI;

            const centerX = WORLD_W / 2;
            const centerY = WORLD_H / 2;

            this.drawRadicalSpeedLines(
                this.speedLinesGraphics,
                centerX,
                centerY,
                this.animeFXState.speedLinesAngle,
                intensity
            );
        }
    },

    /**
     * Draw RADICAL speed lines
     */
    drawRadicalSpeedLines(graphics, centerX, centerY, angle, intensity) {
        const numLines = Math.floor(15 + intensity * 25);
        const spread = Math.PI * 0.8;
        const baseAlpha = 0.5 * intensity;
        const time = this.animeFXState.speedLinesTime;

        for (let i = 0; i < numLines; i++) {
            const lineAngle = angle + (i / numLines - 0.5) * spread;
            const randomOffset = (Math.random() - 0.5) * 0.2;
            const animOffset = Math.sin(time * 10 + i) * 0.05;

            const innerRadius = 50 + Math.random() * 30;
            const outerRadius = Math.min(WORLD_W, WORLD_H) * (0.45 + Math.random() * 0.35);
            const lineWidth = 2 + Math.random() * 3;
            const lineAlpha = baseAlpha * (0.3 + Math.random() * 0.7);

            // Main line
            graphics.lineStyle(lineWidth, 0xffffff, lineAlpha);

            const finalAngle = lineAngle + randomOffset + animOffset;
            const x1 = centerX + Math.cos(finalAngle) * innerRadius;
            const y1 = centerY + Math.sin(finalAngle) * innerRadius;
            const x2 = centerX + Math.cos(finalAngle) * outerRadius;
            const y2 = centerY + Math.sin(finalAngle) * outerRadius;

            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);

            // Some lines get a secondary parallel line for emphasis
            if (Math.random() > 0.7) {
                const offset = 3;
                graphics.lineStyle(lineWidth * 0.5, 0xffffff, lineAlpha * 0.5);
                graphics.moveTo(x1 + offset, y1 + offset);
                graphics.lineTo(x2 + offset, y2 + offset);
            }
        }

        graphics.lineStyle(0);
    },

    /**
     * Update DRAMATIC impact frame
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
        const intensity = this.animeFXState.impactIntensity;
        const color = this.animeFXState.impactColor;

        // Screen flash with harder edge
        const flashAlpha = (1 - progress) * 0.5 * intensity;
        this.impactGraphics.beginFill(color, flashAlpha);
        this.impactGraphics.drawRect(0, 0, WORLD_W, WORLD_H);
        this.impactGraphics.endFill();

        // White flash in center
        const whiteFlashAlpha = (1 - progress) * 0.3 * intensity;
        this.impactGraphics.beginFill(0xffffff, whiteFlashAlpha);
        this.impactGraphics.drawRect(0, 0, WORLD_W, WORLD_H);
        this.impactGraphics.endFill();

        // Convert to screen space
        const screenX = this.animeFXState.impactX - this.lastCameraX;
        const screenY = this.animeFXState.impactY - this.lastCameraY;

        // === IMPACT STAR BURST ===
        if (AnimeStyleConfig.action.impactStarsEnabled) {
            const starSize = 30 + (1 - progress) * 50;
            const starAlpha = (1 - progress) * intensity;
            AnimeStyleUtils.drawImpactStar(this.impactGraphics, screenX, screenY, starSize, 0xffffff, starAlpha);
        }

        // === RADIAL BURST LINES ===
        const numBurstLines = 24;
        const burstRadius = 30 + progress * 200;
        const burstAlpha = (1 - progress) * 0.9 * intensity;

        this.impactGraphics.lineStyle(4, color, burstAlpha);

        for (let i = 0; i < numBurstLines; i++) {
            const angle = (i / numBurstLines) * Math.PI * 2;
            const innerR = burstRadius * 0.2;
            const outerR = burstRadius;

            const x1 = screenX + Math.cos(angle) * innerR;
            const y1 = screenY + Math.sin(angle) * innerR;
            const x2 = screenX + Math.cos(angle) * outerR;
            const y2 = screenY + Math.sin(angle) * outerR;

            this.impactGraphics.moveTo(x1, y1);
            this.impactGraphics.lineTo(x2, y2);
        }

        this.impactGraphics.lineStyle(0);

        // === SHOCKWAVE RINGS ===
        for (let ring = 0; ring < 3; ring++) {
            const ringProgress = Math.max(0, progress - ring * 0.1);
            const ringRadius = 20 + ringProgress * 150;
            const ringAlpha = (1 - ringProgress) * 0.5 * intensity;

            this.impactGraphics.lineStyle(3 - ring, 0xffffff, ringAlpha);
            this.impactGraphics.drawCircle(screenX, screenY, ringRadius);
        }

        this.impactGraphics.lineStyle(0);

        // === MANGA-STYLE ACTION TEXT EFFECT (optional visual) ===
        // Draw angular emphasis lines around impact
        const emphasisAlpha = (1 - progress) * 0.7;
        this.impactGraphics.lineStyle(2, 0x000000, emphasisAlpha);

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const dist = 60 + progress * 40;
            const len = 20;

            const x1 = screenX + Math.cos(angle) * dist;
            const y1 = screenY + Math.sin(angle) * dist;
            const x2 = screenX + Math.cos(angle) * (dist + len);
            const y2 = screenY + Math.sin(angle) * (dist + len);

            this.impactGraphics.moveTo(x1, y1);
            this.impactGraphics.lineTo(x2, y2);
        }

        this.impactGraphics.lineStyle(0);
    },

    /**
     * Update DRAMATIC focus lines
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
        const screenX = this.animeFXState.focusX - this.lastCameraX;
        const screenY = this.animeFXState.focusY - this.lastCameraY;
        const color = this.animeFXState.focusColor;

        const maxRadius = this.animeFXState.focusMaxRadius;
        const currentRadius = maxRadius * (1 - progress * 0.6);
        const innerRadius = currentRadius * 0.1;

        const numLines = 32;
        const alpha = (1 - progress) * 0.7;

        // Outer glow ring
        this.focusLinesGraphics.lineStyle(5, color, alpha * 0.4);
        this.focusLinesGraphics.drawCircle(screenX, screenY, currentRadius);

        // Converging lines
        this.focusLinesGraphics.lineStyle(3, color, alpha);

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const lengthVar = 0.7 + Math.random() * 0.5;

            const x1 = screenX + Math.cos(angle) * innerRadius;
            const y1 = screenY + Math.sin(angle) * innerRadius;
            const x2 = screenX + Math.cos(angle) * currentRadius * lengthVar;
            const y2 = screenY + Math.sin(angle) * currentRadius * lengthVar;

            this.focusLinesGraphics.moveTo(x1, y1);
            this.focusLinesGraphics.lineTo(x2, y2);
        }

        this.focusLinesGraphics.lineStyle(0);

        // Central glow burst
        const glowAlpha = (1 - progress) * 0.6;
        for (let i = 4; i >= 1; i--) {
            const glowRadius = 40 * (i / 4);
            this.focusLinesGraphics.beginFill(color, glowAlpha / i);
            this.focusLinesGraphics.drawCircle(screenX, screenY, glowRadius);
            this.focusLinesGraphics.endFill();
        }

        // Central bright spot
        this.focusLinesGraphics.beginFill(0xffffff, glowAlpha);
        this.focusLinesGraphics.drawCircle(screenX, screenY, 10);
        this.focusLinesGraphics.endFill();
    },

    /**
     * Update action border (corner emphasis lines during fast movement)
     */
    updateActionBorder(state, deltaTime) {
        const taxi = state?.taxi;
        if (!taxi || !AnimeStyleConfig.action.actionLinesEnabled) {
            this.actionBorderGraphics.clear();
            return;
        }

        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);
        const threshold = 3.5;

        if (speed > threshold) {
            const intensity = Math.min(1, (speed - threshold) / 5);
            this.animeFXState.actionBorderIntensity = intensity;

            this.actionBorderGraphics.clear();
            AnimeStyleUtils.drawActionFrameBorder(
                this.actionBorderGraphics,
                WORLD_W,
                WORLD_H,
                intensity,
                0x000000
            );
        } else {
            this.actionBorderGraphics.clear();
            this.animeFXState.actionBorderIntensity = 0;
        }
    },

    /**
     * Update zoom pulse effect
     */
    updateZoomPulse(deltaTime) {
        if (!this.animeFXState.zoomPulseActive) return;

        this.animeFXState.zoomPulseTimer += deltaTime;

        if (this.animeFXState.zoomPulseTimer > 0.2) {
            this.animeFXState.zoomPulseActive = false;
            // Reset any zoom
            if (this.containers.game) {
                this.containers.game.scale.set(1);
            }
            return;
        }

        // Pulse zoom effect
        const t = this.animeFXState.zoomPulseTimer / 0.2;
        const zoomAmount = AnimeStyleConfig.action.zoomPulseAmount;
        const zoom = 1 + Math.sin(t * Math.PI) * zoomAmount;

        if (this.containers.game) {
            this.containers.game.scale.set(zoom);
            this.containers.game.pivot.set(WORLD_W / 2, WORLD_H / 2);
            this.containers.game.position.set(WORLD_W / 2, WORLD_H / 2);
        }
    },

    /**
     * Update screen tone overlay
     */
    updateScreenTone() {
        if (!this.screenToneTexture) return;

        this.screenToneGraphics.clear();
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

/**
 * PixiRenderer Taxi Module
 * Handles taxi rendering and animation
 */

const PixiTaxiMixin = {
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

        // Update wheel animation (wheels retract when flying)
        const gearTarget = (typeof taxi.gearOut === 'undefined') ? 1.0 : (taxi.gearOut ? 1.0 : 0.0);
        const gearSpeed = 0.15; // Animation speed
        if (this.gearAnimProgress < gearTarget) {
            this.gearAnimProgress = Math.min(gearTarget, this.gearAnimProgress + gearSpeed);
        } else if (this.gearAnimProgress > gearTarget) {
            this.gearAnimProgress = Math.max(gearTarget, this.gearAnimProgress - gearSpeed);
        }
        // Apply animation - uniform scale for round wheels
        this.taxiSprites.gearLeft.scale.set(this.gearAnimProgress);
        this.taxiSprites.gearRight.scale.set(this.gearAnimProgress);
        // Hide completely when fully retracted
        this.taxiSprites.gearLeft.visible = this.gearAnimProgress > 0.01;
        this.taxiSprites.gearRight.visible = this.gearAnimProgress > 0.01;

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
    },

    createTaxiGraphics() {
        this.taxiContainer = new PIXI.Container();
        this.containers.taxi.addChild(this.taxiContainer);

        // Ambient glow (always visible) - soft cozy glow
        const ambientGlow = new PIXI.Graphics();
        const ambientSteps = 15;
        for (let i = ambientSteps; i >= 1; i--) {
            const ratio = i / ambientSteps;
            const smoothRatio = Math.pow(ratio, 0.7);
            const alpha = 0.08 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            ambientGlow.beginFill(0xF9E79F, alpha); // Butter yellow glow
            ambientGlow.drawCircle(0, 0, 50 * smoothRatio);
            ambientGlow.endFill();
        }
        this.taxiSprites.ambientGlow = ambientGlow;
        this.taxiContainer.addChild(ambientGlow);

        // Engine glow (when thrusting up) - cute puff effect
        const engineGlow = new PIXI.Graphics();
        const engineSteps = 18;
        for (let i = engineSteps; i >= 1; i--) {
            const ratio = i / engineSteps;
            const smoothRatio = Math.pow(ratio, 0.6);
            const alpha = 0.25 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            // Soft peach puff color
            engineGlow.beginFill(0xFFCDB2, alpha);
            engineGlow.drawEllipse(0, 20, 18 * smoothRatio, 30 * smoothRatio);
            engineGlow.endFill();
        }
        // Warm center
        engineGlow.beginFill(0xFFF5E4, 0.5);
        engineGlow.drawEllipse(0, 18, 6, 10);
        engineGlow.endFill();
        engineGlow.visible = false;
        this.taxiSprites.engineGlow = engineGlow;
        this.taxiContainer.addChild(engineGlow);

        // Side glow left - soft puff when turning
        const sideGlowLeft = new PIXI.Graphics();
        const sideSteps = 12;
        for (let i = sideSteps; i >= 1; i--) {
            const ratio = i / sideSteps;
            const smoothRatio = Math.pow(ratio, 0.6);
            const alpha = 0.2 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            sideGlowLeft.beginFill(0xE2D1F9, alpha); // Lavender puff
            sideGlowLeft.drawCircle(-22, 0, 18 * smoothRatio);
            sideGlowLeft.endFill();
        }
        sideGlowLeft.beginFill(0xffffff, 0.4);
        sideGlowLeft.drawCircle(-22, 0, 4);
        sideGlowLeft.endFill();
        sideGlowLeft.visible = false;
        this.taxiSprites.sideGlowLeft = sideGlowLeft;
        this.taxiContainer.addChild(sideGlowLeft);

        // Side glow right - soft puff when turning
        const sideGlowRight = new PIXI.Graphics();
        for (let i = sideSteps; i >= 1; i--) {
            const ratio = i / sideSteps;
            const smoothRatio = Math.pow(ratio, 0.6);
            const alpha = 0.2 * Math.pow(1 - smoothRatio, 1.5) * smoothRatio;
            if (alpha < 0.001) continue;
            sideGlowRight.beginFill(0xE2D1F9, alpha); // Lavender puff
            sideGlowRight.drawCircle(22, 0, 18 * smoothRatio);
            sideGlowRight.endFill();
        }
        sideGlowRight.beginFill(0xffffff, 0.4);
        sideGlowRight.drawCircle(22, 0, 4);
        sideGlowRight.endFill();
        sideGlowRight.visible = false;
        this.taxiSprites.sideGlowRight = sideGlowRight;
        this.taxiContainer.addChild(sideGlowRight);

        // CUTE CAR BODY - Side view profile (rotates) - RADICAL ANIME STYLE
        const body = new PIXI.Graphics();

        // Base color for cel-shading
        const baseColor = 0xF9E79F; // Butter yellow
        const useAnimeStyle = typeof AnimeStyleConfig !== 'undefined' && AnimeStyleConfig.enabled;

        // Get shading bands for cel-shading
        const bands = useAnimeStyle ? AnimeStyleUtils.getShadingBands(baseColor) : null;

        // Soft shadow beneath the car
        body.beginFill(0x000000, useAnimeStyle ? 0.3 : 0.15);
        body.drawEllipse(0, 14, 22, 5);
        body.endFill();

        // === RADICAL ANIME: Draw BOLD outline FIRST ===
        if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
            const outlineColor = AnimeStyleUtils.getOutlineColor(baseColor);
            const outlineThickness = AnimeStyleConfig.outline.taxiThickness;
            const outlineAlpha = AnimeStyleConfig.outline.alpha;

            // Main bold outline
            body.lineStyle(outlineThickness, outlineColor, outlineAlpha);
            body.moveTo(-20, 6);
            body.lineTo(-20, -2);
            body.lineTo(-18, -6);
            body.quadraticCurveTo(-14, -12, -6, -12);
            body.lineTo(4, -12);
            body.quadraticCurveTo(12, -12, 16, -6);
            body.lineTo(20, -2);
            body.lineTo(22, 0);
            body.lineTo(22, 6);
            body.lineTo(14, 6);
            body.quadraticCurveTo(12, 10, 8, 10);
            body.quadraticCurveTo(4, 10, 2, 6);
            body.lineTo(-6, 6);
            body.quadraticCurveTo(-8, 10, -12, 10);
            body.quadraticCurveTo(-16, 10, -18, 6);
            body.closePath();
            body.lineStyle(0);

            // === RIM LIGHT on top edge (opposite of shadow) ===
            if (AnimeStyleConfig.outline.rimLightEnabled) {
                body.lineStyle(
                    AnimeStyleConfig.outline.rimLightThickness,
                    AnimeStyleConfig.outline.rimLightColor,
                    AnimeStyleConfig.outline.rimLightAlpha
                );
                body.moveTo(-6, -12);
                body.lineTo(4, -12);
                body.quadraticCurveTo(10, -12, 14, -8);
                body.lineStyle(0);
            }
        }

        // === CLASSIC CAR SILHOUETTE - Side view ===

        // Main car body - base mid-tone
        body.beginFill(baseColor);
        body.moveTo(-20, 6);
        body.lineTo(-20, -2);
        body.lineTo(-18, -6);
        body.quadraticCurveTo(-14, -12, -6, -12);
        body.lineTo(4, -12);
        body.quadraticCurveTo(12, -12, 16, -6);
        body.lineTo(20, -2);
        body.lineTo(22, 0);
        body.lineTo(22, 6);
        body.lineTo(14, 6);
        body.quadraticCurveTo(12, 10, 8, 10);
        body.quadraticCurveTo(4, 10, 2, 6);
        body.lineTo(-6, 6);
        body.quadraticCurveTo(-8, 10, -12, 10);
        body.quadraticCurveTo(-16, 10, -18, 6);
        body.lineTo(-20, 6);
        body.endFill();

        // === RADICAL ANIME: Hard-edge cel-shading ===
        if (useAnimeStyle && AnimeStyleConfig.shading.enabled) {
            // DARK SHADOW BAND - bottom and right (hard edge!)
            body.beginFill(bands.shadow, 0.7);
            body.moveTo(22, 0);
            body.lineTo(22, 6);
            body.lineTo(14, 6);
            body.quadraticCurveTo(12, 10, 8, 10);
            body.quadraticCurveTo(4, 10, 2, 6);
            body.lineTo(-6, 6);
            body.quadraticCurveTo(-8, 10, -12, 10);
            body.quadraticCurveTo(-16, 10, -18, 6);
            body.lineTo(-20, 6);
            body.lineTo(-20, 0);
            body.lineTo(22, 0);
            body.endFill();

            // HIGHLIGHT BAND - top-left area (hard edge!)
            body.beginFill(bands.highlight, 0.6);
            body.moveTo(-18, -6);
            body.quadraticCurveTo(-14, -12, -6, -12);
            body.lineTo(4, -12);
            body.quadraticCurveTo(8, -12, 10, -10);
            body.lineTo(-4, -10);
            body.quadraticCurveTo(-12, -10, -16, -6);
            body.closePath();
            body.endFill();

            // Cross-hatching in deep shadow area
            if (AnimeStyleConfig.shading.crossHatchEnabled) {
                body.lineStyle(1, bands.shadow, AnimeStyleConfig.shading.crossHatchAlpha);
                const hatchSpacing = 4;
                for (let i = 0; i < 8; i++) {
                    const x = -16 + i * hatchSpacing;
                    body.moveTo(x, 3);
                    body.lineTo(x + 6, 8);
                }
                body.lineStyle(0);
            }
        }

        // Lower body accent (soft peach trim)
        body.beginFill(0xFFCDB2); // Soft peach
        body.moveTo(-20, 4);
        body.lineTo(22, 4);
        body.lineTo(22, 6);
        body.lineTo(14, 6);
        body.quadraticCurveTo(12, 10, 8, 10);
        body.quadraticCurveTo(4, 10, 2, 6);
        body.lineTo(-6, 6);
        body.quadraticCurveTo(-8, 10, -12, 10);
        body.quadraticCurveTo(-16, 10, -18, 6);
        body.lineTo(-20, 6);
        body.lineTo(-20, 4);
        body.endFill();

        // Body highlight (roof shine)
        body.beginFill(0xffffff, useAnimeStyle ? 0.5 : 0.3);
        body.moveTo(-4, -12);
        body.lineTo(2, -12);
        body.quadraticCurveTo(8, -12, 12, -9);
        body.lineTo(10, -9);
        body.quadraticCurveTo(6, -11, 0, -11);
        body.lineTo(-4, -11);
        body.lineTo(-4, -12);
        body.endFill();

        // === RADICAL ANIME: BIG specular highlights on roof ===
        if (useAnimeStyle && AnimeStyleConfig.specular.enabled) {
            // Main LARGE anime-style specular ellipse
            body.beginFill(0xffffff, AnimeStyleConfig.specular.alpha);
            body.drawEllipse(-1, -11.5, 8, 2.5);
            body.endFill();

            // Secondary bright spot
            body.beginFill(0xffffff, AnimeStyleConfig.specular.alpha * 0.8);
            body.drawEllipse(8, -9, 4, 2);
            body.endFill();

            // Small tertiary highlight (sparkle point)
            body.beginFill(0xffffff, 1.0);
            body.drawCircle(-4, -11, 1.5);
            body.endFill();

            // Animated sparkle cross on main highlight
            if (AnimeStyleConfig.specular.sparkleEnabled) {
                const sparkleTime = Date.now() / 1000 * AnimeStyleConfig.specular.sparkleSpeed;
                const sparkleAlpha = 0.4 + Math.sin(sparkleTime) * 0.3;
                body.lineStyle(1.5, 0xffffff, sparkleAlpha);
                // Vertical
                body.moveTo(-1, -14);
                body.lineTo(-1, -9);
                // Horizontal
                body.moveTo(-5, -11.5);
                body.lineTo(3, -11.5);
                body.lineStyle(0);
            }
        }

        // === WINDOWS ===

        // Rear window
        body.beginFill(0xE2D1F9, 0.85); // Lavender
        body.moveTo(-16, -5);
        body.quadraticCurveTo(-12, -10, -6, -10);
        body.lineTo(-6, -5);
        body.lineTo(-16, -5);
        body.endFill();

        // Front windshield (angled)
        body.beginFill(0xE2D1F9, 0.85); // Lavender
        body.moveTo(4, -10);
        body.quadraticCurveTo(10, -10, 14, -5);
        body.lineTo(4, -5);
        body.lineTo(4, -10);
        body.endFill();

        // Middle side window
        body.beginFill(0xE2D1F9, 0.75); // Lavender
        body.drawRoundedRect(-4, -10, 6, 5, 1);
        body.endFill();

        // Window reflections - RADICAL anime style
        if (useAnimeStyle) {
            // Front windshield - BOLD diagonal shine stripe
            body.beginFill(0xffffff, 0.8);
            body.moveTo(5, -10);
            body.lineTo(12, -10);
            body.lineTo(8, -6);
            body.lineTo(5, -6);
            body.closePath();
            body.endFill();

            // Secondary shine line
            body.beginFill(0xffffff, 0.5);
            body.moveTo(7, -8);
            body.lineTo(11, -8);
            body.lineTo(10, -6);
            body.lineTo(7, -6);
            body.closePath();
            body.endFill();

            // Rear window - diagonal shine
            body.beginFill(0xffffff, 0.7);
            body.moveTo(-15, -9);
            body.lineTo(-10, -9);
            body.lineTo(-13, -6);
            body.lineTo(-15, -6);
            body.closePath();
            body.endFill();

            // Middle window shine
            body.beginFill(0xffffff, 0.6);
            body.moveTo(-3, -9);
            body.lineTo(0, -9);
            body.lineTo(-1, -7);
            body.lineTo(-3, -7);
            body.closePath();
            body.endFill();

            // Window frame outlines (bold)
            body.lineStyle(1.5, 0x000000, 0.4);
            // Front windshield frame
            body.moveTo(4, -10);
            body.quadraticCurveTo(10, -10, 14, -5);
            body.lineTo(4, -5);
            body.lineTo(4, -10);
            // Rear window frame
            body.moveTo(-16, -5);
            body.quadraticCurveTo(-12, -10, -6, -10);
            body.lineTo(-6, -5);
            body.lineTo(-16, -5);
            body.lineStyle(0);
        } else {
            // Original window reflections
            body.beginFill(0xffffff, 0.5);
            body.drawRoundedRect(5, -9, 3, 2, 1);
            body.endFill();
            body.beginFill(0xffffff, 0.4);
            body.drawRoundedRect(-14, -8, 3, 2, 1);
            body.endFill();
        }

        // === TAXI SIGN ON ROOF ===
        body.beginFill(0xF5B7B1); // Soft coral
        body.drawRoundedRect(-4, -15, 8, 3, 1.5);
        body.endFill();
        body.beginFill(0xffffff, 0.5);
        body.drawRoundedRect(-3, -14.5, 6, 1, 0.5);
        body.endFill();

        // === HEADLIGHT (front) ===
        body.beginFill(0xFFF5E4); // Warm cream
        body.drawCircle(20, 0, 3);
        body.endFill();
        body.beginFill(0xffffff, 0.8);
        body.drawCircle(20, 0, 2);
        body.endFill();
        body.beginFill(0xffffff);
        body.drawCircle(21, -1, 0.8);
        body.endFill();

        // === TAIL LIGHT (rear) ===
        body.beginFill(0xF5B7B1); // Soft coral
        body.drawRoundedRect(-21, -2, 2, 4, 1);
        body.endFill();

        // === DOOR DETAILS ===
        body.lineStyle(1, 0x000000, 0.2);
        body.moveTo(-2, -4);
        body.lineTo(-2, 4);
        body.lineStyle(0);

        // Door handle
        body.beginFill(0xD4A5A5); // Dusty rose
        body.drawRoundedRect(0, 0, 3, 1.5, 0.5);
        body.endFill();

        // === CUTE BLUSH on side ===
        body.beginFill(0xFFB5BA, 0.25); // Soft pink
        body.drawEllipse(12, 0, 3, 2);
        body.endFill();

        this.taxiSprites.body = body;
        this.taxiContainer.addChild(body);

        // === WHEELS - Cute round wheels in wheel wells ===

        // Rear wheel (left in side view)
        const gearLeft = new PIXI.Graphics();

        // Tire (dusty rose)
        gearLeft.beginFill(0xC49A9A); // Slightly darker dusty rose
        gearLeft.drawCircle(0, 0, 5);
        gearLeft.endFill();

        // Wheel rim
        gearLeft.beginFill(0xD4A5A5); // Dusty rose
        gearLeft.drawCircle(0, 0, 3.5);
        gearLeft.endFill();

        // Hub cap
        gearLeft.beginFill(0xE8D0D0);
        gearLeft.drawCircle(0, 0, 2);
        gearLeft.endFill();

        // Shine
        gearLeft.beginFill(0xffffff, 0.5);
        gearLeft.drawCircle(-1, -1, 1);
        gearLeft.endFill();

        gearLeft.x = -12;
        gearLeft.y = 10;
        this.taxiSprites.gearLeft = gearLeft;
        this.taxiContainer.addChild(gearLeft);

        // Front wheel (right in side view)
        const gearRight = new PIXI.Graphics();

        // Tire (dusty rose)
        gearRight.beginFill(0xC49A9A);
        gearRight.drawCircle(0, 0, 5);
        gearRight.endFill();

        // Wheel rim
        gearRight.beginFill(0xD4A5A5);
        gearRight.drawCircle(0, 0, 3.5);
        gearRight.endFill();

        // Hub cap
        gearRight.beginFill(0xE8D0D0);
        gearRight.drawCircle(0, 0, 2);
        gearRight.endFill();

        // Shine
        gearRight.beginFill(0xffffff, 0.5);
        gearRight.drawCircle(-1, -1, 1);
        gearRight.endFill();

        gearRight.x = 10;
        gearRight.y = 10;
        this.taxiSprites.gearRight = gearRight;
        this.taxiContainer.addChild(gearRight);

        // === INDICATOR LIGHTS (turn signals) ===

        // Rear indicator (coral blinker)
        const navLightRed = new PIXI.Graphics();
        navLightRed.beginFill(0xF5B7B1, 0.4); // Soft coral glow
        navLightRed.drawCircle(-20, 2, 4);
        navLightRed.endFill();
        navLightRed.beginFill(0xF5B7B1);
        navLightRed.drawCircle(-20, 2, 2);
        navLightRed.endFill();
        navLightRed.beginFill(0xffffff, 0.6);
        navLightRed.drawCircle(-20, 2, 0.8);
        navLightRed.endFill();
        this.taxiSprites.navLightRed = navLightRed;
        this.taxiContainer.addChild(navLightRed);

        // Front indicator (mint blinker)
        const navLightGreen = new PIXI.Graphics();
        navLightGreen.beginFill(0xB8E0D2, 0.4); // Soft mint glow
        navLightGreen.drawCircle(22, 2, 4);
        navLightGreen.endFill();
        navLightGreen.beginFill(0xB8E0D2);
        navLightGreen.drawCircle(22, 2, 2);
        navLightGreen.endFill();
        navLightGreen.beginFill(0xffffff, 0.6);
        navLightGreen.drawCircle(22, 2, 0.8);
        navLightGreen.endFill();
        this.taxiSprites.navLightGreen = navLightGreen;
        this.taxiContainer.addChild(navLightGreen);
    }
};

// Export for use
window.PixiTaxiMixin = PixiTaxiMixin;

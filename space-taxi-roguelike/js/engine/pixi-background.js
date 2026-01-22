/**
 * PixiRenderer Background Module
 * Handles star field, nebulas, galaxies, and cosmic dust generation/rendering
 */

const PixiBackgroundMixin = {
    // ==================== INITIALIZATION ====================

    initStars(level) {
        if (!this.initialized || !level) return;

        // Clear existing background elements
        this.clearBackgroundElements();

        // Store current theme
        this.currentTheme = level.theme || null;

        // Add background gradient (matching start screen nebula effect)
        this.createBackgroundGradient();

        // Generate galaxy clusters
        this.generateGalaxyClusters(level);

        // Generate cosmic dust
        this.generateCosmicDust(level);

        // Generate nebulas
        this.generateNebulas(level);

        // Generate stars with multiple parallax layers
        this.generateStars(level);

        // Update background color based on theme (soft cozy feel)
        this.app.renderer.background.color = 0xFDEBD0; // Soft blush (cozy)
    },

    createBackgroundGradient() {
        // Create sprite from pre-generated gradient texture
        // Add to fixedBackground container (never moves with camera)
        if (this.textures.backgroundGradient) {
            this.backgroundGradientSprite = new PIXI.Sprite(this.textures.backgroundGradient);
            this.backgroundGradientSprite.width = WORLD_W;
            this.backgroundGradientSprite.height = WORLD_H;
            this.backgroundGradientSprite.x = 0;
            this.backgroundGradientSprite.y = 0;
            this.backgroundGradientSprite.alpha = 0.8;
            this.containers.fixedBackground.addChild(this.backgroundGradientSprite);
        }
    },

    clearBackgroundElements() {
        // Clear background gradient
        if (this.backgroundGradientSprite) {
            this.backgroundGradientSprite.destroy();
            this.backgroundGradientSprite = null;
        }

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

        // Clear cosmic rays
        if (this.cosmicRaysGraphics) {
            this.cosmicRaysGraphics.destroy();
            this.cosmicRaysGraphics = null;
        }
        this.cosmicRays = [];

        // Clear containers
        this.containers.fixedBackground.removeChildren();
        this.containers.background.removeChildren();
        this.containers.parallaxLayer1.removeChildren();
        this.containers.parallaxLayer2.removeChildren();
    },

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
    },

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
    },

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
    },

    generateNebulas(level) {
        // More nebulas with larger radius for more prominent effect (like start screen)
        const nebulaCount = 5 + Math.floor(Math.random() * 4);

        for (let i = 0; i < nebulaCount; i++) {
            const nebula = {
                x: Math.random() * level.w,
                y: Math.random() * level.h,
                radius: 300 + Math.random() * 500,
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
    },

    getNebulaColorHex() {
        // Colors matching the start screen nebula theme (purple, cyan, blue, magenta)
        const colors = [
            0x8a2be2, // Blue Violet (prominent)
            0x00d2ff, // Cyan (prominent - matches start screen)
            0x9932cc, // Dark Orchid
            0x00bfff, // Deep Sky Blue
            0xba55d3, // Medium Orchid
            0x4169e1, // Royal Blue
            0xff3e3e, // Red accent (subtle)
            0x8b008b, // Dark Magenta
            0x00ced1, // Dark Turquoise
            0x9400d3  // Dark Violet
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

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
    },

    drawNebulaCloud(graphics, cx, cy, radius, color, eccentricity, maxAlpha) {
        // Check if anime style banded nebulas are enabled
        const useBanded = typeof AnimeStyleConfig !== 'undefined' &&
                         AnimeStyleConfig.enabled &&
                         AnimeStyleConfig.background.bandedNebulas;

        if (useBanded) {
            // === RADICAL ANIME STYLE: Hard-edge distinct color bands ===
            const numBands = AnimeStyleConfig.background.nebulaSteps || 3;

            // Boost the color saturation for anime vibrancy
            const boostColor = typeof AnimeStyleUtils !== 'undefined'
                ? AnimeStyleUtils.saturateColor(color, 1.3)
                : color;

            // Hard-edge outer glow
            graphics.lineStyle(4, boostColor, maxAlpha * 0.5);
            graphics.drawEllipse(cx, cy, radius, radius * eccentricity);
            graphics.lineStyle(0);

            // Distinct color bands with HARD edges (no smooth gradient)
            for (let i = numBands; i >= 1; i--) {
                const ratio = i / numBands;
                // Stepped alpha for hard cel-shaded look
                const alpha = maxAlpha * (1.2 - ratio * 0.6);
                const bandRadius = radius * ratio;

                // Each band has distinct edge - no blending
                graphics.beginFill(boostColor, alpha);
                graphics.drawEllipse(cx, cy, bandRadius, bandRadius * eccentricity);
                graphics.endFill();

                // Add hard edge outline between bands
                if (i > 1) {
                    graphics.lineStyle(1.5, boostColor, alpha * 0.8);
                    graphics.drawEllipse(cx, cy, bandRadius, bandRadius * eccentricity);
                    graphics.lineStyle(0);
                }
            }

            // Bright inner glow for anime shine effect
            const innerGlow = this.lightenColor ? this.lightenColor(boostColor, 0.3) : 0xffffff;
            graphics.beginFill(innerGlow, maxAlpha * 0.3);
            graphics.drawEllipse(cx, cy, radius * 0.15, radius * 0.15 * eccentricity);
            graphics.endFill();
        } else {
            // Original: Use many more steps for smooth gradient (50 steps instead of 10)
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
    },

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
    },

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
    },

    generateStars(level) {
        // More stars with continuous scroll speeds (like start screen animation)
        const layers = [
            { count: 120, sizeMin: 0.5, sizeMax: 1, speed: 0.2, opacity: 0.4, texture: 'starSmall', scrollSpeed: 0.3, isSparkle: false },
            { count: 90, sizeMin: 1, sizeMax: 2, speed: 0.5, opacity: 0.6, texture: 'starSmall', scrollSpeed: 0.5, isSparkle: false },
            { count: 50, sizeMin: 2, sizeMax: 3, speed: 0.8, opacity: 0.8, texture: 'starMedium', scrollSpeed: 0.8, isSparkle: true },
            { count: 20, sizeMin: 3, sizeMax: 5, speed: 1.0, opacity: 1.0, texture: 'starLarge', scrollSpeed: 1.2, isSparkle: true }
        ];

        // Store level dimensions for wrapping
        this.starFieldWidth = level.w * 1.5;
        this.starFieldHeight = level.h * 1.5;

        // Check if anime mode is enabled
        const animeEnabled = typeof AnimeStyleConfig !== 'undefined' &&
                            AnimeStyleConfig.enabled &&
                            AnimeStyleConfig.background.sparkleStars;

        layers.forEach((layer, layerIdx) => {
            for (let i = 0; i < layer.count; i++) {
                const star = {
                    x: Math.random() * this.starFieldWidth - level.w * 0.25,
                    y: Math.random() * this.starFieldHeight - level.h * 0.25,
                    baseX: 0, // Will store base position for wrapping
                    baseY: 0,
                    s: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
                    o: layer.opacity * (0.5 + Math.random() * 0.5),
                    layer: layerIdx,
                    speed: layer.speed,
                    scrollSpeed: layer.scrollSpeed, // Continuous scroll speed
                    twinkleSpeed: 0.5 + Math.random() * 2,
                    twinkleOffset: Math.random() * Math.PI * 2,
                    color: Math.random() > 0.7 ? this.getStarColorTint() : 0xffffff,
                    isSparkle: animeEnabled && layer.isSparkle,
                    sparklePhase: Math.random() * Math.PI * 2,
                    sparkleSpeed: 1 + Math.random() * 2
                };
                star.baseX = star.x;
                star.baseY = star.y;
                this.stars.push(star);

                // For anime sparkle stars, use Graphics instead of sprite
                if (star.isSparkle) {
                    const sparkleGraphics = new PIXI.Graphics();
                    sparkleGraphics.star = star;
                    this.starSprites.push(sparkleGraphics);
                    this.containers.parallaxLayer2.addChild(sparkleGraphics);
                } else {
                    // Create sprite for regular stars
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
            }
        });

        // Generate cosmic energy rays for anime mode
        if (animeEnabled) {
            this.generateCosmicRays(level);
        }
    },

    generateCosmicRays(level) {
        // Create dramatic cosmic energy rays in background
        this.cosmicRaysGraphics = new PIXI.Graphics();
        this.containers.parallaxLayer1.addChild(this.cosmicRaysGraphics);

        // Generate ray data
        this.cosmicRays = [];
        const rayCount = 8 + Math.floor(Math.random() * 6);

        for (let i = 0; i < rayCount; i++) {
            this.cosmicRays.push({
                x: Math.random() * level.w,
                y: Math.random() * level.h,
                angle: Math.random() * Math.PI * 2,
                length: 200 + Math.random() * 400,
                width: 2 + Math.random() * 4,
                color: this.getCosmicRayColor(),
                alpha: 0.1 + Math.random() * 0.15,
                pulseSpeed: 0.3 + Math.random() * 0.5,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }
    },

    getCosmicRayColor() {
        const colors = [
            0x8a2be2, // Blue Violet
            0x00d2ff, // Cyan
            0xff69b4, // Hot Pink
            0x9932cc, // Dark Orchid
            0x00ffcc, // Aquamarine
            0xffcc00  // Gold
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    getStarColorTint() {
        const colors = [
            0xffcccc, // Red giant
            0xccccff, // Blue
            0xffffcc, // Yellow
            0xffcc99, // Orange
            0xccffff  // Cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // ==================== BACKGROUND UPDATES ====================

    updateBackground(camera, level) {
        // Background gradient is in fixedBackground container - no position update needed
        // Just apply subtle pulsing effect
        if (this.backgroundGradientSprite) {
            this.backgroundGradientSprite.alpha = 0.7 + Math.sin(this.time * 0.2) * 0.1;
        }

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

            // Check if anime style is enabled
            const animeEnabled = typeof AnimeStyleConfig !== 'undefined' && AnimeStyleConfig.enabled;

            if (animeEnabled) {
                // === ANIME STYLE: Hard-edge banded glow ===
                const numBands = 4;
                for (let i = numBands; i >= 1; i--) {
                    const ratio = i / numBands;
                    const alpha = 0.2 * (1.1 - ratio * 0.6);
                    const bandRadius = 150 * ratio;

                    graphics.beginFill(hexColor, alpha);
                    graphics.drawCircle(0, 0, bandRadius);
                    graphics.endFill();

                    // Hard edge outline
                    graphics.lineStyle(1, hexColor, alpha * 0.6);
                    graphics.drawCircle(0, 0, bandRadius);
                    graphics.lineStyle(0);
                }

                // Bright center
                graphics.beginFill(0xffffff, 0.3);
                graphics.drawCircle(0, 0, 20);
                graphics.endFill();
            } else {
                // Original: Use more steps and exponential falloff for smoother gradient
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
            }

            // Draw stars with rotation (v7 API)
            cluster.stars.forEach(star => {
                const cos = Math.cos(cluster.rotation);
                const sin = Math.sin(cluster.rotation);
                const rotatedX = star.offsetX * cos - star.offsetY * sin;
                const rotatedY = star.offsetX * sin + star.offsetY * cos;

                const twinkle = 0.6 + Math.sin(this.time * 0.5 + star.offsetX * 0.1) * 0.4;

                if (animeEnabled && star.size > 1) {
                    // Draw anime sparkle for larger stars
                    const sparkleSize = star.size * 2;
                    const armLength = sparkleSize;
                    const armWidth = sparkleSize * 0.2;

                    graphics.beginFill(hexColor, star.brightness * twinkle);

                    // 4-point star shape
                    graphics.moveTo(rotatedX, rotatedY - armLength);
                    graphics.lineTo(rotatedX + armWidth, rotatedY);
                    graphics.lineTo(rotatedX, rotatedY + armLength);
                    graphics.lineTo(rotatedX - armWidth, rotatedY);
                    graphics.closePath();

                    graphics.moveTo(rotatedX - armLength * 0.7, rotatedY);
                    graphics.lineTo(rotatedX, rotatedY + armWidth);
                    graphics.lineTo(rotatedX + armLength * 0.7, rotatedY);
                    graphics.lineTo(rotatedX, rotatedY - armWidth);
                    graphics.closePath();

                    graphics.endFill();

                    // Bright center
                    graphics.beginFill(0xffffff, star.brightness * twinkle * 0.8);
                    graphics.drawCircle(rotatedX, rotatedY, star.size * 0.3);
                    graphics.endFill();
                } else {
                    // Draw star with small glow
                    graphics.beginFill(hexColor, star.brightness * twinkle * 0.3);
                    graphics.drawCircle(rotatedX, rotatedY, star.size * 2.5);
                    graphics.endFill();
                    graphics.beginFill(hexColor, star.brightness * twinkle);
                    graphics.drawCircle(rotatedX, rotatedY, star.size);
                    graphics.endFill();
                }
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

        // Update stars with parallax, twinkling, and continuous scrolling
        this.starSprites.forEach(sprite => {
            const star = sprite.star;
            if (!star) return;

            // Continuous scrolling effect (like start screen starfield)
            const scrollOffset = this.time * star.scrollSpeed * 15;

            // Calculate scrolled position with wrapping
            let scrolledY = star.baseY + scrollOffset;

            // Wrap stars when they go off screen (creates infinite scroll effect)
            if (this.starFieldHeight) {
                scrolledY = ((scrolledY % this.starFieldHeight) + this.starFieldHeight) % this.starFieldHeight - level.h * 0.25;
            }

            // Parallax position combined with scroll
            const parallaxX = star.baseX - camera.x * (1 - star.speed);
            const parallaxY = scrolledY - camera.y * (1 - star.speed);

            // Twinkle
            const twinkle = 0.5 + Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset) * 0.5;

            // Check if this is an anime sparkle star (Graphics object)
            if (star.isSparkle && sprite instanceof PIXI.Graphics) {
                this.drawAnimeSparkle(sprite, parallaxX, parallaxY, star, twinkle);
            } else {
                sprite.x = parallaxX;
                sprite.y = parallaxY;
                sprite.alpha = star.o * twinkle;
            }
        });

        // Update cosmic energy rays
        this.updateCosmicRays(camera);
    },

    drawAnimeSparkle(graphics, x, y, star, twinkle) {
        graphics.clear();

        const size = star.s * 2;
        const alpha = star.o * twinkle;
        const color = star.color;

        // Animated sparkle pulsing
        const sparkleTime = this.time * star.sparkleSpeed + star.sparklePhase;
        const pulseScale = 0.8 + Math.sin(sparkleTime) * 0.3;
        const rotationOffset = Math.sin(sparkleTime * 0.5) * 0.2;

        // Draw 8-point anime sparkle
        const armLength = size * pulseScale;
        const armWidth = size * 0.15;

        graphics.beginFill(color, alpha);

        // Main 4-point star (vertical and horizontal arms)
        // Vertical arm
        graphics.moveTo(0, -armLength * 1.3);
        graphics.lineTo(armWidth, 0);
        graphics.lineTo(0, armLength * 1.3);
        graphics.lineTo(-armWidth, 0);
        graphics.closePath();

        // Horizontal arm
        graphics.moveTo(-armLength, 0);
        graphics.lineTo(0, armWidth);
        graphics.lineTo(armLength, 0);
        graphics.lineTo(0, -armWidth);
        graphics.closePath();

        graphics.endFill();

        // Secondary diagonal arms (for 8-point effect)
        const diagLength = armLength * 0.6;
        const diagWidth = armWidth * 0.7;

        graphics.beginFill(color, alpha * 0.8);

        // Diagonal 1 (top-left to bottom-right)
        graphics.moveTo(-diagLength * 0.707, -diagLength * 0.707);
        graphics.lineTo(diagWidth * 0.5, -diagWidth * 0.5);
        graphics.lineTo(diagLength * 0.707, diagLength * 0.707);
        graphics.lineTo(-diagWidth * 0.5, diagWidth * 0.5);
        graphics.closePath();

        // Diagonal 2 (top-right to bottom-left)
        graphics.moveTo(diagLength * 0.707, -diagLength * 0.707);
        graphics.lineTo(diagWidth * 0.5, diagWidth * 0.5);
        graphics.lineTo(-diagLength * 0.707, diagLength * 0.707);
        graphics.lineTo(-diagWidth * 0.5, -diagWidth * 0.5);
        graphics.closePath();

        graphics.endFill();

        // Bright center glow
        graphics.beginFill(0xffffff, alpha * 0.9);
        graphics.drawCircle(0, 0, size * 0.25);
        graphics.endFill();

        // Outer glow ring (subtle)
        graphics.beginFill(color, alpha * 0.2);
        graphics.drawCircle(0, 0, size * 0.8);
        graphics.endFill();

        // Position the graphics
        graphics.x = x;
        graphics.y = y;
        graphics.rotation = rotationOffset;
    },

    updateCosmicRays(camera) {
        if (!this.cosmicRaysGraphics || !this.cosmicRays) return;

        this.cosmicRaysGraphics.clear();

        this.cosmicRays.forEach(ray => {
            // Pulsing alpha
            const pulseAlpha = ray.alpha * (0.5 + Math.sin(this.time * ray.pulseSpeed + ray.pulseOffset) * 0.5);

            // Parallax position
            const parallaxX = ray.x - camera.x * 0.05;
            const parallaxY = ray.y - camera.y * 0.05;

            // Draw the cosmic ray with gradient effect
            const endX = parallaxX + Math.cos(ray.angle) * ray.length;
            const endY = parallaxY + Math.sin(ray.angle) * ray.length;

            // Main ray line
            this.cosmicRaysGraphics.lineStyle(ray.width, ray.color, pulseAlpha);
            this.cosmicRaysGraphics.moveTo(parallaxX, parallaxY);
            this.cosmicRaysGraphics.lineTo(endX, endY);

            // Glow effect (thicker, more transparent)
            this.cosmicRaysGraphics.lineStyle(ray.width * 3, ray.color, pulseAlpha * 0.3);
            this.cosmicRaysGraphics.moveTo(parallaxX, parallaxY);
            this.cosmicRaysGraphics.lineTo(endX, endY);

            // Bright center core
            this.cosmicRaysGraphics.lineStyle(ray.width * 0.5, 0xffffff, pulseAlpha * 0.6);
            this.cosmicRaysGraphics.moveTo(parallaxX, parallaxY);
            this.cosmicRaysGraphics.lineTo(endX, endY);
        });

        this.cosmicRaysGraphics.lineStyle(0);
    }
};

// Export for use
window.PixiBackgroundMixin = PixiBackgroundMixin;

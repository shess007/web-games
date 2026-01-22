/**
 * RADICAL Anime Style Configuration and Utilities
 * Full cel-shading, bold outlines, dramatic effects
 */

const AnimeStyleConfig = {
    // Master toggle
    enabled: true,

    // BOLD outline settings
    outline: {
        enabled: true,
        thickness: 3.5,          // Thick bold outlines
        alpha: 0.85,             // Strong visibility
        darkenAmount: 0.5,       // Much darker for contrast
        // Object-specific thickness
        taxiThickness: 4.0,      // Hero gets boldest outline
        asteroidThickness: 3.5,
        buildingThickness: 3.0,
        enemyThickness: 5.0,     // VERY thick for menacing look
        passengerThickness: 2.5,
        platformThickness: 3.0,
        // Rim light (bright edge on opposite side of shadow)
        rimLightEnabled: true,
        rimLightColor: 0xffffff,
        rimLightAlpha: 0.4,
        rimLightThickness: 1.5
    },

    // HARD EDGE cel-shading settings
    shading: {
        enabled: true,
        // Three distinct bands with hard edges
        shadowDarken: 0.4,       // 40% darker - dramatic shadow
        highlightLighten: 0.25,  // 25% lighter - bright highlight
        // Hard edge positions (0-1 from shadow to light)
        shadowCutoff: 0.4,       // Where shadow ends
        highlightCutoff: 0.75,   // Where highlight begins
        // Implied light direction (top-left, 45 degrees)
        lightAngle: -Math.PI / 4,
        // Cross-hatching for deep shadows
        crossHatchEnabled: true,
        crossHatchDensity: 4,
        crossHatchAlpha: 0.2
    },

    // DRAMATIC specular highlight settings
    specular: {
        enabled: true,
        alpha: 0.7,              // Very bright
        size: 0.25,              // Large anime shine
        offsetX: -0.25,          // Top-left position
        offsetY: -0.3,
        // Secondary smaller highlight
        secondaryEnabled: true,
        secondaryAlpha: 0.5,
        secondarySize: 0.12,
        // Animated sparkle
        sparkleEnabled: true,
        sparkleSpeed: 3.0
    },

    // Background effects
    background: {
        sparkleStars: true,
        bandedNebulas: true,
        nebulaSteps: 3,          // Fewer steps = harder bands
        // Dramatic vignette
        vignetteEnabled: true,
        vignetteStrength: 0.3
    },

    // ACTION effects
    action: {
        // Screen flash on events
        flashEnabled: true,
        flashIntensity: 0.8,
        // Action lines around screen border
        actionLinesEnabled: true,
        actionLinesCount: 24,
        // Impact stars
        impactStarsEnabled: true,
        // Dramatic zoom effect
        zoomPulseEnabled: true,
        zoomPulseAmount: 0.02
    },

    // Color enhancement
    colors: {
        saturationBoost: 1.2,    // More vivid colors
        contrastBoost: 1.15      // Higher contrast
    }
};

const AnimeStyleUtils = {
    /**
     * Get bold outline color (much darker than base)
     */
    getOutlineColor(baseColor, darkenAmount = AnimeStyleConfig.outline.darkenAmount) {
        return this.darkenColor(baseColor, darkenAmount);
    },

    /**
     * Get THREE distinct shading bands with hard edges
     */
    getShadingBands(baseColor) {
        return {
            shadow: this.darkenColor(baseColor, AnimeStyleConfig.shading.shadowDarken),
            mid: baseColor,
            highlight: this.lightenColor(baseColor, AnimeStyleConfig.shading.highlightLighten)
        };
    },

    /**
     * Darken a color by a percentage (0-1)
     */
    darkenColor(color, amount) {
        const r = Math.max(0, Math.floor(((color >> 16) & 0xff) * (1 - amount)));
        const g = Math.max(0, Math.floor(((color >> 8) & 0xff) * (1 - amount)));
        const b = Math.max(0, Math.floor((color & 0xff) * (1 - amount)));
        return (r << 16) | (g << 8) | b;
    },

    /**
     * Lighten a color by a percentage (0-1)
     */
    lightenColor(color, amount) {
        const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(255 * amount));
        const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(255 * amount));
        const b = Math.min(255, (color & 0xff) + Math.floor(255 * amount));
        return (r << 16) | (g << 8) | b;
    },

    /**
     * Boost color saturation
     */
    saturateColor(color, amount = AnimeStyleConfig.colors.saturationBoost) {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        const newR = Math.min(255, Math.max(0, Math.round(gray + (r - gray) * amount)));
        const newG = Math.min(255, Math.max(0, Math.round(gray + (g - gray) * amount)));
        const newB = Math.min(255, Math.max(0, Math.round(gray + (b - gray) * amount)));

        return (newR << 16) | (newG << 8) | newB;
    },

    /**
     * Draw DRAMATIC anime-style specular highlight
     */
    drawSpecularHighlight(graphics, centerX, centerY, objectSize, color = 0xffffff) {
        if (!AnimeStyleConfig.specular.enabled) return;

        const config = AnimeStyleConfig.specular;
        const size = objectSize * config.size;
        const offsetX = objectSize * config.offsetX;
        const offsetY = objectSize * config.offsetY;

        // Main large specular - anime style ellipse
        graphics.beginFill(color, config.alpha);
        graphics.drawEllipse(
            centerX + offsetX,
            centerY + offsetY,
            size * 1.5,
            size * 0.7
        );
        graphics.endFill();

        // Secondary smaller highlight
        if (config.secondaryEnabled) {
            graphics.beginFill(color, config.secondaryAlpha);
            graphics.drawEllipse(
                centerX + offsetX * 0.3,
                centerY + offsetY * 0.6,
                size * config.secondarySize * 3,
                size * config.secondarySize * 1.5
            );
            graphics.endFill();
        }

        // Animated sparkle cross
        if (config.sparkleEnabled) {
            const sparkleTime = Date.now() / 1000 * config.sparkleSpeed;
            const sparkleAlpha = 0.3 + Math.sin(sparkleTime) * 0.2;
            const sparkleSize = size * 0.4;

            graphics.lineStyle(1.5, color, sparkleAlpha);
            // Vertical line
            graphics.moveTo(centerX + offsetX, centerY + offsetY - sparkleSize);
            graphics.lineTo(centerX + offsetX, centerY + offsetY + sparkleSize);
            // Horizontal line
            graphics.moveTo(centerX + offsetX - sparkleSize, centerY + offsetY);
            graphics.lineTo(centerX + offsetX + sparkleSize, centerY + offsetY);
            graphics.lineStyle(0);
        }
    },

    /**
     * Draw BOLD outline for a shape path
     */
    drawBoldOutline(graphics, drawPath, baseColor, thickness = null) {
        if (!AnimeStyleConfig.outline.enabled) return;

        const outlineThickness = thickness || AnimeStyleConfig.outline.thickness;
        const outlineColor = this.getOutlineColor(baseColor);

        // Draw outline
        graphics.lineStyle(outlineThickness, outlineColor, AnimeStyleConfig.outline.alpha);
        drawPath(graphics);
        graphics.lineStyle(0);

        // Draw rim light on opposite side
        if (AnimeStyleConfig.outline.rimLightEnabled) {
            graphics.lineStyle(
                AnimeStyleConfig.outline.rimLightThickness,
                AnimeStyleConfig.outline.rimLightColor,
                AnimeStyleConfig.outline.rimLightAlpha
            );
            drawPath(graphics);
            graphics.lineStyle(0);
        }
    },

    /**
     * Draw hard-edge cel-shading on a circular object
     */
    drawCelShadingCircle(graphics, x, y, radius, baseColor) {
        if (!AnimeStyleConfig.shading.enabled) return;

        const bands = this.getShadingBands(baseColor);
        const lightAngle = AnimeStyleConfig.shading.lightAngle;

        // Shadow crescent (bottom-right, hard edge)
        graphics.beginFill(bands.shadow, 0.7);
        graphics.arc(x, y, radius, lightAngle + Math.PI * 0.3, lightAngle + Math.PI * 1.2);
        graphics.lineTo(x, y);
        graphics.closePath();
        graphics.endFill();

        // Highlight crescent (top-left, hard edge)
        graphics.beginFill(bands.highlight, 0.5);
        graphics.arc(x, y, radius * 0.9, lightAngle - Math.PI * 0.4, lightAngle + Math.PI * 0.2);
        graphics.lineTo(x, y);
        graphics.closePath();
        graphics.endFill();

        // Cross-hatching in deep shadow
        if (AnimeStyleConfig.shading.crossHatchEnabled) {
            this.drawCrossHatching(graphics, x + radius * 0.3, y + radius * 0.3, radius * 0.5, bands.shadow);
        }
    },

    /**
     * Draw cross-hatching pattern for deep shadows
     */
    drawCrossHatching(graphics, x, y, size, color) {
        const density = AnimeStyleConfig.shading.crossHatchDensity;
        const alpha = AnimeStyleConfig.shading.crossHatchAlpha;
        const spacing = size / density;

        graphics.lineStyle(1, color, alpha);

        // Diagonal lines (top-left to bottom-right)
        for (let i = -density; i <= density; i++) {
            const offset = i * spacing;
            graphics.moveTo(x - size + offset, y - size);
            graphics.lineTo(x + offset, y + size);
        }

        // Cross lines (top-right to bottom-left)
        for (let i = -density; i <= density; i++) {
            const offset = i * spacing;
            graphics.moveTo(x + size + offset, y - size);
            graphics.lineTo(x + offset, y + size);
        }

        graphics.lineStyle(0);
    },

    /**
     * Draw 4-point anime sparkle star (BIGGER)
     */
    drawSparkle(graphics, x, y, size, color, alpha = 1.0) {
        const armLength = size * 1.2;
        const armWidth = size * 0.2;

        graphics.beginFill(color, alpha);

        // Vertical arm (taller)
        graphics.moveTo(x, y - armLength);
        graphics.lineTo(x + armWidth, y);
        graphics.lineTo(x, y + armLength);
        graphics.lineTo(x - armWidth, y);
        graphics.closePath();

        // Horizontal arm
        graphics.moveTo(x - armLength * 0.8, y);
        graphics.lineTo(x, y + armWidth);
        graphics.lineTo(x + armLength * 0.8, y);
        graphics.lineTo(x, y - armWidth);
        graphics.closePath();

        graphics.endFill();

        // Bright center
        graphics.beginFill(0xffffff, alpha);
        graphics.drawCircle(x, y, size * 0.2);
        graphics.endFill();

        // Small diagonal arms for extra sparkle
        const diagLength = armLength * 0.5;
        const diagWidth = armWidth * 0.7;
        graphics.beginFill(color, alpha * 0.7);

        // Diagonal 1
        graphics.moveTo(x - diagLength * 0.7, y - diagLength * 0.7);
        graphics.lineTo(x + diagWidth * 0.5, y - diagWidth * 0.5);
        graphics.lineTo(x + diagLength * 0.7, y + diagLength * 0.7);
        graphics.lineTo(x - diagWidth * 0.5, y + diagWidth * 0.5);
        graphics.closePath();

        graphics.endFill();
    },

    /**
     * Draw DRAMATIC manga speed lines
     */
    drawSpeedLines(graphics, centerX, centerY, angle, intensity, color = 0xffffff, alpha = 0.6) {
        const numLines = Math.floor(12 + intensity * 20);
        const spread = Math.PI * 0.7;
        const baseAlpha = alpha * intensity;

        for (let i = 0; i < numLines; i++) {
            const lineAngle = angle + (i / numLines - 0.5) * spread;
            const randomOffset = (Math.random() - 0.5) * 0.15;

            const innerRadius = 30 + Math.random() * 20;
            const outerRadius = 200 + Math.random() * 150;
            const lineWidth = 1.5 + Math.random() * 2.5;
            const lineAlpha = baseAlpha * (0.4 + Math.random() * 0.6);

            graphics.lineStyle(lineWidth, color, lineAlpha);

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
     * Draw focus/converging lines (DRAMATIC version)
     */
    drawFocusLines(graphics, centerX, centerY, radius, numLines = 24, color = 0xffffff, alpha = 0.7) {
        // Outer glow ring
        graphics.lineStyle(4, color, alpha * 0.3);
        graphics.drawCircle(centerX, centerY, radius);

        graphics.lineStyle(3, color, alpha);

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const innerRadius = radius * 0.15;
            const outerRadius = radius;

            // Vary line length
            const lengthVar = 0.8 + Math.random() * 0.4;

            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius * lengthVar;
            const y2 = centerY + Math.sin(angle) * outerRadius * lengthVar;

            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        }

        graphics.lineStyle(0);
    },

    /**
     * Draw impact star burst
     */
    drawImpactStar(graphics, x, y, size, color = 0xffffff, alpha = 1.0) {
        const points = 8;
        const outerRadius = size;
        const innerRadius = size * 0.4;

        graphics.beginFill(color, alpha);

        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }

        graphics.closePath();
        graphics.endFill();

        // Center glow
        graphics.beginFill(0xffffff, alpha * 0.8);
        graphics.drawCircle(x, y, size * 0.2);
        graphics.endFill();
    },

    /**
     * Draw action frame border lines
     */
    drawActionFrameBorder(graphics, width, height, intensity = 1.0, color = 0x000000) {
        const lineCount = Math.floor(8 + intensity * 16);
        const maxLength = Math.min(width, height) * 0.15;

        graphics.lineStyle(3, color, 0.8 * intensity);

        // Top-left corner
        for (let i = 0; i < lineCount / 4; i++) {
            const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.5;
            const length = maxLength * (0.5 + Math.random() * 0.5);
            const startX = Math.random() * width * 0.2;
            const startY = Math.random() * height * 0.2;

            graphics.moveTo(startX, startY);
            graphics.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        }

        // Top-right corner
        for (let i = 0; i < lineCount / 4; i++) {
            const angle = -Math.PI * 3 / 4 + (Math.random() - 0.5) * 0.5;
            const length = maxLength * (0.5 + Math.random() * 0.5);
            const startX = width - Math.random() * width * 0.2;
            const startY = Math.random() * height * 0.2;

            graphics.moveTo(startX, startY);
            graphics.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        }

        // Bottom-left corner
        for (let i = 0; i < lineCount / 4; i++) {
            const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
            const length = maxLength * (0.5 + Math.random() * 0.5);
            const startX = Math.random() * width * 0.2;
            const startY = height - Math.random() * height * 0.2;

            graphics.moveTo(startX, startY);
            graphics.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        }

        // Bottom-right corner
        for (let i = 0; i < lineCount / 4; i++) {
            const angle = Math.PI * 3 / 4 + (Math.random() - 0.5) * 0.5;
            const length = maxLength * (0.5 + Math.random() * 0.5);
            const startX = width - Math.random() * width * 0.2;
            const startY = height - Math.random() * height * 0.2;

            graphics.moveTo(startX, startY);
            graphics.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        }

        graphics.lineStyle(0);
    },

    /**
     * Draw rim light on edge of circular object
     */
    drawRimLight(graphics, x, y, radius, baseColor) {
        if (!AnimeStyleConfig.outline.rimLightEnabled) return;

        const lightAngle = AnimeStyleConfig.shading.lightAngle;
        const rimAngle = lightAngle + Math.PI; // Opposite side from light

        graphics.lineStyle(
            AnimeStyleConfig.outline.rimLightThickness * 2,
            AnimeStyleConfig.outline.rimLightColor,
            AnimeStyleConfig.outline.rimLightAlpha
        );

        graphics.arc(x, y, radius - 1, rimAngle - Math.PI * 0.4, rimAngle + Math.PI * 0.4);
        graphics.lineStyle(0);
    }
};

// Export for use
window.AnimeStyleConfig = AnimeStyleConfig;
window.AnimeStyleUtils = AnimeStyleUtils;

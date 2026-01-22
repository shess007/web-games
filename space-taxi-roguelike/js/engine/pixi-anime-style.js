/**
 * Anime Style Configuration and Utilities
 * Provides cel-shading, outline, and specular highlight functions
 */

const AnimeStyleConfig = {
    // Master toggle
    enabled: true,

    // Outline settings
    outline: {
        enabled: true,
        thickness: 2.5,        // Base outline thickness
        alpha: 0.6,            // Outline opacity
        darkenAmount: 0.35,    // How much darker than base color
        // Special cases
        taxiThickness: 2.5,
        asteroidThickness: 2.5,
        buildingThickness: 2.0,
        enemyThickness: 4.0,   // Thicker, more dramatic for enemies
        passengerThickness: 2.0
    },

    // Cel-shading settings
    shading: {
        enabled: true,
        shadowDarken: 0.25,    // 25% darker for shadow
        highlightLighten: 0.15, // 15% lighter for highlight
        // Implied light direction (top-left)
        lightAngle: -Math.PI / 4
    },

    // Specular highlight settings
    specular: {
        enabled: true,
        alpha: 0.4,
        size: 0.15,            // Relative to object size
        offsetX: -0.2,         // Relative offset from center
        offsetY: -0.25
    },

    // Background effects
    background: {
        sparkleStars: true,    // Use 4-point sparkles instead of round stars
        bandedNebulas: true,   // Use distinct color bands
        nebulaSteps: 4         // Number of color bands
    }
};

const AnimeStyleUtils = {
    /**
     * Get outline color (darkened version of base color)
     */
    getOutlineColor(baseColor, darkenAmount = AnimeStyleConfig.outline.darkenAmount) {
        return this.darkenColor(baseColor, darkenAmount);
    },

    /**
     * Get shading bands from base color
     * Returns { shadow, mid, highlight }
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
     * Draw anime-style specular highlight ellipse
     */
    drawSpecularHighlight(graphics, centerX, centerY, objectSize, color = 0xffffff) {
        if (!AnimeStyleConfig.specular.enabled) return;

        const size = objectSize * AnimeStyleConfig.specular.size;
        const offsetX = objectSize * AnimeStyleConfig.specular.offsetX;
        const offsetY = objectSize * AnimeStyleConfig.specular.offsetY;

        // Main specular
        graphics.beginFill(color, AnimeStyleConfig.specular.alpha);
        graphics.drawEllipse(
            centerX + offsetX,
            centerY + offsetY,
            size * 1.2,
            size * 0.6
        );
        graphics.endFill();

        // Small secondary highlight
        graphics.beginFill(color, AnimeStyleConfig.specular.alpha * 0.6);
        graphics.drawEllipse(
            centerX + offsetX * 0.5,
            centerY + offsetY * 0.8,
            size * 0.5,
            size * 0.3
        );
        graphics.endFill();
    },

    /**
     * Draw soft outline for a circular object
     */
    drawCircleOutline(graphics, x, y, radius, baseColor, thickness = null) {
        if (!AnimeStyleConfig.outline.enabled) return;

        const outlineThickness = thickness || AnimeStyleConfig.outline.thickness;
        const outlineColor = this.getOutlineColor(baseColor);

        graphics.lineStyle(outlineThickness, outlineColor, AnimeStyleConfig.outline.alpha);
        graphics.drawCircle(x, y, radius);
        graphics.lineStyle(0);
    },

    /**
     * Draw soft outline for a rectangular object
     */
    drawRectOutline(graphics, x, y, width, height, baseColor, thickness = null) {
        if (!AnimeStyleConfig.outline.enabled) return;

        const outlineThickness = thickness || AnimeStyleConfig.outline.thickness;
        const outlineColor = this.getOutlineColor(baseColor);

        graphics.lineStyle(outlineThickness, outlineColor, AnimeStyleConfig.outline.alpha);
        graphics.drawRect(x, y, width, height);
        graphics.lineStyle(0);
    },

    /**
     * Draw shadow crescent on one side of a circular object (cel-shading effect)
     */
    drawShadowCrescent(graphics, x, y, radius, baseColor) {
        if (!AnimeStyleConfig.shading.enabled) return;

        const shadowColor = this.darkenColor(baseColor, AnimeStyleConfig.shading.shadowDarken);

        // Draw shadow arc on bottom-right (opposite of light source)
        graphics.beginFill(shadowColor, 0.4);
        graphics.arc(x, y, radius, 0, Math.PI * 0.8);
        graphics.lineTo(x, y);
        graphics.closePath();
        graphics.endFill();
    },

    /**
     * Draw 4-point anime sparkle star
     */
    drawSparkle(graphics, x, y, size, color, alpha = 1.0) {
        const armLength = size;
        const armWidth = size * 0.15;

        graphics.beginFill(color, alpha);

        // Vertical arm
        graphics.moveTo(x, y - armLength);
        graphics.lineTo(x + armWidth, y);
        graphics.lineTo(x, y + armLength);
        graphics.lineTo(x - armWidth, y);
        graphics.closePath();

        // Horizontal arm
        graphics.moveTo(x - armLength, y);
        graphics.lineTo(x, y + armWidth);
        graphics.lineTo(x + armLength, y);
        graphics.lineTo(x, y - armWidth);
        graphics.closePath();

        graphics.endFill();

        // Bright center
        graphics.beginFill(0xffffff, alpha * 0.8);
        graphics.drawCircle(x, y, size * 0.15);
        graphics.endFill();
    },

    /**
     * Create manga-style speed lines emanating from a point
     */
    drawSpeedLines(graphics, centerX, centerY, angle, intensity, color = 0xffffff, alpha = 0.4) {
        const numLines = Math.floor(8 + intensity * 12);
        const spread = Math.PI * 0.8; // Angular spread

        graphics.lineStyle(1.5, color, alpha * intensity);

        for (let i = 0; i < numLines; i++) {
            const lineAngle = angle + (i / numLines - 0.5) * spread;
            const innerRadius = 40 + Math.random() * 30;
            const outerRadius = 150 + Math.random() * 100;

            const x1 = centerX + Math.cos(lineAngle) * innerRadius;
            const y1 = centerY + Math.sin(lineAngle) * innerRadius;
            const x2 = centerX + Math.cos(lineAngle) * outerRadius;
            const y2 = centerY + Math.sin(lineAngle) * outerRadius;

            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        }

        graphics.lineStyle(0);
    },

    /**
     * Draw focus/converging lines (for pickup/dropoff events)
     */
    drawFocusLines(graphics, centerX, centerY, radius, numLines = 16, color = 0xffffff, alpha = 0.5) {
        graphics.lineStyle(2, color, alpha);

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const innerRadius = radius * 0.3;
            const outerRadius = radius;

            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;

            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        }

        graphics.lineStyle(0);
    }
};

// Export for use
window.AnimeStyleConfig = AnimeStyleConfig;
window.AnimeStyleUtils = AnimeStyleUtils;

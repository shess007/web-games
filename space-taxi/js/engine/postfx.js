/**
 * PostFX - Retro CRT Post-Processing Effects Engine
 * Adds powerful modern effects with a retro aesthetic
 */
class PostFX {
    constructor(sourceCanvas) {
        this.source = sourceCanvas;
        this.width = sourceCanvas.width;
        this.height = sourceCanvas.height;

        // Create offscreen canvases for multi-pass rendering
        this.bufferA = this.createCanvas(this.width, this.height);
        this.bufferB = this.createCanvas(this.width, this.height);
        this.bloomBuffer = this.createCanvas(this.width / 4, this.height / 4);

        // Effect settings
        this.settings = {
            // CRT Effects
            scanlines: false,
            scanlineIntensity: 0.12,
            scanlineCount: 300,

            curvature: false,
            curvatureAmount: 0.03,

            vignette: false,
            vignetteIntensity: 0.4,
            vignetteRadius: 0.85,

            // Chromatic Aberration
            chromatic: false,
            chromaticAmount: 1.5,

            // Bloom/Glow
            bloom: false,
            bloomIntensity: 0.35,
            bloomThreshold: 0.6,

            // Noise/Static
            noise: false,
            noiseIntensity: 0.03,

            // Flicker
            flicker: false,
            flickerIntensity: 0.01,

            // Screen Flash
            flashIntensity: 0,
            flashColor: '#ffffff'
        };

        this.time = 0;
    }

    createCanvas(w, h) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return {
            canvas,
            ctx: canvas.getContext('2d', { willReadFrequently: true })
        };
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.bufferA.canvas.width = w;
        this.bufferA.canvas.height = h;
        this.bufferB.canvas.width = w;
        this.bufferB.canvas.height = h;
        this.bloomBuffer.canvas.width = w / 4;
        this.bloomBuffer.canvas.height = h / 4;
    }

    /**
     * Trigger a screen flash effect
     */
    flash(color = '#ffffff', intensity = 1.0) {
        this.settings.flashIntensity = intensity;
        this.settings.flashColor = color;
    }

    /**
     * Apply all post-processing effects
     */
    render(targetCtx) {
        this.time += 0.016; // ~60fps delta

        // Start with source image
        this.bufferA.ctx.drawImage(this.source, 0, 0);

        // Apply effects in order
        if (this.settings.bloom) {
            this.applyBloom();
        }

        if (this.settings.chromatic) {
            this.applyChromaticAberration();
        }

        if (this.settings.curvature) {
            this.applyCurvature();
        }

        if (this.settings.scanlines) {
            this.applyScanlines();
        }

        if (this.settings.vignette) {
            this.applyVignette();
        }

        if (this.settings.noise) {
            this.applyNoise();
        }

        if (this.settings.flicker) {
            this.applyFlicker();
        }

        // Apply screen flash
        if (this.settings.flashIntensity > 0) {
            this.applyFlash();
            this.settings.flashIntensity *= 0.85; // Decay
            if (this.settings.flashIntensity < 0.01) {
                this.settings.flashIntensity = 0;
            }
        }

        // Draw final result to target
        targetCtx.drawImage(this.bufferA.canvas, 0, 0);
    }

    /**
     * Bloom effect - extract bright areas and blur them
     */
    applyBloom() {
        const ctx = this.bloomBuffer.ctx;
        const w = this.bloomBuffer.canvas.width;
        const h = this.bloomBuffer.canvas.height;

        // Downscale to bloom buffer
        ctx.drawImage(this.bufferA.canvas, 0, 0, w, h);

        // Extract bright pixels and apply blur
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const threshold = this.settings.bloomThreshold * 255;

        // Threshold pass
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness < threshold) {
                data[i] = data[i + 1] = data[i + 2] = 0;
            } else {
                // Boost bright pixels
                const boost = 1.5;
                data[i] = Math.min(255, data[i] * boost);
                data[i + 1] = Math.min(255, data[i + 1] * boost);
                data[i + 2] = Math.min(255, data[i + 2] * boost);
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Simple box blur (applied twice for smoother result)
        this.boxBlur(ctx, w, h, 4);
        this.boxBlur(ctx, w, h, 4);

        // Composite bloom back onto main buffer
        this.bufferA.ctx.globalCompositeOperation = 'screen';
        this.bufferA.ctx.globalAlpha = this.settings.bloomIntensity;
        this.bufferA.ctx.drawImage(this.bloomBuffer.canvas, 0, 0, this.width, this.height);
        this.bufferA.ctx.globalCompositeOperation = 'source-over';
        this.bufferA.ctx.globalAlpha = 1;
    }

    /**
     * Fast box blur approximation
     */
    boxBlur(ctx, w, h, radius) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const copy = new Uint8ClampedArray(data);

        const div = (radius * 2 + 1) * (radius * 2 + 1);

        for (let y = radius; y < h - radius; y++) {
            for (let x = radius; x < w - radius; x++) {
                let r = 0, g = 0, b = 0;

                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const idx = ((y + ky) * w + (x + kx)) * 4;
                        r += copy[idx];
                        g += copy[idx + 1];
                        b += copy[idx + 2];
                    }
                }

                const idx = (y * w + x) * 4;
                data[idx] = r / div;
                data[idx + 1] = g / div;
                data[idx + 2] = b / div;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Chromatic aberration - RGB channel split
     */
    applyChromaticAberration() {
        const amount = this.settings.chromaticAmount;
        const ctx = this.bufferB.ctx;

        ctx.clearRect(0, 0, this.width, this.height);

        // Red channel - shifted left
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.bufferA.canvas, -amount, 0);
        const redData = ctx.getImageData(0, 0, this.width, this.height);

        // Green channel - center (original position)
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(this.bufferA.canvas, 0, 0);
        const greenData = ctx.getImageData(0, 0, this.width, this.height);

        // Blue channel - shifted right
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(this.bufferA.canvas, amount, 0);
        const blueData = ctx.getImageData(0, 0, this.width, this.height);

        // Combine channels
        const finalData = ctx.createImageData(this.width, this.height);
        for (let i = 0; i < finalData.data.length; i += 4) {
            finalData.data[i] = redData.data[i];         // Red from left
            finalData.data[i + 1] = greenData.data[i + 1]; // Green from center
            finalData.data[i + 2] = blueData.data[i + 2]; // Blue from right
            finalData.data[i + 3] = 255;
        }

        this.bufferA.ctx.putImageData(finalData, 0, 0);
    }

    /**
     * CRT barrel distortion/curvature
     */
    applyCurvature() {
        const ctx = this.bufferB.ctx;
        const srcCtx = this.bufferA.ctx;
        const w = this.width;
        const h = this.height;
        const amount = this.settings.curvatureAmount;

        const srcData = srcCtx.getImageData(0, 0, w, h);
        const dstData = ctx.createImageData(w, h);

        const centerX = w / 2;
        const centerY = h / 2;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                // Normalize coordinates to -1 to 1
                const nx = (x - centerX) / centerX;
                const ny = (y - centerY) / centerY;

                // Apply barrel distortion
                const r2 = nx * nx + ny * ny;
                const distortion = 1 + r2 * amount;

                // Map back to source coordinates
                const srcX = Math.floor(centerX + nx * distortion * centerX);
                const srcY = Math.floor(centerY + ny * distortion * centerY);

                const dstIdx = (y * w + x) * 4;

                if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
                    const srcIdx = (srcY * w + srcX) * 4;
                    dstData.data[dstIdx] = srcData.data[srcIdx];
                    dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
                    dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
                    dstData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
                } else {
                    // Edge pixels - black
                    dstData.data[dstIdx] = 0;
                    dstData.data[dstIdx + 1] = 0;
                    dstData.data[dstIdx + 2] = 0;
                    dstData.data[dstIdx + 3] = 255;
                }
            }
        }

        this.bufferA.ctx.putImageData(dstData, 0, 0);
    }

    /**
     * CRT scanlines effect
     */
    applyScanlines() {
        const ctx = this.bufferA.ctx;
        const intensity = this.settings.scanlineIntensity;
        const count = this.settings.scanlineCount;
        const lineHeight = this.height / count;

        ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`;

        for (let i = 0; i < count; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(0, i * lineHeight, this.width, lineHeight * 0.5);
            }
        }

        // Add subtle horizontal phosphor lines
        ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.1})`;
        for (let i = 0; i < count; i++) {
            if (i % 2 === 1) {
                ctx.fillRect(0, i * lineHeight, this.width, 1);
            }
        }
    }

    /**
     * Vignette effect - darkens edges
     */
    applyVignette() {
        const ctx = this.bufferA.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.max(this.width, this.height) * this.settings.vignetteRadius;

        const gradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.3,
            centerX, centerY, radius
        );

        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.settings.vignetteIntensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Static noise effect
     */
    applyNoise() {
        const ctx = this.bufferA.ctx;
        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        const intensity = this.settings.noiseIntensity * 255;

        // Sparse noise for performance
        const step = 4;
        for (let y = 0; y < this.height; y += step) {
            for (let x = 0; x < this.width; x += step) {
                if (Math.random() > 0.7) {
                    const noise = (Math.random() - 0.5) * intensity;
                    const idx = (y * this.width + x) * 4;
                    data[idx] = Math.max(0, Math.min(255, data[idx] + noise));
                    data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise));
                    data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise));
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Brightness flicker effect
     */
    applyFlicker() {
        const ctx = this.bufferA.ctx;
        const flicker = 1 + (Math.random() - 0.5) * this.settings.flickerIntensity * 2;

        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255, 255, 255, ${(flicker - 1) * 0.5})`;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Screen flash effect (explosion, hit, etc.)
     */
    applyFlash() {
        const ctx = this.bufferA.ctx;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = this.settings.flashColor;
        ctx.globalAlpha = this.settings.flashIntensity;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }
}

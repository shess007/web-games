class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.minimapCanvas = null;
        this.minimapCtx = null;
        this.stars = [];
        this.nebulaGradients = [];
        this.galaxyClusters = [];
        this.cosmicDust = [];
        this.particleTrails = [];
        this.speedLines = [];
        this.lastTaxiPos = { x: 0, y: 0 };
        this.time = 0;

        // Post-processing
        this.postFX = null;
        this.renderBuffer = null;
        this.renderCtx = null;

        // Initialize render buffer for post-processing
        this.initRenderBuffer();
    }

    initRenderBuffer() {
        this.renderBuffer = document.createElement('canvas');
        this.renderBuffer.width = WORLD_W;
        this.renderBuffer.height = WORLD_H;
        this.renderCtx = this.renderBuffer.getContext('2d');
    }

    initPostFX() {
        if (typeof PostFX !== 'undefined' && !this.postFX) {
            this.postFX = new PostFX(this.renderBuffer);
        }
    }

    // Trigger screen flash effect
    flash(color = '#ffffff', intensity = 0.5) {
        if (this.postFX) {
            this.postFX.flash(color, intensity);
        }
    }

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

    initStars(level) {
        this.stars = [];
        this.nebulaGradients = [];
        this.galaxyClusters = [];
        this.cosmicDust = [];
        if (!level) return;

        // Generate distant galaxy clusters (very slow parallax - appears very far)
        this.generateGalaxyClusters(level);

        // Generate cosmic dust particles
        this.generateCosmicDust(level);

        // Create multi-layer parallax stars
        const layers = [
            { count: 80, sizeMin: 0.5, sizeMax: 1, speed: 0.2, opacity: 0.3 },  // Far background
            { count: 60, sizeMin: 1, sizeMax: 2, speed: 0.5, opacity: 0.5 },     // Mid layer
            { count: 40, sizeMin: 2, sizeMax: 3, speed: 0.8, opacity: 0.7 },     // Near layer
            { count: 15, sizeMin: 3, sizeMax: 5, speed: 1.0, opacity: 1.0 }      // Foreground bright stars
        ];

        layers.forEach((layer, layerIdx) => {
            for (let i = 0; i < layer.count; i++) {
                this.stars.push({
                    x: Math.random() * level.w,
                    y: Math.random() * level.h,
                    s: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
                    o: layer.opacity * (0.5 + Math.random() * 0.5),
                    layer: layerIdx,
                    speed: layer.speed,
                    twinkleSpeed: 0.5 + Math.random() * 2,
                    twinkleOffset: Math.random() * Math.PI * 2,
                    // Color variation for some stars
                    color: Math.random() > 0.8 ? this.getStarColor() : '#ffffff'
                });
            }
        });

        // Generate nebula clouds
        this.generateNebulas(level);
    }

    getStarColor() {
        const colors = [
            '#ffcccc', // Red giant
            '#ccccff', // Blue
            '#ffffcc', // Yellow
            '#ffcc99', // Orange
            '#ccffff'  // Cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateNebulas(level) {
        // Create procedural nebula positions - more nebulas with larger radius
        const nebulaCount = 6 + Math.floor(Math.random() * 5);
        for (let i = 0; i < nebulaCount; i++) {
            this.nebulaGradients.push({
                x: Math.random() * level.w,
                y: Math.random() * level.h,
                radius: 300 + Math.random() * 500,
                color1: this.getNebulaColor(),
                color2: this.getNebulaColor(),
                rotation: Math.random() * Math.PI * 2,
                drift: { x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1 }
            });
        }
    }

    getNebulaColor() {
        const colors = [
            'rgba(140, 60, 200, 0.25)',   // Vibrant Purple
            'rgba(60, 140, 220, 0.22)',   // Bright Blue
            'rgba(200, 60, 140, 0.20)',   // Hot Magenta
            'rgba(60, 200, 150, 0.18)',   // Cyan Teal
            'rgba(220, 140, 60, 0.20)',   // Warm Orange
            'rgba(180, 80, 220, 0.22)',   // Violet
            'rgba(80, 180, 220, 0.20)'    // Electric Blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateGalaxyClusters(level) {
        // Distant galaxy clusters - very slow parallax (0.02-0.05)
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
                parallaxSpeed: 0.02 + Math.random() * 0.03, // Very slow - appears very distant
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.0001, // Slow rotation
                coreColor: this.getGalaxyColor()
            };

            // Generate cluster stars in spiral pattern
            for (let j = 0; j < starCount; j++) {
                const angle = (j / starCount) * Math.PI * 4 + Math.random() * 0.5;
                const dist = (j / starCount) * spread + Math.random() * 20;
                cluster.stars.push({
                    offsetX: Math.cos(angle) * dist,
                    offsetY: Math.sin(angle) * dist * 0.6, // Flatten for perspective
                    size: 0.5 + Math.random() * 1.5,
                    brightness: 0.2 + Math.random() * 0.4
                });
            }

            this.galaxyClusters.push(cluster);
        }
    }

    getGalaxyColor() {
        const colors = [
            { r: 200, g: 140, b: 255 }, // Vibrant Purple
            { r: 140, g: 200, b: 255 }, // Bright Blue
            { r: 255, g: 220, b: 140 }, // Golden Yellow
            { r: 140, g: 255, b: 200 }, // Bright Teal
            { r: 255, g: 160, b: 200 }, // Hot Pink
            { r: 255, g: 180, b: 120 }, // Warm Orange
            { r: 180, g: 255, b: 255 }  // Cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateCosmicDust(level) {
        // Cosmic dust - multiple layers with different parallax
        const dustLayers = [
            { count: 100, parallax: 0.05, opacity: 0.15, size: 1 },
            { count: 80, parallax: 0.1, opacity: 0.2, size: 1.5 },
            { count: 60, parallax: 0.15, opacity: 0.25, size: 2 }
        ];

        dustLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                this.cosmicDust.push({
                    x: Math.random() * level.w * 1.2 - level.w * 0.1,
                    y: Math.random() * level.h * 1.2 - level.h * 0.1,
                    size: layer.size + Math.random() * layer.size,
                    opacity: layer.opacity * (0.5 + Math.random() * 0.5),
                    parallax: layer.parallax,
                    drift: {
                        x: (Math.random() - 0.5) * 0.02,
                        y: (Math.random() - 0.5) * 0.02
                    }
                });
            }
        });
    }

    draw(state) {
        if (!state.level) return;

        this.initPostFX();
        this.time += 0.016;

        // Store current theme for drawing functions
        this.currentTheme = state.level.theme || null;

        // Render to buffer first
        const ctx = this.renderCtx;
        ctx.save();

        // Background with parallax gradient
        this.drawBackground(ctx, state.camera, state.level);

        // Shake
        if (state.shake > 0) {
            ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake);
        }

        // Camera Viewport
        ctx.translate(-state.camera.x, -state.camera.y);

        // Deep background parallax layers (drawn first, behind everything)
        this.drawGalaxyClusters(ctx, state.camera);
        this.drawCosmicDust(ctx, state.camera);

        // Background effects
        this.drawNebulas(ctx, state.camera);
        this.drawStars(ctx, state.camera);

        // Speed lines when moving fast
        this.drawSpeedLines(ctx, state);

        // Game elements - Space obstacles
        this.drawAsteroids(ctx, state.level.asteroids);
        this.drawDebris(ctx, state.level.debris);
        this.drawMeteors(ctx, state.level.meteors);

        // Platforms and characters
        this.drawPlatforms(ctx, state);
        this.drawEnemies(ctx, state.level.enemies);
        this.drawActivePassenger(ctx, state.activePassenger);

        // Enhanced particles with trails
        this.drawParticleTrails(ctx);
        this.drawParticles(ctx, state.particles);

        // Taxi with glow
        this.drawTaxi(ctx, state.taxi);
        this.drawTaxiGlow(ctx, state.taxi, state.keys);

        ctx.restore();

        // Apply post-processing and render to main canvas
        if (this.postFX) {
            // Trigger flash on explosion
            if (state.shake > 15) {
                this.postFX.flash('#ff5500', state.shake / 50);
            }
            this.postFX.render(this.ctx);
        } else {
            this.ctx.drawImage(this.renderBuffer, 0, 0);
        }

        // Minimap
        if (this.minimapCtx) {
            this.drawMinimap(state);
        }

        // Update particle trails
        this.updateParticleTrails(state.particles);
        this.updateSpeedLines(state.taxi);
    }

    drawBackground(ctx, camera, level) {
        // Parallax factor for the background gradient (very slow - appears infinitely far)
        const parallaxFactor = 0.02;

        // Calculate parallax offset based on camera position relative to level center
        const levelCenterX = level ? level.w / 2 : 0;
        const levelCenterY = level ? level.h / 2 : 0;
        const offsetX = (camera.x - levelCenterX) * parallaxFactor;
        const offsetY = (camera.y - levelCenterY) * parallaxFactor;

        // Gradient center shifts slightly with camera movement
        const gradientCenterX = WORLD_W / 2 - offsetX;
        const gradientCenterY = WORLD_H / 2 - offsetY;

        // Get theme colors or use defaults
        const theme = this.currentTheme;
        const bgColor = theme ? theme.bgColor : '#050510';

        // Parse background color to create gradient variations
        const r = parseInt(bgColor.slice(1, 3), 16);
        const g = parseInt(bgColor.slice(3, 5), 16);
        const b = parseInt(bgColor.slice(5, 7), 16);

        // Deep space gradient with parallax - theme-based colors
        const gradient = ctx.createRadialGradient(
            gradientCenterX, gradientCenterY, 0,
            gradientCenterX, gradientCenterY, WORLD_W
        );
        gradient.addColorStop(0, `rgb(${Math.min(255, r + 10)}, ${Math.min(255, g + 5)}, ${Math.min(255, b + 15)})`);
        gradient.addColorStop(0.3, `rgb(${r}, ${g}, ${b})`);
        gradient.addColorStop(0.6, `rgb(${Math.max(0, r - 3)}, ${Math.max(0, g - 3)}, ${Math.max(0, b - 3)})`);
        gradient.addColorStop(1, `rgb(${Math.max(0, r - 5)}, ${Math.max(0, g - 5)}, ${Math.max(0, b - 5)})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // Add subtle vignette that follows the parallax
        const vignette = ctx.createRadialGradient(
            gradientCenterX, gradientCenterY, WORLD_W * 0.3,
            gradientCenterX, gradientCenterY, WORLD_W * 0.8
        );
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }

    drawGalaxyClusters(ctx, camera) {
        ctx.save();

        this.galaxyClusters.forEach(cluster => {
            // Update rotation over time
            cluster.rotation += cluster.rotationSpeed;

            // Very slow parallax - these appear extremely distant
            const parallaxX = cluster.x - camera.x * (1 - cluster.parallaxSpeed);
            const parallaxY = cluster.y - camera.y * (1 - cluster.parallaxSpeed);

            // Draw galaxy core glow - more visible
            const coreGlow = ctx.createRadialGradient(
                parallaxX, parallaxY, 0,
                parallaxX, parallaxY, 120
            );
            const color = cluster.coreColor;
            coreGlow.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.35)`);
            coreGlow.addColorStop(0.2, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);
            coreGlow.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`);
            coreGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = coreGlow;
            ctx.beginPath();
            ctx.arc(parallaxX, parallaxY, 120, 0, Math.PI * 2);
            ctx.fill();

            // Draw cluster stars with rotation
            cluster.stars.forEach(star => {
                // Apply rotation to star position
                const cos = Math.cos(cluster.rotation);
                const sin = Math.sin(cluster.rotation);
                const rotatedX = star.offsetX * cos - star.offsetY * sin;
                const rotatedY = star.offsetX * sin + star.offsetY * cos;

                const starX = parallaxX + rotatedX;
                const starY = parallaxY + rotatedY;

                // Twinkle effect
                const twinkle = 0.6 + Math.sin(this.time * 0.5 + star.offsetX * 0.1) * 0.4;

                ctx.globalAlpha = star.brightness * twinkle;
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillRect(starX - star.size / 2, starY - star.size / 2, star.size, star.size);
            });
        });

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    drawCosmicDust(ctx, camera) {
        ctx.save();

        this.cosmicDust.forEach(dust => {
            // Apply drift over time (very slow movement)
            dust.x += dust.drift.x;
            dust.y += dust.drift.y;

            // Parallax effect
            const parallaxX = dust.x - camera.x * (1 - dust.parallax);
            const parallaxY = dust.y - camera.y * (1 - dust.parallax);

            // Subtle pulsing
            const pulse = 0.7 + Math.sin(this.time * 0.3 + dust.x * 0.01) * 0.3;

            ctx.globalAlpha = dust.opacity * pulse;
            ctx.fillStyle = 'rgba(150, 150, 200, 1)';

            // Draw as small soft circle
            const gradient = ctx.createRadialGradient(
                parallaxX, parallaxY, 0,
                parallaxX, parallaxY, dust.size
            );
            gradient.addColorStop(0, 'rgba(180, 180, 220, 0.8)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(parallaxX - dust.size, parallaxY - dust.size, dust.size * 2, dust.size * 2);
        });

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    drawNebulas(ctx, camera) {
        ctx.save();
        this.nebulaGradients.forEach(nebula => {
            // Slow parallax for nebulas
            const parallaxX = nebula.x - camera.x * 0.1;
            const parallaxY = nebula.y - camera.y * 0.1;

            const gradient = ctx.createRadialGradient(
                parallaxX, parallaxY, 0,
                parallaxX, parallaxY, nebula.radius
            );
            gradient.addColorStop(0, nebula.color1);
            gradient.addColorStop(0.5, nebula.color2);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(parallaxX, parallaxY, nebula.radius, nebula.radius * 0.6, nebula.rotation, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    drawStars(ctx, camera) {
        this.stars.forEach(s => {
            // Parallax effect based on layer
            const parallaxX = s.x - camera.x * (1 - s.speed);
            const parallaxY = s.y - camera.y * (1 - s.speed);

            // Twinkle effect
            const twinkle = 0.5 + Math.sin(this.time * s.twinkleSpeed + s.twinkleOffset) * 0.5;
            const opacity = s.o * twinkle;

            // Draw star with glow for larger stars
            if (s.s > 2) {
                // Glow
                const gradient = ctx.createRadialGradient(
                    parallaxX, parallaxY, 0,
                    parallaxX, parallaxY, s.s * 3
                );
                gradient.addColorStop(0, s.color.replace(')', `, ${opacity * 0.5})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i, (m, r, g, b) => `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`));
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(parallaxX - s.s * 3, parallaxY - s.s * 3, s.s * 6, s.s * 6);
            }

            // Core
            ctx.fillStyle = s.color === '#ffffff'
                ? `rgba(255, 255, 255, ${opacity})`
                : s.color;
            ctx.globalAlpha = opacity;
            ctx.fillRect(parallaxX - s.s / 2, parallaxY - s.s / 2, s.s, s.s);
            ctx.globalAlpha = 1;
        });
    }

    drawSpeedLines(ctx, state) {
        const taxi = state.taxi;
        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);

        if (speed > 3) {
            // Add speed lines
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

        // Draw existing speed lines
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        this.speedLines.forEach(line => {
            ctx.globalAlpha = line.life * 0.5;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            const angle = Math.atan2(line.vy, line.vx);
            ctx.lineTo(
                line.x - Math.cos(angle) * line.length * line.life,
                line.y - Math.sin(angle) * line.length * line.life
            );
            ctx.stroke();
        });
        ctx.restore();
    }

    updateSpeedLines(taxi) {
        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.x += line.vx * 0.5;
            line.y += line.vy * 0.5;
            line.life -= 0.05;
            if (line.life <= 0) {
                this.speedLines.splice(i, 1);
            }
        }
    }

    // ==================== SPACE OBSTACLES ====================

    drawAsteroids(ctx, asteroids) {
        if (!asteroids) return;

        asteroids.forEach(a => {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rotation);

            // Outer glow
            const glow = ctx.createRadialGradient(0, 0, a.size * 0.5, 0, 0, a.size * 1.2);
            glow.addColorStop(0, 'rgba(100, 80, 60, 0.3)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(-a.size * 1.5, -a.size * 1.5, a.size * 3, a.size * 3);

            // Rocky body - draw polygon from vertices
            ctx.beginPath();
            ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
            for (let i = 1; i < a.vertices.length; i++) {
                ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
            }
            ctx.closePath();

            // Fill with gradient
            const bodyGrad = ctx.createRadialGradient(-a.size * 0.3, -a.size * 0.3, 0, 0, 0, a.size);
            bodyGrad.addColorStop(0, '#6a5a4a');
            bodyGrad.addColorStop(0.5, a.color);
            bodyGrad.addColorStop(1, '#2a2018');
            ctx.fillStyle = bodyGrad;
            ctx.fill();

            // Edge highlight
            ctx.strokeStyle = 'rgba(150, 130, 100, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Crater details
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(a.size * 0.2, a.size * 0.1, a.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-a.size * 0.3, -a.size * 0.2, a.size * 0.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawDebris(ctx, debris) {
        if (!debris) return;

        debris.forEach(d => {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);

            ctx.fillStyle = d.color;

            switch(d.type) {
                case 'scrap':
                    // Irregular metal piece
                    ctx.beginPath();
                    ctx.moveTo(-d.size, -d.size * 0.5);
                    ctx.lineTo(d.size * 0.5, -d.size);
                    ctx.lineTo(d.size, d.size * 0.3);
                    ctx.lineTo(-d.size * 0.3, d.size);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    break;

                case 'panel':
                    // Flat panel
                    ctx.fillRect(-d.size, -d.size * 0.3, d.size * 2, d.size * 0.6);
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.strokeRect(-d.size, -d.size * 0.3, d.size * 2, d.size * 0.6);
                    break;

                case 'pipe':
                    // Cylindrical pipe
                    ctx.fillRect(-d.size * 1.5, -d.size * 0.25, d.size * 3, d.size * 0.5);
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(-d.size * 1.5, -d.size * 0.25, d.size * 3, d.size * 0.15);
                    break;

                case 'crystal':
                    // Glowing crystal shard
                    ctx.fillStyle = d.color;
                    ctx.shadowColor = d.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(0, -d.size);
                    ctx.lineTo(d.size * 0.5, 0);
                    ctx.lineTo(0, d.size);
                    ctx.lineTo(-d.size * 0.5, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    break;
            }

            ctx.restore();
        });
    }

    drawMeteors(ctx, meteors) {
        if (!meteors) return;

        meteors.forEach(m => {
            // Draw fiery trail first
            if (m.trail && m.trail.length > 1) {
                ctx.save();
                for (let i = 0; i < m.trail.length - 1; i++) {
                    const t = m.trail[i];
                    const alpha = t.life * 0.6;
                    const size = m.size * t.life;

                    // Outer glow
                    const trailGlow = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size * 2);
                    trailGlow.addColorStop(0, `rgba(255, 150, 50, ${alpha * 0.5})`);
                    trailGlow.addColorStop(0.5, `rgba(255, 80, 0, ${alpha * 0.3})`);
                    trailGlow.addColorStop(1, 'transparent');
                    ctx.fillStyle = trailGlow;
                    ctx.fillRect(t.x - size * 2, t.y - size * 2, size * 4, size * 4);
                }
                ctx.restore();
            }

            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(m.rotation);

            // Meteor glow
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size * 2);
            glow.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
            glow.addColorStop(0.3, 'rgba(255, 100, 0, 0.4)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(-m.size * 2, -m.size * 2, m.size * 4, m.size * 4);

            // Meteor body
            const bodyGrad = ctx.createRadialGradient(-m.size * 0.3, -m.size * 0.3, 0, 0, 0, m.size);
            bodyGrad.addColorStop(0, '#ffcc66');
            bodyGrad.addColorStop(0.3, '#ff6600');
            bodyGrad.addColorStop(0.7, '#993300');
            bodyGrad.addColorStop(1, '#331100');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(0, 0, m.size, 0, Math.PI * 2);
            ctx.fill();

            // Hot core
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(-m.size * 0.2, -m.size * 0.2, m.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.restore();
        });
    }

    drawPlatforms(ctx, state) {
        const platforms = state.level?.platforms;
        if (!platforms) return;

        // Get theme colors or use defaults
        const theme = this.currentTheme;
        const platformColor = theme ? theme.platformColor : '#00ff41';
        const fuelColor = theme ? theme.fuelColor : '#00d2ff';
        const targetColor = '#ffffff'; // White for target platforms

        // Parse colors for rgba
        const parseColor = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };
        const pc = parseColor(platformColor);
        const fc = parseColor(fuelColor);
        const tc = parseColor(targetColor);

        // Determine target platform ID
        const passengers = state.level.passengers || [];
        const passIdx = state.passengerIndex || 0;
        const currentPass = passengers[passIdx];
        let targetPlatformId = null;
        if (state.activePassenger && currentPass) {
            if (state.activePassenger.state === 'WAITING') {
                targetPlatformId = currentPass.f; // Pickup platform
            } else if (state.activePassenger.state === 'IN_TAXI') {
                targetPlatformId = currentPass.t; // Dropoff platform
            }
        }

        platforms.forEach(p => {
            const isTarget = p.id === targetPlatformId;
            // Use white/bright color for target, otherwise normal colors
            const color = isTarget ? tc : (p.fuel ? fc : pc);
            const colorHex = isTarget ? targetColor : (p.fuel ? fuelColor : platformColor);

            // Platform base with glow underneath
            const glowGradient = ctx.createRadialGradient(
                p.x + p.w / 2, p.y + 5, 0,
                p.x + p.w / 2, p.y + 5, p.w / 2
            );
            // Stronger glow for target platform
            const glowIntensity = isTarget ? 0.5 : 0.3;
            glowGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowIntensity})`);
            glowGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(p.x - 20, p.y - 10, p.w + 40, 30);

            // Platform body
            ctx.fillStyle = '#111';
            ctx.fillRect(p.x, p.y, p.w, p.h);

            // Top strip with pulsing glow
            const pulse = 0.7 + Math.sin(this.time * 3) * 0.3;
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pulse})`;
            ctx.fillRect(p.x, p.y, p.w, 4);

            // Add light dots ONLY for target platforms and fuel platforms
            if (isTarget || p.fuel) {
                ctx.fillStyle = colorHex;
                for (let i = 0; i < 5; i++) {
                    const dotPulse = 0.3 + Math.sin(this.time * 4 + i) * 0.7;
                    ctx.globalAlpha = dotPulse;
                    ctx.fillRect(p.x + 10 + i * (p.w - 20) / 4, p.y + p.h - 6, 3, 3);
                }
                ctx.globalAlpha = 1;
            }

            // Platform name label
            ctx.fillStyle = colorHex;
            ctx.font = '10px "VT323"';
            const label = p.name || (p.fuel ? 'FUEL' : 'PAD ' + p.id);
            const textWidth = ctx.measureText(label).width;
            // Center the text above the platform
            ctx.fillText(label, p.x + (p.w - textWidth) / 2, p.y - 6);
        });
    }

    drawEnemies(ctx, enemies) {
        if (!enemies) return;
        enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);

            // Outer danger glow (pulsing)
            const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.5;
            const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size * 3);
            outerGlow.addColorStop(0, `rgba(255, 0, 0, ${0.4 * pulse})`);
            outerGlow.addColorStop(0.5, `rgba(255, 50, 0, ${0.2 * pulse})`);
            outerGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = outerGlow;
            ctx.fillRect(-e.size * 3, -e.size * 3, e.size * 6, e.size * 6);

            // Inner glow
            const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size);
            innerGlow.addColorStop(0, `rgba(255, 100, 0, ${0.6 * pulse})`);
            innerGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(0, 0, e.size, 0, Math.PI * 2);
            ctx.fill();

            // Body with gradient
            const bodyGrad = ctx.createRadialGradient(0, -e.size/4, 0, 0, 0, e.size/2);
            bodyGrad.addColorStop(0, '#ff6600');
            bodyGrad.addColorStop(1, '#ff3300');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Evil eyes with glow
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 5;
            ctx.fillStyle = '#fff';
            ctx.fillRect(-5, -3, 3, 3);
            ctx.fillRect(2, -3, 3, 3);

            // Red pupils
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-4, -2, 1, 1);
            ctx.fillRect(3, -2, 1, 1);
            ctx.shadowBlur = 0;

            // Animated energy tentacles
            ctx.strokeStyle = '#ff5500';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ff3300';
            ctx.shadowBlur = 10;
            for(let i = 0; i < 6; i++) {
                const a = (i/6) * Math.PI * 2 + Date.now()/300;
                const wave = Math.sin(Date.now()/100 + i) * 5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const endX = Math.cos(a) * (e.size + wave);
                const endY = Math.sin(a) * (e.size + wave);
                const ctrlX = Math.cos(a + 0.3) * e.size * 0.5;
                const ctrlY = Math.sin(a + 0.3) * e.size * 0.5;
                ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            ctx.restore();
        });
    }

    drawActivePassenger(ctx, p) {
        if (!p || p.state !== 'WAITING') return;

        // Teleport glow effect underneath
        const teleportPulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
        const teleGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 25);
        teleGlow.addColorStop(0, `rgba(244, 114, 182, ${0.4 * teleportPulse})`);
        teleGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = teleGlow;
        ctx.fillRect(p.x - 25, p.y - 25, 50, 30);

        // Body with gradient
        const bodyGrad = ctx.createLinearGradient(p.x - 4, p.y - 12, p.x + 4, p.y);
        bodyGrad.addColorStop(0, '#f472b6');
        bodyGrad.addColorStop(1, '#db2777');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(p.x - 4, p.y - 12, 8, 12);

        // Head
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(p.x - 3, p.y - 18, 6, 6);

        // Bouncing arrow indicator with glow
        const bounce = Math.sin(Date.now() / 200) * 5;
        ctx.shadowColor = '#f472b6';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 25 + bounce);
        ctx.lineTo(p.x - 5, p.y - 33 + bounce);
        ctx.lineTo(p.x + 5, p.y - 33 + bounce);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Pickup ring animation
        ctx.strokeStyle = `rgba(244, 114, 182, ${teleportPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 6, 15 + (1 - teleportPulse) * 10, 0, Math.PI * 2);
        ctx.stroke();
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

        // Limit trail count for performance
        if (this.particleTrails.length > 200) {
            this.particleTrails.splice(0, this.particleTrails.length - 200);
        }
    }

    drawParticleTrails(ctx) {
        ctx.save();
        this.particleTrails.forEach(t => {
            ctx.globalAlpha = t.life * 0.3;
            ctx.fillStyle = t.color;
            ctx.fillRect(t.x - t.size / 2, t.y - t.size / 2, t.size, t.size);
        });
        ctx.restore();
    }

    drawParticles(ctx, particles) {
        if (!particles) return;
        ctx.save();
        particles.forEach(p => {
            // Enhanced glow effect
            const glowSize = p.size * 6;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);

            // Parse color for gradient
            let glowColor = 'rgba(255, 255, 85, 0.4)';
            if (p.color === '#ffff55') {
                glowColor = 'rgba(255, 255, 85, 0.4)';
            } else if (p.color === '#00ffff') {
                glowColor = 'rgba(0, 255, 255, 0.4)';
            } else if (p.color === '#ff5500') {
                glowColor = 'rgba(255, 85, 0, 0.5)';
            } else if (p.color === '#ffffaa') {
                glowColor = 'rgba(255, 255, 170, 0.4)';
            }

            grad.addColorStop(0, glowColor);
            grad.addColorStop(0.5, glowColor.replace('0.4', '0.1').replace('0.5', '0.2'));
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);

            // Bright core
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = p.life * 0.8;
            ctx.fillRect(p.x - p.size/4, p.y - p.size/4, p.size/2, p.size/2);

            // Colored outer
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
        ctx.restore();
    }

    drawTaxiGlow(ctx, taxi, keys) {
        const thrustUp = keys && (keys['ArrowUp'] || keys['KeyW']);
        const thrustSide = keys && (keys['ArrowLeft'] || keys['ArrowRight'] || keys['KeyA'] || keys['KeyD']);

        // Engine glow when thrusting
        if (thrustUp) {
            const engineGlow = ctx.createRadialGradient(
                taxi.x, taxi.y + 15, 0,
                taxi.x, taxi.y + 25, 30
            );
            engineGlow.addColorStop(0, 'rgba(255, 255, 100, 0.6)');
            engineGlow.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
            engineGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = engineGlow;
            ctx.fillRect(taxi.x - 30, taxi.y, 60, 50);
        }

        // Side thruster glow
        if (thrustSide) {
            const sideX = keys['ArrowLeft'] || keys['KeyA'] ? taxi.x + 20 : taxi.x - 20;
            const sideGlow = ctx.createRadialGradient(sideX, taxi.y, 0, sideX, taxi.y, 15);
            sideGlow.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
            sideGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = sideGlow;
            ctx.fillRect(sideX - 15, taxi.y - 15, 30, 30);
        }

        // Ambient taxi glow
        const ambientGlow = ctx.createRadialGradient(taxi.x, taxi.y, 0, taxi.x, taxi.y, 40);
        ambientGlow.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
        ambientGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = ambientGlow;
        ctx.fillRect(taxi.x - 40, taxi.y - 40, 80, 80);
    }

    drawTaxi(ctx, taxi) {
        ctx.save();
        ctx.translate(taxi.x, taxi.y);
        ctx.rotate(taxi.angle || 0);

        // Shadow underneath
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-14, 8, 28, 4);

        // Main body with gradient
        const bodyGrad = ctx.createLinearGradient(-15, -10, -15, 6);
        bodyGrad.addColorStop(0, '#fcd34d');
        bodyGrad.addColorStop(0.5, '#fbbf24');
        bodyGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(-15, -10, 30, 16);

        // Body highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-14, -9, 28, 4);

        // Cockpit with reflection
        const cockpitGrad = ctx.createLinearGradient(2, -7, 2, -2);
        cockpitGrad.addColorStop(0, '#00e5ff');
        cockpitGrad.addColorStop(0.5, '#00d2ff');
        cockpitGrad.addColorStop(1, '#0099cc');
        ctx.fillStyle = cockpitGrad;
        ctx.fillRect(2, -7, 10, 5);

        // Cockpit shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(3, -6, 4, 2);

        // Landing gear
        const gearOut = (typeof taxi.gearOut === 'undefined') ? true : taxi.gearOut;
        ctx.fillStyle = gearOut ? '#555' : '#222';
        ctx.fillRect(-12, 6, 6, gearOut ? 5 : 2);
        ctx.fillRect(6, 6, 6, gearOut ? 5 : 2);

        // Gear lights
        if (gearOut) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-10, 9, 2, 2);
            ctx.fillRect(8, 9, 2, 2);
        }

        // Navigation lights (blinking)
        const blink = Math.sin(Date.now() / 200) > 0;
        if (blink) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-15, -5, 2, 2);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(13, -5, 2, 2);
        }

        ctx.restore();
    }

    drawMinimap(state) {
        const mCtx = this.minimapCtx;
        const level = state.level;
        if (!level || !mCtx) return;
        const scaleW = 160 / level.w;
        const scaleH = 120 / level.h;

        // Dark background with slight transparency
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

        // Asteroids (brown dots)
        mCtx.fillStyle = '#6a5040';
        level.asteroids?.forEach(a => {
            const size = Math.max(3, a.size * scaleW * 0.8);
            mCtx.beginPath();
            mCtx.arc(a.x * scaleW, a.y * scaleH, size, 0, Math.PI * 2);
            mCtx.fill();
        });

        // Debris (small gray dots)
        mCtx.fillStyle = '#555';
        level.debris?.forEach(d => {
            mCtx.fillRect(d.x * scaleW - 1, d.y * scaleH - 1, 2, 2);
        });

        // Meteors (orange with trail indication)
        level.meteors?.forEach(m => {
            mCtx.fillStyle = '#ff6600';
            mCtx.beginPath();
            mCtx.arc(m.x * scaleW, m.y * scaleH, 3, 0, Math.PI * 2);
            mCtx.fill();
            // Direction indicator
            mCtx.strokeStyle = '#ff9944';
            mCtx.lineWidth = 1;
            mCtx.beginPath();
            mCtx.moveTo(m.x * scaleW, m.y * scaleH);
            mCtx.lineTo((m.x - m.vx * 10) * scaleW, (m.y - m.vy * 10) * scaleH);
            mCtx.stroke();
        });

        // Platforms
        level.platforms?.forEach(p => {
            const passengers = level.passengers || [];
            const passIdx = state.passengerIndex || 0;
            const currentPass = passengers[passIdx];
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

        // Enemies with glow
        level.enemies?.forEach(e => {
            mCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            mCtx.beginPath();
            mCtx.arc(e.x * scaleW, e.y * scaleH, 4, 0, Math.PI * 2);
            mCtx.fill();
            mCtx.fillStyle = '#ff0000';
            mCtx.fillRect(e.x * scaleW - 1, e.y * scaleH - 1, 2, 2);
        });

        // Taxi with trail
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

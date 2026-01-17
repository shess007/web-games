class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // Simple static stars
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * WORLD_W,
                y: Math.random() * WORLD_H,
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random() * 0.5 + 0.2
            });
        }

        // Trail history for projectiles
        this.projectileTrails = new Map();
    }

    reset() {
        this.projectileTrails.clear();
    }

    draw(state) {
        const { ctx } = this;

        // Simple solid background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        ctx.save();

        // Screen shake: directional (recoil) + random (explosions)
        const totalShakeX = (state.shakeX || 0) + (state.shake > 0.5 ? (Math.random() - 0.5) * state.shake : 0);
        const totalShakeY = (state.shakeY || 0) + (state.shake > 0.5 ? (Math.random() - 0.5) * state.shake : 0);

        if (Math.abs(totalShakeX) > 0.1 || Math.abs(totalShakeY) > 0.1 || state.shake > 0.5) {
            ctx.translate(WORLD_W/2, WORLD_H/2);
            ctx.rotate((Math.random() - 0.5) * state.shake * 0.002);
            ctx.translate(-WORLD_W/2, -WORLD_H/2);
            ctx.translate(totalShakeX, totalShakeY);
        }

        // Draw layers back to front
        this.drawStars(ctx);
        this.drawCeilingAndFloor(ctx);
        this.drawPlatforms(ctx);
        this.drawBarrier(ctx, state.barrier);
        this.drawProjectiles(ctx, state.projectiles);
        this.drawDebris(ctx, state.debris);
        this.drawPlayers(ctx, state.players);
        this.drawParticles(ctx, state.particles);

        ctx.restore();

        // HUD on top
        this.drawHUD(ctx, state);
    }

    drawStars(ctx) {
        ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            ctx.globalAlpha = star.brightness;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;
    }

    drawCeilingAndFloor(ctx) {
        const time = Date.now() * 0.001;

        // Ceiling - metallic gradient
        const ceilGrad = ctx.createLinearGradient(0, CEILING_Y, 0, CEILING_Y + CEILING_H);
        ceilGrad.addColorStop(0, '#2a2a3e');
        ceilGrad.addColorStop(0.5, '#1a1a2e');
        ceilGrad.addColorStop(1, '#0a0a1e');
        ctx.fillStyle = ceilGrad;
        ctx.fillRect(0, CEILING_Y, BARRIER_X, CEILING_H);
        ctx.fillRect(BARRIER_X + BARRIER_W, CEILING_Y, WORLD_W - BARRIER_X - BARRIER_W, CEILING_H);

        // Floor - metallic gradient
        const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + FLOOR_H);
        floorGrad.addColorStop(0, '#252530');
        floorGrad.addColorStop(0.3, '#151520');
        floorGrad.addColorStop(1, '#0a0a10');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, FLOOR_Y, BARRIER_X, FLOOR_H);
        ctx.fillRect(BARRIER_X + BARRIER_W, FLOOR_Y, WORLD_W - BARRIER_X - BARRIER_W, FLOOR_H);

        // Animated fuel strip with energy pulse
        const pulseOffset = (time * 50) % 30;

        // Left fuel platform
        this.drawFuelStrip(ctx, 0, FLOOR_Y, BARRIER_X, pulseOffset, time);
        // Right fuel platform
        this.drawFuelStrip(ctx, BARRIER_X + BARRIER_W, FLOOR_Y, WORLD_W - BARRIER_X - BARRIER_W, pulseOffset, time);

        // Floor grid lines for tech feel
        ctx.strokeStyle = 'rgba(0, 255, 68, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < WORLD_W; x += 20) {
            if (x > BARRIER_X - 10 && x < BARRIER_X + BARRIER_W + 10) continue;
            ctx.beginPath();
            ctx.moveTo(x, FLOOR_Y);
            ctx.lineTo(x, FLOOR_Y + FLOOR_H);
            ctx.stroke();
        }

        // Labels with glow
        ctx.shadowColor = '#00ff44';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('◆ FUEL ◆', BARRIER_X / 2, FLOOR_Y + 18);
        ctx.fillText('◆ FUEL ◆', BARRIER_X + BARRIER_W + (WORLD_W - BARRIER_X - BARRIER_W) / 2, FLOOR_Y + 18);
        ctx.shadowBlur = 0;
    }

    drawFuelStrip(ctx, x, y, width, pulseOffset, time) {
        // Base strip
        const stripGrad = ctx.createLinearGradient(x, y, x, y + 6);
        stripGrad.addColorStop(0, '#00ff66');
        stripGrad.addColorStop(0.5, '#00cc44');
        stripGrad.addColorStop(1, '#009933');
        ctx.fillStyle = stripGrad;
        ctx.fillRect(x, y, width, 6);

        // Animated energy pulses
        ctx.fillStyle = 'rgba(150, 255, 200, 0.6)';
        for (let px = x - pulseOffset; px < x + width; px += 30) {
            if (px >= x && px + 15 <= x + width) {
                ctx.fillRect(px, y + 1, 15, 4);
            }
        }

        // Top shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y, width, 2);

        // Glow effect
        ctx.shadowColor = '#00ff44';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(0, 255, 68, 0.3)';
        ctx.fillRect(x, y - 2, width, 2);
        ctx.shadowBlur = 0;
    }

    drawPlatforms(ctx) {
        const time = Date.now() * 0.001;

        Object.values(PLATFORMS).forEach(p => {
            if (p.type !== 'ammo') return;

            // Platform base with gradient
            const platGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
            platGrad.addColorStop(0, '#ffcc44');
            platGrad.addColorStop(0.3, '#ff9900');
            platGrad.addColorStop(1, '#cc6600');
            ctx.fillStyle = platGrad;
            ctx.fillRect(p.x, p.y, p.w, p.h);

            // Animated energy field on top
            const fieldGrad = ctx.createLinearGradient(p.x, p.y - 8, p.x, p.y);
            fieldGrad.addColorStop(0, 'rgba(255, 200, 50, 0)');
            fieldGrad.addColorStop(1, `rgba(255, 200, 50, ${0.3 + Math.sin(time * 4) * 0.15})`);
            ctx.fillStyle = fieldGrad;
            ctx.fillRect(p.x, p.y - 8, p.w, 8);

            // Energy particles floating up
            ctx.fillStyle = 'rgba(255, 220, 100, 0.8)';
            for (let i = 0; i < 3; i++) {
                const particleX = p.x + 10 + (i * 30) + Math.sin(time * 2 + i) * 5;
                const particleY = p.y - 3 - ((time * 20 + i * 10) % 15);
                const particleSize = 2 + Math.sin(time * 3 + i) * 1;
                ctx.beginPath();
                ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Top highlight
            ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
            ctx.fillRect(p.x, p.y, p.w, 2);

            // Side accents
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(p.x, p.y, 3, p.h);
            ctx.fillRect(p.x + p.w - 3, p.y, 3, p.h);

            // Glowing label - dark text for readability
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 2;
            ctx.fillStyle = '#331100';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('▸ AMMO ◂', p.x + p.w / 2, p.y + 10);
            ctx.shadowBlur = 0;

            // Bottom glow
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 12;
            ctx.fillStyle = 'rgba(255, 170, 0, 0.2)';
            ctx.fillRect(p.x, p.y + p.h, p.w, 3);
            ctx.shadowBlur = 0;
        });
    }

    drawBarrier(ctx, barrier) {
        if (!barrier) return;

        const asteroids = barrier.getAsteroids();

        asteroids.forEach(asteroid => {
            if (asteroid.hp <= 0) return;

            const screenY = barrier.getAsteroidScreenY(asteroid);
            const screenX = barrier.getAsteroidScreenX(asteroid);

            // Skip if off-screen
            if (screenY > WORLD_H + asteroid.radius || screenY < -asteroid.radius) return;

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(asteroid.rotation);

            // Calculate damage state
            const damageRatio = asteroid.hp / asteroid.maxHp;

            // Base colors based on asteroid color seed
            const hue = 20 + asteroid.colorSeed * 30; // Brown to orange range
            const baseSat = 30 + asteroid.colorSeed * 20;
            const baseLit = 25 + asteroid.colorSeed * 15;

            // Darken when damaged
            const litMod = damageRatio * 0.4 + 0.6;

            // Draw asteroid shadow/glow for depth
            ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
            ctx.beginPath();
            ctx.moveTo(asteroid.vertices[0].x + 3, asteroid.vertices[0].y + 3);
            for (let i = 1; i < asteroid.vertices.length; i++) {
                ctx.lineTo(asteroid.vertices[i].x + 3, asteroid.vertices[i].y + 3);
            }
            ctx.closePath();
            ctx.fill();

            // Draw main asteroid body
            const bodyColor = `hsl(${hue}, ${baseSat}%, ${baseLit * litMod}%)`;
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
            for (let i = 1; i < asteroid.vertices.length; i++) {
                ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();

            // Draw edge highlight (top-left lit)
            ctx.strokeStyle = `hsl(${hue}, ${baseSat - 10}%, ${(baseLit + 15) * litMod}%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Draw only top portion of outline
            const startIdx = Math.floor(asteroid.vertices.length * 0.6);
            const endIdx = Math.floor(asteroid.vertices.length * 0.9);
            ctx.moveTo(asteroid.vertices[startIdx].x, asteroid.vertices[startIdx].y);
            for (let i = startIdx + 1; i <= endIdx; i++) {
                const idx = i % asteroid.vertices.length;
                ctx.lineTo(asteroid.vertices[idx].x, asteroid.vertices[idx].y);
            }
            ctx.stroke();

            // Draw craters
            asteroid.craters.forEach(crater => {
                // Crater shadow (darker)
                ctx.fillStyle = `hsl(${hue}, ${baseSat}%, ${(baseLit - 8) * litMod}%)`;
                ctx.beginPath();
                ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
                ctx.fill();

                // Crater highlight rim
                ctx.strokeStyle = `hsl(${hue}, ${baseSat - 5}%, ${(baseLit + 5) * litMod}%)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(crater.x - 1, crater.y - 1, crater.radius, Math.PI * 0.8, Math.PI * 1.8);
                ctx.stroke();
            });

            // Draw damage cracks when damaged
            if (damageRatio < 1) {
                ctx.strokeStyle = `rgba(255, 100, 50, ${0.6 * (1 - damageRatio)})`;
                ctx.lineWidth = 2;

                // Draw crack lines
                const numCracks = Math.ceil((1 - damageRatio) * 4);
                for (let i = 0; i < numCracks; i++) {
                    const angle = (i / numCracks) * Math.PI * 2 + asteroid.id;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    const len = asteroid.radius * (0.5 + Math.random() * 0.4);
                    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
                    ctx.stroke();
                }

                // Glowing core when critical
                if (damageRatio <= 0.34) {
                    const glowIntensity = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
                    ctx.fillStyle = `rgba(255, 80, 30, ${glowIntensity})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, asteroid.radius * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        });
    }

    drawProjectiles(ctx, projectiles) {
        // Clear old trails if no projectiles
        if (projectiles.length === 0) {
            this.projectileTrails.clear();
        }

        projectiles.forEach(p => {
            // Simple trail (max 6 points)
            const id = p.owner + '_' + Math.round(p.x) + '_' + Math.round(p.y);
            if (!this.projectileTrails.has(p)) {
                this.projectileTrails.set(p, []);
            }
            const trail = this.projectileTrails.get(p);
            trail.push({ x: p.x, y: p.y });
            if (trail.length > 6) trail.shift();

            // Draw simple trail
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < trail.length; i++) {
                if (i === 0) ctx.moveTo(trail[i].x, trail[i].y);
                else ctx.lineTo(trail[i].x, trail[i].y);
            }
            ctx.stroke();

            // Simple glow (just two circles)
            ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, PROJECTILE_SIZE * 2, 0, Math.PI * 2);
            ctx.fill();

            // Bright core
            ctx.fillStyle = '#ffff88';
            ctx.beginPath();
            ctx.arc(p.x, p.y, PROJECTILE_SIZE, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, PROJECTILE_SIZE * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Clean up trails for dead projectiles
        const activeProjectiles = new Set(projectiles);
        for (const proj of this.projectileTrails.keys()) {
            if (!activeProjectiles.has(proj)) {
                this.projectileTrails.delete(proj);
            }
        }
    }

    drawPlayers(ctx, players) {
        const time = Date.now() * 0.001;

        players.forEach((player, index) => {
            if (!player.alive) return;

            const colors = index === 0 ? COLORS.p1 : COLORS.p2;

            // Enhanced thrust effect
            if (player.thrusting && player.fuel > 0) {
                ctx.save();
                ctx.translate(player.x, player.y);
                ctx.rotate(player.angle || 0);

                // Flame flicker parameters
                const flicker = 0.8 + Math.random() * 0.4;
                const flameLength = 18 + Math.random() * 8;

                // Outer glow
                const glowGrad = ctx.createRadialGradient(0, 15, 0, 0, 15, 25);
                glowGrad.addColorStop(0, 'rgba(255, 150, 50, 0.6)');
                glowGrad.addColorStop(0.5, 'rgba(255, 100, 30, 0.3)');
                glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(0, 15, 25, 0, Math.PI * 2);
                ctx.fill();

                // Main flame - orange/red outer
                ctx.fillStyle = `rgba(255, ${Math.floor(80 + Math.random() * 40)}, 0, ${0.9 * flicker})`;
                ctx.beginPath();
                ctx.moveTo(-8, 8);
                ctx.quadraticCurveTo(-10 + Math.random() * 4, 8 + flameLength * 0.5, -3 + Math.random() * 2, 8 + flameLength);
                ctx.quadraticCurveTo(0, 8 + flameLength * 0.7, 3 + Math.random() * 2, 8 + flameLength);
                ctx.quadraticCurveTo(10 - Math.random() * 4, 8 + flameLength * 0.5, 8, 8);
                ctx.closePath();
                ctx.fill();

                // Middle flame - yellow
                ctx.fillStyle = `rgba(255, ${Math.floor(200 + Math.random() * 55)}, 50, ${0.95 * flicker})`;
                ctx.beginPath();
                ctx.moveTo(-5, 8);
                ctx.quadraticCurveTo(-6 + Math.random() * 2, 8 + flameLength * 0.4, -1 + Math.random() * 2, 8 + flameLength * 0.75);
                ctx.quadraticCurveTo(0, 8 + flameLength * 0.6, 1 + Math.random() * 2, 8 + flameLength * 0.75);
                ctx.quadraticCurveTo(6 - Math.random() * 2, 8 + flameLength * 0.4, 5, 8);
                ctx.closePath();
                ctx.fill();

                // Inner flame - white hot core
                ctx.fillStyle = `rgba(255, 255, ${Math.floor(200 + Math.random() * 55)}, ${flicker})`;
                ctx.beginPath();
                ctx.moveTo(-3, 8);
                ctx.quadraticCurveTo(-2 + Math.random() * 2, 8 + flameLength * 0.3, 0, 8 + flameLength * 0.5);
                ctx.quadraticCurveTo(2 - Math.random() * 2, 8 + flameLength * 0.3, 3, 8);
                ctx.closePath();
                ctx.fill();

                // Engine exhaust ports glow
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#ffaa44';
                ctx.fillRect(-10, 6, 6, 3);
                ctx.fillRect(4, 6, 6, 3);
                ctx.shadowBlur = 0;

                // Heat distortion lines
                ctx.strokeStyle = `rgba(255, 200, 100, ${0.2 + Math.random() * 0.2})`;
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const heatY = 12 + i * 6 + Math.random() * 4;
                    ctx.beginPath();
                    ctx.moveTo(-6 + Math.random() * 4, heatY);
                    ctx.lineTo(6 - Math.random() * 4, heatY);
                    ctx.stroke();
                }

                ctx.restore();
            }

            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.rotate(player.angle || 0);

            // Ship shadow/depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-14, -8, 30, 16);

            // Main body with gradient
            const bodyGrad = ctx.createLinearGradient(-15, -10, -15, 6);
            bodyGrad.addColorStop(0, '#ffe566');
            bodyGrad.addColorStop(0.3, colors.body);
            bodyGrad.addColorStop(1, '#cc9900');
            ctx.fillStyle = bodyGrad;
            ctx.fillRect(-15, -10, 30, 16);

            // Body top highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-15, -10, 30, 3);

            // Body panel lines
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-5, -10);
            ctx.lineTo(-5, 6);
            ctx.moveTo(12, -10);
            ctx.lineTo(12, 6);
            ctx.stroke();

            // Cockpit window with reflection
            const cockpitGrad = ctx.createLinearGradient(2, -7, 2, -2);
            cockpitGrad.addColorStop(0, colors.cockpit);
            cockpitGrad.addColorStop(1, index === 0 ? '#004422' : '#442200');
            ctx.fillStyle = cockpitGrad;
            ctx.fillRect(2, -7, 10, 5);

            // Cockpit shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(3, -6, 4, 2);

            // Landing gear with detail
            const gearColor = player.gearOut ? colors.gear : '#222';
            ctx.fillStyle = gearColor;
            ctx.fillRect(-12, 6, 6, 5);
            ctx.fillRect(6, 6, 6, 5);

            if (player.gearOut) {
                // Gear pads
                ctx.fillStyle = '#666';
                ctx.fillRect(-13, 10, 8, 2);
                ctx.fillRect(5, 10, 8, 2);
            }

            ctx.restore();

            // Player indicator with glow
            ctx.shadowColor = colors.cockpit;
            ctx.shadowBlur = 6;
            ctx.fillStyle = colors.cockpit;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`P${index + 1}`, player.x, player.y - 22);
            ctx.shadowBlur = 0;
        });
    }

    drawDebris(ctx, debris) {
        if (!debris) return;

        debris.forEach(d => {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);
            ctx.globalAlpha = Math.min(1, d.life * 1.5);

            // Outer glow (danger indicator)
            ctx.shadowColor = '#ff6644';
            ctx.shadowBlur = 8;

            // Rock colors
            const colors = ['#8b7355', '#6b5344', '#5a4a3a'];
            ctx.fillStyle = colors[Math.floor(d.owner) % colors.length];

            // Draw irregular rock shape
            ctx.beginPath();
            const sides = 6;
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                const r = d.size * (0.6 + Math.sin(i * 3 + d.rotation) * 0.4);
                if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();

            // Highlight edge
            ctx.strokeStyle = '#aa9977';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Hot glow from explosion
            ctx.fillStyle = `rgba(255, 100, 50, ${d.life * 0.4})`;
            ctx.beginPath();
            ctx.arc(0, 0, d.size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.restore();
        });
    }

    drawParticles(ctx, particles) {
        particles.forEach(p => {
            ctx.globalAlpha = p.life;

            if (p.isDust) {
                // Dust particles - soft, blurry circles
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.isRock) {
                // Rock debris - irregular shapes
                ctx.fillStyle = p.color;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.life * 5); // Spin as it flies
                ctx.beginPath();
                // Draw irregular polygon
                const sides = 5;
                for (let i = 0; i < sides; i++) {
                    const angle = (i / sides) * Math.PI * 2;
                    const r = p.size * (0.6 + Math.sin(i * 2) * 0.4);
                    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else {
                // Default particle - colored circle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
        });
    }

    drawHUD(ctx, state) {
        const { players, score, roundState, countdown } = state;

        // Score panel background
        const panelWidth = 140;
        const panelX = WORLD_W / 2 - panelWidth / 2;
        const panelGrad = ctx.createLinearGradient(panelX, 8, panelX, 55);
        panelGrad.addColorStop(0, 'rgba(20, 25, 40, 0.85)');
        panelGrad.addColorStop(1, 'rgba(10, 12, 20, 0.9)');
        ctx.fillStyle = panelGrad;
        this.roundRect(ctx, panelX, 8, panelWidth, 47, 8);
        ctx.fill();

        // Panel border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, panelX, 8, panelWidth, 47, 8);
        ctx.stroke();

        // Player 1 score with glow
        ctx.shadowColor = COLORS.p1.cockpit;
        ctx.shadowBlur = 10;
        ctx.fillStyle = COLORS.p1.cockpit;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(score[0], WORLD_W / 2 - 15, 40);

        // VS divider
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#888';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(':', WORLD_W / 2, 38);

        // Player 2 score with glow
        ctx.shadowColor = COLORS.p2.cockpit;
        ctx.shadowBlur = 10;
        ctx.fillStyle = COLORS.p2.cockpit;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(score[1], WORLD_W / 2 + 15, 40);
        ctx.shadowBlur = 0;

        // First to X label
        ctx.fillStyle = '#555';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FIRST TO ${ROUNDS_TO_WIN}`, WORLD_W / 2, 52);

        // Player HUDs
        this.drawPlayerHUD(ctx, players[0], 0, 15);
        this.drawPlayerHUD(ctx, players[1], 1, WORLD_W - 115);

        // Round state overlays
        if (roundState === 'COUNTDOWN' && countdown > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, WORLD_W, WORLD_H);

            const countNum = Math.ceil(countdown / 60);

            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 72px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(countNum, WORLD_W / 2, WORLD_H / 2 + 20);

            ctx.fillStyle = '#888';
            ctx.font = '18px monospace';
            ctx.fillText('GET READY', WORLD_W / 2, WORLD_H / 2 + 60);
        }

        if (roundState === 'ROUND_END') {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, WORLD_W, WORLD_H);

            const winner = state.lastRoundWinner;
            const winnerColor = winner === 0 ? COLORS.p1.cockpit : COLORS.p2.cockpit;

            ctx.fillStyle = winnerColor;
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`PLAYER ${winner + 1}`, WORLD_W / 2, WORLD_H / 2 - 10);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px monospace';
            ctx.fillText('WINS THE ROUND!', WORLD_W / 2, WORLD_H / 2 + 30);
        }

        if (roundState === 'MATCH_END') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)';
            ctx.fillRect(0, 0, WORLD_W, WORLD_H);

            const winner = score[0] >= ROUNDS_TO_WIN ? 0 : 1;
            const winnerColor = winner === 0 ? COLORS.p1.cockpit : COLORS.p2.cockpit;

            ctx.fillStyle = winnerColor;
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`PLAYER ${winner + 1}`, WORLD_W / 2, WORLD_H / 2 - 30);

            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 32px monospace';
            ctx.fillText('CHAMPION!', WORLD_W / 2, WORLD_H / 2 + 25);

            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.fillText('Press SPACE to play again', WORLD_W / 2, WORLD_H / 2 + 80);
        }
    }

    drawPlayerHUD(ctx, player, index, x) {
        const colors = index === 0 ? COLORS.p1 : COLORS.p2;
        const y = 60;
        const time = Date.now() * 0.001;

        // HUD background with gradient
        const bgGrad = ctx.createLinearGradient(x, y, x, y + 58);
        bgGrad.addColorStop(0, 'rgba(20, 25, 40, 0.9)');
        bgGrad.addColorStop(1, 'rgba(10, 12, 20, 0.95)');
        ctx.fillStyle = bgGrad;

        // Rounded rectangle background
        this.roundRect(ctx, x, y, 100, 58, 6);
        ctx.fill();

        // Glowing border with player color
        ctx.shadowColor = colors.cockpit;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = colors.cockpit;
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, 100, 58, 6);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Player icon and label
        ctx.fillStyle = colors.cockpit;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';

        // Draw mini ship icon
        ctx.save();
        ctx.translate(x + 12, y + 12);
        ctx.fillStyle = colors.body;
        ctx.fillRect(-6, -3, 12, 6);
        ctx.fillStyle = colors.cockpit;
        ctx.fillRect(1, -2, 4, 3);
        ctx.restore();

        ctx.fillStyle = colors.cockpit;
        ctx.fillText(`P${index + 1}`, x + 22, y + 15);

        // Fuel bar background with inner shadow
        ctx.fillStyle = '#111';
        this.roundRect(ctx, x + 5, y + 21, 90, 12, 3);
        ctx.fill();

        // Fuel bar inner border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + 5, y + 21, 90, 12, 3);
        ctx.stroke();

        // Fuel bar with gradient
        const fuelPercent = player.fuel / MAX_FUEL;
        const fuelLow = player.fuel <= 15;
        const fuelMed = player.fuel <= 30;

        if (fuelPercent > 0) {
            const fuelGrad = ctx.createLinearGradient(x + 5, y + 21, x + 5, y + 33);
            if (fuelLow) {
                // Pulsing red for low fuel
                const pulse = 0.7 + Math.sin(time * 8) * 0.3;
                fuelGrad.addColorStop(0, `rgba(255, ${Math.floor(80 * pulse)}, ${Math.floor(50 * pulse)}, 1)`);
                fuelGrad.addColorStop(0.5, `rgba(255, ${Math.floor(50 * pulse)}, ${Math.floor(30 * pulse)}, 1)`);
                fuelGrad.addColorStop(1, `rgba(180, ${Math.floor(30 * pulse)}, ${Math.floor(20 * pulse)}, 1)`);
            } else if (fuelMed) {
                fuelGrad.addColorStop(0, '#ffdd44');
                fuelGrad.addColorStop(0.5, '#ffaa00');
                fuelGrad.addColorStop(1, '#cc8800');
            } else {
                fuelGrad.addColorStop(0, '#44ff88');
                fuelGrad.addColorStop(0.5, '#00ff44');
                fuelGrad.addColorStop(1, '#00cc33');
            }

            ctx.fillStyle = fuelGrad;
            this.roundRect(ctx, x + 6, y + 22, 88 * fuelPercent, 10, 2);
            ctx.fill();

            // Fuel bar shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.roundRect(ctx, x + 6, y + 22, 88 * fuelPercent, 4, 2);
            ctx.fill();
        }

        // Fuel icon and text
        ctx.fillStyle = '#666';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('⛽', x + 6, y + 44);

        const fuelColor = fuelLow ? '#ff4444' : fuelMed ? '#ffaa00' : '#44ff88';
        ctx.fillStyle = fuelColor;
        ctx.textAlign = 'right';
        ctx.fillText(Math.floor(player.fuel) + '%', x + 94, y + 44);
        ctx.textAlign = 'left';

        // Ammo display - energy cells style
        const fullAmmo = Math.floor(player.ammo);
        const ammoY = y + 50;

        for (let i = 0; i < 10; i++) {
            const cellX = x + 6 + i * 9;
            const isFull = i < fullAmmo;

            // Cell background
            ctx.fillStyle = '#181818';
            ctx.fillRect(cellX, ammoY, 7, 6);

            if (isFull) {
                // Glowing ammo cell
                const cellGrad = ctx.createLinearGradient(cellX, ammoY, cellX, ammoY + 6);
                cellGrad.addColorStop(0, '#ffe066');
                cellGrad.addColorStop(0.5, '#ffcc00');
                cellGrad.addColorStop(1, '#cc9900');
                ctx.fillStyle = cellGrad;
                ctx.fillRect(cellX + 1, ammoY + 1, 5, 4);

                // Cell shine
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(cellX + 1, ammoY + 1, 5, 1);
            } else {
                // Empty cell
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX + 1, ammoY + 1, 5, 4);
            }
        }
    }

    // Helper function for rounded rectangles
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}

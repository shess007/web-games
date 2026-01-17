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
        // Ceiling - simple solid
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, CEILING_Y, BARRIER_X, CEILING_H);
        ctx.fillRect(BARRIER_X + BARRIER_W, CEILING_Y, WORLD_W - BARRIER_X - BARRIER_W, CEILING_H);

        // Floor - simple solid
        ctx.fillStyle = '#151520';
        ctx.fillRect(0, FLOOR_Y, BARRIER_X, FLOOR_H);
        ctx.fillRect(BARRIER_X + BARRIER_W, FLOOR_Y, WORLD_W - BARRIER_X - BARRIER_W, FLOOR_H);

        // Fuel strip
        ctx.fillStyle = COLORS.platform.fuel;
        ctx.fillRect(0, FLOOR_Y, BARRIER_X, 4);
        ctx.fillRect(BARRIER_X + BARRIER_W, FLOOR_Y, WORLD_W - BARRIER_X - BARRIER_W, 4);

        // Labels
        ctx.fillStyle = '#888';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FUEL', BARRIER_X / 2, FLOOR_Y + 18);
        ctx.fillText('FUEL', BARRIER_X + BARRIER_W + (WORLD_W - BARRIER_X - BARRIER_W) / 2, FLOOR_Y + 18);
    }

    drawPlatforms(ctx) {
        Object.values(PLATFORMS).forEach(p => {
            if (p.type !== 'ammo') return;

            // Simple platform
            ctx.fillStyle = COLORS.platform.ammo;
            ctx.fillRect(p.x, p.y, p.w, p.h);

            // Top highlight
            ctx.fillStyle = '#ffdd88';
            ctx.fillRect(p.x, p.y, p.w, 2);

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('AMMO', p.x + p.w / 2, p.y + 10);
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
        players.forEach((player, index) => {
            if (!player.alive) return;

            const colors = index === 0 ? COLORS.p1 : COLORS.p2;

            // Simple thrust indicator
            if (player.thrusting) {
                ctx.fillStyle = 'rgba(255, 200, 50, 0.4)';
                ctx.beginPath();
                ctx.arc(player.x, player.y + 12, 15, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.rotate(player.angle || 0);

            // Main body - simple solid color
            ctx.fillStyle = colors.body;
            ctx.fillRect(-15, -10, 30, 16);

            // Body highlight
            ctx.fillStyle = '#ffe066';
            ctx.fillRect(-15, -10, 30, 3);

            // Cockpit window
            ctx.fillStyle = colors.cockpit;
            ctx.fillRect(2, -7, 10, 5);

            // Landing gear
            ctx.fillStyle = player.gearOut ? colors.gear : '#111';
            ctx.fillRect(-12, 6, 6, 5);
            ctx.fillRect(6, 6, 6, 5);

            ctx.restore();

            // Player indicator
            ctx.fillStyle = colors.cockpit;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`P${index + 1}`, player.x, player.y - 22);
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

        // Score display
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${score[0]} - ${score[1]}`, WORLD_W / 2, 38);

        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
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

        // HUD background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 100, 52);

        // Border with player color
        ctx.strokeStyle = colors.cockpit;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 100, 52);

        // Player label
        ctx.fillStyle = colors.cockpit;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`P${index + 1}`, x + 5, y + 13);

        // Fuel bar background
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 5, y + 19, 90, 10);

        // Fuel bar - solid color
        const fuelPercent = player.fuel / MAX_FUEL;
        const fuelColor = player.fuel > 30 ? '#00ff44' : player.fuel > 15 ? '#ffaa00' : '#ff3333';
        ctx.fillStyle = fuelColor;
        ctx.fillRect(x + 5, y + 19, 90 * fuelPercent, 10);

        // Fuel label
        ctx.fillStyle = '#888';
        ctx.font = '7px monospace';
        ctx.fillText('FUEL', x + 5, y + 38);
        ctx.fillStyle = fuelColor;
        ctx.fillText(Math.floor(player.fuel) + '%', x + 70, y + 38);

        // Ammo display - simple dots
        const fullAmmo = Math.floor(player.ammo);
        ctx.font = '9px monospace';
        let ammoX = x + 5;

        // Full ammo
        ctx.fillStyle = '#ffcc00';
        for (let i = 0; i < Math.min(fullAmmo, 10); i++) {
            ctx.fillText('●', ammoX + i * 8, y + 49);
        }

        // Empty ammo
        ctx.fillStyle = '#333';
        for (let i = fullAmmo; i < 10; i++) {
            ctx.fillText('○', ammoX + i * 8, y + 49);
        }
    }
}

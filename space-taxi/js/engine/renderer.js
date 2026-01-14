class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.starLayers = [[], [], []];
    }

    initStars(level) {
        this.starLayers = [[], [], [], []]; // 4 Layers: Far Stars, Medium Stars, Near Stars, Planets/Nebula

        // Stars
        for (let l = 0; l < 3; l++) {
            for (let i = 0; i < 120; i++) {
                this.starLayers[l].push({
                    x: Math.random() * level.w,
                    y: Math.random() * level.h,
                    s: (l + 1) * 0.15, // Travel speed factor
                    c: l === 0 ? '#111122' : (l === 1 ? '#333355' : '#666688'),
                    size: Math.random() * (l + 1)
                });
            }
        }

        // Deep Space Objects (Planets/Nebulae)
        const colors = ['#220044', '#002244', '#442200'];
        for (let i = 0; i < 5; i++) {
            this.starLayers[3].push({
                x: Math.random() * level.w,
                y: Math.random() * level.h,
                s: 0.05, // Very slow movement
                c: colors[i % colors.length],
                size: 20 + Math.random() * 40,
                type: 'planet'
            });
        }
    }

    draw(state) {
        const { level, taxi, camera, particles, shake, activePassenger, passengerIndex, keys } = state;
        if (!level) return;

        const shakeX = (Math.random() - 0.5) * shake;
        const shakeY = (Math.random() - 0.5) * shake;

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        this.ctx.clearRect(0, 0, WORLD_W, WORLD_H);

        // Parallax Layers
        this.starLayers.forEach((layer, idx) => {
            layer.forEach(s => {
                const sx = (s.x - camera.x * s.s) % level.w;
                const sy = (s.y - camera.y * s.s) % level.h;
                const rx = sx < 0 ? sx + level.w : sx;
                const ry = sy < 0 ? sy + level.h : sy;

                // Only draw if within viewport range
                if (rx > -s.size && rx < WORLD_W + s.size && ry > -s.size && ry < WORLD_H + s.size) {
                    if (s.type === 'planet') {
                        const grad = this.ctx.createRadialGradient(rx, ry, 0, rx, ry, s.size);
                        grad.addColorStop(0, s.c); grad.addColorStop(1, 'transparent');
                        this.ctx.fillStyle = grad;
                        this.ctx.beginPath(); this.ctx.arc(rx, ry, s.size, 0, Math.PI * 2); this.ctx.fill();
                    } else {
                        this.ctx.fillStyle = s.c;
                        const twinkle = idx === 2 && Math.random() > 0.98 ? 2 : 1;
                        this.ctx.fillRect(rx, ry, s.size * twinkle, s.size * twinkle);
                    }
                }
            });
        });

        // Walls (Industrial look with highlights)
        level.walls.forEach(w => {
            const rx = w.x - camera.x, ry = w.y - camera.y;
            if (rx + w.w < 0 || rx > WORLD_W || ry + w.h < 0 || ry > WORLD_H) return;

            // Base wall structure
            const wallGrad = this.ctx.createLinearGradient(rx, ry, rx + w.w, ry + w.h);
            wallGrad.addColorStop(0, '#2a2a3a');
            wallGrad.addColorStop(1, '#1a1a2a');
            this.ctx.fillStyle = wallGrad;
            this.ctx.fillRect(rx, ry, w.w, w.h);

            // Bevel edges
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(rx + 1, ry + 1, w.w - 2, w.h - 2);

            // Industrial texture (grid)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let x = 10; x < w.w; x += 20) this.ctx.fillRect(rx + x, ry, 1, w.h);
            for (let y = 10; y < w.h; y += 20) this.ctx.fillRect(rx, ry + y, w.w, 1);
        });

        // Platforms (Technical pad look)
        level.platforms.forEach(p => {
            const rx = p.x - camera.x, ry = p.y - camera.y;
            if (p.fuel) {
                const grad = this.ctx.createRadialGradient(rx + p.w / 2, ry, 0, rx + p.w / 2, ry, 40);
                grad.addColorStop(0, 'rgba(0, 255, 0, 0.3)'); grad.addColorStop(1, 'rgba(0, 255, 0, 0)');
                this.ctx.fillStyle = grad; this.ctx.fillRect(rx - 20, ry - 40, p.w + 40, 80);
            }

            // Platform base with gradient
            const pGrad = this.ctx.createLinearGradient(rx, ry, rx, ry + p.h);
            pGrad.addColorStop(0, '#444455');
            pGrad.addColorStop(1, '#222233');
            this.ctx.fillStyle = pGrad;
            this.ctx.fillRect(rx, ry, p.w, p.h);

            // Landing pad markings
            this.ctx.fillStyle = p.fuel ? '#00aa00' : '#888899';
            this.ctx.fillRect(rx, ry, 4, p.h); // Left bar
            this.ctx.fillRect(rx + p.w - 4, ry, 4, p.h); // Right bar

            // Label
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '6px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(p.fuel ? 'FUEL' : 'PAD ' + p.id, rx + p.w / 2, ry + 15);
            this.ctx.textAlign = 'left';
        });

        // Passenger
        if (activePassenger?.state === 'WAITING') {
            const rx = activePassenger.x - camera.x, ry = activePassenger.y - camera.y;
            // Body with depth
            this.ctx.fillStyle = '#cc00cc'; this.ctx.fillRect(rx - 5, ry - 12, 10, 12);
            this.ctx.fillStyle = '#ff00ff'; this.ctx.fillRect(rx - 5, ry - 14, 10, 2);
            // Face
            this.ctx.fillStyle = '#ffccaa'; this.ctx.fillRect(rx - 3, ry - 19, 6, 6);
            // Cap/Hair highlight
            this.ctx.fillStyle = '#552200'; this.ctx.fillRect(rx - 3, ry - 20, 6, 2);
        }

        // Enemies (Underworld Creatures)
        if (level.enemies) {
            level.enemies.forEach(e => {
                const angle = Date.now() * e.speed;
                const ex = e.x + Math.cos(angle) * e.r - camera.x;
                const ey = e.y + Math.sin(angle) * e.r - camera.y;

                if (ex + e.size < 0 || ex - e.size > WORLD_W || ey + e.size < 0 || ey - e.size > WORLD_H) return;

                // Daemon Body (Pulsing)
                const pulse = Math.sin(Date.now() * 0.01) * 2;
                this.ctx.fillStyle = '#440000';
                this.ctx.beginPath();
                this.ctx.arc(ex, ey, e.size + pulse, 0, Math.PI * 2);
                this.ctx.fill();

                // Glowing Eye
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(ex, ey, e.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();

                // Pupils
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(ex - 1, ey - e.size * 0.3, 2, e.size * 0.6);
            });
        }

        // Particles
        particles.forEach(p => {
            this.ctx.globalAlpha = p.life; this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - camera.x - p.size / 2, p.y - camera.y - p.size / 2, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0;

        // Taxi (Advanced plastic/metallic look)
        this.ctx.save();
        this.ctx.translate(taxi.x - camera.x, taxi.y - camera.y);
        this.ctx.rotate(taxi.angle);

        // Engine Glow
        if (state.fuel > 0 && (keys['ArrowUp'] || keys['KeyW'])) {
            const glow = this.ctx.createRadialGradient(0, 12, 0, 0, 12, 35);
            glow.addColorStop(0, 'rgba(255, 255, 100, 0.6)');
            glow.addColorStop(0.4, 'rgba(255, 100, 0, 0.4)');
            glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = glow; this.ctx.fillRect(-30, 0, 60, 60);
        }

        // Taxi Hull Gradient
        const hullGrad = this.ctx.createLinearGradient(-TAXI_W / 2, -TAXI_H / 2, -TAXI_W / 2, TAXI_H / 2);
        if (state.fuel > 0) {
            hullGrad.addColorStop(0, '#ffee55'); // Highlight
            hullGrad.addColorStop(0.5, '#ccaa00'); // Base
            hullGrad.addColorStop(1, '#886600'); // Shadow
        } else {
            hullGrad.addColorStop(0, '#888');
            hullGrad.addColorStop(0.5, '#444');
            hullGrad.addColorStop(1, '#222');
        }

        // Hull
        this.ctx.fillStyle = hullGrad;
        this.ctx.fillRect(-TAXI_W / 2, -TAXI_H / 2, TAXI_W, TAXI_H - 6);

        // Window with Enhanced Reflection
        this.ctx.fillStyle = '#0a2a4a'; this.ctx.fillRect(2, -7, 14, 6);
        const refX = (Math.sin(Date.now() * 0.002) * 4) + 6;
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)'; this.ctx.fillRect(refX, -6, 3, 2);

        // Landing Gear Animation
        const isNearPlatform = level.platforms.some(p =>
            Math.abs(taxi.x - (p.x + p.w / 2)) < p.w / 2 + 30 &&
            Math.abs(taxi.y + TAXI_H / 2 - p.y) < 60
        );
        const gearExt = isNearPlatform ? 4 : 0;

        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(-14, 4, 8, 4 + gearExt); // Rear leg shadow
        this.ctx.fillRect(6, 4, 8, 4 + gearExt);  // Front leg shadow

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-15, 5 + gearExt, 8, 4); // Rear foot
        this.ctx.fillRect(7, 5 + gearExt, 8, 4);  // Front foot

        // "TAXI" lettering
        this.ctx.fillStyle = state.fuel > 0 ? '#111' : '#333';
        this.ctx.font = '6px Arial';
        this.ctx.fillText("TAXI", -12, 2);

        this.ctx.restore();

        // Lighting Engine (Dynamic Thrust Glow on Walls/Platforms)
        if (state.fuel > 0 && (keys['ArrowUp'] || keys['KeyW'] || keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'])) {
            const tx = taxi.x - camera.x;
            const ty = taxi.y - camera.y;
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';
            const lightGrad = this.ctx.createRadialGradient(tx, ty, 0, tx, ty, 150);
            lightGrad.addColorStop(0, 'rgba(255, 150, 50, 0.2)');
            lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = lightGrad;
            this.ctx.fillRect(0, 0, WORLD_W, WORLD_H);
            this.ctx.restore();
        }

        this.ctx.restore();
    }
}

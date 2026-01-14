class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.starLayers = [[], [], []];
    }

    initStars(level) {
        this.starLayers = [[], [], []];
        for (let l = 0; l < 3; l++) {
            for (let i = 0; i < 100; i++) {
                this.starLayers[l].push({
                    x: Math.random() * level.w,
                    y: Math.random() * level.h,
                    s: (l + 1) * 0.8,
                    c: l === 0 ? '#111122' : (l === 1 ? '#333355' : '#666688')
                });
            }
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

        // Stars (Twinkling)
        this.starLayers.forEach((layer, idx) => {
            this.ctx.fillStyle = layer[0].c;
            layer.forEach(s => {
                const sx = (s.x - camera.x * s.s) % level.w;
                const sy = (s.y - camera.y * s.s) % level.h;
                const size = (idx + 1) * (Math.random() > 0.98 ? 1.5 : 1);
                this.ctx.fillRect(sx < 0 ? sx + level.w : sx, sy < 0 ? sy + level.h : sy, size, size);
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

        // Window with Reflection
        this.ctx.fillStyle = '#0a2a4a'; this.ctx.fillRect(2, -7, 14, 6);
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)'; this.ctx.fillRect(4, -6, 4, 2);

        // Landing Gear/Wheels (Plastical)
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(-14, 4, 8, 4); // Rear wheel shadowed
        this.ctx.fillRect(6, 4, 8, 4);  // Front wheel shadowed
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(-15, 5, 8, 4); // Rear wheel
        this.ctx.fillRect(7, 5, 8, 4);  // Front wheel

        // "TAXI" lettering
        this.ctx.fillStyle = state.fuel > 0 ? '#111' : '#333';
        this.ctx.font = '6px Arial';
        this.ctx.fillText("TAXI", -12, 2);

        this.ctx.restore();

        this.ctx.restore();
    }
}

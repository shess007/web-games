class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.minimapCanvas = null;
        this.minimapCtx = null;
        this.stars = [];
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
        if (!level) return;
        const count = 150;
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * level.w,
                y: Math.random() * level.h,
                s: Math.random() * 2,
                o: Math.random() * 0.5 + 0.5
            });
        }
    }

    draw(state) {
        if (!state.level) return;
        
        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = '#020205';
        this.ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // Shake
        if (state.shake > 0) {
            this.ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake);
        }
        
        // Camera Viewport
        this.ctx.translate(-state.camera.x, -state.camera.y);

        this.drawStars();
        this.drawWalls(state.level.walls);
        this.drawPlatforms(state.level.platforms);
        this.drawEnemies(state.level.enemies);
        this.drawActivePassenger(state.activePassenger);
        this.drawParticles(state.particles);
        this.drawTaxi(state.taxi);
        
        this.ctx.restore();

        // Minimap
        if (this.minimapCtx) {
            this.drawMinimap(state);
        }
    }

    drawStars() {
        this.stars.forEach(s => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${s.o})`;
            this.ctx.fillRect(s.x, s.y, s.s, s.s);
        });
    }

    drawWalls(walls) {
        if (!walls) return;
        this.ctx.fillStyle = '#1a1a25';
        walls.forEach(w => {
            this.ctx.fillRect(w.x, w.y, w.w, w.h);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(w.x, w.y, w.w, w.h);
        });
    }

    drawPlatforms(platforms) {
        if (!platforms) return;
        platforms.forEach(p => {
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
            this.ctx.fillStyle = p.isFuel ? '#00d2ff' : '#00ff41';
            this.ctx.fillRect(p.x, p.y, p.w, 4);
            this.ctx.fillStyle = '#aaa';
            this.ctx.font = '14px "VT323"';
            const label = p.fuel ? 'FUEL' : 'PAD ' + p.id;
            this.ctx.fillText(label, p.x + 5, p.y + 16);
        });
    }

    drawEnemies(enemies) {
        if (!enemies) return;
        enemies.forEach(e => {
            // Draw Underworld Creature
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            
            // Glow
            const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.5;
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, e.size * 2);
            grad.addColorStop(0, `rgba(255, 0, 0, ${0.3 * pulse})`);
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(-e.size * 2, -e.size * 2, e.size * 4, e.size * 4);

            // Body
            this.ctx.fillStyle = '#ff3300';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(-4, -2, 2, 2);
            this.ctx.fillRect(2, -2, 2, 2);
            
            // Tentacles/Artifacts
            this.ctx.strokeStyle = '#ff3300';
            this.ctx.lineWidth = 2;
            for(let i=0; i<4; i++) {
                const a = (i/4) * Math.PI * 2 + Date.now()/300;
                this.ctx.beginPath();
                this.ctx.moveTo(0,0);
                this.ctx.lineTo(Math.cos(a)*e.size, Math.sin(a)*e.size);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }

    drawActivePassenger(p) {
        if (!p || p.state !== 'WAITING') return;
        this.ctx.fillStyle = '#f472b6';
        this.ctx.fillRect(p.x - 4, p.y - 12, 8, 12);
        this.ctx.fillStyle = '#fbcfe8';
        this.ctx.fillRect(p.x - 3, p.y - 18, 6, 6);
        const bounce = Math.sin(Date.now() / 200) * 5;
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y - 25 + bounce);
        this.ctx.lineTo(p.x - 4, p.y - 32 + bounce);
        this.ctx.lineTo(p.x + 4, p.y - 32 + bounce);
        this.ctx.fill();
    }

    drawParticles(particles) {
        if (!particles) return;
        this.ctx.save();
        particles.forEach(p => {
            // Particle Light Illumination effect
            const glowSize = p.size * 4;
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
            grad.addColorStop(0, p.color.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#ffff55', 'rgba(255,255,85,0.3)').replace('#00ffff', 'rgba(0,255,255,0.3)'));
            grad.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = grad;
            this.ctx.globalAlpha = p.life * 0.5;
            this.ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);

            // Core Particle
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
        this.ctx.restore();
    }

    drawTaxi(taxi) {
        this.ctx.save();
        this.ctx.translate(taxi.x, taxi.y);
        this.ctx.rotate(taxi.angle || 0);
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillRect(-15, -10, 30, 16);
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(-15, 0, 30, 6);
        this.ctx.fillStyle = '#00d2ff';
        this.ctx.fillRect(2, -7, 10, 5);
        const gearOut = (typeof taxi.gearOut === 'undefined') ? true : taxi.gearOut;
        this.ctx.fillStyle = gearOut ? '#444' : '#111';
        this.ctx.fillRect(-12, 6, 6, 4);
        this.ctx.fillRect(6, 6, 6, 4);
        this.ctx.restore();
    }

    drawMinimap(state) {
        const mCtx = this.minimapCtx;
        const level = state.level;
        if (!level || !mCtx) return;
        const scaleW = 160 / level.w;
        const scaleH = 120 / level.h;
        mCtx.fillStyle = '#000';
        mCtx.fillRect(0, 0, 160, 120);
        mCtx.fillStyle = '#22232a';
        level.walls?.forEach(w => {
            mCtx.fillRect(w.x * scaleW, w.y * scaleH, w.w * scaleW, w.h * scaleH);
        });
        level.platforms?.forEach(p => {
            const isTarget = state.activePassenger && (
                (state.activePassenger.state === 'WAITING' && p.id === levels[state.currentLevelIdx].passengers[state.passengerIndex].f) ||
                (state.activePassenger.state === 'IN_TAXI' && p.id === levels[state.currentLevelIdx].passengers[state.passengerIndex].t)
            );
            mCtx.fillStyle = isTarget ? '#fff' : '#444';
            mCtx.fillRect(p.x * scaleW, p.y * scaleH, p.w * scaleW, p.h * scaleH);
            if (isTarget) {
                mCtx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 150) * 0.5})`;
                mCtx.strokeRect(p.x * scaleW - 1, p.y * scaleH - 1, p.w * scaleW + 2, p.h * scaleH + 2);
            }
        });
        // Enemies on minimap
        mCtx.fillStyle = '#ff0000';
        level.enemies?.forEach(e => {
            mCtx.fillRect(e.x * scaleW - 1, e.y * scaleH - 1, 2, 2);
        });
        mCtx.fillStyle = '#fbbf24';
        mCtx.fillRect(state.taxi.x * scaleW - 2, state.taxi.y * scaleH - 2, 4, 4);
    }
}

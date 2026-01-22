/**
 * PixiRenderer Particles Module
 * Handles particles, particle trails, and speed lines
 */

const PixiParticlesMixin = {
    updateParticles(particles) {
        if (!particles) return;

        // Remove excess sprites
        while (this.particleSprites.length > particles.length) {
            const sprite = this.particleSprites.pop();
            sprite.destroy();
        }

        // Update or create sprites
        particles.forEach((p, i) => {
            let sprite = this.particleSprites[i];

            if (!sprite) {
                sprite = new PIXI.Sprite(this.getParticleTexture(p.color));
                sprite.anchor.set(0.5);
                this.particleSprites.push(sprite);
                this.containers.particles.addChild(sprite);
            }

            sprite.x = p.x;
            sprite.y = p.y;
            sprite.alpha = p.life;
            sprite.scale.set(p.size / 10);
            sprite.tint = this.parseHexColor(p.color);
        });
    },

    getParticleTexture(color) {
        switch (color) {
            case '#ffff55': return this.textures.particleYellow;
            case '#00ffff': return this.textures.particleCyan;
            case '#ff5500':
            case '#ff8800':
            case '#ffaa00': return this.textures.particleOrange;
            default: return this.textures.particleWhite;
        }
    },

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

        // Limit trail count
        if (this.particleTrails.length > 200) {
            this.particleTrails.splice(0, this.particleTrails.length - 200);
        }

        // Sync trail sprites
        while (this.trailSprites.length > this.particleTrails.length) {
            const sprite = this.trailSprites.pop();
            sprite.destroy();
        }

        this.particleTrails.forEach((t, i) => {
            let sprite = this.trailSprites[i];

            if (!sprite) {
                sprite = new PIXI.Sprite(this.getTrailTexture(t.color));
                sprite.anchor.set(0.5);
                this.trailSprites.push(sprite);
                this.containers.particles.addChild(sprite);
            }

            sprite.x = t.x;
            sprite.y = t.y;
            sprite.alpha = t.life * 0.3;
            sprite.scale.set(t.size / 6);
        });
    },

    getTrailTexture(color) {
        switch (color) {
            case '#ffff55': return this.textures.trailYellow;
            case '#00ffff': return this.textures.trailCyan;
            case '#ff5500':
            case '#ff8800':
            case '#ffaa00': return this.textures.trailOrange;
            default: return this.textures.trailYellow;
        }
    },

    updateSpeedLines(state) {
        // Speed lines disabled - clear any existing and return
        this.speedLineGraphics.clear();
        return;

        const taxi = state.taxi;
        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);

        if (speed > 3) {
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

        // Update and draw speed lines
        this.speedLineGraphics.clear();

        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.x += line.vx * 0.5;
            line.y += line.vy * 0.5;
            line.life -= 0.05;

            if (line.life <= 0) {
                this.speedLines.splice(i, 1);
                continue;
            }

            const angle = Math.atan2(line.vy, line.vx);
            const endX = line.x - Math.cos(angle) * line.length * line.life;
            const endY = line.y - Math.sin(angle) * line.length * line.life;

            // v7 API
            this.speedLineGraphics.lineStyle(1, 0xffffff, line.life * 0.5);
            this.speedLineGraphics.moveTo(line.x, line.y);
            this.speedLineGraphics.lineTo(endX, endY);
        }
    }
};

// Export for use
window.PixiParticlesMixin = PixiParticlesMixin;

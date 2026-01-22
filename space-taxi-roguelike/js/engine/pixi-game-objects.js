/**
 * PixiRenderer Game Objects Module
 * Handles asteroids, debris, meteors, enemies, and passengers
 */

const PixiGameObjectsMixin = {
    updateAsteroids(asteroids) {
        if (!asteroids) return;

        const useAnimeStyle = typeof AnimeStyleConfig !== 'undefined' && AnimeStyleConfig.enabled;

        asteroids.forEach((a, idx) => {
            let sprite = this.asteroidSprites.get(idx);

            if (!sprite) {
                // Create asteroid graphics
                sprite = new PIXI.Graphics();
                this.asteroidSprites.set(idx, sprite);
                this.containers.asteroids.addChild(sprite);
            }

            sprite.clear();

            const baseColor = 0xFFCDB2; // Soft peach base color

            // Soft outer glow - cozy pastel (v7 API)
            const glowColor = 0xE2D1F9; // Lavender glow
            for (let i = 4; i >= 1; i--) {
                const ratio = i / 4;
                const alpha = 0.12 * (1 - ratio);
                sprite.beginFill(glowColor, alpha);
                sprite.drawCircle(0, 0, a.size * 1.25 * ratio);
                sprite.endFill();
            }

            // === ANIME STYLE: Draw outline FIRST ===
            if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
                const outlineColor = AnimeStyleUtils.getOutlineColor(baseColor);
                sprite.lineStyle(AnimeStyleConfig.outline.asteroidThickness, outlineColor, AnimeStyleConfig.outline.alpha);
                sprite.drawCircle(0, 0, a.size * 0.85);
                sprite.lineStyle(0);
            }

            // Draw soft rounded blob shape (v7 API)
            sprite.beginFill(baseColor);
            if (!useAnimeStyle) {
                sprite.lineStyle(2, 0xF5B7B1, 0.5); // Original soft coral outline
            }

            if (a.vertices && a.vertices.length > 0) {
                sprite.drawCircle(0, 0, a.size * 0.85);
            } else {
                sprite.drawCircle(0, 0, a.size);
            }
            sprite.endFill();
            sprite.lineStyle(0);

            // === ANIME STYLE: Shadow crescent on bottom-right ===
            if (useAnimeStyle && AnimeStyleConfig.shading.enabled) {
                const shadowColor = AnimeStyleUtils.darkenColor(baseColor, AnimeStyleConfig.shading.shadowDarken);
                sprite.beginFill(shadowColor, 0.4);
                sprite.arc(0, 0, a.size * 0.85, 0.3, Math.PI * 0.9);
                sprite.lineTo(0, 0);
                sprite.closePath();
                sprite.endFill();
            }

            // Soft dimples instead of harsh craters (v7 API)
            sprite.beginFill(0xFAD7A0, 0.4); // Slightly darker warm peach
            sprite.drawCircle(a.size * 0.2, a.size * 0.1, a.size * 0.15);
            sprite.endFill();
            sprite.beginFill(0xFAD7A0, 0.4);
            sprite.drawCircle(-a.size * 0.3, -a.size * 0.2, a.size * 0.1);
            sprite.endFill();

            // === ANIME STYLE: Specular highlight ===
            if (useAnimeStyle && AnimeStyleConfig.specular.enabled) {
                AnimeStyleUtils.drawSpecularHighlight(sprite, 0, 0, a.size);
            }

            sprite.x = a.x;
            sprite.y = a.y;
            sprite.rotation = a.rotation;
        });
    },

    parseHSLColor(hslString) {
        // Parse HSL string like "hsl(30, 25%, 35%)"
        if (!hslString || !hslString.startsWith('hsl')) return 0x4a3a2a;

        const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return 0x4a3a2a;

        const h = parseInt(match[1]) / 360;
        const s = parseInt(match[2]) / 100;
        const l = parseInt(match[3]) / 100;

        // HSL to RGB conversion
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
    },

    updateDebris(debris) {
        if (!debris) return;

        debris.forEach((d, idx) => {
            let sprite = this.debrisSprites.get(idx);

            if (!sprite) {
                sprite = new PIXI.Graphics();
                this.debrisSprites.set(idx, sprite);
                this.containers.debris.addChild(sprite);
            }

            sprite.clear();

            const color = this.parseHexColor(d.color) || 0x888888;

            switch (d.type) {
                case 'scrap':
                    // v7 API
                    sprite.beginFill(color);
                    sprite.lineStyle(1, 0xffffff, 0.3);
                    sprite.moveTo(-d.size, -d.size * 0.5);
                    sprite.lineTo(d.size * 0.5, -d.size);
                    sprite.lineTo(d.size, d.size * 0.3);
                    sprite.lineTo(-d.size * 0.3, d.size);
                    sprite.closePath();
                    sprite.endFill();
                    break;

                case 'panel':
                    // v7 API
                    sprite.beginFill(color);
                    sprite.lineStyle(1, 0xffffff, 0.2);
                    sprite.drawRect(-d.size, -d.size * 0.3, d.size * 2, d.size * 0.6);
                    sprite.endFill();
                    break;

                case 'pipe':
                    // v7 API
                    sprite.beginFill(color);
                    sprite.drawRect(-d.size * 1.5, -d.size * 0.25, d.size * 3, d.size * 0.5);
                    sprite.endFill();
                    sprite.beginFill(0xffffff, 0.2);
                    sprite.drawRect(-d.size * 1.5, -d.size * 0.25, d.size * 3, d.size * 0.15);
                    sprite.endFill();
                    break;

                case 'crystal':
                    // Diamond shape with glow (v7 API)
                    sprite.beginFill(0x7777ff);
                    sprite.moveTo(0, -d.size);
                    sprite.lineTo(d.size * 0.5, 0);
                    sprite.lineTo(0, d.size);
                    sprite.lineTo(-d.size * 0.5, 0);
                    sprite.closePath();
                    sprite.endFill();

                    // Add glow effect for crystals (v7 API)
                    for (let i = 3; i >= 1; i--) {
                        sprite.beginFill(0x7777ff, 0.1);
                        sprite.moveTo(0, -d.size * (1 + i * 0.2));
                        sprite.lineTo(d.size * 0.5 * (1 + i * 0.2), 0);
                        sprite.lineTo(0, d.size * (1 + i * 0.2));
                        sprite.lineTo(-d.size * 0.5 * (1 + i * 0.2), 0);
                        sprite.closePath();
                        sprite.endFill();
                    }
                    break;
            }

            sprite.x = d.x;
            sprite.y = d.y;
            sprite.rotation = d.rotation;
        });
    },

    updateMeteors(meteors) {
        if (!meteors) return;

        const useAnimeStyle = typeof AnimeStyleConfig !== 'undefined' && AnimeStyleConfig.enabled;

        meteors.forEach((m, idx) => {
            let container = this.meteorSprites.get(idx);

            if (!container) {
                container = new PIXI.Container();
                container.trailGraphics = new PIXI.Graphics();
                container.bodyGraphics = new PIXI.Graphics();
                container.addChild(container.trailGraphics);
                container.addChild(container.bodyGraphics);
                this.meteorSprites.set(idx, container);
                this.containers.meteors.addChild(container);
            }

            // Draw trail (v7 API)
            const trail = container.trailGraphics;
            trail.clear();

            if (m.trail && m.trail.length > 1) {
                m.trail.forEach((t, ti) => {
                    if (t.life <= 0) return;
                    const size = m.size * t.life;

                    // Outer glow (v7 API)
                    for (let i = 3; i >= 1; i--) {
                        const ratio = i / 3;
                        const alpha = t.life * 0.3 * (1 - ratio);
                        trail.beginFill(0xff5000, alpha);
                        trail.drawCircle(t.x - m.x, t.y - m.y, size * 2 * ratio);
                        trail.endFill();
                    }
                });

                // === ANIME STYLE: Manga speed lines in trail ===
                if (useAnimeStyle && m.trail.length > 3) {
                    const moveAngle = Math.atan2(m.vy, m.vx);
                    const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);

                    if (speed > 2) {
                        const numLines = Math.min(6, Math.floor(speed));
                        trail.lineStyle(1.5, 0xffaa00, 0.4);

                        for (let i = 0; i < numLines; i++) {
                            const spread = (i / numLines - 0.5) * 0.5;
                            const lineAngle = moveAngle + Math.PI + spread;
                            const startDist = m.size * 1.5;
                            const endDist = m.size * 3 + speed * 5;

                            trail.moveTo(
                                Math.cos(lineAngle) * startDist,
                                Math.sin(lineAngle) * startDist
                            );
                            trail.lineTo(
                                Math.cos(lineAngle) * endDist,
                                Math.sin(lineAngle) * endDist
                            );
                        }
                        trail.lineStyle(0);
                    }
                }
            }

            // Draw meteor body (v7 API)
            const body = container.bodyGraphics;
            body.clear();

            const bodyColor = 0x993300;

            // Glow (v7 API)
            for (let i = 5; i >= 1; i--) {
                const ratio = i / 5;
                const alpha = 0.3 * (1 - ratio);
                body.beginFill(0xff6400, alpha);
                body.drawCircle(0, 0, m.size * 2 * ratio);
                body.endFill();
            }

            // === ANIME STYLE: Body outline ===
            if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
                const outlineColor = AnimeStyleUtils.darkenColor(bodyColor, 0.4);
                body.lineStyle(2.5, outlineColor, 0.7);
                body.drawCircle(0, 0, m.size);
                body.lineStyle(0);
            }

            // Body (v7 API)
            body.beginFill(bodyColor);
            body.drawCircle(0, 0, m.size);
            body.endFill();

            // Gradient effect (lighter center) (v7 API)
            body.beginFill(0xff6600);
            body.drawCircle(-m.size * 0.3, -m.size * 0.3, m.size * 0.6);
            body.endFill();

            // Hot core (v7 API)
            body.beginFill(0xffffff, 0.8);
            body.drawCircle(-m.size * 0.2, -m.size * 0.2, m.size * 0.3);
            body.endFill();

            container.x = m.x;
            container.y = m.y;
            body.rotation = m.rotation;
        });
    },

    updateEnemies(enemies) {
        if (!enemies) return;

        const useAnimeStyle = typeof AnimeStyleConfig !== 'undefined' && AnimeStyleConfig.enabled;

        enemies.forEach((e, idx) => {
            let container = this.enemySprites.get(idx);

            if (!container) {
                container = new PIXI.Graphics();
                this.enemySprites.set(idx, container);
                this.containers.enemies.addChild(container);
            }

            container.clear();

            const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.5;
            const bodyColor = 0xff3300;

            // Outer danger glow (v7 API)
            for (let i = 5; i >= 1; i--) {
                const ratio = i / 5;
                const alpha = 0.2 * pulse * (1 - ratio);
                container.beginFill(0xff0000, alpha);
                container.drawCircle(0, 0, e.size * 3 * ratio);
                container.endFill();
            }

            // === ANIME STYLE: Dramatic thick outline ===
            if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
                const outlineColor = AnimeStyleUtils.darkenColor(bodyColor, 0.5); // Darker, more menacing
                container.lineStyle(AnimeStyleConfig.outline.enemyThickness, outlineColor, 0.8);
                container.drawCircle(0, 0, e.size / 2);
                container.lineStyle(0);
            }

            // Inner glow (v7 API)
            for (let i = 3; i >= 1; i--) {
                const ratio = i / 3;
                const alpha = 0.3 * pulse * (1 - ratio);
                container.beginFill(0xff6400, alpha);
                container.drawCircle(0, 0, e.size * ratio);
                container.endFill();
            }

            // Body (v7 API)
            container.beginFill(bodyColor);
            container.drawCircle(0, 0, e.size / 2);
            container.endFill();

            // === ANIME STYLE: Evil specular highlight ===
            if (useAnimeStyle && AnimeStyleConfig.specular.enabled) {
                container.beginFill(0xffffff, 0.3);
                container.drawEllipse(-e.size * 0.15, -e.size * 0.2, e.size * 0.15, e.size * 0.08);
                container.endFill();
            }

            // Eyes (v7 API)
            container.beginFill(0xffffff);
            container.drawRect(-5, -3, 3, 3);
            container.endFill();
            container.beginFill(0xffffff);
            container.drawRect(2, -3, 3, 3);
            container.endFill();

            // Red pupils (v7 API)
            container.beginFill(0xff0000);
            container.drawRect(-4, -2, 1, 1);
            container.endFill();
            container.beginFill(0xff0000);
            container.drawRect(3, -2, 1, 1);
            container.endFill();

            // Animated tentacles (v7 API) with anime-style outlines
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + Date.now() / 300;
                const wave = Math.sin(Date.now() / 100 + i) * 5;
                const endX = Math.cos(a) * (e.size + wave);
                const endY = Math.sin(a) * (e.size + wave);
                const ctrlX = Math.cos(a + 0.3) * e.size * 0.5;
                const ctrlY = Math.sin(a + 0.3) * e.size * 0.5;

                // Tentacle outline (anime style)
                if (useAnimeStyle) {
                    container.lineStyle(5, 0x660000, 0.6);
                    container.moveTo(0, 0);
                    container.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
                }

                container.lineStyle(3, 0xff5500, 1, 0.5, false);
                container.moveTo(0, 0);
                container.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
            }

            container.x = e.x;
            container.y = e.y;
        });
    },

    updatePassenger(passenger) {
        // Handle visibility based on state
        const visibleStates = ['WAITING', 'WALKING_TO_TAXI', 'WALKING_TO_BUILDING'];
        if (!passenger || !visibleStates.includes(passenger.state)) {
            if (this.passengerSprite) {
                this.passengerSprite.visible = false;
            }
            return;
        }

        if (!this.passengerSprite) {
            this.passengerSprite = new PIXI.Graphics();
            this.containers.passenger.addChild(this.passengerSprite);
        }

        this.passengerSprite.visible = true;
        this.passengerSprite.clear();

        // Draw based on current state
        if (passenger.state === 'WAITING') {
            this.drawWaitingPassenger(passenger);
        } else if (passenger.state === 'WALKING_TO_TAXI' || passenger.state === 'WALKING_TO_BUILDING') {
            this.drawWalkingPassenger(passenger);
        }

        this.passengerSprite.x = passenger.x;
        this.passengerSprite.y = passenger.y;
    },

    drawWaitingPassenger(passenger) {
        const p = passenger;
        const teleportPulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
        const useAnimeStyle = typeof AnimeStyleConfig !== 'undefined' && AnimeStyleConfig.enabled;
        const bodyColor = 0xf472b6;
        const headColor = 0xfbcfe8;

        // Teleport glow underneath (v7 API)
        for (let i = 4; i >= 1; i--) {
            const ratio = i / 4;
            const alpha = 0.2 * teleportPulse * (1 - ratio);
            this.passengerSprite.beginFill(bodyColor, alpha);
            this.passengerSprite.drawEllipse(0, 0, 25 * ratio, 12 * ratio);
            this.passengerSprite.endFill();
        }

        // === ANIME STYLE: Body outline ===
        if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
            const outlineColor = AnimeStyleUtils.getOutlineColor(bodyColor);
            this.passengerSprite.lineStyle(AnimeStyleConfig.outline.passengerThickness, outlineColor, AnimeStyleConfig.outline.alpha);
            this.passengerSprite.drawRect(-4, -12, 8, 12);
            this.passengerSprite.lineStyle(0);
        }

        // Body (v7 API)
        this.passengerSprite.beginFill(bodyColor);
        this.passengerSprite.drawRect(-4, -12, 8, 12);
        this.passengerSprite.endFill();

        // === ANIME STYLE: Head outline ===
        if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
            const outlineColor = AnimeStyleUtils.getOutlineColor(headColor);
            this.passengerSprite.lineStyle(AnimeStyleConfig.outline.passengerThickness, outlineColor, AnimeStyleConfig.outline.alpha);
            this.passengerSprite.drawRect(-3, -18, 6, 6);
            this.passengerSprite.lineStyle(0);
        }

        // Head (v7 API)
        this.passengerSprite.beginFill(headColor);
        this.passengerSprite.drawRect(-3, -18, 6, 6);
        this.passengerSprite.endFill();

        // Bouncing arrow (v7 API)
        const bounce = Math.sin(Date.now() / 200) * 5;
        this.passengerSprite.beginFill(0xffffff);
        this.passengerSprite.moveTo(0, -25 + bounce);
        this.passengerSprite.lineTo(-5, -33 + bounce);
        this.passengerSprite.lineTo(5, -33 + bounce);
        this.passengerSprite.closePath();
        this.passengerSprite.endFill();

        // Pickup ring (v7 API)
        this.passengerSprite.lineStyle(2, bodyColor, teleportPulse);
        this.passengerSprite.drawCircle(0, -6, 15 + (1 - teleportPulse) * 10);
    },

    drawWalkingPassenger(passenger) {
        const p = passenger;
        const walkTime = Date.now() / 1000;
        const legSwing = Math.sin(walkTime * 10 * WALKING_CONFIG.legAnimationSpeed * 50) * 4;
        const bodyBob = Math.abs(Math.sin(walkTime * 10 * WALKING_CONFIG.legAnimationSpeed * 50)) * 2;
        const armSwing = -legSwing * 0.6;
        const useAnimeStyle = typeof AnimeStyleConfig !== 'undefined' && AnimeStyleConfig.enabled;
        const bodyColor = 0xf472b6;
        const headColor = 0xfbcfe8;

        // Direction indicator (flipped based on walk direction)
        const dir = p.walkDirection || 1;

        // Shadow/ground contact
        this.passengerSprite.beginFill(0x000000, 0.2);
        this.passengerSprite.drawEllipse(0, 2, 6, 3);
        this.passengerSprite.endFill();

        // Legs (animated)
        // Back leg
        this.passengerSprite.beginFill(0xc04a8a);
        this.passengerSprite.drawRect(-2 + legSwing * 0.3, -3, 3, 5);
        this.passengerSprite.endFill();

        // Front leg
        this.passengerSprite.beginFill(bodyColor);
        this.passengerSprite.drawRect(-1 - legSwing * 0.3, -3, 3, 5);
        this.passengerSprite.endFill();

        // === ANIME STYLE: Body outline ===
        if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
            const outlineColor = AnimeStyleUtils.getOutlineColor(bodyColor);
            this.passengerSprite.lineStyle(AnimeStyleConfig.outline.passengerThickness, outlineColor, AnimeStyleConfig.outline.alpha);
            this.passengerSprite.drawRect(-4, -12 - bodyBob, 8, 10);
            this.passengerSprite.lineStyle(0);
        }

        // Body (with bob)
        this.passengerSprite.beginFill(bodyColor);
        this.passengerSprite.drawRect(-4, -12 - bodyBob, 8, 10);
        this.passengerSprite.endFill();

        // Arms (swinging opposite to legs)
        // Back arm
        this.passengerSprite.beginFill(0xc04a8a);
        this.passengerSprite.drawRect(-5 + armSwing * 0.2, -10 - bodyBob, 2, 6);
        this.passengerSprite.endFill();

        // Front arm
        this.passengerSprite.beginFill(bodyColor);
        this.passengerSprite.drawRect(3 - armSwing * 0.2, -10 - bodyBob, 2, 6);
        this.passengerSprite.endFill();

        // === ANIME STYLE: Head outline ===
        if (useAnimeStyle && AnimeStyleConfig.outline.enabled) {
            const outlineColor = AnimeStyleUtils.getOutlineColor(headColor);
            this.passengerSprite.lineStyle(AnimeStyleConfig.outline.passengerThickness, outlineColor, AnimeStyleConfig.outline.alpha);
            this.passengerSprite.drawRect(-3, -18 - bodyBob, 6, 6);
            this.passengerSprite.lineStyle(0);
        }

        // Head (with slight bob)
        this.passengerSprite.beginFill(headColor);
        this.passengerSprite.drawRect(-3, -18 - bodyBob, 6, 6);
        this.passengerSprite.endFill();

        // Direction indicator arrow (above head, pointing in walk direction)
        const arrowX = dir * 8;
        this.passengerSprite.beginFill(0x00ff88, 0.8);
        this.passengerSprite.moveTo(arrowX, -22 - bodyBob);
        this.passengerSprite.lineTo(arrowX - dir * 4, -25 - bodyBob);
        this.passengerSprite.lineTo(arrowX - dir * 4, -19 - bodyBob);
        this.passengerSprite.closePath();
        this.passengerSprite.endFill();

        // Walking dust particles (occasional)
        if (Math.random() < 0.1) {
            const dustX = (Math.random() - 0.5) * 8;
            this.passengerSprite.beginFill(0xaaaaaa, 0.3);
            this.passengerSprite.drawCircle(dustX, 2, 2);
            this.passengerSprite.endFill();
        }
    }
};

// Export for use
window.PixiGameObjectsMixin = PixiGameObjectsMixin;

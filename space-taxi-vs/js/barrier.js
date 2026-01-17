// Asteroid field that serves as the central barrier
class Barrier {
    constructor() {
        this.asteroids = [];
        this.scrollOffset = 0;
        this.totalHeight = WORLD_H * 1.5; // Taller than screen for seamless scrolling
        this.init();
    }

    // Seeded random for consistent asteroid shapes
    seededRandom(seed) {
        const x = Math.sin(seed * 9999) * 10000;
        return x - Math.floor(x);
    }

    // Generate irregular asteroid shape vertices
    generateShape(seed, radius, numPoints) {
        const vertices = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            // Vary radius with seeded randomness for consistent shape
            const variance = 0.6 + this.seededRandom(seed + i * 7) * 0.8;
            const r = radius * variance;
            vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
        return vertices;
    }

    // Generate crater positions for an asteroid
    generateCraters(seed, radius, count) {
        const craters = [];
        for (let i = 0; i < count; i++) {
            const angle = this.seededRandom(seed + i * 13) * Math.PI * 2;
            const dist = this.seededRandom(seed + i * 17) * radius * 0.5;
            const size = radius * (0.1 + this.seededRandom(seed + i * 23) * 0.2);
            craters.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                radius: size
            });
        }
        return craters;
    }

    init() {
        this.asteroids = [];
        this.scrollOffset = 0;

        // Create varied asteroids in the barrier zone
        const numAsteroids = 25;

        for (let i = 0; i < numAsteroids; i++) {
            const seed = i * 1337;

            // Determine asteroid size category
            const sizeRoll = this.seededRandom(seed);
            let radius, hp, numPoints;

            if (sizeRoll < 0.3) {
                // Small asteroid
                radius = 12 + this.seededRandom(seed + 1) * 8;
                hp = 1;
                numPoints = 7;
            } else if (sizeRoll < 0.7) {
                // Medium asteroid
                radius = 22 + this.seededRandom(seed + 1) * 10;
                hp = 2;
                numPoints = 9;
            } else {
                // Large asteroid
                radius = 35 + this.seededRandom(seed + 1) * 15;
                hp = 3;
                numPoints = 11;
            }

            // Position within barrier zone with some variance
            const x = BARRIER_X + BARRIER_W / 2 + (this.seededRandom(seed + 2) - 0.5) * (BARRIER_W - radius);
            const baseY = (i / numAsteroids) * this.totalHeight;

            // Offset Y to prevent perfect grid
            const yOffset = (this.seededRandom(seed + 3) - 0.5) * 40;

            const asteroid = {
                id: i,
                x: x,
                baseY: baseY + yOffset,
                radius: radius,
                hp: hp,
                maxHp: hp,
                rotation: this.seededRandom(seed + 4) * Math.PI * 2,
                rotationSpeed: (this.seededRandom(seed + 5) - 0.5) * 0.02,
                vertices: this.generateShape(seed, radius, numPoints),
                craters: this.generateCraters(seed + 100, radius, Math.floor(radius / 10)),
                // Color variation
                colorSeed: this.seededRandom(seed + 6),
                // Slight horizontal drift
                driftX: (this.seededRandom(seed + 7) - 0.5) * 0.3,
                driftPhase: this.seededRandom(seed + 8) * Math.PI * 2
            };

            this.asteroids.push(asteroid);
        }
    }

    reset() {
        this.asteroids.forEach(asteroid => {
            asteroid.hp = asteroid.maxHp;
        });
        this.scrollOffset = 0;
    }

    update() {
        // Scroll down continuously
        this.scrollOffset += BARRIER_SCROLL_SPEED;

        // Wrap around when scrolled past total height
        if (this.scrollOffset >= this.totalHeight) {
            this.scrollOffset -= this.totalHeight;
            // Destroyed asteroids stay destroyed - players must clear a path!
        }

        // Update asteroid rotations
        this.asteroids.forEach(asteroid => {
            asteroid.rotation += asteroid.rotationSpeed;
        });
    }

    // Calculate the screen Y position for an asteroid
    getAsteroidScreenY(asteroid) {
        let y = (asteroid.baseY + this.scrollOffset) % this.totalHeight;
        // Shift so asteroids scroll down through screen
        y = y - (this.totalHeight - WORLD_H);
        return y;
    }

    // Get current X position (with drift)
    getAsteroidScreenX(asteroid) {
        const drift = Math.sin(this.scrollOffset * 0.01 + asteroid.driftPhase) * 10 * asteroid.driftX;
        return asteroid.x + drift;
    }

    checkPlayerCollision(player) {
        if (!player.alive) return false;

        const box = player.getBoundingBox();
        const playerCenterX = box.x + box.w / 2;
        const playerCenterY = box.y + box.h / 2;
        const playerRadius = Math.max(box.w, box.h) / 2;

        for (const asteroid of this.asteroids) {
            if (asteroid.hp <= 0) continue;

            const screenY = this.getAsteroidScreenY(asteroid);
            const screenX = this.getAsteroidScreenX(asteroid);

            // Skip if asteroid is off-screen
            if (screenY > WORLD_H + asteroid.radius || screenY < -asteroid.radius) continue;

            // Circle-based collision (good enough for asteroids)
            const dx = playerCenterX - screenX;
            const dy = playerCenterY - screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Use slightly smaller collision radius for fairness
            if (dist < asteroid.radius * 0.7 + playerRadius * 0.6) {
                return true;
            }
        }

        return false;
    }

    getBlockAt(x, y) {
        // For projectile collision - returns asteroid if hit
        for (const asteroid of this.asteroids) {
            if (asteroid.hp <= 0) continue;

            const screenY = this.getAsteroidScreenY(asteroid);
            const screenX = this.getAsteroidScreenX(asteroid);

            // Skip if off-screen
            if (screenY > WORLD_H + asteroid.radius || screenY < -asteroid.radius) continue;

            const dx = x - screenX;
            const dy = y - screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < asteroid.radius * 0.8) {
                return asteroid;
            }
        }

        return null;
    }

    damageBlock(asteroid) {
        if (asteroid && asteroid.hp > 0) {
            asteroid.hp--;
            // Add rotation impulse when hit
            asteroid.rotationSpeed += (Math.random() - 0.5) * 0.05;
            return true;
        }
        return false;
    }

    // For compatibility with old block system
    getBlockScreenY(block) {
        return this.getAsteroidScreenY(block);
    }

    isPassable(x) {
        // Check if there's a gap at the given x position
        let blockedCount = 0;
        const checkPoints = 10;

        for (let i = 0; i < checkPoints; i++) {
            const y = (i / checkPoints) * WORLD_H;
            if (this.getBlockAt(x, y)) {
                blockedCount++;
            }
        }

        return blockedCount < checkPoints * 0.3;
    }

    getTotalHP() {
        return this.asteroids.reduce((sum, a) => sum + a.hp, 0);
    }

    getDestroyedPercentage() {
        const maxHP = this.asteroids.reduce((sum, a) => sum + a.maxHp, 0);
        const currentHP = this.getTotalHP();
        return ((maxHP - currentHP) / maxHP) * 100;
    }

    // Get all asteroids for rendering
    getAsteroids() {
        return this.asteroids;
    }
}

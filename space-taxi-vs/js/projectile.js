class Projectile {
    constructor(x, y, vx, vy, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
        this.alive = true;
    }

    update() {
        if (!this.alive) return;

        this.x += this.vx;
        this.y += this.vy;

        // Small gravity effect
        this.vy += GRAVITY * 0.1;

        // Screen wrap (vertical)
        if (this.y > WORLD_H + PROJECTILE_SIZE) {
            this.y = -PROJECTILE_SIZE;
        } else if (this.y < -PROJECTILE_SIZE) {
            this.y = WORLD_H + PROJECTILE_SIZE;
        }

        // Destroy if off screen horizontally
        if (this.x < -PROJECTILE_SIZE || this.x > WORLD_W + PROJECTILE_SIZE) {
            this.alive = false;
        }
    }

    checkPlayerCollision(player) {
        if (!this.alive || !player.alive) return false;
        if (player.playerNum === this.owner) return false;

        const box = player.getBoundingBox();

        return (
            this.x + PROJECTILE_SIZE / 2 > box.x &&
            this.x - PROJECTILE_SIZE / 2 < box.x + box.w &&
            this.y + PROJECTILE_SIZE / 2 > box.y &&
            this.y - PROJECTILE_SIZE / 2 < box.y + box.h
        );
    }

    checkBarrierCollision(barrier) {
        if (!this.alive) return null;
        // Use barrier's getBlockAt which works with both old blocks and new asteroids
        return barrier.getBlockAt(this.x, this.y);
    }

    die() {
        this.alive = false;
    }
}


class ProjectileManager {
    constructor() {
        this.projectiles = [];
    }

    add(projectileData) {
        if (projectileData) {
            this.projectiles.push(new Projectile(
                projectileData.x,
                projectileData.y,
                projectileData.vx,
                projectileData.vy,
                projectileData.owner
            ));
        }
    }

    update() {
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => p.alive);
    }

    checkCollisions(players, barrier, audio, createExplosion, createDebris) {
        const hits = [];

        this.projectiles.forEach(projectile => {
            if (!projectile.alive) return;

            // Check player hits
            players.forEach(player => {
                if (projectile.checkPlayerCollision(player)) {
                    player.die();
                    projectile.die();
                    audio.playExplosion();
                    createExplosion(player.x, player.y, player.playerNum);
                    hits.push({ type: 'player', player, projectile });
                }
            });

            // Check barrier hits (asteroids)
            const hitAsteroid = projectile.checkBarrierCollision(barrier);
            if (hitAsteroid) {
                const wasDestroyed = hitAsteroid.hp === 1;
                const screenX = barrier.getAsteroidScreenX(hitAsteroid);
                const screenY = barrier.getAsteroidScreenY(hitAsteroid);

                barrier.damageBlock(hitAsteroid);
                projectile.die();
                audio.playHitBarrier();

                // Create debris particles
                if (createDebris) {
                    createDebris(screenX, screenY, hitAsteroid.radius, wasDestroyed);
                }

                hits.push({ type: 'barrier', block: hitAsteroid, projectile, destroyed: wasDestroyed });
            }
        });

        return hits;
    }

    clear() {
        this.projectiles = [];
    }

    getAll() {
        return this.projectiles;
    }
}

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

        for (const block of barrier.blocks) {
            if (block.hp <= 0) continue;

            const screenY = barrier.getBlockScreenY(block);

            // Skip if off-screen
            if (screenY > WORLD_H || screenY + BLOCK_H < 0) continue;

            if (
                this.x + PROJECTILE_SIZE / 2 > block.x &&
                this.x - PROJECTILE_SIZE / 2 < block.x + BLOCK_W &&
                this.y + PROJECTILE_SIZE / 2 > screenY &&
                this.y - PROJECTILE_SIZE / 2 < screenY + BLOCK_H
            ) {
                return block;
            }
        }

        return null;
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

    checkCollisions(players, barrier, audio, createExplosion) {
        const hits = [];

        this.projectiles.forEach(projectile => {
            if (!projectile.alive) return;

            // Check player hits
            players.forEach(player => {
                if (projectile.checkPlayerCollision(player)) {
                    player.die();
                    projectile.die();
                    audio.playExplosion();
                    createExplosion(player.x, player.y);
                    hits.push({ type: 'player', player, projectile });
                }
            });

            // Check barrier hits
            const hitBlock = projectile.checkBarrierCollision(barrier);
            if (hitBlock) {
                hitBlock.hp--;
                projectile.die();
                audio.playHitBarrier();
                hits.push({ type: 'barrier', block: hitBlock, projectile });
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

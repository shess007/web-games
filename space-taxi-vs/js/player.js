class Player {
    constructor(playerNum, spawnX, spawnY) {
        this.playerNum = playerNum;
        this.spawnX = spawnX;
        this.spawnY = spawnY;

        this.reset();
    }

    reset() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.fuel = MAX_FUEL;
        this.ammo = MAX_AMMO;
        this.alive = true;
        this.shootCooldown = 0;
        this.landedOn = null;
        this.gearOut = false;
        this.thrusting = false;
    }

    update(input) {
        if (!this.alive) return;

        this.thrusting = false;

        // Handle thrust
        if (this.fuel > 0) {
            if (input.up) {
                this.vy -= THRUST_UP;
                this.fuel -= FUEL_BURN_THRUST;
                this.thrusting = true;
            }
            if (input.left) {
                this.vx -= THRUST_SIDE;
                this.fuel -= FUEL_BURN_SIDE;
                this.angle = Math.max(this.angle - 0.05, -0.3);
                this.thrusting = true;
            } else if (input.right) {
                this.vx += THRUST_SIDE;
                this.fuel -= FUEL_BURN_SIDE;
                this.angle = Math.min(this.angle + 0.05, 0.3);
                this.thrusting = true;
            } else {
                this.angle *= 0.9;
            }
        } else {
            this.angle *= 0.95;
        }

        // Apply physics
        this.vy += GRAVITY;
        this.vx *= DRAG;
        this.vy *= DRAG;

        // Clamp velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > MAX_VELOCITY) {
            this.vx = (this.vx / speed) * MAX_VELOCITY;
            this.vy = (this.vy / speed) * MAX_VELOCITY;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Screen wrap (vertical) - ONLY in the middle barrier zone
        const inWrapZone = this.x >= WRAP_ZONE_X && this.x <= WRAP_ZONE_X + WRAP_ZONE_W;

        if (inWrapZone) {
            // Allow wrap through in barrier zone
            if (this.y > WORLD_H + PLAYER_H) {
                this.y = -PLAYER_H;
            } else if (this.y < -PLAYER_H) {
                this.y = WORLD_H + PLAYER_H;
            }
        } else {
            // Outside barrier zone: solid ceiling and floor
            // Ceiling collision
            if (this.y - PLAYER_H / 2 < CEILING_H) {
                this.y = CEILING_H + PLAYER_H / 2;
                this.vy = Math.abs(this.vy) * 0.3; // Bounce down slightly
            }
            // Floor collision (don't stop here, landing is handled in checkPlatformCollision)
            if (this.y + PLAYER_H / 2 > FLOOR_Y) {
                // Will be handled by platform collision for landing
            }
        }

        // Horizontal bounds
        if (this.x < PLAYER_W / 2) {
            this.x = PLAYER_W / 2;
            this.vx = 0;
        } else if (this.x > WORLD_W - PLAYER_W / 2) {
            this.x = WORLD_W - PLAYER_W / 2;
            this.vx = 0;
        }

        // Update cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Fuel clamping
        this.fuel = Math.max(0, Math.min(MAX_FUEL, this.fuel));

        // Check if near any platform or floor for landing gear
        this.gearOut = false;
        this.landedOn = null;

        // Check floor proximity (outside wrap zone)
        const inWrapZoneNow = this.x >= WRAP_ZONE_X && this.x <= WRAP_ZONE_X + WRAP_ZONE_W;
        if (!inWrapZoneNow && this.y > FLOOR_Y - 80) {
            this.gearOut = true;
        }

        // Check ammo platforms
        Object.entries(PLATFORMS).forEach(([id, p]) => {
            if (p.type === 'ammo') {
                const dist = Math.sqrt(
                    Math.pow(this.x - (p.x + p.w / 2), 2) +
                    Math.pow(this.y - p.y, 2)
                );
                if (dist < 80) {
                    this.gearOut = true;
                }
            }
        });
    }

    checkPlatformCollision() {
        let landed = null;

        // Check floor landing (fuel platforms)
        const inWrapZone = this.x >= WRAP_ZONE_X && this.x <= WRAP_ZONE_X + WRAP_ZONE_W;

        if (!inWrapZone && this.y + PLAYER_H / 2 >= FLOOR_Y) {
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

            // Check landing conditions
            if (speed < 6 && Math.abs(this.angle) < 0.4 && this.vy >= 0) {
                // Successful landing on floor
                this.y = FLOOR_Y - PLAYER_H / 2;
                this.vy = 0;
                this.vx *= 0.5;
                this.angle = 0;
                this.landedOn = this.x < WORLD_W / 2 ? 'floorLeft' : 'floorRight';
                landed = { type: 'fuel' };
            } else if (speed >= 6) {
                // Crash into floor at high speed
                return { type: 'crash' };
            }
        }

        // Check ammo platform landing
        Object.entries(PLATFORMS).forEach(([id, p]) => {
            if (p.type !== 'ammo') return; // Floor fuel handled above

            if (
                this.x + PLAYER_W / 2 > p.x &&
                this.x - PLAYER_W / 2 < p.x + p.w &&
                this.y + PLAYER_H / 2 > p.y &&
                this.y - PLAYER_H / 2 < p.y + p.h
            ) {
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

                // Check landing conditions
                if (speed < 6 && Math.abs(this.angle) < 0.4 && this.vy >= 0) {
                    // Successful landing
                    this.y = p.y - PLAYER_H / 2;
                    this.vy = 0;
                    this.vx *= 0.5;
                    this.angle = 0;
                    this.landedOn = id;
                    landed = p;
                }
            }
        });

        return landed;
    }

    canShoot() {
        return this.alive && this.ammo >= 1 && this.shootCooldown === 0;
    }

    shoot() {
        if (!this.canShoot()) return null;

        this.ammo -= 1;
        this.shootCooldown = SHOOT_COOLDOWN;

        // Determine shoot direction based on player position
        const direction = this.x < WORLD_W / 2 ? 1 : -1;

        return {
            x: this.x + (direction * PLAYER_W / 2),
            y: this.y,
            vx: direction * PROJECTILE_SPEED,
            vy: this.vy * 0.3, // Inherit some vertical velocity
            owner: this.playerNum
        };
    }

    die() {
        this.alive = false;
    }

    getBoundingBox() {
        return {
            x: this.x - PLAYER_W / 2,
            y: this.y - PLAYER_H / 2,
            w: PLAYER_W,
            h: PLAYER_H
        };
    }

    refuel(amount) {
        const before = this.fuel;
        this.fuel = Math.min(MAX_FUEL, this.fuel + amount);
        return this.fuel > before;
    }

    reload(amount) {
        const before = this.ammo;
        this.ammo = Math.min(MAX_AMMO, this.ammo + amount);
        return this.ammo > before;
    }
}

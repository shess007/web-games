class Barrier {
    constructor() {
        this.blocks = [];
        this.scrollOffset = 0;
        this.totalHeight = BARRIER_ROWS * BLOCK_H;
        this.init();
    }

    init() {
        this.blocks = [];
        this.scrollOffset = 0;

        // Create grid of blocks that covers more than screen height
        for (let row = 0; row < BARRIER_ROWS; row++) {
            for (let col = 0; col < BARRIER_COLS; col++) {
                this.blocks.push({
                    x: BARRIER_X + col * BLOCK_W,
                    baseY: row * BLOCK_H,
                    row: row,
                    col: col,
                    hp: BLOCK_HP
                });
            }
        }
    }

    reset() {
        this.blocks.forEach(block => {
            block.hp = BLOCK_HP;
        });
        this.scrollOffset = 0;
    }

    update() {
        // Scroll down continuously
        this.scrollOffset += BARRIER_SCROLL_SPEED;

        // Wrap around when scrolled past total barrier height
        if (this.scrollOffset >= this.totalHeight) {
            this.scrollOffset -= this.totalHeight;
        }
    }

    // Calculate the screen Y position for a block
    getBlockScreenY(block) {
        // Add scroll offset and wrap around total height
        let y = (block.baseY + this.scrollOffset) % this.totalHeight;
        // Shift so blocks appear to scroll down through screen
        y = y - (this.totalHeight - WORLD_H);
        return y;
    }

    checkPlayerCollision(player) {
        if (!player.alive) return false;

        const box = player.getBoundingBox();

        for (const block of this.blocks) {
            if (block.hp <= 0) continue;

            const screenY = this.getBlockScreenY(block);

            // Skip if block is off-screen
            if (screenY > WORLD_H || screenY + BLOCK_H < 0) continue;

            if (
                box.x + box.w > block.x &&
                box.x < block.x + BLOCK_W &&
                box.y + box.h > screenY &&
                box.y < screenY + BLOCK_H
            ) {
                return true;
            }
        }

        return false;
    }

    getBlockAt(x, y) {
        for (const block of this.blocks) {
            if (block.hp <= 0) continue;

            const screenY = this.getBlockScreenY(block);

            // Skip if off-screen
            if (screenY > WORLD_H || screenY + BLOCK_H < 0) continue;

            if (
                x >= block.x &&
                x < block.x + BLOCK_W &&
                y >= screenY &&
                y < screenY + BLOCK_H
            ) {
                return block;
            }
        }

        return null;
    }

    damageBlock(block) {
        if (block && block.hp > 0) {
            block.hp--;
            return true;
        }
        return false;
    }

    isPassable(x) {
        // Check if there's a gap at the given x position
        // This is more for pathfinding/AI use later
        const col = Math.floor((x - BARRIER_X) / BLOCK_W);
        if (col < 0 || col >= BARRIER_COLS) return true;

        let openBlocks = 0;
        this.blocks
            .filter(b => b.col === col)
            .forEach(b => {
                if (b.hp <= 0) openBlocks++;
            });

        return openBlocks >= BARRIER_ROWS * 0.3; // At least 30% open
    }

    getTotalHP() {
        return this.blocks.reduce((sum, b) => sum + b.hp, 0);
    }

    getDestroyedPercentage() {
        const maxHP = this.blocks.length * BLOCK_HP;
        const currentHP = this.getTotalHP();
        return ((maxHP - currentHP) / maxHP) * 100;
    }
}

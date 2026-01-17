import { CONFIG } from './config.js';
import { walls } from './state.js';

/**
 * Collision Detection System
 */

export function checkWallCollision(x, z, radius) {
    for (const wall of walls) {
        // AABB collision with circle
        const closestX = Math.max(wall.minX, Math.min(x, wall.maxX));
        const closestZ = Math.max(wall.minZ, Math.min(z, wall.maxZ));

        const distX = x - closestX;
        const distZ = z - closestZ;
        const distance = Math.sqrt(distX * distX + distZ * distZ);

        if (distance < radius) {
            return true;
        }
    }

    // Boundary check
    const totalSize = CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE;
    if (x - radius < 0 || x + radius > totalSize ||
        z - radius < 0 || z + radius > totalSize) {
        return true;
    }

    return false;
}

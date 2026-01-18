// Physics Engine

/**
 * Calculates distance from a point to a line segment
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} x1 - Segment start X
 * @param {number} y1 - Segment start Y
 * @param {number} x2 - Segment end X
 * @param {number} y2 - Segment end Y
 * @returns {Object} Distance and collision info
 */
export function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    let t = 0;
    if (lengthSq > 0) {
        t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
    }

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    return {
        distance: Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2),
        nearestX,
        nearestY,
        normalX: px - nearestX,
        normalY: py - nearestY
    };
}

/**
 * Updates physics simulation
 * @param {Object} state - Game state
 * @param {Object} config - Game configuration
 */
export function updatePhysics(state, config) {
    if (!state.playing || state.won) return;

    const { marble, tilt } = state;

    // Apply tilt as acceleration
    marble.vx += tilt.x * config.sensitivity;
    marble.vy += tilt.y * config.sensitivity;

    // Apply friction
    marble.vx *= config.friction;
    marble.vy *= config.friction;

    // Clamp speed
    const speed = Math.sqrt(marble.vx ** 2 + marble.vy ** 2);
    if (speed > config.maxSpeed) {
        marble.vx = (marble.vx / speed) * config.maxSpeed;
        marble.vy = (marble.vy / speed) * config.maxSpeed;
    }

    // Update position
    marble.x += marble.vx;
    marble.y += marble.vy;
}

/**
 * Checks and resolves wall collisions
 * @param {Object} state - Game state
 * @param {Object} config - Game configuration
 * @returns {Object|null} Collision point if collision occurred
 */
export function checkCollisions(state, config) {
    const { marble, walls } = state;
    let collisionPoint = null;

    for (const wall of walls) {
        const result = pointToSegmentDistance(
            marble.x, marble.y,
            wall.x1, wall.y1, wall.x2, wall.y2
        );

        const minDist = config.marbleRadius + config.wallThickness / 2;

        if (result.distance < minDist) {
            collisionPoint = { x: result.nearestX, y: result.nearestY };

            // Push marble out
            const overlap = minDist - result.distance;
            const len = Math.sqrt(result.normalX ** 2 + result.normalY ** 2);
            if (len > 0) {
                marble.x += (result.normalX / len) * overlap;
                marble.y += (result.normalY / len) * overlap;

                // Reflect velocity
                const nx = result.normalX / len;
                const ny = result.normalY / len;
                const dot = marble.vx * nx + marble.vy * ny;
                marble.vx -= 1.5 * dot * nx;
                marble.vy -= 1.5 * dot * ny;

                // Dampen on collision
                marble.vx *= 0.5;
                marble.vy *= 0.5;
            }
        }
    }

    return collisionPoint;
}

/**
 * Checks if marble has reached the target
 * @param {Object} state - Game state
 * @param {Object} config - Game configuration
 * @returns {boolean} True if win condition met
 */
export function checkWin(state, config) {
    const { marble, target } = state;
    const dist = Math.sqrt(
        (marble.x - target.x) ** 2 + (marble.y - target.y) ** 2
    );

    return dist < config.marbleRadius + config.targetRadius;
}

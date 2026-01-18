// Game State Management

/**
 * Creates a new game state object
 * @returns {Object} Initial game state
 */
export function createState() {
    return {
        level: 1,
        playing: false,
        startTime: 0,
        marble: { x: 0, y: 0, vx: 0, vy: 0 },
        target: { x: 0, y: 0 },
        walls: [],
        tilt: { x: 0, y: 0 },
        lastCollision: 0,
        won: false,
    };
}

/**
 * Resets state for a new level
 * @param {Object} state - Current game state
 * @param {number} level - New level number
 */
export function resetState(state, level) {
    state.level = level;
    state.playing = false;
    state.startTime = 0;
    state.marble = { x: 0, y: 0, vx: 0, vy: 0 };
    state.target = { x: 0, y: 0 };
    state.walls = [];
    state.tilt = { x: 0, y: 0 };
    state.lastCollision = 0;
    state.won = false;
}

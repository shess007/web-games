/**
 * Game Configuration Constants
 */
export const CONFIG = {
    // Maze settings
    MAZE_SIZE: 9,
    CELL_SIZE: 5,
    WALL_HEIGHT: 5,

    // Player settings
    PLAYER_RADIUS: 0.4,
    PLAYER_SPEED: 8,
    TURN_SPEED: 3,

    // Attack settings (button press required to attack)
    ATTACK_RANGE: 2.0,           // Distance in units
    ATTACK_ANGLE: Math.PI / 3,   // 60 degree cone (30 each side)
    ATTACK_COOLDOWN: 0.8,        // Seconds between attacks
    ATTACK_LUNGE_DISTANCE: 0.3,  // Camera lunge distance
    ATTACK_LUNGE_SPEED: 8,       // Camera lunge recovery speed

    // Game timing
    GAMEPLAY_DURATION: 10,
    MAP_DURATION: 5,

    // Visual settings
    FOG_DENSITY: 0.055,

    // Camera bob
    BOB_SPEED: 12,
    BOB_AMOUNT: 0.08
};

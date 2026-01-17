// Arena Dimensions
const WORLD_W = 800;
const WORLD_H = 600;

// Player Dimensions (same as original Space Taxi)
const PLAYER_W = 30;
const PLAYER_H = 16;

// Physics
const GRAVITY = 0.06;
const THRUST_UP = 0.2;
const THRUST_SIDE = 0.15;
const MAX_VELOCITY = 8;
const DRAG = 0.98;

// Fuel System
const MAX_FUEL = 100;
const FUEL_BURN_THRUST = 0.15;
const FUEL_BURN_SIDE = 0.06;
const FUEL_REFILL_RATE = 1.5;

// Ammo System
const MAX_AMMO = 15;
const AMMO_REFILL_RATE = 0.015; // Per frame when on ammo platform (~1 ammo per second)
const SHOOT_COOLDOWN = 15; // Frames between shots

// Projectile
const PROJECTILE_SPEED = 12;
const PROJECTILE_SIZE = 6;

// Barrier
const BARRIER_X = 375; // Left edge of barrier (centered)
const BARRIER_W = 50; // Width of barrier zone
const BARRIER_COLS = 4;
const BARRIER_ROWS = 24; // More rows for continuous scroll effect
const BLOCK_W = BARRIER_W / BARRIER_COLS;
const BLOCK_H = 25;
const BLOCK_HP = 2;
const BARRIER_SCROLL_SPEED = 1;

// Match
const ROUNDS_TO_WIN = 3;
const ROUND_START_DELAY = 90; // Frames before round starts
const ROUND_END_DELAY = 60; // Frames before next round

// Platforms
// The floor is now the fuel platform (except middle barrier zone)
// Ammo platforms are on the sides
const FLOOR_Y = 570;
const FLOOR_H = 30;
const CEILING_Y = 0;
const CEILING_H = 30;

const PLATFORMS = {
    // Floor = Fuel (left side, up to barrier)
    floorLeft: { x: 0, y: FLOOR_Y, w: BARRIER_X, h: FLOOR_H, type: 'fuel' },
    // Floor = Fuel (right side, after barrier)
    floorRight: { x: BARRIER_X + BARRIER_W, y: FLOOR_Y, w: WORLD_W - BARRIER_X - BARRIER_W, h: FLOOR_H, type: 'fuel' },
    // Ammo platforms on sides
    ammo1: { x: 20, y: 280, w: 80, h: 15, type: 'ammo', player: 1 },
    ammo2: { x: 700, y: 280, w: 80, h: 15, type: 'ammo', player: 2 }
};

// Wrap zone - only the middle (barrier zone) allows vertical screen wrap
const WRAP_ZONE_X = BARRIER_X;
const WRAP_ZONE_W = BARRIER_W;

// Spawn positions
const SPAWN_P1 = { x: 100, y: 150 };
const SPAWN_P2 = { x: 700, y: 150 };

// Colors (Taxi style like original Space Taxi)
const COLORS = {
    p1: {
        body: '#fbbf24',      // Gold yellow (original taxi)
        cockpit: '#00ff88',   // Green cockpit to distinguish
        shadow: 'rgba(0,0,0,0.2)',
        gear: '#444',
        thrust: '#ffff55'
    },
    p2: {
        body: '#fbbf24',      // Gold yellow (original taxi)
        cockpit: '#ff6600',   // Orange cockpit to distinguish
        shadow: 'rgba(0,0,0,0.2)',
        gear: '#444',
        thrust: '#ffff55'
    },
    barrier: '#665544',
    barrierDamaged: '#884422',
    barrierCritical: '#aa2200',
    projectile: '#ffffff',
    platform: {
        fuel: '#00ff44',    // Green
        ammo: '#ffaa00'
    },
    floor: '#111',
    ceiling: '#1a1a25',
    background: '#020205'   // Darker like original
};

// Input mappings
const KEYS_P1 = {
    up: ['KeyW'],
    left: ['KeyA'],
    right: ['KeyD'],
    shoot: ['Space']
};

const KEYS_P2 = {
    up: ['ArrowUp'],
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    shoot: ['Enter']
};

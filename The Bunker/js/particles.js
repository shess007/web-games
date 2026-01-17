import { CONFIG } from './config.js';
import { scene, lamps } from './state.js';

/**
 * Particle Effects System
 * - Dust particles floating in light beams
 * - Sparks from flickering/broken lamps
 * - Low-lying fog wisps
 */

// Particle systems
let dustParticles = null;
let fogWisps = null;
let sparkSystems = [];

// Dust particle data
const DUST_COUNT = 500;
let dustPositions = null;
let dustVelocities = null;

// Fog wisp data
const FOG_COUNT = 200;
let fogPositions = null;
let fogVelocities = null;

// Spark data
const MAX_SPARKS_PER_LAMP = 20;

/**
 * Initialize all particle systems
 */
export function initParticles() {
    createDustParticles();
    createFogWisps();
}

/**
 * Create floating dust particles
 */
function createDustParticles() {
    const geometry = new THREE.BufferGeometry();
    dustPositions = new Float32Array(DUST_COUNT * 3);
    dustVelocities = [];

    const mazeExtent = CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE;

    for (let i = 0; i < DUST_COUNT; i++) {
        // Random position within maze
        dustPositions[i * 3] = Math.random() * mazeExtent;
        dustPositions[i * 3 + 1] = Math.random() * CONFIG.WALL_HEIGHT;
        dustPositions[i * 3 + 2] = Math.random() * mazeExtent;

        // Slow random velocity
        dustVelocities.push({
            x: (Math.random() - 0.5) * 0.1,
            y: (Math.random() - 0.5) * 0.05,
            z: (Math.random() - 0.5) * 0.1
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffee,
        size: 0.03,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    dustParticles = new THREE.Points(geometry, material);
    scene.add(dustParticles);
}

/**
 * Create low-lying fog wisps
 */
function createFogWisps() {
    const geometry = new THREE.BufferGeometry();
    fogPositions = new Float32Array(FOG_COUNT * 3);
    fogVelocities = [];

    const mazeExtent = CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE;

    for (let i = 0; i < FOG_COUNT; i++) {
        // Random position, but keep low to ground
        fogPositions[i * 3] = Math.random() * mazeExtent;
        fogPositions[i * 3 + 1] = Math.random() * 0.8; // Low to ground
        fogPositions[i * 3 + 2] = Math.random() * mazeExtent;

        // Very slow drifting motion
        fogVelocities.push({
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.3,
            phase: Math.random() * Math.PI * 2
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x888899,
        size: 0.15,
        transparent: true,
        opacity: 0.15,
        blending: THREE.NormalBlending,
        depthWrite: false
    });

    fogWisps = new THREE.Points(geometry, material);
    scene.add(fogWisps);
}

/**
 * Emit sparks from a lamp
 */
export function emitSparks(lamp) {
    if (!lamp.light) return;

    const sparkCount = 3 + Math.floor(Math.random() * 5);
    const lampPos = lamp.group.position;

    for (let i = 0; i < sparkCount; i++) {
        createSpark(lampPos.x, lampPos.y - 0.3, lampPos.z);
    }
}

/**
 * Create a single spark particle
 */
function createSpark(x, y, z) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([x, y, z]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.08,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const spark = new THREE.Points(geometry, material);

    // Spark physics data
    const sparkData = {
        mesh: spark,
        velocity: {
            x: (Math.random() - 0.5) * 2,
            y: -1 - Math.random() * 2,
            z: (Math.random() - 0.5) * 2
        },
        life: 0.5 + Math.random() * 0.5,
        age: 0
    };

    scene.add(spark);
    sparkSystems.push(sparkData);
}

/**
 * Update all particle systems
 */
export function updateParticles(delta) {
    updateDustParticles(delta);
    updateFogWisps(delta);
    updateSparks(delta);
    checkLampSparks(delta);
}

/**
 * Update dust particles
 */
function updateDustParticles(delta) {
    if (!dustParticles) return;

    const positions = dustParticles.geometry.attributes.position.array;
    const mazeExtent = CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE;

    for (let i = 0; i < DUST_COUNT; i++) {
        const i3 = i * 3;
        const vel = dustVelocities[i];

        // Update position
        positions[i3] += vel.x * delta;
        positions[i3 + 1] += vel.y * delta;
        positions[i3 + 2] += vel.z * delta;

        // Add slight turbulence
        positions[i3] += Math.sin(Date.now() * 0.001 + i) * 0.002;
        positions[i3 + 1] += Math.cos(Date.now() * 0.0015 + i) * 0.001;

        // Wrap around maze boundaries
        if (positions[i3] < 0) positions[i3] = mazeExtent;
        if (positions[i3] > mazeExtent) positions[i3] = 0;
        if (positions[i3 + 1] < 0) positions[i3 + 1] = CONFIG.WALL_HEIGHT;
        if (positions[i3 + 1] > CONFIG.WALL_HEIGHT) positions[i3 + 1] = 0;
        if (positions[i3 + 2] < 0) positions[i3 + 2] = mazeExtent;
        if (positions[i3 + 2] > mazeExtent) positions[i3 + 2] = 0;
    }

    dustParticles.geometry.attributes.position.needsUpdate = true;
}

/**
 * Update fog wisps
 */
function updateFogWisps(delta) {
    if (!fogWisps) return;

    const positions = fogWisps.geometry.attributes.position.array;
    const mazeExtent = CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE;
    const time = Date.now() * 0.001;

    for (let i = 0; i < FOG_COUNT; i++) {
        const i3 = i * 3;
        const vel = fogVelocities[i];

        // Slow drifting with sine wave motion
        positions[i3] += vel.x * delta + Math.sin(time + vel.phase) * 0.01;
        positions[i3 + 1] += Math.sin(time * 0.5 + vel.phase) * 0.005;
        positions[i3 + 2] += vel.z * delta + Math.cos(time + vel.phase) * 0.01;

        // Keep fog low
        if (positions[i3 + 1] < 0) positions[i3 + 1] = 0;
        if (positions[i3 + 1] > 1.0) positions[i3 + 1] = 0.5;

        // Wrap around maze boundaries
        if (positions[i3] < 0) positions[i3] = mazeExtent;
        if (positions[i3] > mazeExtent) positions[i3] = 0;
        if (positions[i3 + 2] < 0) positions[i3 + 2] = mazeExtent;
        if (positions[i3 + 2] > mazeExtent) positions[i3 + 2] = 0;
    }

    fogWisps.geometry.attributes.position.needsUpdate = true;
}

/**
 * Update spark particles
 */
function updateSparks(delta) {
    for (let i = sparkSystems.length - 1; i >= 0; i--) {
        const spark = sparkSystems[i];
        spark.age += delta;

        if (spark.age >= spark.life) {
            // Remove dead spark
            scene.remove(spark.mesh);
            spark.mesh.geometry.dispose();
            spark.mesh.material.dispose();
            sparkSystems.splice(i, 1);
            continue;
        }

        // Update position with gravity
        const positions = spark.mesh.geometry.attributes.position.array;
        positions[0] += spark.velocity.x * delta;
        positions[1] += spark.velocity.y * delta;
        positions[2] += spark.velocity.z * delta;

        // Apply gravity
        spark.velocity.y -= 5 * delta;

        // Fade out
        const lifeRatio = 1 - (spark.age / spark.life);
        spark.mesh.material.opacity = lifeRatio;

        spark.mesh.geometry.attributes.position.needsUpdate = true;
    }
}

/**
 * Check flickering lamps and emit sparks randomly
 */
let sparkTimer = 0;
function checkLampSparks(delta) {
    sparkTimer += delta;

    // Only check periodically
    if (sparkTimer < 0.1) return;
    sparkTimer = 0;

    for (const lamp of lamps) {
        // Emit sparks from flickering lamps occasionally
        if (lamp.state === 'flickering' && !lamp.flickerPause) {
            if (Math.random() < 0.03) {
                emitSparks(lamp);
            }
        }
        // Broken lamps emit sparks rarely
        if (lamp.state === 'broken') {
            if (Math.random() < 0.005) {
                emitSparks(lamp);
            }
        }
    }
}

/**
 * Clean up particles (for restart)
 */
export function resetParticles() {
    if (dustParticles) {
        scene.remove(dustParticles);
        dustParticles.geometry.dispose();
        dustParticles.material.dispose();
        dustParticles = null;
    }

    if (fogWisps) {
        scene.remove(fogWisps);
        fogWisps.geometry.dispose();
        fogWisps.material.dispose();
        fogWisps = null;
    }

    for (const spark of sparkSystems) {
        scene.remove(spark.mesh);
        spark.mesh.geometry.dispose();
        spark.mesh.material.dispose();
    }
    sparkSystems = [];
}

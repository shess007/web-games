import { CONFIG } from './config.js';
import {
    scene, renderer, camera1, camera2,
    player1, player2, maze,
    player1BobPhase, player2BobPhase,
    player1LungeOffset, player2LungeOffset,
    setScene, setRenderer, setCamera1, setCamera2,
    setPlayer1, setPlayer2, setMaze, resetWalls, addWall
} from './state.js';
import { generateMaze } from './maze.js';
import { createWallTexture, createFloorTexture, createCeilingTexture, createNormalMap } from './textures.js';
import { createLamps } from './lamps.js';
import { createPlayerMeshes } from './creatures.js';
import { initParticles } from './particles.js';

/**
 * Three.js Renderer Setup and Rendering
 */

export function initThreeJS(canvas) {
    // Scene
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x000000);
    newScene.fog = new THREE.FogExp2(0x000000, CONFIG.FOG_DENSITY);
    setScene(newScene);

    // Renderer
    const newRenderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    newRenderer.shadowMap.enabled = false;
    setRenderer(newRenderer);

    // Cameras
    const aspect = (window.innerWidth / 2) / window.innerHeight;
    const cam1 = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
    const cam2 = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);

    // Set up camera layers:
    // Layer 0: All world objects (walls, floor, lamps, etc.)
    // Layer 1: Player 1 mesh (visible to camera 2 only)
    // Layer 2: Player 2 mesh (visible to camera 1 only)
    cam1.layers.enable(0);  // World objects
    cam1.layers.enable(2);  // Player 2 mesh (see opponent)
    // cam1 does NOT enable layer 1, so it won't see player 1 mesh

    cam2.layers.enable(0);  // World objects
    cam2.layers.enable(1);  // Player 1 mesh (see opponent)
    // cam2 does NOT enable layer 2, so it won't see player 2 mesh

    setCamera1(cam1);
    setCamera2(cam2);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x1a1a22, 0.8);
    scene.add(ambientLight);

    // Create maze geometry
    createMazeGeometry();

    // Create players
    createPlayers();

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

export function createMazeGeometry() {
    // Generate maze
    const newMaze = generateMaze(CONFIG.MAZE_SIZE, CONFIG.MAZE_SIZE);
    setMaze(newMaze);

    // Create procedural textures
    const wallTexture = createWallTexture();
    const floorTexture = createFloorTexture();
    const ceilingTexture = createCeilingTexture();

    // Materials
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.9,
        metalness: 0.0,
        emissive: 0x0a0a0a,
        emissiveIntensity: 0.12
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.95,
        metalness: 0.0,
        emissive: 0x050505,
        emissiveIntensity: 0.08
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
        map: ceilingTexture,
        roughness: 0.95,
        metalness: 0.0,
        emissive: 0x040404,
        emissiveIntensity: 0.06
    });

    // Create floor
    const floorSize = CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE;
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, 1, 1);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(floorSize / 2, 0, floorSize / 2);
    scene.add(floor);

    // Create ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(floorSize, floorSize, 1, 1);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(floorSize / 2, CONFIG.WALL_HEIGHT, floorSize / 2);
    scene.add(ceiling);

    // Create walls
    const wallGeometry = new THREE.BoxGeometry(CONFIG.CELL_SIZE, CONFIG.WALL_HEIGHT, 0.2);
    const wallGeometrySide = new THREE.BoxGeometry(0.2, CONFIG.WALL_HEIGHT, CONFIG.CELL_SIZE);

    for (let y = 0; y < CONFIG.MAZE_SIZE; y++) {
        for (let x = 0; x < CONFIG.MAZE_SIZE; x++) {
            const cell = maze[y][x];
            const cx = x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
            const cz = y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;

            // North wall
            if (cell.walls.north) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(cx, CONFIG.WALL_HEIGHT / 2, cz - CONFIG.CELL_SIZE / 2);
                scene.add(wall);
                addWall({
                    minX: cx - CONFIG.CELL_SIZE / 2,
                    maxX: cx + CONFIG.CELL_SIZE / 2,
                    minZ: cz - CONFIG.CELL_SIZE / 2 - 0.1,
                    maxZ: cz - CONFIG.CELL_SIZE / 2 + 0.1
                });
            }

            // South wall (only for bottom row)
            if (y === CONFIG.MAZE_SIZE - 1 && cell.walls.south) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(cx, CONFIG.WALL_HEIGHT / 2, cz + CONFIG.CELL_SIZE / 2);
                scene.add(wall);
                addWall({
                    minX: cx - CONFIG.CELL_SIZE / 2,
                    maxX: cx + CONFIG.CELL_SIZE / 2,
                    minZ: cz + CONFIG.CELL_SIZE / 2 - 0.1,
                    maxZ: cz + CONFIG.CELL_SIZE / 2 + 0.1
                });
            }

            // West wall
            if (cell.walls.west) {
                const wall = new THREE.Mesh(wallGeometrySide, wallMaterial);
                wall.position.set(cx - CONFIG.CELL_SIZE / 2, CONFIG.WALL_HEIGHT / 2, cz);
                scene.add(wall);
                addWall({
                    minX: cx - CONFIG.CELL_SIZE / 2 - 0.1,
                    maxX: cx - CONFIG.CELL_SIZE / 2 + 0.1,
                    minZ: cz - CONFIG.CELL_SIZE / 2,
                    maxZ: cz + CONFIG.CELL_SIZE / 2
                });
            }

            // East wall (only for right column)
            if (x === CONFIG.MAZE_SIZE - 1 && cell.walls.east) {
                const wall = new THREE.Mesh(wallGeometrySide, wallMaterial);
                wall.position.set(cx + CONFIG.CELL_SIZE / 2, CONFIG.WALL_HEIGHT / 2, cz);
                scene.add(wall);
                addWall({
                    minX: cx + CONFIG.CELL_SIZE / 2 - 0.1,
                    maxX: cx + CONFIG.CELL_SIZE / 2 + 0.1,
                    minZ: cz - CONFIG.CELL_SIZE / 2,
                    maxZ: cz + CONFIG.CELL_SIZE / 2
                });
            }
        }
    }

    // Add outer boundary walls
    addBoundaryWalls(wallMaterial);

    // Add ceiling lamps
    createLamps();

    // Initialize particle effects
    initParticles();
}

function addBoundaryWalls(material) {
    const totalSize = CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE;
    const wallThickness = 0.2;

    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(totalSize, CONFIG.WALL_HEIGHT, wallThickness),
        material
    );
    northWall.position.set(totalSize / 2, CONFIG.WALL_HEIGHT / 2, 0);
    scene.add(northWall);

    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(totalSize, CONFIG.WALL_HEIGHT, wallThickness),
        material
    );
    southWall.position.set(totalSize / 2, CONFIG.WALL_HEIGHT / 2, totalSize);
    scene.add(southWall);

    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, CONFIG.WALL_HEIGHT, totalSize),
        material
    );
    westWall.position.set(0, CONFIG.WALL_HEIGHT / 2, totalSize / 2);
    scene.add(westWall);

    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, CONFIG.WALL_HEIGHT, totalSize),
        material
    );
    eastWall.position.set(totalSize, CONFIG.WALL_HEIGHT / 2, totalSize / 2);
    scene.add(eastWall);
}

function createPlayers() {
    // Player 1 (starts top-left area)
    setPlayer1({
        x: CONFIG.CELL_SIZE * 1.5,
        z: CONFIG.CELL_SIZE * 1.5,
        rotation: 0,
        color: 0x4444ff
    });

    // Player 2 (starts bottom-right area)
    setPlayer2({
        x: CONFIG.CELL_SIZE * (CONFIG.MAZE_SIZE - 1.5),
        z: CONFIG.CELL_SIZE * (CONFIG.MAZE_SIZE - 1.5),
        rotation: Math.PI,
        color: 0xff4444
    });

    // Create flashlights
    createFlashlight(camera1, player1.color);
    createFlashlight(camera2, player2.color);

    // Create creature meshes
    createPlayerMeshes();
}

function createFlashlight(camera, color) {
    const spotlight = new THREE.SpotLight(0xffffee, 1.2);
    spotlight.angle = Math.PI / 5;
    spotlight.penumbra = 0.3;
    spotlight.decay = 1.5;
    spotlight.distance = 18;
    spotlight.castShadow = false;

    const pointLight = new THREE.PointLight(color, 0.3, 6);

    camera.add(spotlight);
    camera.add(spotlight.target);
    camera.add(pointLight);

    spotlight.position.set(0, 0, 0);
    spotlight.target.position.set(0, 0, -1);
    pointLight.position.set(0, -0.5, 0);

    scene.add(camera);
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);

    const aspect = (width / 2) / height;
    camera1.aspect = aspect;
    camera1.updateProjectionMatrix();
    camera2.aspect = aspect;
    camera2.updateProjectionMatrix();
}

export function updateCameras() {
    // Calculate walking bob offset
    const bob1 = Math.sin(player1BobPhase) * CONFIG.BOB_AMOUNT;
    const bob2 = Math.sin(player2BobPhase) * CONFIG.BOB_AMOUNT;

    // Camera 1 follows player 1 with bob and lunge
    const lunge1X = -Math.sin(player1.rotation) * player1LungeOffset;
    const lunge1Z = -Math.cos(player1.rotation) * player1LungeOffset;
    camera1.position.set(player1.x + lunge1X, 1.6 + bob1, player1.z + lunge1Z);
    camera1.rotation.y = player1.rotation;
    camera1.rotation.z = Math.sin(player1BobPhase * 0.5) * 0.01;

    // Camera 2 follows player 2 with bob and lunge
    const lunge2X = -Math.sin(player2.rotation) * player2LungeOffset;
    const lunge2Z = -Math.cos(player2.rotation) * player2LungeOffset;
    camera2.position.set(player2.x + lunge2X, 1.6 + bob2, player2.z + lunge2Z);
    camera2.rotation.y = player2.rotation;
    camera2.rotation.z = Math.sin(player2BobPhase * 0.5) * 0.01;
}

export function render() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfWidth = width / 2;

    renderer.setScissorTest(true);

    // Render left half (Player 1)
    renderer.setViewport(0, 0, halfWidth, height);
    renderer.setScissor(0, 0, halfWidth, height);
    renderer.render(scene, camera1);

    // Render right half (Player 2)
    renderer.setViewport(halfWidth, 0, halfWidth, height);
    renderer.setScissor(halfWidth, 0, halfWidth, height);
    renderer.render(scene, camera2);

    renderer.setScissorTest(false);
}

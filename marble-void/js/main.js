// Main Entry Point
import { CONFIG } from './config.js';
import { createState } from './state.js';
import { generateMaze } from './maze.js';
import { updatePhysics, checkCollisions, checkWin } from './physics.js';
import { createRenderer } from './renderer.js';
import { createInputManager } from './input.js';
import { createUI } from './ui.js';

// Initialize game state
const state = createState();

// Get DOM elements
const canvas = document.getElementById('game-canvas');
const collisionCanvas = document.getElementById('collision-indicator');

const elements = {
    startScreen: document.getElementById('start-screen'),
    winScreen: document.getElementById('win-screen'),
    hud: document.getElementById('hud'),
    levelNum: document.getElementById('level-num'),
    timerDisplay: document.getElementById('timer'),
    winTime: document.getElementById('win-time'),
    startBtn: document.getElementById('start-btn'),
    nextBtn: document.getElementById('next-btn'),
    permissionError: document.getElementById('permission-error'),
    revealFlash: document.getElementById('reveal-flash')
};

// Create module instances
const renderer = createRenderer(canvas, collisionCanvas);
const inputManager = createInputManager(state, canvas);
const ui = createUI(elements);

// Initialize level
function initLevel(level) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const maze = generateMaze(level, w, h, CONFIG);
    state.walls = maze.walls;

    // Place marble at maze start position
    state.marble = {
        x: maze.start.x,
        y: maze.start.y,
        vx: 0,
        vy: 0
    };

    // Place target at maze end position
    state.target = {
        x: maze.target.x,
        y: maze.target.y
    };

    state.won = false;
    state.startTime = Date.now();
    ui.updateLevel(level);
}

// Start game
async function startGame() {
    console.log('Starting game...');

    // Try to get motion permission but don't block on it
    inputManager.requestMotionPermission();

    ui.hideStart();

    initLevel(state.level);
    state.playing = true;
    console.log('Game started!');
}

// Next level
function nextLevel() {
    ui.hideWin();
    state.level++;
    initLevel(state.level);
    state.playing = true;
}

// Handle win
function handleWin() {
    state.won = true;
    const elapsed = Date.now() - state.startTime;
    ui.showWin(elapsed);
    inputManager.triggerCelebrationHaptic();
}

// Game loop
function gameLoop(time) {
    // Update physics
    updatePhysics(state, CONFIG);

    // Check collisions
    if (state.playing && !state.won) {
        const collisionPoint = checkCollisions(state, CONFIG);
        if (collisionPoint) {
            const now = Date.now();
            if (now - state.lastCollision >= 50) {
                state.lastCollision = now;
                renderer.triggerCollisionReveal(collisionPoint, state.walls, CONFIG);
                inputManager.triggerHaptic();
            }
        }

        // Check win
        if (checkWin(state, CONFIG)) {
            handleWin();
        }

        // Update timer
        const elapsed = Date.now() - state.startTime;
        ui.updateTimer(elapsed);
    }

    // Render
    renderer.render(state, CONFIG, time);

    requestAnimationFrame(gameLoop);
}

// Handle resize
function handleResize() {
    renderer.resize();
}

// Initialize
function init() {
    // Set up resize handler
    window.addEventListener('resize', handleResize);
    renderer.resize();

    // Initialize input handlers
    inputManager.init();

    // Set up button handlers
    ui.setupButtons(startGame, nextLevel);

    // Log for debugging
    console.log('VOID MARBLE loaded. Tap BEGIN to start.');

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Start the game
init();

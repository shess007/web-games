import { CONFIG } from './config.js';
import {
    gameState, scene, camera1, camera2,
    player1, player2, player1Mesh, player2Mesh,
    lastTime, phaseTimer,
    setLastTime, setPhaseTimer, setPlayer1BobPhase, setPlayer2BobPhase,
    resetWalls, resetLamps
} from './state.js';
import { initAudio } from './audio.js';
import { handleInput } from './input.js';
import { checkPlayerCollision } from './collision.js';
import { updateLamps } from './lamps.js';
import { updatePlayerMeshes, createPlayerMeshes } from './creatures.js';
import { updateCameras, render, createMazeGeometry } from './renderer.js';
import { drawMap } from './map.js';

/**
 * Game Loop and State Management
 */

// DOM Elements
let timerDisplay, mapTimerDisplay, phaseIndicator;
let mapOverlay, gameOverScreen, winnerText, startScreen;

export function initGameUI() {
    timerDisplay = document.getElementById('timer');
    mapTimerDisplay = document.getElementById('map-timer');
    phaseIndicator = document.getElementById('phase-indicator');
    mapOverlay = document.getElementById('map-overlay');
    gameOverScreen = document.getElementById('game-over');
    winnerText = document.getElementById('winner-text');
    startScreen = document.getElementById('start-screen');

    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
}

export function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    setLastTime(currentTime);

    if (!gameState.isRunning) return;

    // Update phase timer
    setPhaseTimer(phaseTimer + delta);

    if (gameState.phase === 'gameplay') {
        // Handle input and movement
        handleInput(delta);

        // Check for catch
        if (checkPlayerCollision()) {
            endGame();
            return;
        }

        // Update timer display
        const remaining = Math.ceil(CONFIG.GAMEPLAY_DURATION - phaseTimer);
        timerDisplay.textContent = remaining;

        // Switch to map phase
        if (phaseTimer >= CONFIG.GAMEPLAY_DURATION) {
            switchToMapPhase();
        }
    } else {
        // Map phase
        drawMap();

        const remaining = Math.ceil(CONFIG.MAP_DURATION - phaseTimer);
        mapTimerDisplay.textContent = remaining;

        // Switch back to gameplay
        if (phaseTimer >= CONFIG.MAP_DURATION) {
            switchToGameplayPhase();
        }
    }

    // Update lamps (flickering effect)
    updateLamps(delta);

    // Update player creature meshes
    updatePlayerMeshes();

    // Update cameras
    updateCameras();

    // Render
    render();
}

function switchToMapPhase() {
    gameState.phase = 'map';
    setPhaseTimer(0);
    mapOverlay.style.display = 'flex';
    phaseIndicator.innerHTML = 'MAP PHASE';
    drawMap();
}

function switchToGameplayPhase() {
    gameState.phase = 'gameplay';
    setPhaseTimer(0);
    mapOverlay.style.display = 'none';
    phaseIndicator.innerHTML = 'HUNT: <span id="timer">10</span>';
    timerDisplay = document.getElementById('timer');
}

export function startGame() {
    startScreen.style.display = 'none';
    gameState.isRunning = true;
    gameState.phase = 'gameplay';
    gameState.timer = CONFIG.GAMEPLAY_DURATION;
    gameState.winner = null;
    setPhaseTimer(0);

    // Reset player positions
    player1.x = CONFIG.CELL_SIZE * 1.5;
    player1.z = CONFIG.CELL_SIZE * 1.5;
    player1.rotation = 0;

    player2.x = CONFIG.CELL_SIZE * (CONFIG.MAZE_SIZE - 1.5);
    player2.z = CONFIG.CELL_SIZE * (CONFIG.MAZE_SIZE - 1.5);
    player2.rotation = Math.PI;

    // Reset camera bob
    setPlayer1BobPhase(0);
    setPlayer2BobPhase(0);

    // Start ambient audio
    initAudio();
}

function endGame() {
    gameState.isRunning = false;

    // Determine winner
    const dx = player2.x - player1.x;
    const dz = player2.z - player1.z;
    const angle1 = Math.atan2(-dx, -dz);
    const angle2 = Math.atan2(dx, dz);

    const diff1 = Math.abs(normalizeAngle(player1.rotation - angle1));
    const diff2 = Math.abs(normalizeAngle(player2.rotation - angle2));

    if (diff1 < diff2) {
        winnerText.textContent = 'Player 1 Wins!';
        winnerText.style.color = '#4444ff';
    } else {
        winnerText.textContent = 'Player 2 Wins!';
        winnerText.style.color = '#ff4444';
    }

    gameOverScreen.style.display = 'flex';
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function restartGame() {
    gameOverScreen.style.display = 'none';

    // Clear scene and rebuild maze
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    resetWalls();
    resetLamps();

    // Reinitialize
    scene.fog = new THREE.FogExp2(0x000000, CONFIG.FOG_DENSITY);
    const ambientLight = new THREE.AmbientLight(0x1a1a22, 0.8);
    scene.add(ambientLight);

    createMazeGeometry();

    // Recreate flashlights
    const spotlight1 = new THREE.SpotLight(0xffffee, 1.2);
    spotlight1.angle = Math.PI / 5;
    spotlight1.penumbra = 0.3;
    spotlight1.decay = 1.5;
    spotlight1.distance = 18;
    camera1.add(spotlight1);
    camera1.add(spotlight1.target);
    spotlight1.target.position.set(0, 0, -1);
    camera1.add(new THREE.PointLight(player1.color, 0.3, 6));

    const spotlight2 = new THREE.SpotLight(0xffffee, 1.2);
    spotlight2.angle = Math.PI / 5;
    spotlight2.penumbra = 0.3;
    spotlight2.decay = 1.5;
    spotlight2.distance = 18;
    camera2.add(spotlight2);
    camera2.add(spotlight2.target);
    spotlight2.target.position.set(0, 0, -1);
    camera2.add(new THREE.PointLight(player2.color, 0.3, 6));

    scene.add(camera1);
    scene.add(camera2);

    // Recreate player meshes
    createPlayerMeshes();

    startGame();
}

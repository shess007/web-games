import { CONFIG } from './config.js';
import {
    gameState, scene, camera1, camera2,
    player1, player2, player1Mesh, player2Mesh,
    lastTime, phaseTimer,
    player1LungeOffset, player2LungeOffset,
    setLastTime, setPhaseTimer, setPlayer1BobPhase, setPlayer2BobPhase,
    setPlayer1LungeOffset, setPlayer2LungeOffset,
    resetWalls, resetLamps
} from './state.js';
import { initAudio, updateFootsteps, playAttackSound } from './audio.js';
import {
    handleInput, player1Moving, player2Moving,
    handleAttackInput, checkAttackHit, resetAttackState,
    player1Attacking, player2Attacking,
    player1AttackCooldown, player2AttackCooldown
} from './input.js';
import { updateLamps } from './lamps.js';
import { updatePlayerMeshes, createPlayerMeshes } from './creatures.js';
import { updateCameras, render, createMazeGeometry } from './renderer.js';
import { drawMap } from './map.js';
import { updateParticles, resetParticles } from './particles.js';

/**
 * Game Loop and State Management
 */

// DOM Elements
let timerDisplay, mapTimerDisplay, phaseIndicator;
let mapOverlay, gameOverScreen, winnerText, startScreen;
let p1CooldownBar, p2CooldownBar;

// Track button state to prevent repeated triggers
let buttonWasPressed = false;

// Camera lunge effect constants
const LUNGE_SPEED = 8;
const LUNGE_DISTANCE = 0.3;

export function initGameUI() {
    timerDisplay = document.getElementById('timer');
    mapTimerDisplay = document.getElementById('map-timer');
    phaseIndicator = document.getElementById('phase-indicator');
    mapOverlay = document.getElementById('map-overlay');
    gameOverScreen = document.getElementById('game-over');
    winnerText = document.getElementById('winner-text');
    startScreen = document.getElementById('start-screen');
    p1CooldownBar = document.getElementById('p1-cooldown');
    p2CooldownBar = document.getElementById('p2-cooldown');

    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // Start gamepad button polling for menu navigation
    setInterval(checkGamepadButtons, 100);
}

/**
 * Check for gamepad button presses to start/restart game
 */
function checkGamepadButtons() {
    const gamepads = navigator.getGamepads();
    let anyButtonPressed = false;

    for (const gamepad of gamepads) {
        if (!gamepad) continue;

        // Check A button (0), B button (1), Start button (9)
        const aButton = gamepad.buttons[0]?.pressed;
        const startButton = gamepad.buttons[9]?.pressed;

        if (aButton || startButton) {
            anyButtonPressed = true;
            break;
        }
    }

    // Only trigger on button press (not hold)
    if (anyButtonPressed && !buttonWasPressed) {
        // Check if we're on start screen
        if (startScreen.style.display !== 'none') {
            startGame();
        }
        // Check if we're on game over screen
        else if (gameOverScreen.style.display === 'flex') {
            restartGame();
        }
    }

    buttonWasPressed = anyButtonPressed;
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

        // Handle attack input
        handleAttackInput(delta);

        // Update footstep sounds
        updateFootsteps(delta, player1, player2, player1Moving, player2Moving);

        // Check for attacks
        if (player1Attacking) {
            playAttackSound(true);
            setPlayer1LungeOffset(LUNGE_DISTANCE);
            if (checkAttackHit(player1, player2)) {
                endGame(1);
                return;
            }
        }
        if (player2Attacking) {
            playAttackSound(false);
            setPlayer2LungeOffset(LUNGE_DISTANCE);
            if (checkAttackHit(player2, player1)) {
                endGame(2);
                return;
            }
        }

        // Update lunge animations
        if (player1LungeOffset > 0) {
            let newOffset = player1LungeOffset - LUNGE_SPEED * delta;
            if (newOffset < 0) newOffset = 0;
            setPlayer1LungeOffset(newOffset);
        }
        if (player2LungeOffset > 0) {
            let newOffset = player2LungeOffset - LUNGE_SPEED * delta;
            if (newOffset < 0) newOffset = 0;
            setPlayer2LungeOffset(newOffset);
        }

        // Update cooldown UI
        updateCooldownUI();

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

    // Update particle effects
    updateParticles(delta);

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

function endGame(winner) {
    gameState.isRunning = false;

    if (winner === 1) {
        winnerText.textContent = 'Player 1 Wins!';
        winnerText.style.color = '#4444ff';
    } else {
        winnerText.textContent = 'Player 2 Wins!';
        winnerText.style.color = '#ff4444';
    }

    gameOverScreen.style.display = 'flex';
}

/**
 * Update cooldown bar UI
 */
function updateCooldownUI() {
    const ATTACK_COOLDOWN = 0.8;

    if (p1CooldownBar) {
        const p1Ready = player1AttackCooldown <= 0;
        const p1Progress = p1Ready ? 100 : ((ATTACK_COOLDOWN - player1AttackCooldown) / ATTACK_COOLDOWN) * 100;
        p1CooldownBar.style.width = p1Progress + '%';
        p1CooldownBar.style.backgroundColor = p1Ready ? '#4f4' : '#44f';
    }

    if (p2CooldownBar) {
        const p2Ready = player2AttackCooldown <= 0;
        const p2Progress = p2Ready ? 100 : ((ATTACK_COOLDOWN - player2AttackCooldown) / ATTACK_COOLDOWN) * 100;
        p2CooldownBar.style.width = p2Progress + '%';
        p2CooldownBar.style.backgroundColor = p2Ready ? '#4f4' : '#f44';
    }
}


function restartGame() {
    gameOverScreen.style.display = 'none';

    // Reset attack state
    resetAttackState();
    setPlayer1LungeOffset(0);
    setPlayer2LungeOffset(0);

    // Clear scene and rebuild maze
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    resetWalls();
    resetLamps();
    resetParticles();

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

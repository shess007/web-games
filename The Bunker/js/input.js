import { CONFIG } from './config.js';
import {
    keys, gameState, player1, player2,
    player1BobPhase, player2BobPhase,
    setPlayer1BobPhase, setPlayer2BobPhase
} from './state.js';
import { checkWallCollision } from './collision.js';

/**
 * Input Handling System
 */

// Gamepad deadzone threshold
const DEADZONE = 0.2;

// Store connected gamepads
let connectedGamepads = [];

export function setupInput() {
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        // Prevent arrow keys from scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Gamepad connection events
    window.addEventListener('gamepadconnected', (e) => {
        console.log('Gamepad connected:', e.gamepad.index, e.gamepad.id);
        updateGamepadList();
    });

    window.addEventListener('gamepaddisconnected', (e) => {
        console.log('Gamepad disconnected:', e.gamepad.index);
        updateGamepadList();
    });

    // Start gamepad debug polling
    setInterval(updateGamepadDebug, 100);
}

function updateGamepadList() {
    const gamepads = navigator.getGamepads();
    connectedGamepads = [];
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            connectedGamepads.push({
                index: gamepads[i].index,
                id: gamepads[i].id
            });
        }
    }
}

function updateGamepadDebug() {
    const debugEl = document.getElementById('gamepad-debug');
    if (!debugEl) return;

    const connected = getConnectedGamepads();
    let html = '';

    if (connected.length === 0) {
        html = '<div>No gamepads via API. Using keyboard controls.</div>';
        html += '<div style="color:#888;font-size:10px">If using Xbox controllers, press A button to register</div>';
    } else {
        html += `<div style="color:#0f0">Gamepad API active - Arrow keys disabled</div>`;
        connected.forEach((gp, idx) => {
            const player = idx === 0 ? 'Player 1' : (idx === 1 ? 'Player 2' : `Extra`);
            const color = idx === 0 ? '#44f' : (idx === 1 ? '#f44' : '#888');
            const axes = `(${gp.axes[0]?.toFixed(1)},${gp.axes[1]?.toFixed(1)})`;
            html += `<div style="color:${color}">${player}: ${gp.id.substring(0, 20)}... ${axes}</div>`;
        });

        if (connected.length === 1) {
            html += '<div style="color:#ff6">Need 2nd controller for Player 2</div>';
        }
    }

    debugEl.innerHTML = html;
}

/**
 * Get all connected gamepads as an array (filtering out null entries)
 */
function getConnectedGamepads() {
    const gamepads = navigator.getGamepads();
    const connected = [];
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
            connected.push(gamepads[i]);
        }
    }
    return connected;
}

/**
 * Get gamepad input for a specific player
 * @param {number} playerIndex - 0 for Player 1, 1 for Player 2
 * @returns {{forward: number, turn: number}} - Input values
 */
function getGamepadInput(playerIndex) {
    // Get connected gamepads (may not be at indices 0 and 1)
    const connected = getConnectedGamepads();
    const gamepad = connected[playerIndex];

    if (!gamepad) return { forward: 0, turn: 0 };

    let forward = 0;
    let turn = 0;

    // Left stick Y-axis for forward/backward (axis 1)
    const leftY = gamepad.axes[1];
    if (Math.abs(leftY) > DEADZONE) {
        forward = -leftY; // Negative because up on stick is negative
    }

    // Left stick X-axis for turning (axis 0)
    const leftX = gamepad.axes[0];
    if (Math.abs(leftX) > DEADZONE) {
        turn = -leftX; // Negative for correct turn direction
    }

    // D-pad support (buttons 12-15 on standard gamepad)
    if (gamepad.buttons[12]?.pressed) forward = 1;  // D-pad up
    if (gamepad.buttons[13]?.pressed) forward = -1; // D-pad down
    if (gamepad.buttons[14]?.pressed) turn = 1;     // D-pad left
    if (gamepad.buttons[15]?.pressed) turn = -1;    // D-pad right

    return { forward, turn };
}

// Track movement state for footstep audio
export let player1Moving = false;
export let player2Moving = false;

export function handleInput(delta) {
    if (gameState.phase !== 'gameplay') {
        player1Moving = false;
        player2Moving = false;
        return;
    }

    // Check how many gamepads are connected
    const connected = getConnectedGamepads();
    const hasGamepads = connected.length >= 1;

    // Player 1 (WASD + Gamepad 0)
    let p1Forward = 0, p1Turn = 0;

    // Keyboard input for Player 1 (WASD always works)
    if (keys['KeyW']) p1Forward = 1;
    if (keys['KeyS']) p1Forward = -1;
    if (keys['KeyA']) p1Turn = 1;
    if (keys['KeyD']) p1Turn = -1;

    // Gamepad input for Player 1 (first connected gamepad)
    const gp1 = getGamepadInput(0);
    if (gp1.forward !== 0) p1Forward = gp1.forward;
    if (gp1.turn !== 0) p1Turn = gp1.turn;

    movePlayer(player1, p1Forward, p1Turn, delta);
    player1Moving = Math.abs(p1Forward) > 0.1;

    // Update camera bob for player 1
    if (Math.abs(p1Forward) > 0.1) {
        setPlayer1BobPhase(player1BobPhase + delta * CONFIG.BOB_SPEED);
    }

    // Player 2 (Arrow Keys + Gamepad 1)
    let p2Forward = 0, p2Turn = 0;

    // Keyboard input for Player 2
    // Arrow keys disabled when ANY gamepad is connected to prevent
    // Xbox/browser gamepad-to-keyboard mapping from affecting both players
    if (!hasGamepads) {
        if (keys['ArrowUp']) p2Forward = 1;
        if (keys['ArrowDown']) p2Forward = -1;
        if (keys['ArrowLeft']) p2Turn = 1;
        if (keys['ArrowRight']) p2Turn = -1;
    }

    // Gamepad input for Player 2 (second connected gamepad)
    const gp2 = getGamepadInput(1);
    if (gp2.forward !== 0) p2Forward = gp2.forward;
    if (gp2.turn !== 0) p2Turn = gp2.turn;

    movePlayer(player2, p2Forward, p2Turn, delta);
    player2Moving = Math.abs(p2Forward) > 0.1;

    // Update camera bob for player 2
    if (Math.abs(p2Forward) > 0.1) {
        setPlayer2BobPhase(player2BobPhase + delta * CONFIG.BOB_SPEED);
    }
}

function movePlayer(player, forward, turn, delta) {
    // Rotation (supports analog values)
    player.rotation += turn * CONFIG.TURN_SPEED * delta;

    // Movement (supports analog values for variable speed)
    if (Math.abs(forward) > 0.1) {
        const moveSpeed = CONFIG.PLAYER_SPEED * delta * forward;
        const newX = player.x - Math.sin(player.rotation) * moveSpeed;
        const newZ = player.z - Math.cos(player.rotation) * moveSpeed;

        // Check collision with walls
        if (!checkWallCollision(newX, player.z, CONFIG.PLAYER_RADIUS)) {
            player.x = newX;
        }
        if (!checkWallCollision(player.x, newZ, CONFIG.PLAYER_RADIUS)) {
            player.z = newZ;
        }
    }
}

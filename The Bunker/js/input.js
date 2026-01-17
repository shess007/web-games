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
}

export function handleInput(delta) {
    if (gameState.phase !== 'gameplay') return;

    // Player 1 (WASD)
    let p1Forward = 0, p1Turn = 0;
    if (keys['KeyW']) p1Forward = 1;
    if (keys['KeyS']) p1Forward = -1;
    if (keys['KeyA']) p1Turn = 1;
    if (keys['KeyD']) p1Turn = -1;

    movePlayer(player1, p1Forward, p1Turn, delta);

    // Update camera bob for player 1
    if (p1Forward !== 0) {
        setPlayer1BobPhase(player1BobPhase + delta * CONFIG.BOB_SPEED);
    }

    // Player 2 (Arrow Keys)
    let p2Forward = 0, p2Turn = 0;
    if (keys['ArrowUp']) p2Forward = 1;
    if (keys['ArrowDown']) p2Forward = -1;
    if (keys['ArrowLeft']) p2Turn = 1;
    if (keys['ArrowRight']) p2Turn = -1;

    movePlayer(player2, p2Forward, p2Turn, delta);

    // Update camera bob for player 2
    if (p2Forward !== 0) {
        setPlayer2BobPhase(player2BobPhase + delta * CONFIG.BOB_SPEED);
    }
}

function movePlayer(player, forward, turn, delta) {
    // Rotation
    player.rotation += turn * CONFIG.TURN_SPEED * delta;

    // Movement
    if (forward !== 0) {
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

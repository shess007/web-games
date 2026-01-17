/**
 * The Bunker - Main Entry Point
 * A local multiplayer 3D first-person tag game
 */

import { initThreeJS } from './renderer.js';
import { setupInput } from './input.js';
import { initMap } from './map.js';
import { initGameUI, gameLoop } from './game.js';

function init() {
    // Get canvas element
    const canvas = document.getElementById('game-canvas');

    // Initialize Three.js
    initThreeJS(canvas);

    // Initialize input handling
    setupInput();

    // Initialize map overlay
    initMap();

    // Initialize game UI and event listeners
    initGameUI();

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Start when page loads
window.addEventListener('load', init);

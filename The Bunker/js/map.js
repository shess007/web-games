import { CONFIG } from './config.js';
import { maze, player1, player2 } from './state.js';

/**
 * Map Overlay Rendering
 */

let mapCanvas, mapCtx;

export function initMap() {
    mapCanvas = document.getElementById('map-canvas');
    mapCtx = mapCanvas.getContext('2d');
}

export function drawMap() {
    const size = Math.min(window.innerWidth * 0.7, window.innerHeight * 0.7);
    mapCanvas.width = size;
    mapCanvas.height = size;

    const cellSize = size / CONFIG.MAZE_SIZE;

    // Clear
    mapCtx.fillStyle = '#0a0a0a';
    mapCtx.fillRect(0, 0, size, size);

    // Draw maze walls
    mapCtx.strokeStyle = '#333';
    mapCtx.lineWidth = 2;

    for (let y = 0; y < CONFIG.MAZE_SIZE; y++) {
        for (let x = 0; x < CONFIG.MAZE_SIZE; x++) {
            const cell = maze[y][x];
            const px = x * cellSize;
            const py = y * cellSize;

            mapCtx.beginPath();

            if (cell.walls.north) {
                mapCtx.moveTo(px, py);
                mapCtx.lineTo(px + cellSize, py);
            }
            if (cell.walls.south) {
                mapCtx.moveTo(px, py + cellSize);
                mapCtx.lineTo(px + cellSize, py + cellSize);
            }
            if (cell.walls.west) {
                mapCtx.moveTo(px, py);
                mapCtx.lineTo(px, py + cellSize);
            }
            if (cell.walls.east) {
                mapCtx.moveTo(px + cellSize, py);
                mapCtx.lineTo(px + cellSize, py + cellSize);
            }

            mapCtx.stroke();
        }
    }

    // Draw players
    const scale = size / (CONFIG.MAZE_SIZE * CONFIG.CELL_SIZE);

    // Player 1 (blue)
    drawPlayerDot(player1.x * scale, player1.z * scale, player1.rotation, '#4444ff', 'P1');

    // Player 2 (red)
    drawPlayerDot(player2.x * scale, player2.z * scale, player2.rotation, '#ff4444', 'P2');
}

function drawPlayerDot(x, y, rotation, color, label) {
    const radius = 14;

    // Glow effect
    const gradient = mapCtx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.4, color + '88');
    gradient.addColorStop(1, 'transparent');
    mapCtx.fillStyle = gradient;
    mapCtx.beginPath();
    mapCtx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    mapCtx.fill();

    // Save context for rotation
    mapCtx.save();
    mapCtx.translate(x, y);
    mapCtx.rotate(-rotation);

    // Draw creature silhouette
    mapCtx.fillStyle = color;

    // Body (hunched oval)
    mapCtx.beginPath();
    mapCtx.ellipse(0, 2, 8, 10, 0, 0, Math.PI * 2);
    mapCtx.fill();

    // Head
    mapCtx.beginPath();
    mapCtx.ellipse(0, -10, 6, 7, 0, 0, Math.PI * 2);
    mapCtx.fill();

    // Eyes (glowing)
    mapCtx.fillStyle = '#fff';
    mapCtx.beginPath();
    mapCtx.arc(-3, -11, 2, 0, Math.PI * 2);
    mapCtx.arc(3, -11, 2, 0, Math.PI * 2);
    mapCtx.fill();

    // Arms
    mapCtx.strokeStyle = color;
    mapCtx.lineWidth = 3;
    mapCtx.lineCap = 'round';

    // Left arm
    mapCtx.beginPath();
    mapCtx.moveTo(-7, 0);
    mapCtx.quadraticCurveTo(-14, 5, -12, 12);
    mapCtx.stroke();

    // Right arm
    mapCtx.beginPath();
    mapCtx.moveTo(7, 0);
    mapCtx.quadraticCurveTo(14, 5, 12, 12);
    mapCtx.stroke();

    // Direction indicator
    mapCtx.strokeStyle = '#fff';
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.moveTo(0, -17);
    mapCtx.lineTo(0, -25);
    mapCtx.lineTo(-4, -21);
    mapCtx.moveTo(0, -25);
    mapCtx.lineTo(4, -21);
    mapCtx.stroke();

    mapCtx.restore();

    // Label
    mapCtx.fillStyle = '#fff';
    mapCtx.font = 'bold 11px Courier New';
    mapCtx.textAlign = 'center';
    mapCtx.fillText(label, x, y + radius + 18);
}

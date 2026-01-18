// Canvas Renderer
import { pointToSegmentDistance } from './physics.js';

/**
 * Creates a renderer instance
 * @param {HTMLCanvasElement} canvas - Main game canvas
 * @param {HTMLCanvasElement} collisionCanvas - Collision effect canvas
 * @returns {Object} Renderer API
 */
export function createRenderer(canvas, collisionCanvas) {
    const ctx = canvas.getContext('2d');
    const collisionCtx = collisionCanvas.getContext('2d');

    /**
     * Resizes canvases to match window dimensions
     */
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        collisionCanvas.width = width * dpr;
        collisionCanvas.height = height * dpr;
        collisionCanvas.style.width = width + 'px';
        collisionCanvas.style.height = height + 'px';
        collisionCtx.scale(dpr, dpr);
    }

    /**
     * Renders the game state
     * @param {Object} state - Game state
     * @param {Object} config - Game configuration
     * @param {number} time - Current timestamp
     */
    function render(state, config, time) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.clearRect(0, 0, width, height);

        // Pure black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (!state.playing) return;

        const { marble, target } = state;

        // Draw target (pulsing glow)
        const pulse = 0.7 + 0.3 * Math.sin(time * config.targetPulseSpeed);
        const targetGradient = ctx.createRadialGradient(
            target.x, target.y, 0,
            target.x, target.y, config.targetRadius * 3 * pulse
        );
        targetGradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
        targetGradient.addColorStop(0.3, 'rgba(16, 185, 129, 0.4)');
        targetGradient.addColorStop(0.7, 'rgba(16, 185, 129, 0.1)');
        targetGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(target.x, target.y, config.targetRadius * 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = targetGradient;
        ctx.fill();

        // Target core
        ctx.beginPath();
        ctx.arc(target.x, target.y, config.targetRadius, 0, Math.PI * 2);
        const targetCore = ctx.createRadialGradient(
            target.x - 5, target.y - 5, 0,
            target.x, target.y, config.targetRadius
        );
        targetCore.addColorStop(0, '#6ee7b7');
        targetCore.addColorStop(0.5, '#10b981');
        targetCore.addColorStop(1, '#047857');
        ctx.fillStyle = targetCore;
        ctx.fill();

        // Draw marble
        // Outer glow
        const marbleGlow = ctx.createRadialGradient(
            marble.x, marble.y, config.marbleRadius * 0.5,
            marble.x, marble.y, config.marbleRadius * 4
        );
        marbleGlow.addColorStop(0, 'rgba(110, 231, 255, 0.6)');
        marbleGlow.addColorStop(0.5, 'rgba(110, 231, 255, 0.2)');
        marbleGlow.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(marble.x, marble.y, config.marbleRadius * 4, 0, Math.PI * 2);
        ctx.fillStyle = marbleGlow;
        ctx.fill();

        // Marble body
        const marbleGradient = ctx.createRadialGradient(
            marble.x - config.marbleRadius * 0.3,
            marble.y - config.marbleRadius * 0.3,
            0,
            marble.x, marble.y, config.marbleRadius
        );
        marbleGradient.addColorStop(0, '#ffffff');
        marbleGradient.addColorStop(0.3, '#6ee7ff');
        marbleGradient.addColorStop(0.7, '#0ea5e9');
        marbleGradient.addColorStop(1, '#0369a1');

        ctx.beginPath();
        ctx.arc(marble.x, marble.y, config.marbleRadius, 0, Math.PI * 2);
        ctx.fillStyle = marbleGradient;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(
            marble.x - config.marbleRadius * 0.3,
            marble.y - config.marbleRadius * 0.3,
            config.marbleRadius * 0.3,
            0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
    }

    /**
     * Triggers collision reveal effect
     * @param {Object} point - Collision point {x, y}
     * @param {Array} walls - Wall segments
     * @param {Object} config - Game configuration
     */
    function triggerCollisionReveal(point, walls, config) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Draw reveal on collision canvas
        collisionCtx.clearRect(0, 0, width, height);

        const gradient = collisionCtx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, config.collisionRevealRadius
        );
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 50, 0.2)');
        gradient.addColorStop(1, 'transparent');

        collisionCtx.fillStyle = gradient;
        collisionCtx.fillRect(0, 0, width, height);

        // Draw nearby walls
        collisionCtx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
        collisionCtx.lineWidth = config.wallThickness;
        collisionCtx.lineCap = 'round';

        for (const wall of walls) {
            const dist = Math.min(
                pointToSegmentDistance(point.x, point.y, wall.x1, wall.y1, wall.x2, wall.y2).distance,
                config.collisionRevealRadius * 1.5
            );

            if (dist < config.collisionRevealRadius * 1.5) {
                const alpha = 1 - (dist / (config.collisionRevealRadius * 1.5));
                collisionCtx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.6})`;
                collisionCtx.beginPath();
                collisionCtx.moveTo(wall.x1, wall.y1);
                collisionCtx.lineTo(wall.x2, wall.y2);
                collisionCtx.stroke();
            }
        }

        collisionCanvas.classList.add('active');

        setTimeout(() => {
            collisionCanvas.classList.remove('active');
            collisionCtx.clearRect(0, 0, width, height);
        }, config.collisionRevealDuration);
    }

    /**
     * Clears the collision canvas
     */
    function clearCollision() {
        collisionCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    return {
        render,
        resize,
        triggerCollisionReveal,
        clearCollision
    };
}

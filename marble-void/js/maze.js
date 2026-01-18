// Maze Generation

/**
 * Generates a maze layout for the given level
 * @param {number} level - Current game level
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} config - Game configuration
 * @returns {Array} Array of wall segments
 */
export function generateMaze(level, width, height, config) {
    const walls = [];
    const padding = 30;
    const cellSize = Math.min(width, height) / (4 + Math.floor(level / 2));

    // Outer walls
    walls.push({ x1: padding, y1: padding, x2: width - padding, y2: padding });
    walls.push({ x1: width - padding, y1: padding, x2: width - padding, y2: height - padding });
    walls.push({ x1: width - padding, y1: height - padding, x2: padding, y2: height - padding });
    walls.push({ x1: padding, y1: height - padding, x2: padding, y2: padding });

    // Generate maze using recursive division
    const maze = generateRecursiveMaze(
        padding + cellSize,
        padding + cellSize,
        width - padding * 2 - cellSize * 2,
        height - padding * 2 - cellSize * 2,
        Math.min(3 + level, 6),
        level
    );

    walls.push(...maze);

    // Add some random obstacles based on level
    const obstacleCount = Math.min(level * 2, 12);
    for (let i = 0; i < obstacleCount; i++) {
        const length = 30 + Math.random() * 60;
        const x = padding + cellSize + Math.random() * (width - padding * 2 - cellSize * 2 - length);
        const y = padding + cellSize + Math.random() * (height - padding * 2 - cellSize * 2 - length);

        if (Math.random() > 0.5) {
            walls.push({ x1: x, y1: y, x2: x + length, y2: y });
        } else {
            walls.push({ x1: x, y1: y, x2: x, y2: y + length });
        }
    }

    return walls;
}

/**
 * Generates maze walls using recursive division algorithm
 * @param {number} x - Starting X coordinate
 * @param {number} y - Starting Y coordinate
 * @param {number} width - Area width
 * @param {number} height - Area height
 * @param {number} depth - Recursion depth
 * @param {number} level - Game level
 * @returns {Array} Array of wall segments
 */
function generateRecursiveMaze(x, y, width, height, depth, level) {
    const walls = [];
    if (depth <= 0 || width < 60 || height < 60) return walls;

    const horizontal = height > width;

    if (horizontal) {
        const splitY = y + 40 + Math.random() * (height - 80);
        const gapStart = x + Math.random() * (width - 60);
        const gapEnd = gapStart + 50 + Math.random() * 30;

        if (gapStart > x) {
            walls.push({ x1: x, y1: splitY, x2: gapStart, y2: splitY });
        }
        if (gapEnd < x + width) {
            walls.push({ x1: gapEnd, y1: splitY, x2: x + width, y2: splitY });
        }

        walls.push(...generateRecursiveMaze(x, y, width, splitY - y, depth - 1, level));
        walls.push(...generateRecursiveMaze(x, splitY, width, height - (splitY - y), depth - 1, level));
    } else {
        const splitX = x + 40 + Math.random() * (width - 80);
        const gapStart = y + Math.random() * (height - 60);
        const gapEnd = gapStart + 50 + Math.random() * 30;

        if (gapStart > y) {
            walls.push({ x1: splitX, y1: y, x2: splitX, y2: gapStart });
        }
        if (gapEnd < y + height) {
            walls.push({ x1: splitX, y1: gapEnd, x2: splitX, y2: y + height });
        }

        walls.push(...generateRecursiveMaze(x, y, splitX - x, height, depth - 1, level));
        walls.push(...generateRecursiveMaze(splitX, y, width - (splitX - x), height, depth - 1, level));
    }

    return walls;
}

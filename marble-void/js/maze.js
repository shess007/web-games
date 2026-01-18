// Maze Generation - Grid-based recursive backtracking

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

    // Cell size decreases with level for tighter mazes
    const baseCellSize = 50;
    const cellSize = Math.max(35, baseCellSize - level * 2);

    // Calculate grid dimensions to fit the screen
    const mazeWidth = width - padding * 2;
    const mazeHeight = height - padding * 2;
    const cols = Math.floor(mazeWidth / cellSize);
    const rows = Math.floor(mazeHeight / cellSize);

    // Center the maze
    const offsetX = padding + (mazeWidth - cols * cellSize) / 2;
    const offsetY = padding + (mazeHeight - rows * cellSize) / 2;

    // Generate maze grid using recursive backtracking
    const grid = generateMazeGrid(cols, rows);

    // Convert grid to wall segments
    // Outer walls
    const mazeRight = offsetX + cols * cellSize;
    const mazeBottom = offsetY + rows * cellSize;

    walls.push({ x1: offsetX, y1: offsetY, x2: mazeRight, y2: offsetY }); // top
    walls.push({ x1: mazeRight, y1: offsetY, x2: mazeRight, y2: mazeBottom }); // right
    walls.push({ x1: mazeRight, y1: mazeBottom, x2: offsetX, y2: mazeBottom }); // bottom
    walls.push({ x1: offsetX, y1: mazeBottom, x2: offsetX, y2: offsetY }); // left

    // Internal walls based on grid
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = grid[row][col];
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;

            // Draw south wall if present (skip bottom row - already have outer wall)
            if (cell.south && row < rows - 1) {
                walls.push({
                    x1: x,
                    y1: y + cellSize,
                    x2: x + cellSize,
                    y2: y + cellSize
                });
            }

            // Draw east wall if present (skip right column - already have outer wall)
            if (cell.east && col < cols - 1) {
                walls.push({
                    x1: x + cellSize,
                    y1: y,
                    x2: x + cellSize,
                    y2: y + cellSize
                });
            }
        }
    }

    // Calculate start position (top-left cell center)
    const startX = offsetX + cellSize / 2;
    const startY = offsetY + cellSize / 2;

    // Calculate target position (bottom-right cell center)
    const targetX = offsetX + (cols - 0.5) * cellSize;
    const targetY = offsetY + (rows - 0.5) * cellSize;

    return {
        walls,
        start: { x: startX, y: startY },
        target: { x: targetX, y: targetY }
    };
}

/**
 * Generates a maze grid using recursive backtracking algorithm
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @returns {Array} 2D grid of cells with wall info
 */
function generateMazeGrid(cols, rows) {
    // Initialize grid with all walls
    const grid = [];
    for (let row = 0; row < rows; row++) {
        grid[row] = [];
        for (let col = 0; col < cols; col++) {
            grid[row][col] = {
                visited: false,
                north: true,
                south: true,
                east: true,
                west: true
            };
        }
    }

    // Recursive backtracking
    const stack = [];
    let current = { row: 0, col: 0 };
    grid[0][0].visited = true;

    function getUnvisitedNeighbors(row, col) {
        const neighbors = [];

        // North
        if (row > 0 && !grid[row - 1][col].visited) {
            neighbors.push({ row: row - 1, col, direction: 'north' });
        }
        // South
        if (row < rows - 1 && !grid[row + 1][col].visited) {
            neighbors.push({ row: row + 1, col, direction: 'south' });
        }
        // East
        if (col < cols - 1 && !grid[row][col + 1].visited) {
            neighbors.push({ row, col: col + 1, direction: 'east' });
        }
        // West
        if (col > 0 && !grid[row][col - 1].visited) {
            neighbors.push({ row, col: col - 1, direction: 'west' });
        }

        return neighbors;
    }

    function removeWall(row1, col1, row2, col2, direction) {
        switch (direction) {
            case 'north':
                grid[row1][col1].north = false;
                grid[row2][col2].south = false;
                break;
            case 'south':
                grid[row1][col1].south = false;
                grid[row2][col2].north = false;
                break;
            case 'east':
                grid[row1][col1].east = false;
                grid[row2][col2].west = false;
                break;
            case 'west':
                grid[row1][col1].west = false;
                grid[row2][col2].east = false;
                break;
        }
    }

    // Main loop
    let iterations = 0;
    const maxIterations = cols * rows * 10;

    while (iterations < maxIterations) {
        iterations++;
        const neighbors = getUnvisitedNeighbors(current.row, current.col);

        if (neighbors.length > 0) {
            // Choose random neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];

            // Push current to stack
            stack.push(current);

            // Remove wall between current and next
            removeWall(current.row, current.col, next.row, next.col, next.direction);

            // Move to next cell
            current = { row: next.row, col: next.col };
            grid[current.row][current.col].visited = true;
        } else if (stack.length > 0) {
            // Backtrack
            current = stack.pop();
        } else {
            // Done
            break;
        }
    }

    return grid;
}

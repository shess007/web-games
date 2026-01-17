/**
 * Maze Generation using Depth-First Search (Recursive Backtracker)
 */

export function generateMaze(width, height) {
    // Initialize grid with all walls
    const grid = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            grid[y][x] = {
                visited: false,
                walls: { north: true, south: true, east: true, west: true }
            };
        }
    }

    // Recursive backtracker
    const stack = [];
    const startX = 1;
    const startY = 1;
    grid[startY][startX].visited = true;
    stack.push({ x: startX, y: startY });

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(grid, current, width, height);

        if (neighbors.length > 0) {
            // Choose random neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];

            // Remove walls between current and next
            grid[current.y][current.x].walls[next.dir.wall] = false;
            grid[next.y][next.x].walls[next.dir.opposite] = false;

            // Mark as visited and push to stack
            grid[next.y][next.x].visited = true;
            stack.push({ x: next.x, y: next.y });
        } else {
            stack.pop();
        }
    }

    return grid;
}

function getUnvisitedNeighbors(grid, current, width, height) {
    const neighbors = [];
    const directions = [
        { dx: 0, dy: -1, wall: 'north', opposite: 'south' },
        { dx: 0, dy: 1, wall: 'south', opposite: 'north' },
        { dx: 1, dy: 0, wall: 'east', opposite: 'west' },
        { dx: -1, dy: 0, wall: 'west', opposite: 'east' }
    ];

    for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !grid[ny][nx].visited) {
            neighbors.push({ x: nx, y: ny, dir });
        }
    }

    return neighbors;
}

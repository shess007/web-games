var WORLD_W = 800;
var WORLD_H = 600;
var TAXI_W = 34;
var TAXI_H = 22;
var MAX_LANDING_SPD = 1.0;

// Levels array - populated by procedural generator
var levels = [];

// ==================== WORLD BUILDING DATA ====================

// Platform names for procedural generation
var PLATFORM_NAMES = [
    "ALPHA BASE", "NEBULA DOCK", "ASTEROID HUB", "COSMIC PORT",
    "STELLAR BAY", "VOID STATION", "PULSAR PAD", "QUASAR POINT",
    "NOVA TERMINAL", "ECLIPSE DECK", "METEOR STOP", "ORBIT PLAZA",
    "ZENITH TOWER", "DEEP SPACE 7", "FRONTIER POST", "DRIFT HAVEN",
    "SOLAR FLARE", "DARK MATTER", "ION GATE", "WARP ZONE",
    "CRYO STATION", "PLASMA PORT", "GRAVITY WELL", "SINGULARITY",
    "PHOTON PIER", "QUANTUM QUAY", "NEUTRON NEST", "COMET CORNER",
    "STARFALL INN", "VOID WALKER", "LUNAR LEDGE", "MARS DEPOT"
];

var FUEL_STATION_NAMES = [
    "FUEL DEPOT", "GAS GIANT", "ENERGY CORE", "POWER CELL",
    "REFUEL BAY", "CHARGE POINT", "TANK STATION", "PLASMA PUMP"
];

// Passenger characters with personalities
var PASSENGERS = [
    { emoji: "🧑‍🚀", name: "Astronaut", personality: "professional" },
    { emoji: "👾", name: "Alien", personality: "mysterious" },
    { emoji: "🤖", name: "Robot", personality: "logical" },
    { emoji: "🕵️", name: "Agent", personality: "secretive" },
    { emoji: "🧙", name: "Space Wizard", personality: "eccentric" },
    { emoji: "🥷", name: "Ninja", personality: "silent" },
    { emoji: "👽", name: "Grey", personality: "curious" },
    { emoji: "🧛", name: "Void Vampire", personality: "dramatic" },
    { emoji: "🤠", name: "Space Cowboy", personality: "casual" },
    { emoji: "👩‍🔬", name: "Scientist", personality: "nerdy" },
    { emoji: "💀", name: "Skeleton", personality: "spooky" },
    { emoji: "🎃", name: "Pumpkin Head", personality: "festive" },
    { emoji: "🦊", name: "Fox Person", personality: "sly" },
    { emoji: "🐙", name: "Octopoid", personality: "tentacular" },
    { emoji: "🌟", name: "Star Being", personality: "radiant" },
    { emoji: "🔮", name: "Fortune Teller", personality: "prophetic" }
];

// Passenger comments by personality
var PASSENGER_COMMENTS = {
    pickup: {
        professional: ["Mission acknowledged.", "Coordinates locked.", "Proceed to destination."],
        mysterious: ["The stars align...", "Interesting trajectory.", "I sense... turbulence."],
        logical: ["Efficiency at 73%.", "Route calculated.", "Fuel consumption nominal."],
        secretive: ["Don't ask questions.", "Keep it quiet.", "No detours."],
        eccentric: ["To infinity!", "My crystals are tingling!", "The cosmos calls!"],
        silent: ["...", "*nods*", "..."],
        curious: ["What is this vehicle?", "Fascinating propulsion!", "Your species is odd."],
        dramatic: ["The void awaits!", "Darkness is my ally.", "Eternal night beckons!"],
        casual: ["Howdy, partner!", "Let's ride!", "Yee-haw, space style!"],
        nerdy: ["Interesting thrust vectors!", "The physics here are wild!", "Calculating G-forces..."],
        spooky: ["Boo.", "Cold in here...", "I see dead planets."],
        festive: ["Trick or treat!", "Spooky szn!", "Got any candy?"],
        sly: ["Quick and quiet.", "No funny business.", "I'm watching you."],
        tentacular: ["All 8 arms ready.", "Grip secured.", "Tentacles crossed!"],
        radiant: ["Shine bright!", "Stellar journey!", "Glow mode: ON"],
        prophetic: ["I foresee... a landing.", "The cards say: bumpy.", "Destiny awaits!"]
    },
    dropoff: {
        professional: ["Mission complete.", "Satisfactory service.", "Payment processed."],
        mysterious: ["Until we meet again...", "The prophecy continues.", "Farewell, mortal."],
        logical: ["Arrival confirmed.", "Trip efficiency: adequate.", "Transaction complete."],
        secretive: ["You saw nothing.", "Forget my face.", "This never happened."],
        eccentric: ["What a ride!", "My aura is pleased!", "Cosmic blessings!"],
        silent: ["...", "*vanishes*", "..."],
        curious: ["Adequate transport.", "Your world is strange.", "Most educational."],
        dramatic: ["The night embraces me!", "Into the shadows!", "MWAHAHAHA!"],
        casual: ["Much obliged!", "See ya, space cowboy!", "That was a hoot!"],
        nerdy: ["Smooth deceleration!", "Great landing angle!", "5 stars for physics!"],
        spooky: ["Rest in peace...", "The haunting continues.", "BOO-bye!"],
        festive: ["Happy Halloween!", "Pumpkin approved!", "Spook-tacular ride!"],
        sly: ["Smooth operation.", "You're alright, pilot.", "Perhaps again sometime."],
        tentacular: ["Suction cups satisfied.", "8/8 would ride again.", "Tentastic!"],
        radiant: ["You're a star!", "Keep shining!", "Brilliant journey!"],
        prophetic: ["As I foresaw.", "Destiny delivered.", "The cards were right."]
    }
};

// ==================== ENVIRONMENT THEMES ====================

var ENVIRONMENT_THEMES = [
    {
        name: "DEEP SPACE",
        bgColor: "#050510",
        wallColor: "#2a2a4a",
        wallHighlight: "#4a4a6a",
        platformColor: "#00ff41",
        platformHighlight: "#88ff88",
        fuelColor: "#00d2ff",
        starColors: ["#ffffff", "#aaaaff", "#ffaaaa"],
        ambientParticles: null
    },
    {
        name: "NEBULA ZONE",
        bgColor: "#100818",
        wallColor: "#3a1a4a",
        wallHighlight: "#6a2a7a",
        platformColor: "#ff00ff",
        platformHighlight: "#ff88ff",
        fuelColor: "#00ffaa",
        starColors: ["#ff88ff", "#8888ff", "#ffffff"],
        ambientParticles: "nebula"
    },
    {
        name: "ICE FIELDS",
        bgColor: "#081018",
        wallColor: "#2a4a6a",
        wallHighlight: "#4a8aaa",
        platformColor: "#00ffff",
        platformHighlight: "#88ffff",
        fuelColor: "#ffff00",
        starColors: ["#aaffff", "#ffffff", "#88aaff"],
        ambientParticles: "snow"
    },
    {
        name: "LAVA SECTOR",
        bgColor: "#180808",
        wallColor: "#4a2a1a",
        wallHighlight: "#8a4a2a",
        platformColor: "#ff6600",
        platformHighlight: "#ffaa44",
        fuelColor: "#00ff88",
        starColors: ["#ff8844", "#ffaa00", "#ffffff"],
        ambientParticles: "embers"
    },
    {
        name: "ASTEROID BELT",
        bgColor: "#0a0a0a",
        wallColor: "#4a4a4a",
        wallHighlight: "#6a6a6a",
        platformColor: "#ffaa00",
        platformHighlight: "#ffdd44",
        fuelColor: "#00aaff",
        starColors: ["#888888", "#aaaaaa", "#ffffff"],
        ambientParticles: "dust"
    },
    {
        name: "VOID RIFT",
        bgColor: "#080010",
        wallColor: "#1a0a3a",
        wallHighlight: "#3a1a6a",
        platformColor: "#aa00ff",
        platformHighlight: "#cc44ff",
        fuelColor: "#00ffff",
        starColors: ["#aa44ff", "#4444ff", "#ffffff"],
        ambientParticles: "void"
    },
    {
        name: "SOLAR FLARE",
        bgColor: "#181008",
        wallColor: "#5a4a1a",
        wallHighlight: "#8a7a3a",
        platformColor: "#ffff00",
        platformHighlight: "#ffff88",
        fuelColor: "#ff4400",
        starColors: ["#ffff44", "#ffaa00", "#ffffff"],
        ambientParticles: "plasma"
    },
    {
        name: "CRYSTAL CAVES",
        bgColor: "#080818",
        wallColor: "#2a3a5a",
        wallHighlight: "#4a6a8a",
        platformColor: "#44ffaa",
        platformHighlight: "#88ffcc",
        fuelColor: "#ff44aa",
        starColors: ["#44ffff", "#ff44ff", "#ffffff"],
        ambientParticles: "crystals"
    }
];

// ==================== PROCEDURAL LEVEL GENERATOR ====================

class LevelGenerator {
    constructor() {
        this.wallThickness = 60;
        this.platformW = 110;
        this.platformH = 22;
        this.minPlatformSpacing = 200;
        this.gridSize = 40; // Cell size for reachability grid
    }

    generate(levelNum) {
        // Scale difficulty with level number
        const difficulty = Math.min(levelNum, 20);

        // Level size grows with difficulty
        const w = 1600 + Math.floor(difficulty * 100);
        const h = 1200 + Math.floor(difficulty * 80);

        // Number of platforms and passengers scale with difficulty
        const numPlatforms = 4 + Math.floor(difficulty * 0.5);
        const numPassengers = 2 + Math.floor(difficulty * 0.3);
        const numFuelStations = 1 + Math.floor(difficulty / 5);
        const numEnemies = Math.max(0, Math.floor((difficulty - 2) * 0.8));
        const numInternalWalls = 1 + Math.floor(difficulty * 0.4);

        // Generate walls (border + internal)
        const walls = this.generateWalls(w, h, numInternalWalls, difficulty);

        // Spawn point in top-left safe zone
        const spawnX = this.wallThickness + 75;
        const spawnY = this.wallThickness + 50;

        // Build reachability map from spawn point
        const reachable = this.buildReachabilityMap(w, h, walls, spawnX, spawnY);

        // Generate platforms avoiding walls and ensuring reachability
        const platforms = this.generatePlatforms(w, h, numPlatforms, numFuelStations, walls, reachable);

        // Generate passengers with valid routes
        const passengers = this.generatePassengers(platforms, numPassengers);

        // Generate enemies for higher levels
        const enemies = this.generateEnemies(w, h, numEnemies, platforms, walls, difficulty);

        // Spawn point near first platform
        const spawnPlat = platforms[0];

        // Select theme based on level number (cycles through themes)
        const themeIndex = (levelNum - 1) % ENVIRONMENT_THEMES.length;
        const theme = ENVIRONMENT_THEMES[themeIndex];

        const level = {
            w,
            h,
            spawn: { x: spawnPlat.x + spawnPlat.w / 2, y: spawnPlat.y - 50 },
            platforms,
            walls,
            passengers,
            generated: true,
            levelNum: levelNum,
            theme: theme
        };

        if (enemies.length > 0) {
            level.enemies = enemies;
        }

        return level;
    }

    generateWalls(w, h, numInternal, difficulty) {
        const walls = [];
        const t = this.wallThickness;

        // Border walls
        walls.push({ x: 0, y: 0, w: w, h: t });           // Top
        walls.push({ x: 0, y: h - t, w: w, h: t });       // Bottom
        walls.push({ x: 0, y: 0, w: t, h: h });           // Left
        walls.push({ x: w - t, y: 0, w: t, h: h });       // Right

        // Internal walls - create corridors and obstacles
        const safeZone = 250; // Keep area near spawn clear

        for (let i = 0; i < numInternal; i++) {
            const isVertical = Math.random() > 0.4;
            let wall;

            if (isVertical) {
                // Vertical wall with gap
                const wallX = t + safeZone + Math.random() * (w - 2 * t - safeZone - 80);
                const gapPos = 0.2 + Math.random() * 0.6; // Gap position (20-80%)
                const gapSize = 150 + Math.random() * 100;
                const wallHeight = h - 2 * t;
                const gapStart = Math.floor(wallHeight * gapPos);

                // Wall above gap
                if (gapStart > 100) {
                    walls.push({
                        x: wallX,
                        y: t,
                        w: 60 + Math.random() * 40,
                        h: gapStart
                    });
                }
                // Wall below gap
                const belowStart = gapStart + gapSize;
                if (belowStart < wallHeight - 100) {
                    walls.push({
                        x: wallX,
                        y: t + belowStart,
                        w: 60 + Math.random() * 40,
                        h: wallHeight - belowStart
                    });
                }
            } else {
                // Horizontal wall with gap
                const wallY = t + safeZone + Math.random() * (h - 2 * t - safeZone - 80);
                const gapPos = 0.2 + Math.random() * 0.6;
                const gapSize = 150 + Math.random() * 100;
                const wallWidth = w - 2 * t;
                const gapStart = Math.floor(wallWidth * gapPos);

                // Wall left of gap
                if (gapStart > 100) {
                    walls.push({
                        x: t,
                        y: wallY,
                        w: gapStart,
                        h: 40 + Math.random() * 30
                    });
                }
                // Wall right of gap
                const rightStart = gapStart + gapSize;
                if (rightStart < wallWidth - 100) {
                    walls.push({
                        x: t + rightStart,
                        y: wallY,
                        w: wallWidth - rightStart,
                        h: 40 + Math.random() * 30
                    });
                }
            }
        }

        // Add some floating obstacles on higher difficulties
        if (difficulty > 5) {
            const numObstacles = Math.floor((difficulty - 5) * 0.3);
            for (let i = 0; i < numObstacles; i++) {
                const obstacleW = 80 + Math.random() * 60;
                const obstacleH = 30 + Math.random() * 30;
                const ox = t + safeZone + Math.random() * (w - 2 * t - safeZone - obstacleW);
                const oy = t + 200 + Math.random() * (h - 2 * t - 400);

                // Check it doesn't overlap existing walls too much
                let valid = true;
                for (const wall of walls) {
                    if (this.rectsOverlap(ox, oy, obstacleW, obstacleH, wall.x - 50, wall.y - 50, wall.w + 100, wall.h + 100)) {
                        valid = false;
                        break;
                    }
                }
                if (valid) {
                    walls.push({ x: ox, y: oy, w: obstacleW, h: obstacleH });
                }
            }
        }

        return walls;
    }

    // Build a reachability map using flood-fill from spawn point
    buildReachabilityMap(w, h, walls, spawnX, spawnY) {
        const cols = Math.ceil(w / this.gridSize);
        const rows = Math.ceil(h / this.gridSize);

        // Initialize grid (false = not reachable yet)
        const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));

        // Mark walls as permanently blocked (use -1)
        for (const wall of walls) {
            const startCol = Math.floor(wall.x / this.gridSize);
            const endCol = Math.ceil((wall.x + wall.w) / this.gridSize);
            const startRow = Math.floor(wall.y / this.gridSize);
            const endRow = Math.ceil((wall.y + wall.h) / this.gridSize);

            for (let r = startRow; r < endRow && r < rows; r++) {
                for (let c = startCol; c < endCol && c < cols; c++) {
                    if (r >= 0 && c >= 0) {
                        grid[r][c] = -1; // -1 means wall/blocked
                    }
                }
            }
        }

        // Flood-fill from spawn point
        const startCol = Math.floor(spawnX / this.gridSize);
        const startRow = Math.floor(spawnY / this.gridSize);

        const queue = [[startRow, startCol]];
        if (grid[startRow] && grid[startRow][startCol] !== -1) {
            grid[startRow][startCol] = true;
        }

        while (queue.length > 0) {
            const [r, c] = queue.shift();

            // Check all 8 neighbors (including diagonals for flight paths)
            const neighbors = [
                [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
                [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]
            ];

            for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (grid[nr][nc] === false) {
                        grid[nr][nc] = true;
                        queue.push([nr, nc]);
                    }
                }
            }
        }

        return { grid, cols, rows };
    }

    // Check if a position is reachable from spawn
    isReachable(x, y, reachable) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);

        if (row >= 0 && row < reachable.rows && col >= 0 && col < reachable.cols) {
            return reachable.grid[row][col] === true;
        }
        return false;
    }

    generatePlatforms(w, h, numPlatforms, numFuel, walls, reachable) {
        const platforms = [];
        const t = this.wallThickness;
        const margin = 100;

        // Shuffle platform names for this level
        const shuffledNames = [...PLATFORM_NAMES].sort(() => Math.random() - 0.5);
        const shuffledFuelNames = [...FUEL_STATION_NAMES].sort(() => Math.random() - 0.5);
        let nameIndex = 0;
        let fuelNameIndex = 0;

        // Start platform (always in top-left safe zone)
        platforms.push({
            x: t + 20,
            y: t + 100,
            w: this.platformW,
            h: this.platformH,
            id: 0,
            name: shuffledNames[nameIndex++] || "HOME BASE"
        });

        let platformId = 1;
        let attempts = 0;
        const maxAttempts = 500;

        // Generate regular platforms
        while (platforms.length < numPlatforms && attempts < maxAttempts) {
            attempts++;

            const px = t + margin + Math.random() * (w - 2 * t - 2 * margin - this.platformW);
            const py = t + margin + Math.random() * (h - 2 * t - 2 * margin - this.platformH);

            if (this.isValidPlatformPosition(px, py, this.platformW, this.platformH, platforms, walls, reachable)) {
                platforms.push({
                    x: px,
                    y: py,
                    w: this.platformW,
                    h: this.platformH,
                    id: platformId++,
                    name: shuffledNames[nameIndex++] || `STATION ${platformId}`
                });
            }
        }

        // Add fuel stations
        attempts = 0;
        let fuelId = 99;
        while (numFuel > 0 && attempts < maxAttempts) {
            attempts++;

            const px = t + margin + Math.random() * (w - 2 * t - 2 * margin - 90);
            const py = t + margin + Math.random() * (h - 2 * t - 2 * margin - this.platformH);

            if (this.isValidPlatformPosition(px, py, 90, this.platformH, platforms, walls, reachable)) {
                platforms.push({
                    x: px,
                    y: py,
                    w: 90,
                    h: this.platformH,
                    id: fuelId--,
                    fuel: true,
                    name: shuffledFuelNames[fuelNameIndex++] || "FUEL STOP"
                });
                numFuel--;
            }
        }

        return platforms;
    }

    isValidPlatformPosition(x, y, w, h, platforms, walls, reachable) {
        // Check against walls (with margin)
        for (const wall of walls) {
            if (this.rectsOverlap(x, y - 60, w, h + 80, wall.x, wall.y, wall.w, wall.h)) {
                return false;
            }
        }

        // Check against other platforms (minimum spacing)
        for (const plat of platforms) {
            const dist = Math.sqrt(
                Math.pow((x + w/2) - (plat.x + plat.w/2), 2) +
                Math.pow((y + h/2) - (plat.y + plat.h/2), 2)
            );
            if (dist < this.minPlatformSpacing) {
                return false;
            }
        }

        // Check reachability - platform center and area above it must be reachable
        const centerX = x + w / 2;
        const centerY = y;
        const aboveY = y - 50; // Check space above platform for landing

        if (!this.isReachable(centerX, centerY, reachable) ||
            !this.isReachable(centerX, aboveY, reachable)) {
            return false;
        }

        return true;
    }

    generatePassengers(platforms, numPassengers) {
        const passengers = [];
        const regularPlatforms = platforms.filter(p => !p.fuel && p.id !== 0);

        if (regularPlatforms.length < 2) return passengers;

        const usedPairs = new Set();
        const usedCharacters = new Set();

        for (let i = 0; i < numPassengers && i < regularPlatforms.length; i++) {
            let attempts = 0;
            while (attempts < 50) {
                attempts++;
                const fromIdx = Math.floor(Math.random() * regularPlatforms.length);
                let toIdx = Math.floor(Math.random() * regularPlatforms.length);

                // Ensure different platforms
                if (fromIdx === toIdx) continue;

                const fromPlat = regularPlatforms[fromIdx];
                const toPlat = regularPlatforms[toIdx];
                const pairKey = `${fromPlat.id}-${toPlat.id}`;

                if (!usedPairs.has(pairKey)) {
                    usedPairs.add(pairKey);

                    // Assign a unique character
                    let character;
                    let charAttempts = 0;
                    do {
                        character = PASSENGERS[Math.floor(Math.random() * PASSENGERS.length)];
                        charAttempts++;
                    } while (usedCharacters.has(character.emoji) && charAttempts < 20);
                    usedCharacters.add(character.emoji);

                    passengers.push({
                        f: fromPlat.id,
                        t: toPlat.id,
                        fromName: fromPlat.name,
                        toName: toPlat.name,
                        character: character
                    });
                    break;
                }
            }
        }

        return passengers;
    }

    generateEnemies(w, h, numEnemies, platforms, walls, difficulty) {
        const enemies = [];
        const t = this.wallThickness;
        const margin = 150;

        for (let i = 0; i < numEnemies; i++) {
            let attempts = 0;
            while (attempts < 100) {
                attempts++;

                const ex = t + margin + Math.random() * (w - 2 * t - 2 * margin);
                const ey = t + margin + Math.random() * (h - 2 * t - 2 * margin);
                const radius = 80 + Math.random() * 120;
                const size = 15 + Math.random() * 15;
                const speed = 0.0005 + Math.random() * 0.001 + (difficulty * 0.0001);

                // Check not too close to platforms
                let valid = true;
                for (const plat of platforms) {
                    const dist = Math.sqrt(
                        Math.pow(ex - (plat.x + plat.w/2), 2) +
                        Math.pow(ey - (plat.y + plat.h/2), 2)
                    );
                    if (dist < radius + 150) {
                        valid = false;
                        break;
                    }
                }

                // Check not inside walls
                for (const wall of walls) {
                    if (ex > wall.x - radius && ex < wall.x + wall.w + radius &&
                        ey > wall.y - radius && ey < wall.y + wall.h + radius) {
                        valid = false;
                        break;
                    }
                }

                if (valid) {
                    enemies.push({
                        x: ex,
                        y: ey,
                        r: radius,
                        speed: speed,
                        size: size
                    });
                    break;
                }
            }
        }

        return enemies;
    }

    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
}

// Global generator instance
var levelGenerator = new LevelGenerator();

var radioChatter = [
    "Sektor-Kontrolle: 'Scanner-Verschmutzung in Quadrant 4 gemeldet.'",
    "Funk: '...habe heute schon 3 VIPs nach Pluto geflogen.'",
    "Warnung: 'Meteoriten-Warnung für Sektor G-12 aufgehoben.'",
    "Kontrolle: 'Taxi 42, halten Sie die Landebahnen frei.'",
    "Funk: 'Jemand Lust auf einen Drink in der Nebula-Bar?'",
    "System: 'Gravitations-Konstante stabil bei 9.81 u/s.'",
    "Kontrolle: 'Unidentifiziertes Flugobjekt in Level 2 gesichtet! Vorsicht!'",
    "Funk: 'Wer hat die Mülltonnen bei PAD 1 stehen lassen?'",
    "Sektor-Log: 'Sonneneruption erwartet. Schilde prüfen.'"
];

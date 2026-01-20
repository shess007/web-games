// ==================== CORE CONSTANTS ====================

var WORLD_W = 800;
var WORLD_H = 600;
var TAXI_W = 34;
var TAXI_H = 22;
var MAX_LANDING_SPD = 1.0;

// ==================== ROGUELIKE CONFIG ====================

var ROGUELIKE = {
    totalSectors: 3,
    maxHull: 3,
    wallDamage: 1,
    enemyDamage: 2,
    hardLandingDamage: 1,
    hardLandingSpeed: 1.2,
    repairCost: 100,
    fuelCostPerFrame: 0.1,
    contractSelectionTime: 5000, // 5 seconds to choose
};

// Sector configuration
var SECTOR_CONFIG = [
    {
        name: "MORNING SHIFT",
        theme: "DEEP SPACE",
        platforms: 4,
        passengers: 2,
        fuelStations: 1,
        enemies: 0,
        asteroids: 3,
        debris: 5,
        meteors: 0,
        modifierCount: 0,
        contractChoices: 2,
        levelSize: { w: 1600, h: 1200 }
    },
    {
        name: "RUSH HOUR",
        theme: null, // Random from pool
        platforms: 5,
        passengers: 3,
        fuelStations: 1,
        enemies: 2,
        asteroids: 5,
        debris: 8,
        meteors: 2,
        modifierCount: 1,
        contractChoices: 3,
        levelSize: { w: 1800, h: 1400 }
    },
    {
        name: "FINAL FARE",
        theme: "VOID RIFT",
        platforms: 5,
        passengers: 1, // VIP only
        fuelStations: 1,
        enemies: 3,
        asteroids: 7,
        debris: 12,
        meteors: 4,
        modifierCount: 2,
        contractChoices: 1, // VIP contract only
        levelSize: { w: 2000, h: 1600 },
        vipOnly: true
    }
];

// ==================== CONTRACT SYSTEM ====================

var CONTRACT_TYPES = {
    standard: {
        name: "Standard",
        payout: 100,
        description: "Normal delivery",
        color: "#00ff41"
    },
    express: {
        name: "Express",
        payout: 150,
        description: "30 second time limit",
        color: "#ff6600",
        timeLimit: 30000
    },
    hazard: {
        name: "Hazard Pay",
        payout: 200,
        description: "Route through enemies",
        color: "#ff0000",
        hazardZone: true
    },
    vip: {
        name: "VIP",
        payout: 300,
        description: "No bumps, soft landing",
        color: "#ffdd00",
        maxSpeed: 0.8,
        noBumps: true
    },
    fragile: {
        name: "Fragile Cargo",
        payout: 180,
        description: "Max speed 2.0",
        color: "#00d2ff",
        maxSpeed: 2.0
    }
};

// Contract pool by sector
var CONTRACT_POOLS = {
    1: ['standard', 'standard', 'express'],
    2: ['standard', 'express', 'hazard', 'fragile'],
    3: ['vip'] // Final fare is always VIP
};

// ==================== MODIFIER SYSTEM ====================

var MODIFIERS = {
    solarStorm: {
        name: "Solar Storm",
        description: "Thrust reduced 30%",
        icon: "☀️",
        thrustMultiplier: 0.7,
        screenShake: 2
    },
    ionClouds: {
        name: "Ion Clouds",
        description: "Random drift",
        icon: "⚡",
        driftStrength: 0.03
    },
    gravityFlux: {
        name: "Gravity Flux",
        description: "Gravity oscillates",
        icon: "🌀",
        gravityMin: 0.02,
        gravityMax: 0.06,
        cycleSpeed: 0.002
    },
    fuelLeak: {
        name: "Fuel Leak",
        description: "Fuel drains 20% faster",
        icon: "💧",
        fuelDrainMultiplier: 1.2
    },
    scannerJam: {
        name: "Scanner Jam",
        description: "Minimap disabled",
        icon: "📡",
        disableMinimap: true
    },
    luckyStars: {
        name: "Lucky Stars",
        description: "Payouts +25%",
        icon: "⭐",
        payoutMultiplier: 1.25
    }
};

var MODIFIER_POOL = ['solarStorm', 'ionClouds', 'gravityFlux', 'fuelLeak', 'scannerJam', 'luckyStars'];

// ==================== WORLD BUILDING DATA ====================

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

// Theme lookup by name
var THEME_BY_NAME = {};
ENVIRONMENT_THEMES.forEach(t => THEME_BY_NAME[t.name] = t);

// Random theme pools for sector 2
var RANDOM_THEME_POOL = ["NEBULA ZONE", "ICE FIELDS", "LAVA SECTOR", "ASTEROID BELT", "SOLAR FLARE", "CRYSTAL CAVES"];

// ==================== SECTOR GENERATOR ====================

class SectorGenerator {
    constructor() {
        this.platformW = 110;
        this.platformH = 22;
        this.minPlatformSpacing = 200;
        this.gridSize = 40;
    }

    generateSector(sectorIndex) {
        const config = SECTOR_CONFIG[sectorIndex];
        if (!config) return null;

        const w = config.levelSize.w;
        const h = config.levelSize.h;

        // Determine theme
        let theme;
        if (config.theme) {
            theme = THEME_BY_NAME[config.theme];
        } else {
            const randomThemeName = RANDOM_THEME_POOL[Math.floor(Math.random() * RANDOM_THEME_POOL.length)];
            theme = THEME_BY_NAME[randomThemeName];
        }

        // Spawn point
        const spawnX = 150;
        const spawnY = 150;

        // Build reachability map (no walls now)
        const reachable = this.buildReachabilityMap(w, h, [], spawnX, spawnY);

        // Generate platforms
        const platforms = this.generatePlatforms(w, h, config.platforms, config.fuelStations, [], reachable);

        // Generate passengers with contracts
        const passengers = this.generatePassengers(platforms, config.passengers, config.vipOnly);

        // Generate space obstacles
        const asteroids = this.generateAsteroids(w, h, config.asteroids || 0, platforms);
        const debris = this.generateDebris(w, h, config.debris || 0, platforms);
        const meteors = this.generateMeteors(w, h, config.meteors || 0);

        // Generate enemies (orbital creatures)
        const enemies = this.generateEnemies(w, h, config.enemies, platforms, []);

        // Roll modifiers
        const modifiers = this.rollModifiers(config.modifierCount);

        const spawnPlat = platforms[0];

        return {
            w,
            h,
            spawn: { x: spawnPlat.x + spawnPlat.w / 2, y: spawnPlat.y - 50 },
            platforms,
            asteroids,
            debris,
            meteors,
            passengers,
            enemies,
            theme,
            modifiers,
            sectorIndex,
            sectorName: config.name,
            contractChoices: config.contractChoices
        };
    }

    rollModifiers(count) {
        if (count <= 0) return [];

        const available = [...MODIFIER_POOL];
        const selected = [];

        for (let i = 0; i < count && available.length > 0; i++) {
            const idx = Math.floor(Math.random() * available.length);
            selected.push(available.splice(idx, 1)[0]);
        }

        return selected;
    }

    // ==================== SPACE OBSTACLES ====================

    generateAsteroids(w, h, count, platforms) {
        // Large, slow-drifting rocks
        const asteroids = [];
        const margin = 150;

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            while (attempts < 50) {
                attempts++;
                const size = 30 + Math.random() * 50; // 30-80 radius
                const x = margin + Math.random() * (w - 2 * margin);
                const y = margin + Math.random() * (h - 2 * margin);

                // Check distance from platforms
                let valid = true;
                for (const plat of platforms) {
                    const dist = Math.sqrt(Math.pow(x - (plat.x + plat.w/2), 2) + Math.pow(y - plat.y, 2));
                    if (dist < size + 120) { valid = false; break; }
                }

                if (valid) {
                    // Random drift velocity (very slow)
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 0.1 + Math.random() * 0.3;

                    asteroids.push({
                        x, y,
                        size,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.02,
                        // Generate rocky shape (vertices for polygon)
                        vertices: this.generateAsteroidShape(size),
                        color: `hsl(${30 + Math.random() * 20}, ${20 + Math.random() * 15}%, ${25 + Math.random() * 20}%)`
                    });
                    break;
                }
            }
        }
        return asteroids;
    }

    generateAsteroidShape(size) {
        // Create irregular polygon vertices
        const points = 8 + Math.floor(Math.random() * 5);
        const vertices = [];
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const variance = 0.6 + Math.random() * 0.4; // 60-100% of size
            vertices.push({
                x: Math.cos(angle) * size * variance,
                y: Math.sin(angle) * size * variance
            });
        }
        return vertices;
    }

    generateDebris(w, h, count, platforms) {
        // Small floating junk - metal scraps, broken parts
        const debris = [];
        const margin = 100;

        for (let i = 0; i < count; i++) {
            const x = margin + Math.random() * (w - 2 * margin);
            const y = margin + Math.random() * (h - 2 * margin);

            // Check not too close to platforms
            let valid = true;
            for (const plat of platforms) {
                const dist = Math.sqrt(Math.pow(x - (plat.x + plat.w/2), 2) + Math.pow(y - plat.y, 2));
                if (dist < 80) { valid = false; break; }
            }

            if (!valid) continue;

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.5;

            debris.push({
                x, y,
                size: 5 + Math.random() * 12, // Small pieces
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.08,
                type: ['scrap', 'panel', 'pipe', 'crystal'][Math.floor(Math.random() * 4)],
                color: ['#888', '#666', '#aaa', '#7af'][Math.floor(Math.random() * 4)]
            });
        }
        return debris;
    }

    generateMeteors(w, h, count) {
        // Fast-moving rocks that cross the screen
        const meteors = [];

        for (let i = 0; i < count; i++) {
            meteors.push(this.spawnMeteor(w, h));
        }
        return meteors;
    }

    spawnMeteor(w, h) {
        // Spawn from edge, move across screen
        const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y, vx, vy;
        const speed = 2 + Math.random() * 3;
        const size = 8 + Math.random() * 15;

        switch(side) {
            case 0: // Top
                x = Math.random() * w;
                y = -50;
                vx = (Math.random() - 0.5) * speed;
                vy = speed;
                break;
            case 1: // Right
                x = w + 50;
                y = Math.random() * h;
                vx = -speed;
                vy = (Math.random() - 0.5) * speed;
                break;
            case 2: // Bottom
                x = Math.random() * w;
                y = h + 50;
                vx = (Math.random() - 0.5) * speed;
                vy = -speed;
                break;
            case 3: // Left
                x = -50;
                y = Math.random() * h;
                vx = speed;
                vy = (Math.random() - 0.5) * speed;
                break;
        }

        return {
            x, y, vx, vy, size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.15,
            trail: [], // For fiery trail effect
            active: true
        };
    }

    buildReachabilityMap(w, h, walls, spawnX, spawnY) {
        const cols = Math.ceil(w / this.gridSize);
        const rows = Math.ceil(h / this.gridSize);
        const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));

        for (const wall of walls) {
            const startCol = Math.floor(wall.x / this.gridSize);
            const endCol = Math.ceil((wall.x + wall.w) / this.gridSize);
            const startRow = Math.floor(wall.y / this.gridSize);
            const endRow = Math.ceil((wall.y + wall.h) / this.gridSize);

            for (let r = startRow; r < endRow && r < rows; r++) {
                for (let c = startCol; c < endCol && c < cols; c++) {
                    if (r >= 0 && c >= 0) grid[r][c] = -1;
                }
            }
        }

        const startCol = Math.floor(spawnX / this.gridSize);
        const startRow = Math.floor(spawnY / this.gridSize);
        const queue = [[startRow, startCol]];

        if (grid[startRow] && grid[startRow][startCol] !== -1) {
            grid[startRow][startCol] = true;
        }

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const neighbors = [
                [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
                [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]
            ];

            for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === false) {
                    grid[nr][nc] = true;
                    queue.push([nr, nc]);
                }
            }
        }

        return { grid, cols, rows };
    }

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
        const margin = 100; // Keep platforms away from edges

        const shuffledNames = [...PLATFORM_NAMES].sort(() => Math.random() - 0.5);
        const shuffledFuelNames = [...FUEL_STATION_NAMES].sort(() => Math.random() - 0.5);
        let nameIndex = 0;
        let fuelNameIndex = 0;

        // Start platform - near top-left but with margin from edge
        platforms.push({
            x: margin, y: margin + 50, w: this.platformW, h: this.platformH,
            id: 0, name: shuffledNames[nameIndex++] || "HOME BASE"
        });

        let platformId = 1;
        let attempts = 0;

        while (platforms.length < numPlatforms && attempts < 500) {
            attempts++;
            const px = margin + Math.random() * (w - 2 * margin - this.platformW);
            const py = margin + Math.random() * (h - 2 * margin - this.platformH);

            if (this.isValidPlatformPosition(px, py, this.platformW, this.platformH, platforms, walls, reachable)) {
                platforms.push({
                    x: px, y: py, w: this.platformW, h: this.platformH,
                    id: platformId++, name: shuffledNames[nameIndex++] || `STATION ${platformId}`
                });
            }
        }

        // Fuel stations
        attempts = 0;
        let fuelId = 99;
        while (numFuel > 0 && attempts < 500) {
            attempts++;
            const px = margin + Math.random() * (w - 2 * margin - 90);
            const py = margin + Math.random() * (h - 2 * margin - this.platformH);

            if (this.isValidPlatformPosition(px, py, 90, this.platformH, platforms, walls, reachable)) {
                platforms.push({
                    x: px, y: py, w: 90, h: this.platformH,
                    id: fuelId--, fuel: true, name: shuffledFuelNames[fuelNameIndex++] || "FUEL STOP"
                });
                numFuel--;
            }
        }

        return platforms;
    }

    isValidPlatformPosition(x, y, w, h, platforms, walls, reachable) {
        for (const wall of walls) {
            if (this.rectsOverlap(x, y - 60, w, h + 80, wall.x, wall.y, wall.w, wall.h)) return false;
        }

        for (const plat of platforms) {
            const dist = Math.sqrt(Math.pow((x + w/2) - (plat.x + plat.w/2), 2) + Math.pow((y + h/2) - (plat.y + plat.h/2), 2));
            if (dist < this.minPlatformSpacing) return false;
        }

        const centerX = x + w / 2;
        if (!this.isReachable(centerX, y, reachable) || !this.isReachable(centerX, y - 50, reachable)) return false;

        return true;
    }

    generatePassengers(platforms, numPassengers, vipOnly) {
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

                if (fromIdx === toIdx) continue;

                const fromPlat = regularPlatforms[fromIdx];
                const toPlat = regularPlatforms[toIdx];
                const pairKey = `${fromPlat.id}-${toPlat.id}`;

                if (!usedPairs.has(pairKey)) {
                    usedPairs.add(pairKey);

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
                        character,
                        vipOnly: vipOnly || false
                    });
                    break;
                }
            }
        }

        return passengers;
    }

    generateEnemies(w, h, numEnemies, platforms, walls) {
        const enemies = [];
        const margin = 150; // Keep enemies away from edges

        for (let i = 0; i < numEnemies; i++) {
            let attempts = 0;
            while (attempts < 100) {
                attempts++;

                const ex = margin + Math.random() * (w - 2 * margin);
                const ey = margin + Math.random() * (h - 2 * margin);
                const radius = 80 + Math.random() * 120;
                const size = 15 + Math.random() * 15;
                const speed = 0.001 + Math.random() * 0.001; // Slightly faster for roguelike

                let valid = true;
                for (const plat of platforms) {
                    const dist = Math.sqrt(Math.pow(ex - (plat.x + plat.w/2), 2) + Math.pow(ey - (plat.y + plat.h/2), 2));
                    if (dist < radius + 150) { valid = false; break; }
                }

                for (const wall of walls) {
                    if (ex > wall.x - radius && ex < wall.x + wall.w + radius &&
                        ey > wall.y - radius && ey < wall.y + wall.h + radius) {
                        valid = false; break;
                    }
                }

                if (valid) {
                    enemies.push({ x: ex, y: ey, r: radius, speed, size, centerX: ex, centerY: ey, angle: Math.random() * Math.PI * 2 });
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
var sectorGenerator = new SectorGenerator();

// ==================== RADIO CHATTER ====================

var radioChatter = [
    "Control: 'Scanner interference in Quadrant 4.'",
    "Radio: '...already flew 3 VIPs to Pluto today.'",
    "Warning: 'Meteor warning for Sector G-12 lifted.'",
    "Control: 'Taxi 42, keep the landing pads clear.'",
    "Radio: 'Anyone up for drinks at the Nebula Bar?'",
    "System: 'Gravity constant stable at 9.81 u/s.'",
    "Control: 'Unidentified object in Sector 2! Careful!'",
    "Radio: 'Who left the trash cans at PAD 1?'",
    "Sector-Log: 'Solar eruption expected. Check shields.'"
];

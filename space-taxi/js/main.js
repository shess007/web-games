class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.audio = new AudioEngine();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.ui = new UIManager();

        this.state = {
            gameState: 'START',
            cash: 0,
            fuel: 100,
            currentLevelIdx: 0,
            passengerIndex: 0,
            shake: 0,
            particles: [],
            activePassenger: null,
            fuelAlertTriggered: false,
            isTransitioning: false,
            level: null,
            camera: { x: 0, y: 0 },
            taxi: {
                x: 100, y: 100, vx: 0, vy: 0, angle: 0,
                landedOn: null
            },
            keys: {},
            chatterTimer: Math.random() * 500 + 500 // Initial delay for first chatter
        };

        this.bgmInterval = null;
        this.ambienceStarted = false;
        this.initEventListeners();
        this.handleResize();
    }

    initEventListeners() {
        window.onkeydown = e => {
            this.state.keys[e.code] = true;
            if (e.code === 'F2') {
                const isVisible = this.ui.els.devMenu.style.display === 'block';
                this.ui.toggleDevMenu(!isVisible, levels, (idx) => {
                    this.state.currentLevelIdx = idx;
                    this.state.gameState = 'PLAYING';
                    this.ui.hideOverlay();
                    this.initLevel();
                    if (!this.bgmInterval) {
                        this.bgmInterval = setInterval(() => {
                            if (this.state.gameState === 'PLAYING') this.audio.playBGMStep();
                        }, 180);
                    }
                    this.gameLoop();
                });
            }
        };
        window.onkeyup = e => this.state.keys[e.code] = false;
        window.onresize = () => this.handleResize();

        this.ui.els.startBtn.onclick = () => this.startGame();

        if (this.ui.els.fullscreenBtn) {
            this.ui.els.fullscreenBtn.onclick = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
                    });
                } else {
                    document.exitFullscreen();
                }
            };
        }

        this.setupTouch('btn-up', 'ArrowUp');
        this.setupTouch('btn-left', 'ArrowLeft');
        this.setupTouch('btn-right', 'ArrowRight');
    }

    setupTouch(id, code) {
        const el = document.getElementById(id);
        if (!el) return;
        el.ontouchstart = e => { e.preventDefault(); this.state.keys[code] = true; };
        el.ontouchend = e => { e.preventDefault(); this.state.keys[code] = false; };
    }

    handleResize() {
        const isMobile = window.innerWidth <= 950;
        const isLandscape = window.innerWidth > window.innerHeight;
        const hud = document.getElementById('ui');

        // In landscape mobile, HUD is fixed (overlay), so we don't subtract its full height
        const hudHeight = (isMobile && isLandscape) ? 20 : (hud ? hud.offsetHeight : 0);
        const controlsHeight = isMobile ? (isLandscape ? 100 : 160) : 20;

        const availableW = window.innerWidth - (isMobile ? 60 : 20);
        const availableH = window.innerHeight - controlsHeight - hudHeight - 20;

        const scale = Math.min(availableW / WORLD_W, availableH / WORLD_H);

        this.canvas.width = WORLD_W;
        this.canvas.height = WORLD_H;
        this.canvas.style.width = (WORLD_W * scale) + 'px';
        this.canvas.style.height = (WORLD_H * scale) + 'px';

        const container = document.getElementById('game-container');
        container.style.width = (WORLD_W * scale) + 'px';
        container.style.height = (WORLD_H * scale) + 'px';
    }

    startGame() {
        this.audio.setup();
        this.ui.hideOverlay();
        if (this.state.gameState === 'SUCCESS' || (this.state.gameState === 'CRASHED' && this.state.passengerIndex === 0)) {
            this.state.cash = 0;
        }
        this.state.gameState = 'PLAYING';
        this.initLevel();

        if (!this.bgmInterval) {
            this.bgmInterval = setInterval(() => {
                if (this.state.gameState === 'PLAYING') this.audio.playBGMStep();
            }, 180);
        }

        this.gameLoop();
    }

    initLevel() {
        const level = levels[this.state.currentLevelIdx];
        if (!level) return;

        this.state.level = level;
        this.resetTaxi(level.spawn.x, level.spawn.y);
        this.state.fuel = 100;
        this.state.particles = [];
        this.state.shake = 0;
        this.state.fuelAlertTriggered = false;
        this.state.isTransitioning = false;
        this.state.passengerIndex = 0;

        this.renderer.initStars(level);
        this.initPassenger();
    }

    resetTaxi(x, y) {
        this.state.taxi.x = x;
        this.state.taxi.y = y;
        this.state.taxi.vx = 0;
        this.state.taxi.vy = 0;
        this.state.taxi.angle = 0;
        this.state.taxi.landedOn = null;
    }

    initPassenger() {
        const level = this.state.level;
        if (!level || this.state.passengerIndex >= level.passengers.length) return;

        const pass = level.passengers[this.state.passengerIndex];
        const startPlat = level.platforms.find(p => p.id === pass.f);
        this.state.activePassenger = {
            state: 'WAITING',
            x: startPlat.x + startPlat.w / 2,
            y: startPlat.y - 5
        };

        this.ui.updatePassCount(this.state.passengerIndex + 1, level.passengers.length);
        this.ui.setTarget("P" + pass.f);
        this.ui.setMessage("GAST HOLEN");
    }

    gameLoop() {
        if (this.state.gameState !== 'PLAYING') return;

        this.update();
        this.renderer.draw(this.state);
        this.ui.updateMinimap(this.state);

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        const { taxi, level, keys } = this.state;
        const thrustUp = keys['ArrowUp'] || keys['KeyW'];
        const thrustLeft = keys['ArrowLeft'] || keys['KeyA'];
        const thrustRight = keys['ArrowRight'] || keys['KeyD'];
        const anyThrust = (thrustUp || thrustLeft || thrustRight) && this.state.fuel > 0;

        this.audio.updateEngineSound(anyThrust);

        if (this.state.fuel > 0) {
            if (thrustUp) {
                taxi.vy -= 0.13;
                this.state.fuel -= 0.18;
                this.createThrustParticles(taxi.x, taxi.y + 10, '#ffff55');
                this.state.shake = Math.max(this.state.shake, 1.5);
            }
            if (thrustLeft) {
                taxi.vx -= 0.1;
                this.state.fuel -= 0.07;
                taxi.angle = -0.15;
                this.createThrustParticles(taxi.x + 15, taxi.y, '#00ffff', true);
            }
            else if (thrustRight) {
                taxi.vx += 0.1;
                this.state.fuel -= 0.07;
                taxi.angle = 0.15;
                this.createThrustParticles(taxi.x - 15, taxi.y, '#00ffff', true);
            }
            else taxi.angle *= 0.85;
        } else {
            taxi.angle *= 0.9;
            if (!this.state.fuelAlertTriggered) {
                this.state.fuelAlertTriggered = true;
                this.audio.playSound(350, 2.0, 'sine', 0.4, 10);
                this.ui.setMessage("TANK LEER!");
            }
        }

        taxi.vy += 0.04; taxi.vx *= 0.98; taxi.vy *= 0.98;
        taxi.x += taxi.vx; taxi.y += taxi.vy;

        if (this.state.shake > 0) this.state.shake *= 0.9;
        this.state.camera.x = Math.max(0, Math.min(taxi.x - WORLD_W / 2, level.w - WORLD_W));
        this.state.camera.y = Math.max(0, Math.min(taxi.y - WORLD_H / 2, level.h - WORLD_H));

        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);

        // Collisions
        this.checkCollisions(speed);

        // Particles
        for (let i = this.state.particles.length - 1; i >= 0; i--) {
            const p = this.state.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= p.decay;
            if (p.life <= 0) this.state.particles.splice(i, 1);
        }

        this.ui.updateHUD(this.state, speed);

        // Ambience & Radio Chatter
        if (!this.ambienceStarted) {
            this.ambienceStarted = true;
            setInterval(() => {
                if (this.state.gameState === 'PLAYING') this.audio.playSound(50, 1.0, 'sine', 0.05, 0); // Engine hum
            }, 1000);
        }

        if (this.state.chatterTimer > 0) {
            this.state.chatterTimer--;
        } else {
            const chat = radioChatter[Math.floor(Math.random() * radioChatter.length)];
            this.ui.showRadioChatter(chat);
            this.state.chatterTimer = 600 + Math.random() * 1000;
        }

        // Update Passenger Avatar in UI
        if (this.state.activePassenger?.state === 'IN_TAXI') {
            this.ui.updatePassengerAvatar(this.state.passengerIndex);
        } else {
            this.ui.updatePassengerAvatar(null);
        }
    }

    checkCollisions(speed) {
        const { taxi, level } = this.state;

        // Walls
        for (let w of level.walls) {
            if (taxi.x + TAXI_W / 2 > w.x && taxi.x - TAXI_W / 2 < w.x + w.w && taxi.y + TAXI_H / 2 > w.y && taxi.y - TAXI_H / 2 < w.y + w.h) {
                this.crash(); return;
            }
        }

        // Enemies
        if (level.enemies) {
            for (let e of level.enemies) {
                const angle = Date.now() * e.speed;
                const ex = e.x + Math.cos(angle) * e.r;
                const ey = e.y + Math.sin(angle) * e.r;
                const dx = taxi.x - ex;
                const dy = taxi.y - ey;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < e.size + 10) {
                    this.crash("DÄMONEN-ATTACKE!"); return;
                }
            }
        }

        // Platforms
        let landed = false;
        let currentPlat = null;
        for (let p of level.platforms) {
            if (taxi.x + TAXI_W / 2 > p.x && taxi.x - TAXI_W / 2 < p.x + p.w && taxi.y + TAXI_H / 2 > p.y && taxi.y - TAXI_H / 2 < p.y + p.h) {
                if (speed > MAX_LANDING_SPD || Math.abs(taxi.angle) > 0.25) {
                    this.crash(); return;
                }

                taxi.y = p.y - TAXI_H / 2; taxi.vy = 0; taxi.vx = 0; taxi.angle = 0;
                landed = true; taxi.landedOn = p.id;
                currentPlat = p;

                if (p.fuel && this.state.fuel < 100) {
                    this.state.fuel = Math.min(100, this.state.fuel + 0.5);
                    this.state.cash = Math.max(0, this.state.cash - 0.1);
                    this.ui.setMessage("AUFTANKEN");
                    if (Math.random() > 0.8) this.audio.playSound(1200, 0.05, 'triangle', 0.02);
                }
            }
        }

        if (landed && this.state.fuel <= 0 && (!currentPlat || !currentPlat.fuel)) {
            this.crash("GESTRANDET!");
            return;
        }

        if (!landed) taxi.landedOn = null;
        else this.handlePassengerLogic();
    }

    handlePassengerLogic() {
        const { taxi, level, passengerIndex, activePassenger } = this.state;
        if (this.state.isTransitioning || passengerIndex >= level.passengers.length) return;

        const pass = level.passengers[passengerIndex];
        if (taxi.landedOn === pass.f && activePassenger?.state === 'WAITING') {
            activePassenger.state = 'IN_TAXI';
            this.audio.playSound(600, 0.22, 'sine', 0.1);

            const pickUpComments = [
                "[ flieg gefälligst schneller! ]",
                "[ ist das dein erstes mal? ]",
                "[ hoffentlich hast du 'ne lizenz.. ]",
                "[ ich zahl nicht für umwege! ]",
                "[ wehe ich krieg 'nen fleck auf's kostüm! ]",
                "[ ugh, diese billig-taxis schon wieder.. ]",
                "[ gib gas, meine pizza wird kalt! ]",
                "[ blick nach vorn, nicht in den spiegel! ]"
            ];
            const randomPickUp = pickUpComments[Math.floor(Math.random() * pickUpComments.length)];

            this.ui.setPassengerComment(randomPickUp, 1);
            this.ui.setTarget("P" + pass.t);
            this.ui.setMessage("ZIEL: P" + pass.t);
        } else if (taxi.landedOn === pass.t && activePassenger?.state === 'IN_TAXI') {
            activePassenger.state = 'DONE';
            this.state.cash += 100;
            this.audio.playSound(800, 0.35, 'sine', 0.1);

            const dropOffComments = [
                "[ gerade so überlebt.. ]",
                "[ behalt das wechselgeld nicht! ]",
                "[ fahrstil wie ein asteroid.. ]",
                "[ endlich raus aus der kiste! ]",
                "[ ein stern bei taxi-checker! ]",
                "[ trinkgeld? träum weiter! ]"
            ];
            const randomDropOff = dropOffComments[Math.floor(Math.random() * dropOffComments.length)];
            this.ui.setPassengerComment(randomDropOff, 1);

            this.state.passengerIndex++;

            if (this.state.passengerIndex < level.passengers.length) {
                setTimeout(() => this.initPassenger(), 1500);
            } else {
                this.state.isTransitioning = true;
                this.ui.setMessage("SEKTOR KLAR!");
                setTimeout(() => this.nextLevel(), 1500);
            }
        }
    }

    nextLevel() {
        this.state.currentLevelIdx++;
        if (this.state.currentLevelIdx >= levels.length) {
            this.state.gameState = 'SUCCESS';
            this.ui.showOverlay(
                `<span class="text-green-500 text-xl font-bold">LEGENDÄR!</span><br><br>GALAXY TAXI TYCOON STATUS ERREICHT.<br>KONTO: $${Math.floor(this.state.cash)}`,
                "NEUSTART"
            );
            this.state.currentLevelIdx = 0;
        } else {
            this.initLevel();
        }
    }

    crash(msg) {
        this.state.gameState = 'CRASHED';
        this.createExplosion(this.state.taxi.x, this.state.taxi.y);
        this.audio.playSound(100, 0.8, 'sawtooth', 0.5);

        const crashMsg = msg || (this.state.fuel <= 0 ? "TANK LEER!" : "TOTALSCHADEN!");
        this.ui.showOverlay(
            `<span class="text-red-500 text-xl font-bold">${crashMsg}</span><br><br>DER TAXIRAT IST EMPÖRT.<br>KONSTRUKTION FEHLERHAFT.`,
            "NOCHMAL"
        );
    }

    createExplosion(x, y) {
        for (let i = 0; i < 40; i++) {
            this.state.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                color: i % 2 === 0 ? '#ff5500' : '#ffffaa',
                size: 2 + Math.random() * 4
            });
        }
        this.state.shake = 25;
    }

    createThrustParticles(x, y, color, side = false) {
        this.state.particles.push({
            x, y,
            vx: side ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 4,
            vy: side ? (Math.random() - 0.5) * 2 : Math.random() * 4 + 2,
            life: 1.0, decay: 0.05,
            color, size: 4
        });
    }
}

// Start Game
new Game();

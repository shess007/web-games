class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.audio = new AudioEngine();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.ui = new UIManager();
        this.renderer.setMinimapContainer(this.ui.els.minimap);

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

        this.ambienceStarted = false;

        // Controller support
        this.gamepad = null;
        this.gamepadDeadzone = 0.3;
        this.lastThrustVibration = 0;

        this.initEventListeners();
        this.initGamepad();
        this.handleResize();
    }

    initGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad connected: ${e.gamepad.id}`);
            this.gamepad = e.gamepad;
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log(`Gamepad disconnected: ${e.gamepad.id}`);
            this.gamepad = null;
        });
    }

    updateGamepad() {
        const pads = navigator.getGamepads();
        if (pads[0]) {
            this.gamepad = pads[0];
        }
    }

    getGamepadInput() {
        this.updateGamepad();
        const pad = this.gamepad;

        const input = {
            up: false,
            left: false,
            right: false,
            start: false
        };

        if (!pad) return input;

        // Left stick horizontal
        if (pad.axes[0] < -this.gamepadDeadzone) input.left = true;
        if (pad.axes[0] > this.gamepadDeadzone) input.right = true;

        // D-pad (buttons 12-15: up, down, left, right)
        if (pad.buttons[14]?.pressed) input.left = true;
        if (pad.buttons[15]?.pressed) input.right = true;
        if (pad.buttons[12]?.pressed) input.up = true;

        // A button (button 0) or left stick up for thrust
        if (pad.buttons[0]?.pressed) input.up = true;
        if (pad.axes[1] < -this.gamepadDeadzone) input.up = true;

        // Right trigger (button 7) or B button (button 2) also for thrust
        if (pad.buttons[7]?.pressed) input.up = true;

        // Start button (button 9) or A button for menu
        if (pad.buttons[9]?.pressed || pad.buttons[0]?.pressed) input.start = true;

        return input;
    }

    // ==================== VIBRATION SUPPORT ====================

    vibrate(options = {}) {
        this.updateGamepad();
        const pad = this.gamepad;
        if (!pad || !pad.vibrationActuator) return;

        const duration = options.duration ?? 200;
        const strongMagnitude = options.strongMagnitude ?? 0.5;
        const weakMagnitude = options.weakMagnitude ?? 0.5;

        pad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: duration,
            strongMagnitude: strongMagnitude,
            weakMagnitude: weakMagnitude
        }).catch(() => {
            // Silently ignore vibration errors (unsupported, etc.)
        });
    }

    vibrateExplosion() {
        this.vibrate({
            duration: 400,
            strongMagnitude: 1.0,
            weakMagnitude: 0.8
        });
    }

    vibrateLanding() {
        this.vibrate({
            duration: 100,
            strongMagnitude: 0.3,
            weakMagnitude: 0.1
        });
    }

    vibratePickup() {
        this.vibrate({
            duration: 150,
            strongMagnitude: 0.4,
            weakMagnitude: 0.3
        });
    }

    vibrateThrust() {
        this.vibrate({
            duration: 50,
            strongMagnitude: 0.1,
            weakMagnitude: 0.15
        });
    }

    vibrateFuelLow() {
        this.vibrate({
            duration: 300,
            strongMagnitude: 0.6,
            weakMagnitude: 0.4
        });
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
                    this.audio.setup();
                    this.initLevel();
                    this.gameLoop();
                });
            }
        };
        window.onkeyup = e => this.state.keys[e.code] = false;
        window.onresize = () => this.handleResize();

        this.ui.els.startBtn.onclick = () => this.startGame();

        // Check for gamepad start button when not playing
        this.lastGamepadStart = false;
        setInterval(() => {
            if (this.state.gameState !== 'PLAYING') {
                const gamepadInput = this.getGamepadInput();
                // Only trigger on button press (not hold)
                if (gamepadInput.start && !this.lastGamepadStart) {
                    this.startGame();
                }
                this.lastGamepadStart = gamepadInput.start;
            } else {
                this.lastGamepadStart = false;
            }
        }, 100);

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
        const isLandscape = window.innerWidth > window.innerHeight;
        const panelLeft = document.getElementById('panel-left');
        const panelRight = document.getElementById('panel-right');

        let sidebarsWidth = 0;
        if (isLandscape) {
            sidebarsWidth += panelLeft ? panelLeft.offsetWidth : 0;
            sidebarsWidth += panelRight ? panelRight.offsetWidth : 0;
        }

        const availableW = window.innerWidth - sidebarsWidth;
        const availableH = window.innerHeight;

        const scale = Math.min(availableW / WORLD_W, availableH / WORLD_H);

        this.canvas.width = WORLD_W;
        this.canvas.height = WORLD_H;
        this.canvas.style.width = (WORLD_W * scale) + 'px';
        this.canvas.style.height = (WORLD_H * scale) + 'px';

        const container = document.getElementById('game-container');
        if (container) {
            container.style.width = (WORLD_W * scale) + 'px';
            container.style.height = (WORLD_H * scale) + 'px';
        }
    }

    startGame() {
        this.audio.setup();
        this.ui.hideOverlay();
        if (this.state.gameState === 'SUCCESS' || (this.state.gameState === 'CRASHED' && this.state.passengerIndex === 0)) {
            this.state.cash = 0;
        }
        this.state.gameState = 'PLAYING';
        this.initLevel();
        this.gameLoop();
    }

    initLevel() {
        // Generate level if needed
        if (this.state.currentLevelIdx >= levels.length) {
            const levelNum = this.state.currentLevelIdx + 1;
            const generatedLevel = levelGenerator.generate(levelNum);
            levels.push(generatedLevel);
        }

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

        if (level.enemies) {
            level.enemies.forEach(e => {
                e.centerX = e.x;
                e.centerY = e.y;
                e.angle = Math.random() * Math.PI * 2;
            });
        }

        this.renderer.initStars(level);
        this.initPassenger();

        // Update level display
        this.ui.setLevelDisplay(this.state.currentLevelIdx + 1);
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
        const destPlat = level.platforms.find(p => p.id === pass.t);

        this.state.activePassenger = {
            state: 'WAITING',
            x: startPlat.x + startPlat.w / 2,
            y: startPlat.y - 5,
            character: pass.character,
            fromName: pass.fromName || startPlat.name,
            toName: pass.toName || destPlat?.name
        };

        this.ui.updatePassCount(this.state.passengerIndex + 1, level.passengers.length);
        this.ui.setTarget(this.state.activePassenger.fromName || "PAD " + pass.f);
        this.ui.setMessage("GAST HOLEN: " + (this.state.activePassenger.character?.name || "Passagier"));
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

        // Get gamepad input
        const gamepadInput = this.getGamepadInput();

        // Combine keyboard and gamepad input
        const thrustUp = keys['ArrowUp'] || keys['KeyW'] || gamepadInput.up;
        const thrustLeft = keys['ArrowLeft'] || keys['KeyA'] || gamepadInput.left;
        const thrustRight = keys['ArrowRight'] || keys['KeyD'] || gamepadInput.right;
        const anyThrust = (thrustUp || thrustLeft || thrustRight) && this.state.fuel > 0;

        this.audio.updateEngineSound(anyThrust, thrustUp, thrustLeft || thrustRight);

        // Throttled thrust vibration (every 120ms while thrusting)
        if (anyThrust) {
            const now = Date.now();
            if (now - this.lastThrustVibration > 120) {
                this.vibrateThrust();
                this.lastThrustVibration = now;
            }
        }

        if (this.state.fuel > 0) {
            if (thrustUp) {
                taxi.vy -= 0.24;
                this.state.fuel -= 0.18;
                this.createThrustParticles(taxi.x, taxi.y + 10, '#ffff55');
                this.state.shake = Math.max(this.state.shake, 1.5);
            }
            if (thrustLeft) {
                taxi.vx -= 0.19;
                this.state.fuel -= 0.07;
                taxi.angle = -0.15;
                this.createThrustParticles(taxi.x + 15, taxi.y, '#00ffff', true);
            }
            else if (thrustRight) {
                taxi.vx += 0.19;
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
                this.vibrateFuelLow();
            }
        }

        taxi.vy += 0.04; taxi.vx *= 0.98; taxi.vy *= 0.98;
        taxi.x += taxi.vx; taxi.y += taxi.vy;

        if (this.state.shake > 0) this.state.shake *= 0.9;
        this.state.camera.x = Math.max(0, Math.min(taxi.x - WORLD_W / 2, level.w - WORLD_W));
        this.state.camera.y = Math.max(0, Math.min(taxi.y - WORLD_H / 2, level.h - WORLD_H));

        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);

        // Automatic Landing Gear Logic
        let nearPlatform = false;
        for (let p of level.platforms) {
            const dist = Math.sqrt(Math.pow(taxi.x - (p.x + p.w / 2), 2) + Math.pow(taxi.y - p.y, 2));
            if (dist < 100) {
                nearPlatform = true;
                break;
            }
        }
        taxi.gearOut = nearPlatform;

        // Update Enemies (Level 2 specific)
        if (level.enemies) {
            level.enemies.forEach(e => {
                e.angle = (e.angle || 0) + e.speed;
                e.x = e.centerX + Math.cos(e.angle) * e.r;
                e.y = e.centerY + Math.sin(e.angle) * e.r;
            });
        }

        // Collisions
        this.checkCollisions(speed);

        // Particles with enhanced physics
        for (let i = this.state.particles.length - 1; i >= 0; i--) {
            const p = this.state.particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Apply gravity to debris particles
            if (p.gravity) {
                p.vy += 0.1;
            }

            // Air resistance
            p.vx *= 0.98;
            p.vy *= 0.98;

            p.life -= p.decay;
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
            this.ui.updatePassengerAvatar(this.state.activePassenger.character);
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
                const dx = taxi.x - e.x;
                const dy = taxi.y - e.y;
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

                // Vibrate on first landing contact
                if (!taxi.landedOn) {
                    this.vibrateLanding();
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
            this.vibratePickup();
            this.renderer.flash('#00ffaa', 0.4); // Cyan-green flash for pickup

            // Get personality-based pickup comment
            const personality = activePassenger.character?.personality || 'casual';
            const pickupComments = PASSENGER_COMMENTS.pickup[personality] || PASSENGER_COMMENTS.pickup.casual;
            const randomPickUp = "[ " + pickupComments[Math.floor(Math.random() * pickupComments.length)] + " ]";

            this.ui.setPassengerComment(randomPickUp, 1);
            this.ui.setTarget(activePassenger.toName || "PAD " + pass.t);
            this.ui.setMessage("ZIEL: " + (activePassenger.toName || "PAD " + pass.t));
        } else if (taxi.landedOn === pass.t && activePassenger?.state === 'IN_TAXI') {
            activePassenger.state = 'DONE';
            this.state.cash += 100;
            this.audio.playSound(800, 0.35, 'sine', 0.1);
            this.vibratePickup();
            this.renderer.flash('#ffdd00', 0.5); // Gold flash for dropoff + cash

            // Get personality-based dropoff comment
            const personality = activePassenger.character?.personality || 'casual';
            const dropoffComments = PASSENGER_COMMENTS.dropoff[personality] || PASSENGER_COMMENTS.dropoff.casual;
            const randomDropOff = "[ " + dropoffComments[Math.floor(Math.random() * dropoffComments.length)] + " ]";
            this.ui.setPassengerComment(randomDropOff, 1);

            this.state.passengerIndex++;

            if (this.state.passengerIndex < level.passengers.length) {
                setTimeout(() => this.initPassenger(), 1500);
            } else {
                this.state.isTransitioning = true;
                this.ui.setMessage("SEKTOR KLAR!");
                this.renderer.flash('#ffffff', 0.7); // Bright white flash for level complete
                setTimeout(() => this.nextLevel(), 1500);
            }
        }
    }

    nextLevel() {
        this.state.currentLevelIdx++;
        this.initLevel();
    }

    crash(msg) {
        this.state.gameState = 'CRASHED';
        this.createExplosion(this.state.taxi.x, this.state.taxi.y);
        this.audio.playSound(100, 0.8, 'sawtooth', 0.5);
        this.vibrateExplosion();

        const crashMsg = msg || (this.state.fuel <= 0 ? "TANK LEER!" : "TOTALSCHADEN!");
        this.ui.showOverlay(
            `<span class="text-red-500 text-xl font-bold">${crashMsg}</span><br><br>DER TAXIRAT IST EMPÖRT.<br>KONSTRUKTION FEHLERHAFT.`,
            "NOCHMAL"
        );
    }

    createExplosion(x, y) {
        // Main explosion particles - fiery core
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 10;
            this.state.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                color: ['#ff5500', '#ff8800', '#ffaa00', '#ffffaa', '#ffffff'][Math.floor(Math.random() * 5)],
                size: 3 + Math.random() * 6
            });
        }

        // Spark particles - fast moving small pieces
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 15;
            this.state.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.04,
                color: '#ffffff',
                size: 1 + Math.random() * 2
            });
        }

        // Debris particles - larger, slower, gravity-affected
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            this.state.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1.0,
                decay: 0.005 + Math.random() * 0.01,
                color: ['#fbbf24', '#d97706', '#444444'][Math.floor(Math.random() * 3)],
                size: 4 + Math.random() * 6,
                gravity: true
            });
        }

        // Smoke particles - slow rising dark particles
        for (let i = 0; i < 20; i++) {
            this.state.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: -0.5 - Math.random() * 1.5,
                life: 1.0,
                decay: 0.008 + Math.random() * 0.01,
                color: '#333333',
                size: 8 + Math.random() * 12
            });
        }

        this.state.shake = 35;
    }

    createThrustParticles(x, y, color, side = false) {
        // Main thrust particle
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            this.state.particles.push({
                x: x + (Math.random() - 0.5) * 6,
                y: y + (Math.random() - 0.5) * 4,
                vx: side ? (Math.random() - 0.5) * 3 : (Math.random() - 0.5) * 5,
                vy: side ? (Math.random() - 0.5) * 3 : Math.random() * 5 + 3,
                life: 1.0,
                decay: 0.04 + Math.random() * 0.03,
                color,
                size: 3 + Math.random() * 3
            });
        }

        // Add occasional spark
        if (Math.random() > 0.7) {
            this.state.particles.push({
                x, y,
                vx: side ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 10,
                vy: side ? (Math.random() - 0.5) * 8 : Math.random() * 8 + 4,
                life: 1.0,
                decay: 0.08,
                color: '#ffffff',
                size: 1 + Math.random()
            });
        }
    }
}

// Start Game
new Game();

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.audio = new AudioEngine();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.ui = new UIManager();
        this.renderer.setMinimapContainer(this.ui.els.minimap);

        this.state = {
            gameState: 'START', // START, PLAYING, CONTRACT_SELECT, SECTOR_TRANSITION, DEAD, VICTORY, BASE

            // Run state
            run: {
                currentSector: 0,
                hull: ROGUELIKE.maxHull,
                cash: 0,
                passengersDelivered: 0,
                startTime: null,
                deathReason: null,
                wallBumps: 0, // For VIP contract tracking
                maxSpeedReached: 0
            },

            // Sector state
            level: null,
            activeModifiers: [],
            modifierState: {
                gravityPhase: 0
            },

            // Contract state
            availableContracts: [],
            activeContract: null,
            contractTimer: null,
            contractStartTime: null,

            // Passenger state
            passengerIndex: 0,
            activePassenger: null,

            // Physics state
            fuel: 100,
            taxi: { x: 100, y: 100, vx: 0, vy: 0, angle: 0, landedOn: null },
            camera: { x: 0, y: 0 },
            particles: [],
            shake: 0,
            keys: {},

            // UI state
            fuelAlertTriggered: false,
            chatterTimer: Math.random() * 500 + 500
        };

        this.gamepad = null;
        this.gamepadDeadzone = 0.3;
        this.lastThrustVibration = 0;
        this.contractSelectionTimer = null;

        // Gamepad navigation state
        this.selectedContractIndex = 0;
        this.lastGamepadLeft = false;
        this.lastGamepadRight = false;
        this.lastGamepadConfirm = false;

        this.initEventListeners();
        this.initGamepad();
        this.handleResize();

        // PixiJS particle renderer (POC)
        this.pixiParticles = null;
        this.initPixiParticles();
        this.initBenchmarkPanel();
    }

    // ==================== PIXI PARTICLE RENDERER (POC) ====================

    initPixiParticles() {
        if (typeof PixiParticleRenderer !== 'undefined') {
            this.pixiParticles = new PixiParticleRenderer(this.canvas);
            console.log('[Game] PixiJS particle renderer initialized');
        } else {
            console.warn('[Game] PixiJS particle renderer not available');
        }
    }

    initBenchmarkPanel() {
        const panel = document.getElementById('benchmark-panel');
        const toggleBtn = document.getElementById('bench-toggle');
        const stressBtn = document.getElementById('bench-stress');
        const stress10kBtn = document.getElementById('bench-stress-10k');

        if (!panel) return;

        // Toggle panel with 'B' key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'b' || e.key === 'B') {
                panel.classList.toggle('hidden');
            }
            // Toggle PixiJS with 'P' key
            if (e.key === 'p' || e.key === 'P') {
                this.togglePixiRenderer();
            }
            // Stress test with 'S' key
            if (e.key === 's' || e.key === 'S') {
                if (e.shiftKey) {
                    this.startStressTest(10000);
                } else {
                    this.startStressTest(5000);
                }
            }
        });

        // Button handlers
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePixiRenderer());
        }
        if (stressBtn) {
            stressBtn.addEventListener('click', () => this.startStressTest(5000));
        }
        if (stress10kBtn) {
            stress10kBtn.addEventListener('click', () => this.startStressTest(10000));
        }
    }

    togglePixiRenderer() {
        if (this.pixiParticles) {
            const enabled = this.pixiParticles.toggle();
            this.updateBenchmarkPanel();
        }
    }

    startStressTest(count) {
        if (this.pixiParticles) {
            if (this.pixiParticles.stressTestMode) {
                this.pixiParticles.stopStressTest();
            } else {
                this.pixiParticles.startStressTest(count);
            }
        }
    }

    updateBenchmarkPanel() {
        const rendererEl = document.getElementById('bench-renderer');
        const particlesEl = document.getElementById('bench-particles');
        const trailsEl = document.getElementById('bench-trails');
        const drawTimeEl = document.getElementById('bench-draw-time');
        const fpsEl = document.getElementById('bench-fps');

        if (!rendererEl) return;

        if (this.pixiParticles && this.pixiParticles.enabled) {
            const stats = this.pixiParticles.getStats();
            rendererEl.textContent = 'PixiJS (WebGL)';
            rendererEl.className = 'text-right text-green-400';
            particlesEl.textContent = stats.particleCount;
            trailsEl.textContent = stats.trailCount;
            drawTimeEl.textContent = stats.drawTime.toFixed(2) + 'ms';
            fpsEl.textContent = stats.fps;
        } else {
            rendererEl.textContent = 'Canvas 2D';
            rendererEl.className = 'text-right text-yellow-400';
            particlesEl.textContent = this.state.particles?.length || 0;
            trailsEl.textContent = this.renderer.particleTrails?.length || 0;
            drawTimeEl.textContent = '-';
            fpsEl.textContent = '-';
        }
    }

    // ==================== INITIALIZATION ====================

    initGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
        });
        window.addEventListener('gamepaddisconnected', () => {
            this.gamepad = null;
        });
    }

    updateGamepad() {
        const pads = navigator.getGamepads();
        if (pads[0]) this.gamepad = pads[0];
    }

    getGamepadInput() {
        this.updateGamepad();
        const pad = this.gamepad;
        const input = { up: false, left: false, right: false, start: false, confirm: false };
        if (!pad) return input;

        if (pad.axes[0] < -this.gamepadDeadzone) input.left = true;
        if (pad.axes[0] > this.gamepadDeadzone) input.right = true;
        if (pad.buttons[14]?.pressed) input.left = true;
        if (pad.buttons[15]?.pressed) input.right = true;
        if (pad.buttons[12]?.pressed) input.up = true;
        if (pad.buttons[0]?.pressed) input.up = true;
        if (pad.axes[1] < -this.gamepadDeadzone) input.up = true;
        if (pad.buttons[7]?.pressed) input.up = true;
        if (pad.buttons[9]?.pressed) input.start = true;
        if (pad.buttons[0]?.pressed) input.confirm = true;

        return input;
    }

    vibrate(options = {}) {
        this.updateGamepad();
        const pad = this.gamepad;
        if (!pad || !pad.vibrationActuator) return;
        pad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: options.duration ?? 200,
            strongMagnitude: options.strongMagnitude ?? 0.5,
            weakMagnitude: options.weakMagnitude ?? 0.5
        }).catch(() => {});
    }

    vibrateExplosion() { this.vibrate({ duration: 400, strongMagnitude: 1.0, weakMagnitude: 0.8 }); }
    vibrateLanding() { this.vibrate({ duration: 100, strongMagnitude: 0.3, weakMagnitude: 0.1 }); }
    vibratePickup() { this.vibrate({ duration: 150, strongMagnitude: 0.4, weakMagnitude: 0.3 }); }
    vibrateThrust() { this.vibrate({ duration: 50, strongMagnitude: 0.1, weakMagnitude: 0.15 }); }
    vibrateDamage() { this.vibrate({ duration: 200, strongMagnitude: 0.8, weakMagnitude: 0.6 }); }

    initEventListeners() {
        window.onkeydown = e => {
            this.state.keys[e.code] = true;
            // Number keys for contract selection
            if (this.state.gameState === 'CONTRACT_SELECT') {
                if (e.code === 'Digit1' && this.state.availableContracts[0]) this.selectContract(0);
                if (e.code === 'Digit2' && this.state.availableContracts[1]) this.selectContract(1);
                if (e.code === 'Digit3' && this.state.availableContracts[2]) this.selectContract(2);
            }
        };
        window.onkeyup = e => this.state.keys[e.code] = false;
        window.onresize = () => this.handleResize();

        this.ui.els.startBtn.onclick = () => this.startRun();

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.onclick = () => this.startRun();

        // Base port buttons
        const startShiftBtn = document.getElementById('start-shift-btn');
        if (startShiftBtn) startShiftBtn.onclick = () => this.startNewShift();

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) quitBtn.onclick = () => this.quitToStart();

        this.lastGamepadStart = false;
        setInterval(() => {
            const gamepadInput = this.getGamepadInput();

            if (this.state.gameState === 'START' || this.state.gameState === 'DEAD' || this.state.gameState === 'VICTORY') {
                if (gamepadInput.start && !this.lastGamepadStart) {
                    this.startRun();
                }
                this.lastGamepadStart = gamepadInput.start;
            } else if (this.state.gameState === 'BASE') {
                if (gamepadInput.start && !this.lastGamepadStart) {
                    // Only start new shift if player has hull
                    if (this.state.run.hull > 0) {
                        this.startNewShift();
                    }
                }
                this.lastGamepadStart = gamepadInput.start;
            } else if (this.state.gameState === 'CONTRACT_SELECT') {
                const numContracts = this.state.availableContracts.length;

                // Navigate left
                if (gamepadInput.left && !this.lastGamepadLeft) {
                    this.selectedContractIndex = (this.selectedContractIndex - 1 + numContracts) % numContracts;
                    this.ui.highlightContract(this.selectedContractIndex);
                }
                this.lastGamepadLeft = gamepadInput.left;

                // Navigate right
                if (gamepadInput.right && !this.lastGamepadRight) {
                    this.selectedContractIndex = (this.selectedContractIndex + 1) % numContracts;
                    this.ui.highlightContract(this.selectedContractIndex);
                }
                this.lastGamepadRight = gamepadInput.right;

                // Confirm selection
                if (gamepadInput.confirm && !this.lastGamepadConfirm) {
                    if (this.state.availableContracts[this.selectedContractIndex]) {
                        this.selectContract(this.selectedContractIndex);
                    }
                }
                this.lastGamepadConfirm = gamepadInput.confirm;
            }
        }, 100);

        if (this.ui.els.fullscreenBtn) {
            this.ui.els.fullscreenBtn.onclick = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
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
        const panelLeft = document.getElementById('panel-left');
        const panelRight = document.getElementById('panel-right');
        let sidebarsWidth = 0;
        if (window.innerWidth > window.innerHeight) {
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

    // ==================== RUN MANAGEMENT ====================

    startRun() {
        this.audio.setup();
        this.ui.hideOverlay();
        this.ui.hideSummary();

        // Reset run state
        this.state.run = {
            currentSector: 0,
            hull: ROGUELIKE.maxHull,
            cash: 0,
            passengersDelivered: 0,
            startTime: Date.now(),
            deathReason: null,
            wallBumps: 0,
            maxSpeedReached: 0,
            baseFuel: ROGUELIKE.maxFuel  // Fuel reserve at base
        };

        // Go to base port first
        this.goToBase(false);
    }

    initSector(sectorIndex) {
        const level = sectorGenerator.generateSector(sectorIndex);
        if (!level) {
            this.victory();
            return;
        }

        this.state.level = level;
        this.state.activeModifiers = level.modifiers.map(m => MODIFIERS[m]);
        this.state.modifierState = { gravityPhase: 0 };
        this.state.passengerIndex = 0;
        this.state.activePassenger = null;
        this.state.activeContract = null;
        this.state.fuel = this.state.run.baseFuel;  // Use fuel from base reserve
        this.state.particles = [];
        this.state.shake = 0;
        this.state.fuelAlertTriggered = false;

        // Reset taxi position
        this.state.taxi = {
            x: level.spawn.x,
            y: level.spawn.y,
            vx: 0, vy: 0, angle: 0, landedOn: null
        };

        this.renderer.initStars(level);
        this.ui.updateSector(sectorIndex + 1, ROGUELIKE.totalSectors);
        this.ui.updateHull(this.state.run.hull, ROGUELIKE.maxHull);
        this.ui.updateModifiers(this.state.activeModifiers);
        this.ui.setMessage(level.sectorName);

        // Start passenger flow
        this.initPassenger();
    }

    nextSector() {
        this.state.run.currentSector++;
        if (this.state.run.currentSector >= ROGUELIKE.totalSectors) {
            this.victory();
        } else {
            this.initSector(this.state.run.currentSector);
        }
    }

    // ==================== PASSENGER & CONTRACT SYSTEM ====================

    initPassenger() {
        const level = this.state.level;
        if (!level || this.state.passengerIndex >= level.passengers.length) {
            // All passengers done - next sector
            this.ui.setMessage("SECTOR CLEAR!");
            this.renderer.flash('#ffffff', 0.7);
            setTimeout(() => this.nextSector(), 1500);
            return;
        }

        const pass = level.passengers[this.state.passengerIndex];
        const startPlat = level.platforms.find(p => p.id === pass.f);
        const destPlat = level.platforms.find(p => p.id === pass.t);

        this.state.activePassenger = {
            state: 'WAITING',
            x: startPlat.x + startPlat.w / 2,
            y: startPlat.y - 5,
            character: pass.character,
            fromName: pass.fromName || startPlat.name,
            toName: pass.toName || destPlat?.name,
            vipOnly: pass.vipOnly
        };

        this.ui.updateFareCount(this.state.passengerIndex + 1, level.passengers.length);
        this.ui.setTarget(this.state.activePassenger.fromName);
        this.ui.setMessage("PICKUP: " + (this.state.activePassenger.character?.name || "Passenger"));
    }

    showContractSelection() {
        const level = this.state.level;
        const sectorIdx = this.state.run.currentSector;
        const passenger = this.state.activePassenger;

        // Generate contracts
        let pool;
        if (passenger.vipOnly) {
            pool = ['vip'];
        } else {
            pool = CONTRACT_POOLS[sectorIdx + 1] || CONTRACT_POOLS[1];
        }

        // Pick random contracts from pool
        const numChoices = SECTOR_CONFIG[sectorIdx].contractChoices;
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        this.state.availableContracts = shuffled.slice(0, numChoices).map(type => ({
            type,
            ...CONTRACT_TYPES[type]
        }));

        this.state.gameState = 'CONTRACT_SELECT';
        this.selectedContractIndex = 0;
        this.ui.showContractSelection(this.state.availableContracts, (idx) => this.selectContract(idx));
        this.ui.highlightContract(0);

        // Auto-select timer
        this.contractSelectionTimer = setTimeout(() => {
            if (this.state.gameState === 'CONTRACT_SELECT') {
                this.selectContract(0);
            }
        }, ROGUELIKE.contractSelectionTime);
    }

    selectContract(index) {
        if (this.contractSelectionTimer) {
            clearTimeout(this.contractSelectionTimer);
            this.contractSelectionTimer = null;
        }

        const contract = this.state.availableContracts[index];
        if (!contract) return;

        this.state.activeContract = contract;
        this.state.run.wallBumps = 0;
        this.state.run.maxSpeedReached = 0;

        if (contract.timeLimit) {
            this.state.contractStartTime = Date.now();
        }

        this.state.activePassenger.state = 'IN_TAXI';
        this.state.gameState = 'PLAYING';

        this.ui.hideContractSelection();
        this.ui.showContractInfo(contract);
        this.ui.setTarget(this.state.activePassenger.toName);
        this.ui.setMessage("DEST: " + this.state.activePassenger.toName);

        // Personality comment
        const personality = this.state.activePassenger.character?.personality || 'casual';
        const comments = PASSENGER_COMMENTS.pickup[personality] || PASSENGER_COMMENTS.pickup.casual;
        const comment = "[ " + comments[Math.floor(Math.random() * comments.length)] + " ]";
        this.ui.setPassengerComment(comment);

        this.audio.playSound(600, 0.22, 'sine', 0.1);
        this.vibratePickup();
        this.renderer.flash('#00ffaa', 0.4);
    }

    completeDelivery() {
        const contract = this.state.activeContract;
        const passenger = this.state.activePassenger;
        let success = true;
        let payout = contract.payout;

        // Check contract requirements
        if (contract.timeLimit) {
            const elapsed = Date.now() - this.state.contractStartTime;
            if (elapsed > contract.timeLimit) {
                success = false;
                this.ui.setMessage("TIME EXPIRED!");
                payout = Math.floor(payout * 0.5);
            }
        }

        if (contract.noBumps && this.state.run.wallBumps > 0) {
            success = false;
            this.ui.setMessage("VIP DISPLEASED!");
            payout = Math.floor(payout * 0.5);
        }

        if (contract.maxSpeed && this.state.run.maxSpeedReached > contract.maxSpeed) {
            success = false;
            this.ui.setMessage("TOO FAST!");
            payout = Math.floor(payout * 0.5);
        }

        // Apply modifier bonus
        const luckyStars = this.state.activeModifiers.find(m => m.payoutMultiplier);
        if (luckyStars) {
            payout = Math.floor(payout * luckyStars.payoutMultiplier);
        }

        this.state.run.cash += payout;
        this.state.run.passengersDelivered++;

        // Dropoff comment
        const personality = passenger.character?.personality || 'casual';
        const comments = PASSENGER_COMMENTS.dropoff[personality] || PASSENGER_COMMENTS.dropoff.casual;
        const comment = "[ " + comments[Math.floor(Math.random() * comments.length)] + " ]";
        this.ui.setPassengerComment(comment);

        this.ui.setMessage(success ? `+$${payout}!` : `PARTIAL: +$${payout}`);
        this.audio.playSound(800, 0.35, 'sine', 0.1);
        this.vibratePickup();
        this.renderer.flash('#ffdd00', 0.5);

        this.state.activePassenger.state = 'DONE';
        this.state.activeContract = null;
        this.ui.hideContractInfo();

        this.state.passengerIndex++;
        setTimeout(() => this.initPassenger(), 1500);
    }

    // ==================== DAMAGE SYSTEM ====================

    takeDamage(amount, reason) {
        this.state.run.hull -= amount;
        this.vibrateDamage();
        this.renderer.flash('#ff0000', 0.6);
        this.state.shake = Math.max(this.state.shake, 20);

        this.ui.updateHull(this.state.run.hull, ROGUELIKE.maxHull);
        this.audio.playSound(150, 0.5, 'sawtooth', 0.3);

        if (this.state.run.hull <= 0) {
            this.state.run.deathReason = reason;
            this.die();
        }
    }

    die() {
        this.state.gameState = 'DEAD';
        this.createExplosion(this.state.taxi.x, this.state.taxi.y);
        this.vibrateExplosion();
        this.audio.playSound(100, 0.8, 'sawtooth', 0.5);

        setTimeout(() => {
            this.goToBase(false);
        }, 1500);
    }

    victory() {
        this.state.gameState = 'VICTORY';
        this.renderer.flash('#00ff00', 0.8);

        setTimeout(() => {
            this.goToBase(true);
        }, 1500);
    }

    showRunSummary(isVictory) {
        const run = this.state.run;
        const elapsed = Math.floor((Date.now() - run.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        const hullBonus = run.hull * 100;
        const finalScore = run.cash + hullBonus;

        this.ui.showSummary({
            isVictory,
            sector: run.currentSector + 1,
            totalSectors: ROGUELIKE.totalSectors,
            passengers: run.passengersDelivered,
            cash: run.cash,
            time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            hullBonus,
            finalScore,
            deathReason: run.deathReason
        });
    }

    // ==================== BASE PORT ====================

    goToBase(isVictory) {
        this.state.gameState = 'BASE';
        this.audio.switchMusic('base');

        // Save remaining fuel to base reserve (if any left from shift)
        if (this.state.fuel > 0) {
            this.state.run.baseFuel = Math.min(this.state.fuel, ROGUELIKE.maxFuel);
        }

        this.ui.showBase({
            cash: this.state.run.cash,
            hull: this.state.run.hull,
            maxHull: ROGUELIKE.maxHull,
            repairCost: ROGUELIKE.repairCost,
            isVictory: isVictory,
            deathReason: this.state.run.deathReason,
            fuel: this.state.run.baseFuel,
            maxFuel: ROGUELIKE.maxFuel,
            fuelPacks: ROGUELIKE.fuelPacks
        }, () => this.repairHull(), (packIndex) => this.buyFuel(packIndex));
    }

    buyFuel(packIndex) {
        const pack = ROGUELIKE.fuelPacks[packIndex];
        if (!pack) return;

        if (this.state.run.cash >= pack.cost && this.state.run.baseFuel < ROGUELIKE.maxFuel) {
            this.state.run.cash -= pack.cost;
            this.state.run.baseFuel = Math.min(this.state.run.baseFuel + pack.amount, ROGUELIKE.maxFuel);

            // Update UI
            this.ui.updateBaseFuel(
                this.state.run.baseFuel,
                ROGUELIKE.maxFuel,
                this.state.run.cash,
                ROGUELIKE.fuelPacks
            );
            this.ui.updateBaseHull(
                this.state.run.hull,
                ROGUELIKE.maxHull,
                this.state.run.cash,
                ROGUELIKE.repairCost
            );

            // Update cash display
            if (this.ui.els.baseCash) {
                this.ui.els.baseCash.textContent = this.state.run.cash;
            }
        }
    }

    repairHull() {
        if (this.state.run.hull < ROGUELIKE.maxHull &&
            this.state.run.cash >= ROGUELIKE.repairCost) {
            this.state.run.hull++;
            this.state.run.cash -= ROGUELIKE.repairCost;
            this.ui.updateBaseHull(
                this.state.run.hull,
                ROGUELIKE.maxHull,
                this.state.run.cash,
                ROGUELIKE.repairCost
            );

            // Also update fuel display (cash changed, so button states may change)
            this.ui.updateBaseFuel(
                this.state.run.baseFuel,
                ROGUELIKE.maxFuel,
                this.state.run.cash,
                ROGUELIKE.fuelPacks
            );

            // Update the taxi display to show repaired state
            this.ui.startTaxiAnimation(this.state.run.hull, ROGUELIKE.maxHull);

            // Check if game over state should be updated (player repaired and can now continue)
            const isGameOver = this.state.run.hull <= 0 && this.state.run.cash < ROGUELIKE.repairCost;
            if (!isGameOver && this.ui.els.startShiftBtn) {
                this.ui.els.startShiftBtn.style.display = 'flex';
            }
            if (!isGameOver && this.ui.els.baseGameOverMsg) {
                this.ui.els.baseGameOverMsg.classList.add('hidden');
            }

            this.audio.playSound(600, 0.2, 'sine', 0.1);
        }
    }

    startNewShift() {
        this.ui.hideBase();
        this.audio.switchMusic('shift');

        // Keep hull, cash, and fuel from previous run
        const preservedHull = this.state.run.hull;
        const preservedCash = this.state.run.cash;
        const preservedFuel = this.state.run.baseFuel;

        // Reset run state but preserve hull, cash, and fuel
        this.state.run = {
            currentSector: 0,
            hull: preservedHull,
            cash: preservedCash,
            passengersDelivered: 0,
            startTime: Date.now(),
            deathReason: null,
            wallBumps: 0,
            maxSpeedReached: 0,
            baseFuel: preservedFuel
        };

        this.state.gameState = 'PLAYING';
        this.initSector(0);
        this.gameLoop();
    }

    quitToStart() {
        this.ui.hideBase();
        this.ui.showOverlay(
            'Survive your shift.<br><br>' +
            '• 3 sectors • 3 lives •<br>' +
            '• Choose your contracts •<br>' +
            '• Reach the final fare •',
            false
        );
        this.state.gameState = 'START';
    }

    // ==================== GAME LOOP ====================

    gameLoop() {
        if (this.state.gameState !== 'PLAYING' && this.state.gameState !== 'CONTRACT_SELECT') return;

        if (this.state.gameState === 'PLAYING') {
            this.update();
        }

        this.renderer.draw(this.state);
        this.ui.updateMinimap(this.state, this.state.activeModifiers);

        // Sync particles to PixiJS renderer (POC)
        if (this.pixiParticles && this.pixiParticles.enabled) {
            if (this.pixiParticles.stressTestMode) {
                // Run stress test
                this.pixiParticles.updateStressTest(this.state.camera);
            } else {
                // Sync game particles
                this.pixiParticles.syncParticles(this.state.particles, this.state.camera);
                this.pixiParticles.syncTrails(this.renderer.particleTrails, this.state.camera);
            }
            this.updateBenchmarkPanel();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        const { taxi, level, keys } = this.state;
        if (!level) return;

        const gamepadInput = this.getGamepadInput();
        const thrustUp = keys['ArrowUp'] || keys['KeyW'] || gamepadInput.up;
        const thrustLeft = keys['ArrowLeft'] || keys['KeyA'] || gamepadInput.left;
        const thrustRight = keys['ArrowRight'] || keys['KeyD'] || gamepadInput.right;
        const anyThrust = (thrustUp || thrustLeft || thrustRight) && this.state.fuel > 0;

        this.audio.updateEngineSound(anyThrust, thrustUp, thrustLeft || thrustRight);

        if (anyThrust) {
            const now = Date.now();
            if (now - this.lastThrustVibration > 120) {
                this.vibrateThrust();
                this.lastThrustVibration = now;
            }
        }

        // Calculate thrust multiplier from modifiers
        let thrustMult = 1.0;
        const solarStorm = this.state.activeModifiers.find(m => m.thrustMultiplier);
        if (solarStorm) thrustMult = solarStorm.thrustMultiplier;

        // Calculate fuel drain multiplier
        let fuelDrainMult = 1.0;
        const fuelLeak = this.state.activeModifiers.find(m => m.fuelDrainMultiplier);
        if (fuelLeak) fuelDrainMult = fuelLeak.fuelDrainMultiplier;

        // Apply thrust
        if (this.state.fuel > 0) {
            if (thrustUp) {
                taxi.vy -= 0.24 * thrustMult;
                this.state.fuel -= 0.18 * fuelDrainMult;
                this.createThrustParticles(taxi.x, taxi.y + 10, '#ffff55');
                this.state.shake = Math.max(this.state.shake, 1.5);
            }
            if (thrustLeft) {
                taxi.vx -= 0.19 * thrustMult;
                this.state.fuel -= 0.07 * fuelDrainMult;
                taxi.angle = -0.15;
                this.createThrustParticles(taxi.x + 15, taxi.y, '#00ffff', true);
            } else if (thrustRight) {
                taxi.vx += 0.19 * thrustMult;
                this.state.fuel -= 0.07 * fuelDrainMult;
                taxi.angle = 0.15;
                this.createThrustParticles(taxi.x - 15, taxi.y, '#00ffff', true);
            } else {
                taxi.angle *= 0.85;
            }
        } else {
            taxi.angle *= 0.9;
            if (!this.state.fuelAlertTriggered) {
                this.state.fuelAlertTriggered = true;
                this.audio.playSound(350, 2.0, 'sine', 0.4, 10);
                this.ui.setMessage("FUEL EMPTY!");
                this.vibrateDamage();
            }
        }

        // Calculate gravity with modifier
        let gravity = 0.04;
        const gravityFlux = this.state.activeModifiers.find(m => m.gravityMin !== undefined);
        if (gravityFlux) {
            this.state.modifierState.gravityPhase += gravityFlux.cycleSpeed;
            const t = Math.sin(this.state.modifierState.gravityPhase);
            gravity = gravityFlux.gravityMin + (gravityFlux.gravityMax - gravityFlux.gravityMin) * ((t + 1) / 2);
        }

        // Apply drift from ion clouds
        const ionClouds = this.state.activeModifiers.find(m => m.driftStrength);
        if (ionClouds) {
            taxi.vx += (Math.random() - 0.5) * ionClouds.driftStrength;
            taxi.vy += (Math.random() - 0.5) * ionClouds.driftStrength;
        }

        // Apply solar storm shake
        const storm = this.state.activeModifiers.find(m => m.screenShake);
        if (storm) {
            this.state.shake = Math.max(this.state.shake, storm.screenShake);
        }

        // Physics
        taxi.vy += gravity;
        taxi.vx *= 0.98;
        taxi.vy *= 0.98;
        taxi.x += taxi.vx;
        taxi.y += taxi.vy;

        // Boundary constraints - keep taxi within level (invisible edges)
        const edgeMargin = TAXI_W / 2 + 5;
        if (taxi.x < edgeMargin) {
            taxi.x = edgeMargin;
            taxi.vx = Math.abs(taxi.vx) * 0.3; // Soft bounce
        } else if (taxi.x > level.w - edgeMargin) {
            taxi.x = level.w - edgeMargin;
            taxi.vx = -Math.abs(taxi.vx) * 0.3;
        }
        if (taxi.y < edgeMargin) {
            taxi.y = edgeMargin;
            taxi.vy = Math.abs(taxi.vy) * 0.3;
        } else if (taxi.y > level.h - edgeMargin) {
            taxi.y = level.h - edgeMargin;
            taxi.vy = -Math.abs(taxi.vy) * 0.3;
        }

        if (this.state.shake > 0) this.state.shake *= 0.9;
        this.state.camera.x = Math.max(0, Math.min(taxi.x - WORLD_W / 2, level.w - WORLD_W));
        this.state.camera.y = Math.max(0, Math.min(taxi.y - WORLD_H / 2, level.h - WORLD_H));

        const speed = Math.sqrt(taxi.vx * taxi.vx + taxi.vy * taxi.vy);
        this.state.run.maxSpeedReached = Math.max(this.state.run.maxSpeedReached, speed);

        // Landing gear
        let nearPlatform = false;
        for (let p of level.platforms) {
            const dist = Math.sqrt(Math.pow(taxi.x - (p.x + p.w / 2), 2) + Math.pow(taxi.y - p.y, 2));
            if (dist < 100) { nearPlatform = true; break; }
        }
        taxi.gearOut = nearPlatform;

        // Update enemies
        if (level.enemies) {
            level.enemies.forEach(e => {
                e.angle = (e.angle || 0) + e.speed;
                e.x = e.centerX + Math.cos(e.angle) * e.r;
                e.y = e.centerY + Math.sin(e.angle) * e.r;
            });
        }

        // Update asteroids (slow drift, wrap around)
        if (level.asteroids) {
            level.asteroids.forEach(a => {
                a.x += a.vx;
                a.y += a.vy;
                a.rotation += a.rotationSpeed;

                // Wrap around level edges
                if (a.x < -a.size) a.x = level.w + a.size;
                if (a.x > level.w + a.size) a.x = -a.size;
                if (a.y < -a.size) a.y = level.h + a.size;
                if (a.y > level.h + a.size) a.y = -a.size;
            });
        }

        // Update debris (drift and wrap)
        if (level.debris) {
            level.debris.forEach(d => {
                d.x += d.vx;
                d.y += d.vy;
                d.rotation += d.rotationSpeed;

                // Wrap around
                if (d.x < -20) d.x = level.w + 20;
                if (d.x > level.w + 20) d.x = -20;
                if (d.y < -20) d.y = level.h + 20;
                if (d.y > level.h + 20) d.y = -20;
            });
        }

        // Update meteors (fast, respawn when off-screen)
        if (level.meteors) {
            level.meteors.forEach((m, idx) => {
                m.x += m.vx;
                m.y += m.vy;
                m.rotation += m.rotationSpeed;

                // Add trail point
                m.trail.unshift({ x: m.x, y: m.y, life: 1.0 });
                if (m.trail.length > 15) m.trail.pop();
                m.trail.forEach(t => t.life -= 0.07);

                // Respawn if off-screen
                const margin = 100;
                if (m.x < -margin || m.x > level.w + margin ||
                    m.y < -margin || m.y > level.h + margin) {
                    level.meteors[idx] = sectorGenerator.spawnMeteor(level.w, level.h);
                }
            });
        }

        // Collisions
        this.checkCollisions(speed);

        // Particles
        for (let i = this.state.particles.length - 1; i >= 0; i--) {
            const p = this.state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += 0.1;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= p.decay;
            if (p.life <= 0) this.state.particles.splice(i, 1);
        }

        // Update HUD
        this.ui.updateHUD(this.state, speed);

        // Contract timer
        if (this.state.activeContract?.timeLimit && this.state.contractStartTime) {
            const remaining = Math.max(0, this.state.activeContract.timeLimit - (Date.now() - this.state.contractStartTime));
            this.ui.updateContractTimer(Math.ceil(remaining / 1000));
        }

        // Radio chatter
        if (this.state.chatterTimer > 0) {
            this.state.chatterTimer--;
        } else {
            const chat = radioChatter[Math.floor(Math.random() * radioChatter.length)];
            this.ui.showRadioChatter(chat);
            this.state.chatterTimer = 600 + Math.random() * 1000;
        }

        // Passenger avatar
        if (this.state.activePassenger?.state === 'IN_TAXI') {
            this.ui.updatePassengerAvatar(this.state.activePassenger.character);
        } else {
            this.ui.updatePassengerAvatar(null);
        }
    }

    checkCollisions(speed) {
        const { taxi, level } = this.state;

        // Asteroids - large rocks, 1 damage
        if (level.asteroids) {
            for (let a of level.asteroids) {
                const dx = taxi.x - a.x;
                const dy = taxi.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const collisionDist = a.size * 0.8 + 15; // Slightly forgiving hitbox

                if (dist < collisionDist) {
                    // Push taxi away from asteroid
                    const pushAngle = Math.atan2(dy, dx);
                    taxi.vx = Math.cos(pushAngle) * 3;
                    taxi.vy = Math.sin(pushAngle) * 3;

                    this.state.run.wallBumps++;
                    this.takeDamage(ROGUELIKE.wallDamage, "Asteroid collision");
                    return;
                }
            }
        }

        // Debris - small pieces, 1 damage but easier to avoid
        if (level.debris) {
            for (let d of level.debris) {
                const dx = taxi.x - d.x;
                const dy = taxi.y - d.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < d.size + 12) {
                    // Small bump
                    taxi.vx += (Math.random() - 0.5) * 2;
                    taxi.vy += (Math.random() - 0.5) * 2;

                    this.state.run.wallBumps++;
                    this.takeDamage(ROGUELIKE.wallDamage, "Space debris");
                    return;
                }
            }
        }

        // Meteors - fast and dangerous, 2 damage
        if (level.meteors) {
            for (let m of level.meteors) {
                const dx = taxi.x - m.x;
                const dy = taxi.y - m.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < m.size + 15) {
                    // Heavy impact
                    taxi.vx += m.vx * 0.5;
                    taxi.vy += m.vy * 0.5;

                    this.takeDamage(ROGUELIKE.enemyDamage, "Meteor strike");
                    return;
                }
            }
        }

        // Enemies
        if (level.enemies) {
            for (let e of level.enemies) {
                const dx = taxi.x - e.x;
                const dy = taxi.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < e.size + 10) {
                    this.takeDamage(ROGUELIKE.enemyDamage, "Enemy collision");
                    return;
                }
            }
        }

        // Platforms
        let landed = false;
        let currentPlat = null;
        for (let p of level.platforms) {
            if (taxi.x + TAXI_W / 2 > p.x && taxi.x - TAXI_W / 2 < p.x + p.w &&
                taxi.y + TAXI_H / 2 > p.y && taxi.y - TAXI_H / 2 < p.y + p.h) {

                // Check landing speed
                if (speed > ROGUELIKE.hardLandingSpeed) {
                    this.takeDamage(ROGUELIKE.hardLandingDamage, "Hard landing");
                    taxi.vy = -taxi.vy * 0.3;
                    return;
                }

                if (speed > MAX_LANDING_SPD || Math.abs(taxi.angle) > 0.25) {
                    // Bounce but don't damage for moderate speed
                    taxi.vy = -taxi.vy * 0.5;
                    this.vibrateLanding();
                    return;
                }

                if (!taxi.landedOn) {
                    this.vibrateLanding();
                }

                taxi.y = p.y - TAXI_H / 2;
                taxi.vy = 0;
                taxi.vx = 0;
                taxi.angle = 0;
                landed = true;
                taxi.landedOn = p.id;
                currentPlat = p;

                // Fuel station
                if (p.fuel && this.state.fuel < 100) {
                    this.state.fuel = Math.min(100, this.state.fuel + 0.5);
                    this.state.run.cash = Math.max(0, this.state.run.cash - ROGUELIKE.fuelCostPerFrame);
                    this.ui.setMessage("REFUELING");

                    // Repair option
                    if (this.state.run.hull < ROGUELIKE.maxHull && this.state.run.cash >= ROGUELIKE.repairCost) {
                        // Auto-repair one point
                        if (Math.random() < 0.01) { // Slow repair rate
                            this.state.run.hull++;
                            this.state.run.cash -= ROGUELIKE.repairCost;
                            this.ui.updateHull(this.state.run.hull, ROGUELIKE.maxHull);
                            this.ui.setMessage("HULL REPAIRED!");
                        }
                    }
                }
            }
        }

        if (landed && this.state.fuel <= 0 && (!currentPlat || !currentPlat.fuel)) {
            this.takeDamage(ROGUELIKE.maxHull, "Stranded without fuel");
            return;
        }

        if (!landed) taxi.landedOn = null;
        else this.handlePassengerLogic();
    }

    handlePassengerLogic() {
        const { taxi, level, passengerIndex, activePassenger } = this.state;
        if (!activePassenger || passengerIndex >= level.passengers.length) return;

        const pass = level.passengers[passengerIndex];

        // Pickup
        if (taxi.landedOn === pass.f && activePassenger.state === 'WAITING') {
            this.showContractSelection();
        }
        // Dropoff
        else if (taxi.landedOn === pass.t && activePassenger.state === 'IN_TAXI') {
            this.completeDelivery();
        }
    }

    // ==================== EFFECTS ====================

    createExplosion(x, y) {
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

        this.state.shake = 35;
    }

    createThrustParticles(x, y, color, side = false) {
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
    }
}

// Start Game
new Game();

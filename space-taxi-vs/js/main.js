class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = WORLD_W;
        this.canvas.height = WORLD_H;

        this.input = new InputManager();
        this.audio = new AudioEngine();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.projectiles = new ProjectileManager();
        this.barrier = new Barrier();

        this.players = [
            new Player(1, SPAWN_P1.x, SPAWN_P1.y),
            new Player(2, SPAWN_P2.x, SPAWN_P2.y)
        ];

        this.state = {
            roundState: 'MENU', // MENU, COUNTDOWN, PLAYING, ROUND_END, MATCH_END
            score: [0, 0],
            countdown: 0,
            roundEndTimer: 0,
            lastRoundWinner: null,
            shake: 0,
            shakeX: 0,  // Directional shake X
            shakeY: 0,  // Directional shake Y
            particles: []
        };

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        this.showMenu();
    }

    handleResize() {
        const container = document.getElementById('game-container');
        const availableW = window.innerWidth;
        const availableH = window.innerHeight;

        const scale = Math.min(availableW / WORLD_W, availableH / WORLD_H) * 0.95;

        this.canvas.style.width = (WORLD_W * scale) + 'px';
        this.canvas.style.height = (WORLD_H * scale) + 'px';

        if (container) {
            container.style.width = (WORLD_W * scale) + 'px';
            container.style.height = (WORLD_H * scale) + 'px';
        }
    }

    showMenu() {
        this.state.roundState = 'MENU';
        this.renderMenu();

        const waitForStart = () => {
            if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter') || this.input.isGamepadStartPressed()) {
                this.input.clearKey('Space');
                this.input.clearKey('Enter');
                this.startMatch();
            } else {
                requestAnimationFrame(waitForStart);
            }
        };
        waitForStart();
    }

    renderMenu() {
        const { ctx } = this;

        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // Draw some stars
        this.renderer.drawStars(ctx);

        // Title
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE TAXI', WORLD_W / 2, 120);

        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('vs', WORLD_W / 2, 160);

        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('SPACE UBER', WORLD_W / 2, 200);

        // Instructions
        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText('2 PLAYER ARENA BATTLE', WORLD_W / 2, 280);

        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.fillText('PLAYER 1: WASD + SPACE', WORLD_W / 2, 330);
        ctx.fillText('PLAYER 2: ARROWS + ENTER', WORLD_W / 2, 350);

        ctx.fillStyle = '#555';
        ctx.fillText('GAMEPAD: STICK/DPAD + A=THRUST  B/RT=SHOOT', WORLD_W / 2, 380);

        ctx.fillStyle = '#aaa';
        ctx.font = '16px monospace';
        ctx.fillText(`FIRST TO ${ROUNDS_TO_WIN} WINS`, WORLD_W / 2, 440);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('PRESS START OR A TO BEGIN', WORLD_W / 2, 500);

        // Draw sample ships
        ctx.save();
        ctx.translate(200, 260);
        this.drawSampleShip(ctx, COLORS.p1, 'P1');
        ctx.restore();

        ctx.save();
        ctx.translate(600, 260);
        this.drawSampleShip(ctx, COLORS.p2, 'P2');
        ctx.restore();
    }

    drawSampleShip(ctx, colors, label) {
        // Original Space Taxi style (rectangle)
        ctx.fillStyle = colors.body;
        ctx.fillRect(-15, -10, 30, 16);

        // Shadow/underside
        ctx.fillStyle = colors.shadow;
        ctx.fillRect(-15, 0, 30, 6);

        // Cockpit window (colored to distinguish players)
        ctx.fillStyle = colors.cockpit;
        ctx.fillRect(2, -7, 10, 5);

        // Landing gear
        ctx.fillStyle = colors.gear;
        ctx.fillRect(-12, 6, 6, 4);
        ctx.fillRect(6, 6, 6, 4);

        // Label
        ctx.fillStyle = colors.cockpit;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, -18);
    }

    startMatch() {
        this.audio.init();
        this.state.score = [0, 0];
        this.startRound(true); // true = first round, start game loop
    }

    startRound(firstRound = false) {
        // Reset players
        this.players.forEach(p => p.reset());

        // Reset barrier
        this.barrier.reset();

        // Clear projectiles and particles
        this.projectiles.clear();
        this.state.particles = [];
        this.state.shake = 0;
        this.state.shakeX = 0;
        this.state.shakeY = 0;

        // Reset renderer state
        this.renderer.reset();

        // Start countdown
        this.state.roundState = 'COUNTDOWN';
        this.state.countdown = ROUND_START_DELAY;

        // Only start game loop on first round (it keeps running between rounds)
        if (firstRound) {
            this.gameLoop();
        }
    }

    gameLoop() {
        this.update();
        this.render();

        if (this.state.roundState !== 'MENU' && this.state.roundState !== 'MATCH_END') {
            requestAnimationFrame(() => this.gameLoop());
        } else if (this.state.roundState === 'MATCH_END') {
            // Wait for restart
            const waitForRestart = () => {
                if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter') || this.input.isGamepadStartPressed()) {
                    this.input.clearKey('Space');
                    this.input.clearKey('Enter');
                    this.startMatch();
                } else {
                    this.render();
                    requestAnimationFrame(waitForRestart);
                }
            };
            waitForRestart();
        }
    }

    update() {
        switch (this.state.roundState) {
            case 'COUNTDOWN':
                this.updateCountdown();
                break;
            case 'PLAYING':
                this.updatePlaying();
                break;
            case 'ROUND_END':
                this.updateRoundEnd();
                break;
        }

        // Always update particles
        this.updateParticles();

        // Update shake (intensity and directional)
        if (this.state.shake > 0) {
            this.state.shake *= 0.9;
        }
        this.state.shakeX *= 0.85;
        this.state.shakeY *= 0.85;
    }

    updateCountdown() {
        this.state.countdown--;
        if (this.state.countdown <= 0) {
            this.state.roundState = 'PLAYING';
        }
    }

    updatePlaying() {
        // Update barrier scroll
        this.barrier.update();

        // Get input and update players
        this.players.forEach((player, index) => {
            const input = this.input.getPlayerInput(index + 1);

            // Handle shooting
            if (input.shoot && player.canShoot()) {
                const projectileData = player.shoot();
                this.projectiles.add(projectileData);
                this.audio.playShoot(index);
                this.input.vibrateShoot(index + 1);

                // Directional recoil shake (opposite to shot direction)
                const recoilDir = player.x < WORLD_W / 2 ? -1 : 1;
                this.state.shakeX += recoilDir * 4;
                this.state.shakeY += (Math.random() - 0.5) * 2;
            }

            player.update(input);

            // Update engine sound
            this.audio.updateEngineSound(index, player.thrusting);

            // Check platform landing
            const platform = player.checkPlatformCollision();
            let isReloading = false;

            if (platform) {
                if (platform.type === 'crash') {
                    // Crashed into floor too fast
                    player.die();
                    this.audio.playExplosion();
                    this.input.vibrateExplosion(index + 1);
                    this.createExplosion(player.x, player.y);
                } else if (platform.type === 'fuel') {
                    // Vibrate on first landing
                    if (!player._wasLanded) {
                        this.input.vibrateLanding(index + 1);
                    }
                    if (player.refuel(FUEL_REFILL_RATE)) {
                        if (Math.random() < 0.1) this.audio.playRefuel();
                    }
                } else if (platform.type === 'ammo') {
                    // Vibrate on first landing
                    if (!player._wasLanded) {
                        this.input.vibrateLanding(index + 1);
                    }
                    // Reload ammo - only play sound if not fully loaded
                    if (player.ammo < MAX_AMMO && player.reload(AMMO_REFILL_RATE)) {
                        isReloading = true;
                    }
                }
            }

            // Track landing state for vibration
            player._wasLanded = player.landedOn !== null;

            // Update reload sound (continuous tone while on ammo platform)
            this.audio.updateReloadSound(index, isReloading);

            // Create thrust particles
            if (player.thrusting && player.fuel > 0) {
                this.createThrustParticles(player);
            }

            // Check barrier collision
            if (this.barrier.checkPlayerCollision(player)) {
                player.die();
                this.audio.playExplosion();
                this.input.vibrateExplosion(index + 1);
                this.createExplosion(player.x, player.y);
            }
        });

        // Update projectiles
        this.projectiles.update();

        // Check projectile collisions
        this.projectiles.checkCollisions(
            this.players,
            this.barrier,
            this.audio,
            (x, y, playerNum) => {
                this.createExplosion(x, y);
                if (playerNum) this.input.vibrateExplosion(playerNum);
            },
            (x, y, radius, destroyed) => this.createAsteroidDebris(x, y, radius, destroyed)
        );

        // Check for round end
        const alivePlayers = this.players.filter(p => p.alive);
        if (alivePlayers.length <= 1) {
            this.endRound();
        }
    }

    updateRoundEnd() {
        this.state.roundEndTimer--;
        if (this.state.roundEndTimer <= 0) {
            // Check for match end
            if (this.state.score[0] >= ROUNDS_TO_WIN || this.state.score[1] >= ROUNDS_TO_WIN) {
                this.state.roundState = 'MATCH_END';
                this.audio.playMatchWin();
            } else {
                this.startRound();
            }
        }
    }

    endRound() {
        // Determine winner
        if (this.players[0].alive && !this.players[1].alive) {
            this.state.score[0]++;
            this.state.lastRoundWinner = 0;
        } else if (!this.players[0].alive && this.players[1].alive) {
            this.state.score[1]++;
            this.state.lastRoundWinner = 1;
        } else {
            // Both dead - no score change, random last winner for display
            this.state.lastRoundWinner = Math.random() < 0.5 ? 0 : 1;
        }

        this.state.roundState = 'ROUND_END';
        this.state.roundEndTimer = ROUND_END_DELAY;
        this.audio.playRoundWin();
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
        this.state.shake = 20;
    }

    createAsteroidDebris(x, y, radius, destroyed) {
        // Number of particles based on asteroid size and whether it was destroyed
        const baseCount = destroyed ? 20 : 8;
        const count = Math.floor(baseCount * (radius / 25));

        // Rock colors - browns and grays
        const colors = ['#8b7355', '#6b5344', '#5a4a3a', '#7a6a5a', '#9a8a7a', '#4a3a2a'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = destroyed ? (2 + Math.random() * 6) : (1 + Math.random() * 3);

            this.state.particles.push({
                x: x + (Math.random() - 0.5) * radius,
                y: y + (Math.random() - 0.5) * radius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: destroyed ? 0.015 : 0.03,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: destroyed ? (2 + Math.random() * 5) : (1 + Math.random() * 3),
                isRock: true  // Flag for special rendering
            });
        }

        // Add dust cloud for destroyed asteroids
        if (destroyed) {
            for (let i = 0; i < 10; i++) {
                this.state.particles.push({
                    x: x + (Math.random() - 0.5) * radius * 0.5,
                    y: y + (Math.random() - 0.5) * radius * 0.5,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 0.8,
                    decay: 0.02,
                    color: '#aa9988',
                    size: 6 + Math.random() * 8,
                    isDust: true
                });
            }

            // Small screen shake for destroyed asteroid
            this.state.shake = Math.max(this.state.shake, radius * 0.2);
        }
    }

    createThrustParticles(player) {
        const colors = player.playerNum === 1 ? COLORS.p1 : COLORS.p2;
        this.state.particles.push({
            x: player.x,
            y: player.y + PLAYER_H / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 3 + 1,
            life: 1.0,
            decay: 0.05,
            color: colors.thrust,
            size: 3
        });
    }

    updateParticles() {
        for (let i = this.state.particles.length - 1; i >= 0; i--) {
            const p = this.state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.state.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.renderer.draw({
            players: this.players,
            projectiles: this.projectiles.getAll(),
            barrier: this.barrier,
            particles: this.state.particles,
            score: this.state.score,
            roundState: this.state.roundState,
            countdown: this.state.countdown,
            lastRoundWinner: this.state.lastRoundWinner,
            shake: this.state.shake,
            shakeX: this.state.shakeX,
            shakeY: this.state.shakeY
        });
    }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

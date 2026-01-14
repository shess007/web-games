class UIManager {
    constructor() {
        this.els = {
            cash: document.getElementById('cash'),
            fuelVal: document.getElementById('fuel-val'),
            fuelBar: document.getElementById('fuel-bar'),
            levelIdx: document.getElementById('level-idx'),
            speedVal: document.getElementById('speed-val'),
            fuelContainer: document.getElementById('fuel-container'),
            fuelPod: document.getElementById('fuel-pod'),
            speedPod: document.getElementById('speed-pod'),
            message: document.getElementById('message'),
            passengerComment: document.getElementById('passenger-comment'),
            passCount: document.getElementById('pass-count'),
            target: document.getElementById('target'),
            overlay: document.getElementById('overlay'),
            overlayMsg: document.getElementById('overlay-msg'),
            startBtn: document.getElementById('start-btn'),
            minimap: document.getElementById('minimap'),
            devMenu: document.getElementById('dev-menu'),
            devOptions: document.getElementById('dev-options'),
            avatar: document.getElementById('avatar-container'),
            fullscreenBtn: document.getElementById('fullscreen-btn')
        };
        this.currentAvatarId = null;
    }

    updatePassengerAvatar(passId) {
        if (this.currentAvatarId === passId) return;
        this.currentAvatarId = passId;
        this.els.avatar.innerHTML = '';

        if (passId === null) {
            this.els.avatar.style.opacity = '0.3';
            return;
        }

        this.els.avatar.style.opacity = '1';
        const canvas = document.createElement('canvas');
        canvas.className = 'avatar-canvas';
        canvas.width = 8; canvas.height = 8;
        const ctx = canvas.getContext('2d');

        // Procedural Retro Face
        const seed = passId * 12345;
        const hue = (seed % 360);
        ctx.fillStyle = `hsl(${hue}, 50%, 40%)`; // Background/Suit
        ctx.fillRect(0, 0, 8, 8);

        ctx.fillStyle = '#ffccaa'; // Face skin
        ctx.fillRect(2, 2, 4, 4);

        ctx.fillStyle = '#000'; // Eyes
        ctx.fillRect(3, 3, 1, 1);
        ctx.fillRect(5, 3, 1, 1);

        this.els.avatar.appendChild(canvas);
    }

    showRadioChatter(msg) {
        if (this.els.message.innerText.includes('SYSTEM')) return; // Don't overwrite system messages
        this.els.message.innerText = msg;
        this.els.message.style.color = '#0f0';
        setTimeout(() => {
            if (this.els.message.innerText === msg) {
                this.els.message.innerText = 'System Ready';
                this.els.message.style.color = '#fff';
            }
        }, 4000);
    }

    toggleDevMenu(show, levels, onSelect) {
        this.els.devMenu.style.display = show ? 'block' : 'none';
        if (show) {
            this.els.devOptions.innerHTML = '';
            levels.forEach((l, idx) => {
                const opt = document.createElement('div');
                opt.className = 'dev-option';
                opt.innerText = `> LADE SEKTOR ${idx + 1}`;
                opt.onclick = () => {
                    onSelect(idx);
                    this.toggleDevMenu(false);
                };
                this.els.devOptions.appendChild(opt);
            });
        }
    }

    updateHUD(state, speed) {
        // Update Values
        this.els.cash.innerText = Math.floor(state.cash);
        this.els.fuelVal.innerText = Math.floor(state.fuel);
        this.els.fuelBar.style.width = state.fuel + '%';
        this.els.levelIdx.innerText = state.currentLevelIdx + 1;
        this.els.speedVal.innerText = speed.toFixed(1);

        // Fuel Color & Alert Logic
        if (state.fuel < 20) {
            this.els.fuelBar.style.backgroundColor = '#ff3333';
            this.els.fuelPod.classList.add('danger-alert');
            this.els.fuelVal.className = 'gauge-critical';
        } else if (state.fuel < 50) {
            this.els.fuelBar.style.backgroundColor = '#ffaa00';
            this.els.fuelPod.classList.remove('danger-alert');
            this.els.fuelVal.className = 'gauge-warning';
        } else {
            this.els.fuelBar.style.backgroundColor = '#55ff55';
            this.els.fuelPod.classList.remove('danger-alert');
            this.els.fuelVal.className = 'text-white';
        }

        // Speed Color & Alert Logic
        if (speed > MAX_LANDING_SPD) {
            this.els.speedVal.className = 'speed-display gauge-critical';
            this.els.speedPod.classList.add('danger-alert');
        } else {
            this.els.speedVal.className = 'speed-display gauge-fine';
            this.els.speedPod.classList.remove('danger-alert');
        }
    }

    setMessage(msg) {
        this.els.message.innerText = msg;
    }

    setPassengerComment(comment, opacity) {
        this.els.passengerComment.innerText = comment;
        this.els.passengerComment.style.opacity = opacity;
    }

    updatePassCount(current, total) {
        this.els.passCount.innerText = `${current}/${total}`;
    }

    setTarget(target) {
        this.els.target.innerText = target;
    }

    showOverlay(msg, buttonText) {
        this.els.overlay.classList.remove('hidden');
        this.els.overlayMsg.innerHTML = msg;
        this.els.startBtn.innerText = buttonText;
    }

    hideOverlay() {
        this.els.overlay.classList.add('hidden');
    }

    updateMinimap(state) {
        const { taxi, level, passengerIndex, activePassenger } = state;
        if (!level) return;

        const tx = (taxi.x / level.w) * 100, ty = (taxi.y / level.h) * 100;
        let html = `<div style="position:absolute; left:${tx}%; top:${ty}%; width:4px; height:4px; background:yellow; transform:translate(-50%, -50%); z-index:5;"></div>`;

        level.platforms.forEach(p => {
            if (p.fuel) {
                const fx = (p.x / level.w) * 100, fy = (p.y / level.h) * 100;
                html += `<div style="position:absolute; left:${fx}%; top:${fy}%; width:6px; height:2px; background:#00ff00; transform:translate(0, 0); z-index:1;"></div>`;
            }
        });

        if (passengerIndex < level.passengers.length) {
            const pass = level.passengers[passengerIndex];
            const goalId = activePassenger?.state === 'WAITING' ? pass.f : pass.t;
            const goal = level.platforms.find(p => p.id === goalId);
            if (goal) {
                const gx = (goal.x / level.w) * 100, gy = (goal.y / level.h) * 100;
                html += `<div class="target-dot" style="position:absolute; left:${gx}%; top:${gy}%; width:8px; height:3px; background:#ff00ff; border:1px solid white; transform:translate(0, 0); z-index:10;"></div>`;
            }
        }
        if (level.enemies) {
            level.enemies.forEach(e => {
                const angle = Date.now() * e.speed;
                const ex = ((e.x + Math.cos(angle) * e.r) / level.w) * 100;
                const ey = ((e.y + Math.sin(angle) * e.r) / level.h) * 100;
                html += `<div style="position:absolute; left:${ex}%; top:${ey}%; width:3px; height:3px; background:red; border-radius:50%; transform:translate(-50%, -50%); z-index:4; animation: blink 0.2s infinite;"></div>`;
            });
        }

        this.els.minimap.innerHTML = html;
    }
}

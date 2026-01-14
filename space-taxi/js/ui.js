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
            minimap: document.getElementById('minimap')
        };
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
        this.els.minimap.innerHTML = html;
    }
}

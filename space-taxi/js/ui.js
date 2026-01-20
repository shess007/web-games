class UIManager {
    constructor() {
        this.els = {
            cash: document.getElementById('cash'),
            fuelVal: document.getElementById('fuel-val'),
            fuelBar: document.getElementById('fuel-bar'),
            levelIdx: document.getElementById('level-idx'),
            speedVal: document.getElementById('speed-val'),
            fuelPod: document.getElementById('fuel-pod'),
            speedPod: document.getElementById('speed-pod'),
            message: document.getElementById('message'),
            passengerComment: document.getElementById('passenger-comment'),
            passCount: document.getElementById('pass-count'),
            target: document.getElementById('target'),
            overlay: document.getElementById('overlay'),
            overlayMsg: document.getElementById('overlay-msg'),
            startBtn: document.getElementById('start-btn'),
            minimap: document.getElementById('minimap-sidebar'),
            radioLog: document.getElementById('radio-log'),
            avatar: document.getElementById('avatar-container'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            devMenu: document.getElementById('dev-menu'),
            devOptions: document.getElementById('dev-options')
        };
        this.avatars = ['🧑‍🚀', '👾', '🤖', '🕵️', '🧙', '🥷'];
    }

    updateHUD(state, speed) {
        if (this.els.cash) this.els.cash.innerText = Math.floor(state.cash);
        if (this.els.fuelVal) this.els.fuelVal.innerText = Math.floor(state.fuel);
        if (this.els.fuelBar) {
            this.els.fuelBar.style.width = Math.max(0, state.fuel) + '%';
            this.els.fuelBar.style.backgroundColor = state.fuel < 25 ? '#ff3e3e' : (state.fuel < 50 ? '#ffdf00' : '#00ff41');
        }
        if (this.els.levelIdx) this.els.levelIdx.innerText = state.currentLevelIdx + 1;
        if (this.els.speedVal) {
            this.els.speedVal.innerText = speed.toFixed(1);
            this.els.speedVal.style.color = (speed <= (typeof MAX_LANDING_SPD !== 'undefined' ? MAX_LANDING_SPD : 1.0)) ? '#00ff41' : '#ff3e3e';
        }

        if (state.fuel < 25) this.els.fuelPod?.classList.add('danger-alert');
        else this.els.fuelPod?.classList.remove('danger-alert');

        if (speed > 3) this.els.speedPod?.classList.add('danger-alert');
        else this.els.speedPod?.classList.remove('danger-alert');
    }

    updatePassCount(current, total) {
        if (this.els.passCount) this.els.passCount.innerText = `${current}/${total}`;
    }

    setLevelDisplay(levelStr) {
        if (this.els.levelIdx) this.els.levelIdx.innerText = levelStr;
    }

    setTarget(tgt) {
        if (this.els.target) this.els.target.innerText = tgt;
    }

    setMessage(msg) {
        if (this.els.message) {
            this.els.message.innerText = msg;
        }
    }

    showRadioChatter(msg) {
        this.setMessage(msg);
        if (this.els.radioLog) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            entry.innerText = `[${time}] ${msg}`;
            this.els.radioLog.prepend(entry);
            if (this.els.radioLog.children.length > 10) {
                this.els.radioLog.lastElementChild.remove();
            }
        }
        setTimeout(() => {
            if (this.els.message?.innerText === msg) {
                this.setMessage("SYSTEM READY");
            }
        }, 5000);
    }

    setPassengerComment(msg, speakerIdx) {
        if (!this.els.passengerComment) return;
        this.els.passengerComment.innerText = msg;
        this.els.passengerComment.style.opacity = '1';
        setTimeout(() => {
            if (this.els.passengerComment.innerText === msg) {
                this.els.passengerComment.style.opacity = '0';
            }
        }, 4000);
    }

    updatePassengerAvatar(character) {
        if (!this.els.avatar) return;
        if (character === null) {
            this.els.avatar.innerText = '';
            this.els.avatar.style.borderColor = 'rgba(255,255,255,0.05)';
        } else {
            const avatar = character?.emoji || this.avatars[0];
            this.els.avatar.innerText = avatar;
            this.els.avatar.style.fontSize = '24px';
            this.els.avatar.style.borderColor = '#00d2ff';
        }
    }

    updateMinimap(state) {
        // Handled by renderer.draw()
    }

    showOverlay(msg, isGameOver = false) {
        if (this.els.overlayMsg) this.els.overlayMsg.innerHTML = msg;
        this.els.overlay?.classList.remove('hidden');
        if (this.els.startBtn) this.els.startBtn.innerText = isGameOver ? 'RESTART MISSION' : 'START MISSION';
    }

    hideOverlay() {
        this.els.overlay?.classList.add('hidden');
    }

    toggleDevMenu(show, levels = [], onSelect = null) {
        if (!this.els.devMenu) return;
        this.els.devMenu.classList.toggle('hidden', !show);
        if (show && levels.length > 0 && this.els.devOptions) {
            this.els.devOptions.innerHTML = '';
            levels.forEach((l, i) => {
                const btn = document.createElement('button');
                btn.className = 'text-left hover:bg-green-900 p-2 border border-green-900 mb-1 font-mono text-green-500';
                btn.innerText = `LEVEL ${i + 1}`;
                btn.onclick = () => {
                    if (onSelect) onSelect(i);
                    this.toggleDevMenu(false);
                };
                this.els.devOptions.appendChild(btn);
            });
        }
    }
}

class UIManager {
    constructor() {
        this.els = {
            // Original elements
            cash: document.getElementById('cash'),
            fuelVal: document.getElementById('fuel-val'),
            fuelBar: document.getElementById('fuel-bar'),
            speedVal: document.getElementById('speed-val'),
            fuelPod: document.getElementById('fuel-pod'),
            speedPod: document.getElementById('speed-pod'),
            message: document.getElementById('message'),
            passengerComment: document.getElementById('passenger-comment'),
            target: document.getElementById('target'),
            overlay: document.getElementById('overlay'),
            overlayMsg: document.getElementById('overlay-msg'),
            startBtn: document.getElementById('start-btn'),
            minimap: document.getElementById('minimap-sidebar'),
            radioLog: document.getElementById('radio-log'),
            avatar: document.getElementById('avatar-container'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),

            // Roguelike elements
            hullDisplay: document.getElementById('hull-display'),
            sectorIdx: document.getElementById('sector-idx'),
            fareCount: document.getElementById('fare-count'),
            modifierPod: document.getElementById('modifier-pod'),
            modifierList: document.getElementById('modifier-list'),

            // Contract selection
            contractOverlay: document.getElementById('contract-overlay'),
            contractOptions: document.getElementById('contract-options'),
            contractCountdown: document.getElementById('contract-countdown'),

            // Active contract info
            contractInfo: document.getElementById('contract-info'),
            contractType: document.getElementById('contract-type'),
            contractPayout: document.getElementById('contract-payout'),
            contractRequirement: document.getElementById('contract-requirement'),

            // Contract timer
            contractTimer: document.getElementById('contract-timer'),
            timerVal: document.getElementById('timer-val'),

            // Run summary
            summaryOverlay: document.getElementById('summary-overlay'),
            summaryTitle: document.getElementById('summary-title'),
            sumSector: document.getElementById('sum-sector'),
            sumPassengers: document.getElementById('sum-passengers'),
            sumCash: document.getElementById('sum-cash'),
            sumTime: document.getElementById('sum-time'),
            sumHullBonus: document.getElementById('sum-hull-bonus'),
            sumScore: document.getElementById('sum-score'),
            sumDeathReason: document.getElementById('sum-death-reason')
        };
        this.avatars = ['🧑‍🚀', '👾', '🤖', '🕵️', '🧙', '🥷'];
        this.contractSelectCallback = null;
    }

    updateHUD(state, speed) {
        if (this.els.cash) this.els.cash.innerText = Math.floor(state.run?.cash ?? state.cash);
        if (this.els.fuelVal) this.els.fuelVal.innerText = Math.floor(state.fuel);
        if (this.els.fuelBar) {
            this.els.fuelBar.style.width = Math.max(0, state.fuel) + '%';
            this.els.fuelBar.style.backgroundColor = state.fuel < 25 ? '#ff3e3e' : (state.fuel < 50 ? '#ffdf00' : '#00ff41');
        }
        if (this.els.speedVal) {
            this.els.speedVal.innerText = speed.toFixed(1);
            this.els.speedVal.style.color = (speed <= (typeof MAX_LANDING_SPD !== 'undefined' ? MAX_LANDING_SPD : 1.0)) ? '#00ff41' : '#ff3e3e';
        }

        if (state.fuel < 25) this.els.fuelPod?.classList.add('danger-alert');
        else this.els.fuelPod?.classList.remove('danger-alert');

        if (speed > 3) this.els.speedPod?.classList.add('danger-alert');
        else this.els.speedPod?.classList.remove('danger-alert');
    }

    // ==================== ROGUELIKE UI ====================

    updateHull(current, max) {
        if (!this.els.hullDisplay) return;

        const pips = this.els.hullDisplay.querySelectorAll('.hull-pip');
        pips.forEach((pip, i) => {
            if (i < current) {
                pip.textContent = '❤️';
                pip.classList.remove('empty');
            } else {
                pip.textContent = '🖤';
                pip.classList.add('empty');
            }
        });

        // Add danger effect when low hull
        const hullPod = document.getElementById('hull-pod');
        if (hullPod) {
            if (current <= 1) {
                hullPod.classList.add('danger-alert');
            } else {
                hullPod.classList.remove('danger-alert');
            }
        }
    }

    updateSector(current, total) {
        if (this.els.sectorIdx) {
            this.els.sectorIdx.innerText = `${current}/${total}`;
        }
    }

    updateFareCount(current, total) {
        if (this.els.fareCount) {
            this.els.fareCount.innerText = `${current}/${total}`;
        }
    }

    updateModifiers(modifiers) {
        if (!this.els.modifierPod || !this.els.modifierList) return;

        if (!modifiers || modifiers.length === 0) {
            this.els.modifierPod.classList.add('hidden');
            return;
        }

        this.els.modifierPod.classList.remove('hidden');
        this.els.modifierList.innerHTML = modifiers.map(m =>
            `<div class="modifier-item text-purple-400">• ${m.name}</div>`
        ).join('');
    }

    // ==================== CONTRACT SELECTION ====================

    showContractSelection(contracts, callback) {
        if (!this.els.contractOverlay || !this.els.contractOptions) return;

        this.contractSelectCallback = callback;
        this.els.contractOverlay.classList.remove('hidden');
        this.els.contractOptions.innerHTML = '';

        contracts.forEach((contract, idx) => {
            const btn = document.createElement('button');
            btn.className = 'contract-btn w-full p-4 bg-gray-800/90 border-2 text-left transition-all hover:bg-gray-700';

            // Color-code by risk/reward
            let borderColor = 'border-gray-600';
            if (contract.payout >= 200) borderColor = 'border-yellow-500';
            else if (contract.timeLimit) borderColor = 'border-red-500';
            else if (contract.maxSpeed) borderColor = 'border-blue-500';
            btn.classList.add(borderColor);

            btn.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-lg font-bold ${contract.payout >= 200 ? 'text-yellow-400' : 'text-white'}">[${idx + 1}] ${contract.name}</span>
                    <span class="text-green-400 font-bold">$${contract.payout}</span>
                </div>
                <p class="text-sm text-gray-400">${contract.description}</p>
                ${contract.timeLimit ? `<p class="text-xs text-red-400 mt-1">⏱ ${contract.timeLimit / 1000}s time limit</p>` : ''}
                ${contract.maxSpeed ? `<p class="text-xs text-blue-400 mt-1">🐢 Max speed: ${contract.maxSpeed}</p>` : ''}
                ${contract.noBumps ? `<p class="text-xs text-purple-400 mt-1">✨ No wall collisions</p>` : ''}
            `;

            btn.onclick = () => {
                if (this.contractSelectCallback) {
                    this.contractSelectCallback(idx);
                }
            };

            this.els.contractOptions.appendChild(btn);
        });

        // Start countdown
        this.startContractCountdown();
    }

    startContractCountdown() {
        let countdown = 5;
        if (this.els.contractCountdown) {
            this.els.contractCountdown.textContent = countdown;
        }

        this.countdownInterval = setInterval(() => {
            countdown--;
            if (this.els.contractCountdown) {
                this.els.contractCountdown.textContent = countdown;
            }
            if (countdown <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    }

    hideContractSelection() {
        if (this.els.contractOverlay) {
            this.els.contractOverlay.classList.add('hidden');
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    // ==================== ACTIVE CONTRACT INFO ====================

    showContractInfo(contract) {
        if (!this.els.contractInfo) return;

        this.els.contractInfo.classList.remove('hidden');

        if (this.els.contractType) {
            this.els.contractType.textContent = contract.name;
        }
        if (this.els.contractPayout) {
            this.els.contractPayout.textContent = `$${contract.payout}`;
        }
        if (this.els.contractRequirement) {
            let req = '';
            if (contract.timeLimit) req = `⏱ ${contract.timeLimit / 1000}s`;
            if (contract.maxSpeed) req = `🐢 Max: ${contract.maxSpeed}`;
            if (contract.noBumps) req = '✨ No bumps';
            this.els.contractRequirement.textContent = req;
        }

        // Show timer for timed contracts
        if (contract.timeLimit && this.els.contractTimer) {
            this.els.contractTimer.classList.remove('hidden');
        }
    }

    hideContractInfo() {
        if (this.els.contractInfo) {
            this.els.contractInfo.classList.add('hidden');
        }
        if (this.els.contractTimer) {
            this.els.contractTimer.classList.add('hidden');
        }
    }

    updateContractTimer(seconds) {
        if (this.els.timerVal) {
            this.els.timerVal.textContent = seconds;

            // Flash when low
            if (seconds <= 5) {
                this.els.timerVal.classList.add('text-red-500');
                this.els.timerVal.classList.add('animate-pulse');
            } else {
                this.els.timerVal.classList.remove('text-red-500');
                this.els.timerVal.classList.remove('animate-pulse');
            }
        }
    }

    // ==================== RUN SUMMARY ====================

    showSummary(data) {
        if (!this.els.summaryOverlay) return;

        this.els.summaryOverlay.classList.remove('hidden');

        if (this.els.summaryTitle) {
            this.els.summaryTitle.textContent = data.isVictory ? 'SHIFT COMPLETE!' : 'SHIFT TERMINATED';
            this.els.summaryTitle.className = data.isVictory
                ? 'text-2xl font-bold mb-4 text-green-500 uppercase'
                : 'text-2xl font-bold mb-4 text-red-500 uppercase';
        }

        if (this.els.sumSector) {
            this.els.sumSector.textContent = `${data.sector} / ${data.totalSectors}`;
        }
        if (this.els.sumPassengers) {
            this.els.sumPassengers.textContent = data.passengers;
        }
        if (this.els.sumCash) {
            this.els.sumCash.textContent = `$${data.cash}`;
        }
        if (this.els.sumTime) {
            this.els.sumTime.textContent = data.time;
        }
        if (this.els.sumHullBonus) {
            this.els.sumHullBonus.textContent = `+$${data.hullBonus}`;
        }
        if (this.els.sumScore) {
            this.els.sumScore.textContent = `$${data.finalScore}`;
        }
        if (this.els.sumDeathReason) {
            this.els.sumDeathReason.textContent = data.deathReason || '';
        }
    }

    hideSummary() {
        if (this.els.summaryOverlay) {
            this.els.summaryOverlay.classList.add('hidden');
        }
    }

    // ==================== ORIGINAL UI METHODS ====================

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
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

    updateMinimap(state, activeModifiers) {
        // Check for scanner jam modifier
        const scannerJammed = activeModifiers?.some(m => m.disableMinimap);
        if (this.els.minimap) {
            if (scannerJammed) {
                this.els.minimap.style.opacity = '0.2';
                this.els.minimap.innerHTML = '<div class="text-red-500 text-xs text-center pt-4">JAMMED</div>';
            } else {
                this.els.minimap.style.opacity = '1';
                // Actual minimap rendering is handled by renderer
            }
        }
    }

    showOverlay(msg, isGameOver = false) {
        if (this.els.overlayMsg) this.els.overlayMsg.innerHTML = msg;
        this.els.overlay?.classList.remove('hidden');
        if (this.els.startBtn) this.els.startBtn.innerText = isGameOver ? 'TRY AGAIN' : 'START SHIFT';
    }

    hideOverlay() {
        this.els.overlay?.classList.add('hidden');
    }
}

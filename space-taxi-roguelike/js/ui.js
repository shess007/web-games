class UIManager {
    constructor() {
        this.els = {
            // Original elements
            cash: document.getElementById('cash'),
            fuelVal: document.getElementById('fuel-val'),
            fuelBar: document.getElementById('fuel-bar'),
            speedVal: document.getElementById('speed-val'),
            speedBar: document.getElementById('speed-bar'),
            speedNeedle: document.getElementById('speed-needle'),
            landingIndicator: document.getElementById('landing-indicator'),
            fuelPod: document.getElementById('fuel-pod'),
            speedPod: document.getElementById('speed-pod'),
            passengerStatus: document.getElementById('passenger-status-text'),
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
            sumDeathReason: document.getElementById('sum-death-reason'),

            // Base port
            baseOverlay: document.getElementById('base-overlay'),
            baseTitle: document.getElementById('base-title'),
            baseStatusMsg: document.getElementById('base-status-msg'),
            baseCash: document.getElementById('base-cash'),
            baseHullContainer: document.getElementById('base-hull-container'),
            baseRepairCost: document.getElementById('base-repair-cost'),
            baseGameOverMsg: document.getElementById('base-game-over-msg'),
            startShiftBtn: document.getElementById('start-shift-btn'),
            quitBtn: document.getElementById('quit-btn'),
            taxiCanvas: document.getElementById('taxi-canvas')
        };
        this.avatars = ['🧑‍🚀', '👾', '🤖', '🕵️', '🧙', '🥷'];
        this.contractSelectCallback = null;
        this.repairCallback = null;
        this.taxiAnimFrame = 0;
    }

    updateHUD(state, speed) {
        if (this.els.cash) this.els.cash.innerText = Math.floor(state.run?.cash ?? state.cash);
        if (this.els.fuelVal) {
            this.els.fuelVal.innerText = Math.floor(state.fuel);
            // Update fuel value color based on level
            if (state.fuel < 25) {
                this.els.fuelVal.style.color = '#ff3e3e';
                this.els.fuelVal.style.textShadow = '0 0 10px #ff3e3e';
            } else if (state.fuel < 50) {
                this.els.fuelVal.style.color = '#ffdf00';
                this.els.fuelVal.style.textShadow = '0 0 10px #ffdf00';
            } else {
                this.els.fuelVal.style.color = '#00ff41';
                this.els.fuelVal.style.textShadow = '0 0 10px #00ff41';
            }
        }
        if (this.els.fuelBar) {
            // Use height for vertical bar (fills from bottom)
            this.els.fuelBar.style.height = Math.max(0, state.fuel) + '%';
            // Apply color classes
            this.els.fuelBar.classList.remove('warning', 'critical');
            if (state.fuel < 25) {
                this.els.fuelBar.classList.add('critical');
            } else if (state.fuel < 50) {
                this.els.fuelBar.classList.add('warning');
            }
        }
        // Velocity gauge updates
        const maxSpeed = 5.0; // Max display speed
        const landingSpeed = typeof MAX_LANDING_SPD !== 'undefined' ? MAX_LANDING_SPD : 1.0;
        const speedPercent = Math.min((speed / maxSpeed) * 100, 100);
        const canLand = speed <= landingSpeed;

        if (this.els.speedVal) {
            this.els.speedVal.innerText = speed.toFixed(1);
            // Apply color classes based on speed zones
            this.els.speedVal.classList.remove('caution', 'danger');
            if (speed > 3) {
                this.els.speedVal.classList.add('danger');
            } else if (speed > landingSpeed) {
                this.els.speedVal.classList.add('caution');
            }
        }

        // Update speed bar height and color
        if (this.els.speedBar) {
            this.els.speedBar.style.height = speedPercent + '%';
            this.els.speedBar.classList.remove('caution', 'danger');
            if (speed > 3) {
                this.els.speedBar.classList.add('danger');
            } else if (speed > landingSpeed) {
                this.els.speedBar.classList.add('caution');
            }
        }

        // Update needle position
        if (this.els.speedNeedle) {
            this.els.speedNeedle.style.bottom = speedPercent + '%';
        }

        // Update landing indicator
        if (this.els.landingIndicator) {
            this.els.landingIndicator.classList.remove('active', 'warning');
            const landingText = this.els.landingIndicator.querySelector('.landing-text');
            if (canLand) {
                this.els.landingIndicator.classList.add('active');
                if (landingText) landingText.textContent = 'LAND OK';
            } else {
                this.els.landingIndicator.classList.add('warning');
                if (landingText) landingText.textContent = 'TOO FAST';
            }
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
            this.els.sectorIdx.innerText = current;
        }
        // Update total if element exists
        const sectorTotal = document.querySelector('.sector-total');
        if (sectorTotal) {
            sectorTotal.innerText = total;
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

    // ==================== BASE PORT ====================

    showBase(data, repairCallback) {
        if (!this.els.baseOverlay) return;

        this.repairCallback = repairCallback;
        this.els.baseOverlay.classList.remove('hidden');

        // Set title based on state
        if (this.els.baseTitle) {
            if (data.isVictory) {
                this.els.baseTitle.textContent = 'SHIFT COMPLETE!';
                this.els.baseTitle.className = 'base-title victory';
            } else {
                this.els.baseTitle.textContent = 'BASE PORT';
                this.els.baseTitle.className = 'base-title';
            }
        }

        // Set status message
        if (this.els.baseStatusMsg) {
            if (data.isVictory) {
                this.els.baseStatusMsg.textContent = 'All sectors cleared! Start another shift for more earnings.';
            } else if (data.deathReason) {
                this.els.baseStatusMsg.textContent = `Taxi damaged: ${data.deathReason}`;
            } else if (data.hull === data.maxHull && data.cash === 0) {
                this.els.baseStatusMsg.textContent = 'Ready for duty, pilot. Good luck out there!';
            } else {
                this.els.baseStatusMsg.textContent = 'Welcome back, pilot.';
            }
        }

        // Update repair cost display
        if (this.els.baseRepairCost) {
            this.els.baseRepairCost.textContent = data.repairCost;
        }

        this.updateBaseHull(data.hull, data.maxHull, data.cash, data.repairCost);

        // Check for game over condition (0 hull and not enough cash to repair)
        const isGameOver = data.hull <= 0 && data.cash < data.repairCost;

        if (this.els.baseGameOverMsg) {
            if (isGameOver) {
                this.els.baseGameOverMsg.classList.remove('hidden');
            } else {
                this.els.baseGameOverMsg.classList.add('hidden');
            }
        }

        // Hide start shift button if game over
        if (this.els.startShiftBtn) {
            if (isGameOver) {
                this.els.startShiftBtn.style.display = 'none';
            } else {
                this.els.startShiftBtn.style.display = 'flex';
            }
        }

        // Draw the pixel art taxi
        this.drawPixelTaxi(data.hull, data.maxHull);

        // Start taxi animation
        this.startTaxiAnimation(data.hull, data.maxHull);
    }

    hideBase() {
        if (this.els.baseOverlay) {
            this.els.baseOverlay.classList.add('hidden');
        }
        // Stop animation
        if (this.taxiAnimInterval) {
            clearInterval(this.taxiAnimInterval);
            this.taxiAnimInterval = null;
        }
    }

    updateBaseHull(current, max, cash, repairCost) {
        if (!this.els.baseHullContainer) return;

        // Update cash display
        if (this.els.baseCash) {
            this.els.baseCash.textContent = cash;
        }

        // Build hull display with repair buttons
        let html = '';
        for (let i = 0; i < max; i++) {
            if (i < current) {
                // Filled hull pip
                html += `<div class="hull-pip-base">❤️</div>`;
            } else {
                // Empty hull pip with repair button
                const canAfford = cash >= repairCost;
                html += `
                    <button class="repair-btn" data-index="${i}" ${!canAfford ? 'disabled' : ''}>
                        <span>🖤</span>
                        <span class="repair-cost">$${repairCost}</span>
                    </button>
                `;
            }
        }

        this.els.baseHullContainer.innerHTML = html;

        // Attach click handlers to repair buttons
        const repairBtns = this.els.baseHullContainer.querySelectorAll('.repair-btn:not([disabled])');
        repairBtns.forEach(btn => {
            btn.onclick = () => {
                if (this.repairCallback) {
                    this.repairCallback();
                }
            };
        });
    }

    startTaxiAnimation(hull, maxHull) {
        if (this.taxiAnimInterval) {
            clearInterval(this.taxiAnimInterval);
        }
        this.taxiAnimFrame = 0;
        this.taxiAnimInterval = setInterval(() => {
            this.taxiAnimFrame++;
            this.drawPixelTaxi(hull, maxHull);
        }, 100);
    }

    drawPixelTaxi(hull, maxHull) {
        const canvas = this.els.taxiCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Pixel art taxi - isometric 3D style
        const centerX = w / 2;
        const centerY = h / 2 + 15;

        // Hover animation
        const hoverOffset = Math.sin(this.taxiAnimFrame * 0.12) * 4;

        // Taxi body colors based on hull damage
        const damageRatio = hull / maxHull;
        let bodyColor, bodyDark, bodyLight, accentColor;

        if (damageRatio >= 0.66) {
            // Healthy - yellow
            bodyColor = '#ffdd00';
            bodyDark = '#cc9900';
            bodyLight = '#ffff44';
            accentColor = '#ffee66';
        } else if (damageRatio >= 0.33) {
            // Damaged - orange
            bodyColor = '#ff8800';
            bodyDark = '#aa5500';
            bodyLight = '#ffaa44';
            accentColor = '#ffbb66';
        } else if (hull > 0) {
            // Critical - red
            bodyColor = '#ff4444';
            bodyDark = '#aa2222';
            bodyLight = '#ff6666';
            accentColor = '#ff8888';
        } else {
            // Destroyed - gray
            bodyColor = '#555555';
            bodyDark = '#333333';
            bodyLight = '#777777';
            accentColor = '#666666';
        }

        const ty = centerY + hoverOffset;
        const s = 1.4; // Scale factor

        // === DRAW SHADOW ===
        ctx.fillStyle = 'rgba(0, 210, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 60, 55 * s, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // === DRAW TAXI (3D isometric pixel art style) ===

        // Bottom thruster glow (animated)
        const thrusterIntensity = 0.4 + Math.sin(this.taxiAnimFrame * 0.25) * 0.2;
        const gradient = ctx.createRadialGradient(centerX, ty + 35 * s, 0, centerX, ty + 35 * s, 35 * s);
        gradient.addColorStop(0, `rgba(0, 255, 255, ${thrusterIntensity})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 255, ${thrusterIntensity * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 40 * s, ty + 20 * s, 80 * s, 50 * s);

        // === MAIN BODY - 3D EFFECT ===

        // Body top highlight
        ctx.fillStyle = bodyLight;
        ctx.beginPath();
        ctx.moveTo(centerX - 40 * s, ty - 5 * s);
        ctx.lineTo(centerX + 40 * s, ty - 5 * s);
        ctx.lineTo(centerX + 35 * s, ty - 12 * s);
        ctx.lineTo(centerX - 35 * s, ty - 12 * s);
        ctx.closePath();
        ctx.fill();

        // Body main surface
        ctx.fillStyle = bodyColor;
        ctx.fillRect(centerX - 40 * s, ty - 5 * s, 80 * s, 25 * s);

        // Body bottom (darker)
        ctx.fillStyle = bodyDark;
        ctx.fillRect(centerX - 40 * s, ty + 20 * s, 80 * s, 8 * s);

        // Left side panel (darker for 3D effect)
        ctx.fillStyle = bodyDark;
        ctx.beginPath();
        ctx.moveTo(centerX - 40 * s, ty - 5 * s);
        ctx.lineTo(centerX - 40 * s, ty + 28 * s);
        ctx.lineTo(centerX - 45 * s, ty + 25 * s);
        ctx.lineTo(centerX - 45 * s, ty - 2 * s);
        ctx.closePath();
        ctx.fill();

        // Right side panel (slightly lighter)
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(centerX + 40 * s, ty - 5 * s);
        ctx.lineTo(centerX + 40 * s, ty + 28 * s);
        ctx.lineTo(centerX + 45 * s, ty + 25 * s);
        ctx.lineTo(centerX + 45 * s, ty - 2 * s);
        ctx.closePath();
        ctx.fill();

        // === COCKPIT WINDOW ===
        // Window frame
        ctx.fillStyle = '#222222';
        ctx.fillRect(centerX - 25 * s, ty - 8 * s, 50 * s, 22 * s);

        // Window glass
        const windowGradient = ctx.createLinearGradient(centerX - 22 * s, ty - 5 * s, centerX + 22 * s, ty + 12 * s);
        windowGradient.addColorStop(0, '#00d2ff');
        windowGradient.addColorStop(0.3, '#0088aa');
        windowGradient.addColorStop(1, '#004466');
        ctx.fillStyle = windowGradient;
        ctx.fillRect(centerX - 22 * s, ty - 5 * s, 44 * s, 18 * s);

        // Window shine/reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(centerX - 18 * s, ty - 3 * s, 12 * s, 6 * s);

        // Window scan line effect
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        const scanY = (this.taxiAnimFrame * 2) % 18;
        ctx.fillRect(centerX - 22 * s, ty - 5 * s + scanY, 44 * s, 2);

        // === SIDE THRUSTERS ===
        // Left thruster housing
        ctx.fillStyle = '#666666';
        ctx.fillRect(centerX - 55 * s, ty + 5 * s, 12 * s, 18 * s);
        ctx.fillStyle = '#444444';
        ctx.fillRect(centerX - 55 * s, ty + 5 * s, 12 * s, 4 * s);

        // Right thruster housing
        ctx.fillStyle = '#666666';
        ctx.fillRect(centerX + 43 * s, ty + 5 * s, 12 * s, 18 * s);
        ctx.fillStyle = '#444444';
        ctx.fillRect(centerX + 43 * s, ty + 5 * s, 12 * s, 4 * s);

        // Side thruster flames
        if (hull > 0) {
            const sideFlameH = 6 + Math.sin(this.taxiAnimFrame * 0.5) * 3;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(centerX - 53 * s, ty + 23 * s, 8 * s, sideFlameH * s);
            ctx.fillRect(centerX + 45 * s, ty + 23 * s, 8 * s, sideFlameH * s);
        }

        // === MAIN THRUSTER FLAMES ===
        if (hull > 0) {
            const flameHeight = (15 + Math.sin(this.taxiAnimFrame * 0.35) * 8) * s;
            const flameGradient = ctx.createLinearGradient(0, ty + 28 * s, 0, ty + 28 * s + flameHeight);
            flameGradient.addColorStop(0, '#ffffff');
            flameGradient.addColorStop(0.2, '#00ffff');
            flameGradient.addColorStop(0.6, '#0088ff');
            flameGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = flameGradient;
            ctx.fillRect(centerX - 15 * s, ty + 28 * s, 30 * s, flameHeight);

            // Flame particles
            for (let i = 0; i < 5; i++) {
                const px = centerX - 10 * s + Math.random() * 20 * s;
                const py = ty + 28 * s + Math.random() * flameHeight;
                ctx.fillStyle = `rgba(0, 255, 255, ${0.5 - Math.random() * 0.3})`;
                ctx.fillRect(px, py, 3, 3);
            }
        }

        // === LANDING GEAR ===
        ctx.fillStyle = '#333333';
        // Left gear
        ctx.fillRect(centerX - 30 * s, ty + 28 * s, 6 * s, 8 * s);
        ctx.fillStyle = '#222222';
        ctx.fillRect(centerX - 32 * s, ty + 34 * s, 10 * s, 4 * s);
        // Right gear
        ctx.fillStyle = '#333333';
        ctx.fillRect(centerX + 24 * s, ty + 28 * s, 6 * s, 8 * s);
        ctx.fillStyle = '#222222';
        ctx.fillRect(centerX + 22 * s, ty + 34 * s, 10 * s, 4 * s);

        // === TAXI MARKINGS ===
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('TAXI', centerX - 14, ty + 15 * s);

        // Checkerboard pattern on side
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 4; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(centerX - 38 * s + i * 8 * s, ty + 17 * s, 4 * s, 4 * s);
                ctx.fillRect(centerX + 20 * s + i * 8 * s, ty + 17 * s, 4 * s, 4 * s);
            }
        }

        // === DAMAGE EFFECTS ===
        if (damageRatio < 1) {
            // Damage scratches
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            const scratchCount = Math.floor((1 - damageRatio) * 6);
            for (let i = 0; i < scratchCount; i++) {
                const sx = centerX - 35 * s + Math.random() * 70 * s;
                const sy = ty - 5 * s + Math.random() * 25 * s;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + 10 + Math.random() * 10, sy + Math.random() * 10 - 5);
                ctx.stroke();
            }

            // Sparks
            const sparkCount = Math.floor((1 - damageRatio) * 8);
            for (let i = 0; i < sparkCount; i++) {
                if (Math.random() > 0.4) {
                    const sx = centerX - 40 * s + Math.random() * 80 * s;
                    const sy = ty + Math.random() * 25 * s;
                    ctx.fillStyle = Math.random() > 0.5 ? '#ffff00' : '#ff8800';
                    ctx.fillRect(sx, sy, 2 + Math.random() * 2, 2 + Math.random() * 2);
                }
            }
        }

        // === SMOKE FOR CRITICAL DAMAGE ===
        if (hull > 0 && damageRatio < 0.33) {
            for (let i = 0; i < 5; i++) {
                const smokeX = centerX - 20 * s + Math.random() * 40 * s;
                const smokePhase = (this.taxiAnimFrame * 3 + i * 15) % 50;
                const smokeY = ty - 15 * s - smokePhase;
                const smokeAlpha = 0.4 - smokePhase / 125;
                const smokeSize = 5 + smokePhase / 5;
                if (smokeAlpha > 0) {
                    ctx.fillStyle = `rgba(80, 80, 80, ${smokeAlpha})`;
                    ctx.beginPath();
                    ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // === DESTROYED STATE ===
        if (hull <= 0) {
            // Flickering broken lights
            if (this.taxiAnimFrame % 20 < 10) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(centerX - 22 * s, ty - 5 * s, 44 * s, 18 * s);
            }

            // Static/broken screen effect
            for (let i = 0; i < 20; i++) {
                const sx = centerX - 22 * s + Math.random() * 44 * s;
                const sy = ty - 5 * s + Math.random() * 18 * s;
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
                ctx.fillRect(sx, sy, 2, 1);
            }
        }
    }

    drawPixelRect(ctx, x, y, w, h, scale) {
        // Draw a rectangle with pixel-perfect edges
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
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
        const avatarIcon = this.els.avatar.querySelector('.avatar-icon');
        const passengerStatus = this.els.passengerStatus;

        if (character === null) {
            if (avatarIcon) avatarIcon.innerText = '';
            this.els.avatar.classList.remove('has-passenger');
            if (passengerStatus) {
                passengerStatus.innerText = 'NO PASSENGER';
                passengerStatus.parentElement?.classList.remove('active');
            }
        } else {
            const avatar = character?.emoji || this.avatars[0];
            if (avatarIcon) avatarIcon.innerText = avatar;
            this.els.avatar.classList.add('has-passenger');
            if (passengerStatus) {
                passengerStatus.innerText = character?.name || 'ABOARD';
                passengerStatus.parentElement?.classList.add('active');
            }
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

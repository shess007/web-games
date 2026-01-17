class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.engineNodes = [null, null]; // One per player
        this.reloadNodes = [null, null]; // One per player for ammo reload
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Create engine sound nodes for both players
        for (let i = 0; i < 2; i++) {
            this.engineNodes[i] = this.createEngineNode();
            this.reloadNodes[i] = this.createReloadNode();
        }

        this.initialized = true;
    }

    createEngineNode() {
        const noise = this.ctx.createBufferSource();
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();

        return { noise, filter, gain };
    }

    createReloadNode() {
        // Track state for periodic sound playback
        return {
            isReloading: false,
            lastPingTime: 0,
            pingIndex: 0
        };
    }

    playReloadPing(pitchIndex) {
        if (!this.initialized) return;

        // Create a short "ping" sound - ascending pitch for each ammo loaded
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Base frequency increases with each ping (like loading shells)
        const baseFreq = 600 + (pitchIndex % 5) * 80;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.05);

        // Add a metallic click layer
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(baseFreq * 2, this.ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, this.ctx.currentTime + 0.03);

        gain2.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 2;

        // Quick attack, quick decay
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
        osc2.start();
        osc2.stop(this.ctx.currentTime + 0.05);
    }

    updateReloadSound(playerIndex, isReloading) {
        if (!this.initialized) return;

        const reload = this.reloadNodes[playerIndex];
        if (!reload) return;

        const now = this.ctx.currentTime;

        if (isReloading) {
            if (!reload.isReloading) {
                // Just started reloading
                reload.isReloading = true;
                reload.lastPingTime = now;
                reload.pingIndex = 0;
                this.playReloadPing(reload.pingIndex);
            } else {
                // Continue reloading - play ping every 120ms
                if (now - reload.lastPingTime > 0.12) {
                    reload.pingIndex++;
                    reload.lastPingTime = now;
                    this.playReloadPing(reload.pingIndex);
                }
            }
        } else {
            if (reload.isReloading) {
                // Just stopped reloading - play a final "complete" sound
                reload.isReloading = false;
            }
        }
    }

    updateEngineSound(playerIndex, isThrusting) {
        if (!this.initialized) return;

        const engine = this.engineNodes[playerIndex];
        if (!engine) return;

        const targetFreq = isThrusting ? 400 : 100;
        const targetGain = isThrusting ? 0.15 : 0;

        engine.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        engine.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    playShoot(playerIndex) {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Softer "pew" sound - shorter and less harsh
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playHitBarrier() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playExplosion() {
        if (!this.initialized) return;

        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    playRoundWin() {
        if (!this.initialized) return;

        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + i * 0.1 + 0.05);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(this.ctx.currentTime + i * 0.1);
            osc.stop(this.ctx.currentTime + i * 0.1 + 0.3);
        });
    }

    playMatchWin() {
        if (!this.initialized) return;

        const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + i * 0.15 + 0.05);
            gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + i * 0.15 + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(this.ctx.currentTime + i * 0.15);
            osc.stop(this.ctx.currentTime + i * 0.15 + 0.6);
        });
    }

    playRefuel() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 880;

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.setValueAtTime(0, this.ctx.currentTime + 0.02);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.02);
    }

    playReload() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Soft click sound for ammo reload
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
    }
}

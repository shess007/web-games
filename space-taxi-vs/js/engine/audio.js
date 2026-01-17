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
        // Simple charging tone
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 200;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();

        return { osc, filter, gain };
    }

    updateReloadSound(playerIndex, isReloading) {
        if (!this.initialized) return;

        const reload = this.reloadNodes[playerIndex];
        if (!reload) return;

        const time = this.ctx.currentTime;

        if (isReloading) {
            reload.gain.gain.setTargetAtTime(0.08, time, 0.05);
            reload.filter.frequency.setTargetAtTime(800, time, 0.2);
            reload.osc.frequency.setTargetAtTime(400, time, 0.3);
        } else {
            reload.gain.gain.setTargetAtTime(0, time, 0.1);
            reload.filter.frequency.setTargetAtTime(400, time, 0.2);
            reload.osc.frequency.setTargetAtTime(200, time, 0.2);
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

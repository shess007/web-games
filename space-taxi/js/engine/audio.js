class AudioEngine {
    constructor() {
        this.ctx = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.noiseBuffer = null;
        this.bgmBeat = 0;
        this.lastThrustState = { up: false, left: false, right: false };
        this.thrustOscillators = [];
    }

    setup() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;
        noiseSource.loop = true;

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(80, this.ctx.currentTime);
        this.engineFilter.Q.setValueAtTime(8, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        noiseSource.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        noiseSource.start();
    }

    updateEngineSound(isThrusting, thrustUp = false, thrustSide = false) {
        if (!this.ctx) return;

        if (thrustUp) {
            this.engineGain.gain.setTargetAtTime(0.25, this.ctx.currentTime, 0.03);
            const wobble = 280 + Math.sin(this.ctx.currentTime * 30) * 60;
            this.engineFilter.frequency.setTargetAtTime(wobble, this.ctx.currentTime, 0.02);

            if (!this.lastThrustState.up) {
                this.playThrustBurst(120, 0.15, 'sawtooth', 80);
            }
        } else {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
            this.engineFilter.frequency.setTargetAtTime(80, this.ctx.currentTime, 0.1);
        }

        if (thrustSide && !this.lastThrustState.left && !this.lastThrustState.right) {
            this.playSideThrust();
        }

        this.lastThrustState.up = thrustUp;
        this.lastThrustState.left = thrustSide;
        this.lastThrustState.right = thrustSide;
    }

    playThrustBurst(freq, duration, type, slideDown) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq - slideDown), this.ctx.currentTime + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSideThrust() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playSound(f, d, t, v, slideTo = null) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = t;
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        if (slideTo !== null) {
            // exponentialRampToValueAtTime cannot ramp to 0
            const targetFreq = Math.max(0.0001, slideTo);
            osc.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + d);
        }
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + d);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + d);
    }

    playPerc(v) {
        if (!this.ctx) return;
        const s = this.ctx.createBufferSource();
        const f = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();
        s.buffer = this.noiseBuffer;
        f.type = 'highpass';
        f.frequency.setValueAtTime(5000, this.ctx.currentTime);
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
        s.connect(f);
        f.connect(g);
        g.connect(this.ctx.destination);
        s.start();
    }

    playBGMStep() {
        const scale = [130.81, 146.83, 164.81, 196.00, 220.00];
        const arpeggio = [261.63, 329.63, 392.00, 523.25];

        if (this.bgmBeat % 4 === 0) this.playSound(scale[Math.floor(this.bgmBeat / 4) % scale.length] * 0.5, 0.5, 'triangle', 0.03);
        this.playSound(arpeggio[this.bgmBeat % arpeggio.length], 0.2, 'sine', 0.01);
        if (this.bgmBeat % 2 === 0) this.playPerc(0.005);
        this.bgmBeat++;
    }
}

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.noiseBuffer = null;
        this.bgmBeat = 0;
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
        this.engineFilter.frequency.setValueAtTime(100, this.ctx.currentTime);
        this.engineFilter.Q.setValueAtTime(12, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        noiseSource.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        noiseSource.start();
    }

    updateEngineSound(isThrusting) {
        if (!this.ctx) return;
        this.engineGain.gain.setTargetAtTime(isThrusting ? 0.4 : 0, this.ctx.currentTime, 0.05);
        this.engineFilter.frequency.setTargetAtTime(isThrusting ? 400 : 100, this.ctx.currentTime, 0.1);
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

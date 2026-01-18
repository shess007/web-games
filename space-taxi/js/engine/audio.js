class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.noiseBuffer = null;
        this.bgmBeat = 0;
        this.lastThrustState = { up: false, left: false, right: false };
        this.thrustOscillators = [];
        this.musicPlaying = false;
        this.musicIntervals = [];
    }

    setup() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master gain for all sounds
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Separate gain for music (lower volume)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.2;
        this.musicGain.connect(this.ctx.destination);

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
        this.engineGain.connect(this.masterGain);
        noiseSource.start();

        // Start background music
        this.startMusic();
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
        g.connect(this.masterGain || this.ctx.destination);
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
        g.connect(this.masterGain || this.ctx.destination);
        s.start();
    }

    // ==================== BACKGROUND MUSIC ====================

    startMusic() {
        if (this.musicPlaying) return;
        this.musicPlaying = true;

        // Music parameters
        this.bpm = 175;
        this.beatDuration = 60 / this.bpm;
        this.currentBeat = 0;
        this.barLength = 16; // 16 beats per bar pattern

        // Musical scales (A minor / C major for space feel)
        this.bassNotes = [55, 58.27, 65.41, 73.42]; // A1, Bb1, C2, D2
        this.arpNotes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]; // A3, C4, D4, E4, G4, A4, C5
        this.padNotes = [110, 130.81, 164.81, 196]; // A2, C3, E3, G3

        // Start the music loop
        this.scheduleMusicLoop();
    }

    stopMusic() {
        this.musicPlaying = false;
        this.musicIntervals.forEach(id => clearTimeout(id));
        this.musicIntervals = [];
    }

    scheduleMusicLoop() {
        if (!this.musicPlaying || !this.ctx) return;

        const scheduleNext = () => {
            if (!this.musicPlaying) return;

            this.playMusicBeat(this.currentBeat);
            this.currentBeat = (this.currentBeat + 1) % (this.barLength * 4); // 4 bars loop

            const intervalId = setTimeout(scheduleNext, this.beatDuration * 1000);
            this.musicIntervals.push(intervalId);
        };

        scheduleNext();
    }

    playMusicBeat(beat) {
        const beatInBar = beat % this.barLength;
        const barNumber = Math.floor(beat / this.barLength) % 4;

        // Kick drum on 1, 5, 9, 13 (four-on-the-floor with gaps)
        if (beatInBar === 0 || beatInBar === 4 || beatInBar === 8 || beatInBar === 12) {
            this.playKick();
        }

        // Hi-hat on off-beats
        if (beatInBar % 2 === 1) {
            this.playHiHat(beatInBar % 4 === 1 ? 0.4 : 0.2);
        }

        // Snare on 4 and 12
        if (beatInBar === 4 || beatInBar === 12) {
            this.playSnare();
        }

        // Bass line - changes per bar
        if (beatInBar === 0 || beatInBar === 6 || beatInBar === 10) {
            const bassNote = this.bassNotes[barNumber % this.bassNotes.length];
            this.playBass(bassNote, beatInBar === 0 ? 0.3 : 0.15);
        }

        // Arpeggios - fast sequence
        if (beat % 2 === 0) {
            const arpIndex = (beat / 2) % this.arpNotes.length;
            const arpNote = this.arpNotes[arpIndex];
            // Vary octave based on position
            const octaveShift = (barNumber === 2 || barNumber === 3) ? 2 : 1;
            this.playArp(arpNote * octaveShift, 0.08);
        }

        // Pad chord - sustained, plays on bar changes
        if (beatInBar === 0) {
            this.playPadChord(barNumber);
        }

        // Extra tension on bar 3 - add rising arp
        if (barNumber === 3 && beatInBar >= 12) {
            const riseNote = this.arpNotes[beatInBar - 12] * 2;
            this.playArp(riseNote, 0.12);
        }
    }

    playKick() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playSnare() {
        // Noise burst for snare
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start();
    }

    playHiHat(volume) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start();
    }

    playBass(freq, duration) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc2.type = 'square';
        osc2.frequency.value = freq * 0.5;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + duration);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc2.start();
        osc.stop(this.ctx.currentTime + duration);
        osc2.stop(this.ctx.currentTime + duration);
    }

    playArp(freq, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 2;

        const duration = this.beatDuration * 0.4;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playPadChord(barNumber) {
        // Play a sustained chord that fades slowly
        const chordProgressions = [
            [110, 164.81, 220],       // Am (A, E, A)
            [130.81, 196, 261.63],    // C (C, G, C)
            [146.83, 220, 293.66],    // Dm (D, A, D)
            [98, 146.83, 196]         // G (G, D, G) - tension chord
        ];

        const chord = chordProgressions[barNumber % chordProgressions.length];
        const duration = this.beatDuration * 8;

        chord.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Slight detune for width
            osc.detune.value = (i - 1) * 5;

            filter.type = 'lowpass';
            filter.frequency.value = 800;

            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
            gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + duration * 0.7);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        });
    }
}

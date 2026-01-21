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
        this.currentMusicType = 'base'; // 'base' or 'shift'
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

    startMusic(type = 'base') {
        this.stopMusic();
        this.musicPlaying = true;
        this.currentMusicType = type;
        this.currentBeat = 0;

        if (type === 'shift') {
            // Lower volume for shift music so it doesn't overlay SFX
            if (this.musicGain) this.musicGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            this.startShiftMusic();
        } else {
            // Normal volume for ambient base music
            if (this.musicGain) this.musicGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            this.startBaseMusic();
        }
    }

    switchMusic(type) {
        if (this.currentMusicType === type) return;
        this.startMusic(type);
    }

    stopMusic() {
        this.musicPlaying = false;
        this.musicIntervals.forEach(id => clearTimeout(id));
        this.musicIntervals = [];
    }

    // ==================== BASE PORT MUSIC (Ambient/Chill) ====================

    startBaseMusic() {
        this.bpm = 85;
        this.beatDuration = 60 / this.bpm;
        this.barLength = 16;

        // Ambient scales - E minor pentatonic for dreamy feel
        this.baseBassNotes = [41.2, 55, 61.74, 73.42]; // E1, A1, B1, D2
        this.baseArpNotes = [164.81, 196, 246.94, 293.66, 329.63, 392]; // E3, G3, B3, D4, E4, G4
        this.basePadNotes = [82.41, 123.47, 164.81]; // E2, B2, E3

        this.scheduleMusicLoop('base');
    }

    playBaseBeat(beat) {
        const beatInBar = beat % this.barLength;
        const barNumber = Math.floor(beat / this.barLength) % 4;

        // Soft kick on 1 and 9 only
        if (beatInBar === 0 || beatInBar === 8) {
            this.playKick(0.4);
        }

        // Gentle hi-hat pattern
        if (beatInBar % 4 === 2) {
            this.playHiHat(0.15);
        }

        // Soft rimshot on 8
        if (beatInBar === 8) {
            this.playRimshot();
        }

        // Deep ambient bass - longer sustain
        if (beatInBar === 0) {
            const bassNote = this.baseBassNotes[barNumber % this.baseBassNotes.length];
            this.playBaseBass(bassNote, this.beatDuration * 6);
        }

        // Slow, dreamy arpeggios
        if (beat % 4 === 0) {
            const arpIndex = (beat / 4) % this.baseArpNotes.length;
            this.playBaseArp(this.baseArpNotes[arpIndex], 0.06);
        }

        // Lush pad chords - every 2 bars
        if (beatInBar === 0 && barNumber % 2 === 0) {
            this.playBasePad(barNumber);
        }

        // Ethereal shimmer occasionally
        if (beatInBar === 12 && barNumber === 3) {
            this.playShimmer();
        }
    }

    playBaseBass(freq, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 200;

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + duration * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playBaseArp(freq, volume) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const delay = this.ctx.createDelay();
        const delayGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        osc2.type = 'triangle';
        osc2.frequency.value = freq * 2;
        osc2.detune.value = 7;

        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        delay.delayTime.value = this.beatDuration * 0.75;
        delayGain.gain.value = 0.3;

        const duration = this.beatDuration * 2;
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        gain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(this.musicGain);

        osc.start();
        osc2.start();
        osc.stop(this.ctx.currentTime + duration);
        osc2.stop(this.ctx.currentTime + duration);
    }

    playBasePad(barNumber) {
        const chords = [
            [82.41, 123.47, 164.81, 246.94],  // Em9
            [73.42, 110, 146.83, 220],         // D add9
            [65.41, 98, 130.81, 196],          // C maj7
            [82.41, 123.47, 155.56, 246.94]   // Em7
        ];

        const chord = chords[barNumber % chords.length];
        const duration = this.beatDuration * 16;

        chord.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.value = freq;
            osc2.type = 'sine';
            osc2.frequency.value = freq * 2;
            osc2.detune.value = (i - 1.5) * 8;

            filter.type = 'lowpass';
            filter.frequency.value = 600;

            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1);
            gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + duration * 0.6);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start();
            osc2.start();
            osc.stop(this.ctx.currentTime + duration);
            osc2.stop(this.ctx.currentTime + duration);
        });
    }

    playShimmer() {
        const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

                osc.connect(gain);
                gain.connect(this.musicGain);

                osc.start();
                osc.stop(this.ctx.currentTime + 1.5);
            }, i * 80);
        });
    }

    playRimshot() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);

        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // ==================== SHIFT MUSIC (Fast/Energetic/Melodic) ====================

    startShiftMusic() {
        this.bpm = 170;
        this.beatDuration = 60 / this.bpm;
        this.barLength = 16;

        // Energetic scales - A minor with melodic elements
        this.shiftBassNotes = [55, 65.41, 73.42, 82.41]; // A1, C2, D2, E2
        this.shiftMelodyNotes = [440, 523.25, 587.33, 659.25, 783.99, 880]; // A4, C5, D5, E5, G5, A5
        this.shiftArpNotes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33]; // Full octave run

        this.scheduleMusicLoop('shift');
    }

    playShiftBeat(beat) {
        const beatInBar = beat % this.barLength;
        const barNumber = Math.floor(beat / this.barLength) % 8; // 8 bar pattern

        // Driving kick - four on the floor
        if (beatInBar % 4 === 0) {
            this.playKick(0.55);
        }

        // Offbeat kick for drive
        if (beatInBar === 6 || beatInBar === 14) {
            this.playKick(0.35);
        }

        // Fast hi-hats - every beat with accents
        if (beatInBar % 2 === 0) {
            this.playHiHat(0.25);
        }
        if (beatInBar % 2 === 1) {
            this.playHiHat(0.12);
        }

        // Open hi-hat on upbeats
        if (beatInBar === 2 || beatInBar === 10) {
            this.playOpenHat();
        }

        // Punchy snare on 4 and 12
        if (beatInBar === 4 || beatInBar === 12) {
            this.playSnare();
        }

        // Rolling snare fill on bar 8
        if (barNumber === 7 && beatInBar >= 12) {
            this.playSnare();
        }

        // Driving bass line
        this.playShiftBassPattern(beatInBar, barNumber);

        // Fast melodic arpeggios
        if (beat % 2 === 0) {
            const arpIndex = (beat / 2) % this.shiftArpNotes.length;
            const octave = (barNumber % 4 < 2) ? 1 : 2;
            this.playShiftArp(this.shiftArpNotes[arpIndex] * octave, 0.07);
        }

        // Lead melody line
        if (barNumber % 2 === 0) {
            this.playShiftMelody(beatInBar, barNumber);
        }

        // Synth stabs for energy
        if (beatInBar === 0 && barNumber % 2 === 0) {
            this.playShiftStab(barNumber);
        }

        // Rising tension
        if (barNumber === 7 && beatInBar >= 8) {
            const riseFreq = 220 * Math.pow(2, (beatInBar - 8) / 12);
            this.playRiser(riseFreq);
        }
    }

    playShiftBassPattern(beatInBar, barNumber) {
        const patterns = [
            [0, 3, 6, 10],      // Syncopated
            [0, 4, 8, 12],      // Straight
            [0, 3, 7, 10, 14],  // Busy
            [0, 6, 10]          // Sparse
        ];

        const pattern = patterns[barNumber % patterns.length];
        if (pattern.includes(beatInBar)) {
            const bassNote = this.shiftBassNotes[barNumber % this.shiftBassNotes.length];
            const duration = (beatInBar === 0) ? this.beatDuration * 2 : this.beatDuration * 1.5;
            this.playShiftBass(bassNote, duration);
        }
    }

    playShiftBass(freq, duration) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const dist = this.ctx.createWaveShaperFunction ? null : this.ctx.createWaveShaper();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc2.type = 'square';
        osc2.frequency.value = freq;
        osc2.detune.value = -5;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + duration * 0.7);
        filter.Q.value = 8;

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
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

    playShiftArp(freq, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + this.beatDuration * 0.5);
        filter.Q.value = 4;

        const duration = this.beatDuration * 0.45;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShiftMelody(beatInBar, barNumber) {
        // Catchy melodic phrases
        const phrases = [
            { beats: [0, 2, 4, 7], notes: [0, 2, 4, 3] },
            { beats: [0, 3, 6, 8], notes: [2, 4, 5, 4] },
            { beats: [0, 4, 6, 10], notes: [5, 4, 3, 2] },
            { beats: [0, 2, 5, 8, 12], notes: [0, 2, 4, 5, 4] }
        ];

        const phrase = phrases[Math.floor(barNumber / 2) % phrases.length];
        const beatIndex = phrase.beats.indexOf(beatInBar);

        if (beatIndex !== -1) {
            const noteIndex = phrase.notes[beatIndex];
            const freq = this.shiftMelodyNotes[noteIndex % this.shiftMelodyNotes.length];
            this.playMelodyNote(freq);
        }
    }

    playMelodyNote(freq) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.value = freq;
        osc2.type = 'sawtooth';
        osc2.frequency.value = freq;
        osc2.detune.value = 7;

        filter.type = 'lowpass';
        filter.frequency.value = 2500;
        filter.Q.value = 1;

        const duration = this.beatDuration * 1.5;
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc2.start();
        osc.stop(this.ctx.currentTime + duration);
        osc2.stop(this.ctx.currentTime + duration);
    }

    playShiftStab(barNumber) {
        const chords = [
            [220, 277.18, 329.63],    // Am
            [261.63, 329.63, 392],    // C
            [293.66, 369.99, 440],    // Dm
            [196, 246.94, 293.66]     // G
        ];

        const chord = chords[barNumber % chords.length];
        chord.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = (i - 1) * 10;

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(4000, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.3);
            filter.Q.value = 3;

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        });
    }

    playOpenHat() {
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start();
    }

    playRiser(freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    // ==================== SHARED DRUM SOUNDS ====================

    scheduleMusicLoop(type) {
        if (!this.musicPlaying || !this.ctx) return;

        const scheduleNext = () => {
            if (!this.musicPlaying) return;

            if (type === 'shift') {
                this.playShiftBeat(this.currentBeat);
                this.currentBeat = (this.currentBeat + 1) % (this.barLength * 8);
            } else {
                this.playBaseBeat(this.currentBeat);
                this.currentBeat = (this.currentBeat + 1) % (this.barLength * 4);
            }

            const intervalId = setTimeout(scheduleNext, this.beatDuration * 1000);
            this.musicIntervals.push(intervalId);
        };

        scheduleNext();
    }

    playKick(volume = 0.6) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playSnare() {
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
}

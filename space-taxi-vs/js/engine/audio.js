class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.engineNodes = [null, null]; // One per player
        this.reloadNodes = [null, null]; // One per player for ammo reload
        this.initialized = false;
        this.musicPlaying = false;
        this.musicIntervals = [];
    }

    init() {
        if (this.initialized) return;

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Separate gain for music (lower volume)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.25;
        this.musicGain.connect(this.ctx.destination);

        // Create engine sound nodes for both players
        for (let i = 0; i < 2; i++) {
            this.engineNodes[i] = this.createEngineNode();
            this.reloadNodes[i] = this.createReloadNode();
        }

        this.initialized = true;

        // Start background music
        this.startMusic();
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
        if (!this.musicPlaying || !this.initialized) return;

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

/**
 * Procedural Audio System
 * Generates dark ambient drone and creepy sounds using Web Audio API
 */

let audioContext = null;
let ambientGain = null;
let isAudioStarted = false;

export function initAudio() {
    if (isAudioStarted) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    ambientGain = audioContext.createGain();
    ambientGain.gain.value = 1;
    ambientGain.connect(audioContext.destination);

    // Create dark ambient drone
    createDrone(55, 0.12);    // Low bass drone
    createDrone(82.5, 0.06);  // Fifth above
    createDrone(110, 0.03);   // Octave

    // Create eerie high tone
    createEerieTone();

    // Random creepy sounds
    scheduleCreepySounds();

    isAudioStarted = true;
}

function createDrone(frequency, volume) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = frequency;

    // Slow LFO for pitch wobble
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.frequency.value = 0.1 + Math.random() * 0.2;
    lfoGain.gain.value = frequency * 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 2;

    gain.gain.value = volume;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ambientGain);

    osc.start();
}

function createEerieTone() {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = 440;

    // Slow pitch drift
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    // Volume modulation
    const volLfo = audioContext.createOscillator();
    const volLfoGain = audioContext.createGain();
    volLfo.frequency.value = 0.08;
    volLfoGain.gain.value = 0.015;
    volLfo.connect(volLfoGain);
    volLfoGain.connect(gain.gain);
    volLfo.start();

    filter.type = 'bandpass';
    filter.frequency.value = 450;
    filter.Q.value = 15;

    gain.gain.value = 0.02;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ambientGain);

    osc.start();
}

function scheduleCreepySounds() {
    function playCreepySound() {
        if (!audioContext || audioContext.state === 'closed') return;

        const rand = Math.random();

        if (rand < 0.3) {
            // Metallic clang
            playMetallicClang();
        } else if (rand < 0.6) {
            // Low rumble
            playLowRumble();
        } else {
            // Breath/wind sound
            playWindSound();
        }

        // Schedule next creepy sound
        const nextTime = 3000 + Math.random() * 8000;
        setTimeout(playCreepySound, nextTime);
    }

    // Start first creepy sound after delay
    setTimeout(playCreepySound, 2000);
}

function playMetallicClang() {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.value = 100 + Math.random() * 200;

    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 10;

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.setTargetAtTime(0.001, audioContext.currentTime, 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ambientGain);

    osc.start();
    osc.stop(audioContext.currentTime + 1);
}

function playLowRumble() {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 30 + Math.random() * 20;

    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

    osc.connect(gain);
    gain.connect(ambientGain);

    osc.start();
    osc.stop(audioContext.currentTime + 2);
}

function playWindSound() {
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400 + Math.random() * 300;
    filter.Q.value = 5;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ambientGain);

    noise.start();
}

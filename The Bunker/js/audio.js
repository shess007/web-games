/**
 * Procedural Audio System
 * Generates dark ambient drone and creepy sounds using Web Audio API
 */

let audioContext = null;
let ambientGain = null;
let isAudioStarted = false;

// Footstep system
let footstepGain = null;
const FOOTSTEP_INTERVAL = 0.35; // Time between footsteps in seconds
let player1FootstepTimer = 0;
let player2FootstepTimer = 0;

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

    // Initialize footstep audio
    footstepGain = audioContext.createGain();
    footstepGain.gain.value = 0.8;
    footstepGain.connect(audioContext.destination);

    isAudioStarted = true;
}

/**
 * Play a footstep sound with 3D positioning
 * @param {number} sourceX - X position of the sound source
 * @param {number} sourceZ - Z position of the sound source
 * @param {number} listenerX - X position of the listener
 * @param {number} listenerZ - Z position of the listener
 * @param {number} listenerRotation - Rotation of the listener (radians)
 * @param {boolean} isOwnFootstep - Whether this is the listener's own footstep
 */
function playFootstep(sourceX, sourceZ, listenerX, listenerZ, listenerRotation, isOwnFootstep) {
    if (!audioContext || !footstepGain) return;

    // Calculate distance and relative position
    const dx = sourceX - listenerX;
    const dz = sourceZ - listenerZ;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Calculate volume based on distance (louder when closer)
    const maxDistance = 25;
    let volume = isOwnFootstep ? 0.15 : Math.max(0, 1 - (distance / maxDistance));

    // Own footsteps are quieter but always audible
    if (isOwnFootstep) {
        volume = 0.12 + Math.random() * 0.05;
    }

    if (volume <= 0) return;

    // Calculate stereo panning based on relative angle
    let pan = 0;
    if (!isOwnFootstep && distance > 0.5) {
        // Calculate angle to source relative to listener's facing direction
        const angleToSource = Math.atan2(dx, dz);
        const relativeAngle = angleToSource - listenerRotation;
        pan = Math.sin(relativeAngle) * Math.min(1, distance / 5);
    }

    // Create footstep sound
    createFootstepSound(volume, pan, isOwnFootstep);
}

function createFootstepSound(volume, pan, isOwnFootstep) {
    const now = audioContext.currentTime;

    // Create noise burst for footstep
    const bufferSize = audioContext.sampleRate * 0.08;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        // Envelope: quick attack, quick decay
        const env = Math.exp(-i / (bufferSize * 0.15));
        data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    // Low-pass filter for muffled concrete footstep
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = isOwnFootstep ? 800 : 600 + Math.random() * 400;
    filter.Q.value = 1;

    // Add slight resonance for impact
    const resonance = audioContext.createBiquadFilter();
    resonance.type = 'peaking';
    resonance.frequency.value = 100 + Math.random() * 50;
    resonance.gain.value = 6;
    resonance.Q.value = 2;

    // Gain node for volume
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(volume * (0.8 + Math.random() * 0.4), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    // Stereo panner
    const panner = audioContext.createStereoPanner();
    panner.pan.value = pan;

    // Connect nodes
    noise.connect(filter);
    filter.connect(resonance);
    resonance.connect(gain);
    gain.connect(panner);
    panner.connect(footstepGain);

    noise.start(now);
    noise.stop(now + 0.15);

    // Add subtle low thud for weight
    const thud = audioContext.createOscillator();
    const thudGain = audioContext.createGain();
    const thudPanner = audioContext.createStereoPanner();

    thud.type = 'sine';
    thud.frequency.setValueAtTime(60 + Math.random() * 20, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.1);

    thudGain.gain.setValueAtTime(volume * 0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    thudPanner.pan.value = pan;

    thud.connect(thudGain);
    thudGain.connect(thudPanner);
    thudPanner.connect(footstepGain);

    thud.start(now);
    thud.stop(now + 0.15);
}

/**
 * Update footstep sounds based on player movement
 * Call this every frame from the game loop
 */
export function updateFootsteps(delta, p1, p2, p1Moving, p2Moving) {
    if (!audioContext || !isAudioStarted) return;

    // Player 1 footsteps
    if (p1Moving) {
        player1FootstepTimer += delta;
        if (player1FootstepTimer >= FOOTSTEP_INTERVAL) {
            player1FootstepTimer = 0;
            // Play footstep for both listeners
            // P1 hears their own footstep (quiet)
            playFootstep(p1.x, p1.z, p1.x, p1.z, p1.rotation, true);
            // P2 hears P1's footstep (3D positioned)
            playFootstep(p1.x, p1.z, p2.x, p2.z, p2.rotation, false);
        }
    } else {
        player1FootstepTimer = FOOTSTEP_INTERVAL * 0.8; // Ready to play soon when moving again
    }

    // Player 2 footsteps
    if (p2Moving) {
        player2FootstepTimer += delta;
        if (player2FootstepTimer >= FOOTSTEP_INTERVAL) {
            player2FootstepTimer = 0;
            // P2 hears their own footstep (quiet)
            playFootstep(p2.x, p2.z, p2.x, p2.z, p2.rotation, true);
            // P1 hears P2's footstep (3D positioned)
            playFootstep(p2.x, p2.z, p1.x, p1.z, p1.rotation, false);
        }
    } else {
        player2FootstepTimer = FOOTSTEP_INTERVAL * 0.8;
    }
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

import { CONFIG } from './config.js';

/**
 * Procedural Texture Generation using Canvas API
 */

export function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base concrete color
    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 0, 512, 512);

    // Add noise/grain
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const brightness = 30 + Math.random() * 40;
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.4)`;
        ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }

    // Add horizontal concrete lines/seams
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    for (let y = 64; y < 512; y += 128) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.random() * 4 - 2);
        ctx.lineTo(512, y + Math.random() * 4 - 2);
        ctx.stroke();
    }

    // Add vertical seams
    for (let x = 128; x < 512; x += 256) {
        ctx.beginPath();
        ctx.moveTo(x + Math.random() * 4 - 2, 0);
        ctx.lineTo(x + Math.random() * 4 - 2, 512);
        ctx.stroke();
    }

    // Add some cracks
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const startX = Math.random() * 512;
        const startY = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        let x = startX, y = startY;
        for (let j = 0; j < 8; j++) {
            x += Math.random() * 40 - 20;
            y += Math.random() * 60;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Add stains/water damage
    for (let i = 0; i < 3; i++) {
        const x = Math.random() * 400 + 50;
        const y = Math.random() * 200;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y + 100, 150);
        gradient.addColorStop(0, 'rgba(15, 12, 10, 0.4)');
        gradient.addColorStop(1, 'rgba(15, 12, 10, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 100, y, 200, 300);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
}

export function createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Concrete base
    ctx.fillStyle = '#252525';
    ctx.fillRect(0, 0, 512, 512);

    // Add grid pattern for tiles
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    const tileSize = 128;
    for (let x = 0; x <= 512; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
    }

    // Add dirt and grime
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const brightness = Math.random() * 20;
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.3)`;
        ctx.fillRect(x, y, Math.random() * 4 + 1, Math.random() * 4 + 1);
    }

    // Add some dark puddle stains
    for (let i = 0; i < 4; i++) {
        const x = Math.random() * 400 + 50;
        const y = Math.random() * 400 + 50;
        const radius = Math.random() * 60 + 30;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(5, 5, 8, 0.6)');
        gradient.addColorStop(0.7, 'rgba(5, 5, 8, 0.3)');
        gradient.addColorStop(1, 'rgba(5, 5, 8, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(CONFIG.MAZE_SIZE, CONFIG.MAZE_SIZE);
    return texture;
}

export function createCeilingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark ceiling base
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 256, 256);

    // Add panels
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 256; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
    }

    // Add some rust stains dripping down
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 100;
        ctx.fillStyle = 'rgba(20, 10, 5, 0.3)';
        ctx.fillRect(x - 2, y, 4, Math.random() * 80 + 20);
    }

    // Add dust/cobwebs
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const brightness = Math.random() * 15;
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.2)`;
        ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(CONFIG.MAZE_SIZE * 2, CONFIG.MAZE_SIZE * 2);
    return texture;
}

export function createNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Neutral normal (pointing up in tangent space)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    // Add bumps for concrete texture
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 4 + 1;
        const r = 128 + (Math.random() - 0.5) * 30;
        const g = 128 + (Math.random() - 0.5) * 30;
        ctx.fillStyle = `rgb(${r}, ${g}, 255)`;
        ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

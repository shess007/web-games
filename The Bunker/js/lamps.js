import { CONFIG } from './config.js';
import { scene, lamps, addLamp, resetLamps } from './state.js';

/**
 * Ceiling Lamps with different states (normal, flickering, broken)
 */

export function createLamps() {
    resetLamps();

    const lampGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.15, 8);
    const lampHousingGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.1, 8);
    const bulbGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const cageGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8, 1, true);

    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.8
    });

    const cageMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.6,
        wireframe: true
    });

    // Place lamps in some cells (sparse for dark atmosphere)
    for (let y = 0; y < CONFIG.MAZE_SIZE; y++) {
        for (let x = 0; x < CONFIG.MAZE_SIZE; x++) {
            // Only place lamp in ~25% of cells
            if (Math.random() > 0.25) continue;

            const cx = x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
            const cz = y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;

            // Determine lamp state - mostly normal, few flickering
            const rand = Math.random();
            let state = 'normal';
            if (rand < 0.12) state = 'broken';
            else if (rand < 0.22) state = 'flickering'; // Only ~10% flicker

            // Create lamp fixture group
            const lampGroup = new THREE.Group();
            lampGroup.position.set(cx, CONFIG.WALL_HEIGHT - 0.1, cz);

            // Housing
            const housing = new THREE.Mesh(lampGeometry, metalMaterial);
            lampGroup.add(housing);

            // Inner housing
            const innerHousing = new THREE.Mesh(lampHousingGeometry, metalMaterial);
            innerHousing.position.y = -0.1;
            lampGroup.add(innerHousing);

            // Cage
            const cage = new THREE.Mesh(cageGeometry, cageMaterial);
            cage.position.y = -0.25;
            lampGroup.add(cage);

            // Bulb
            const bulbColor = state === 'broken' ? 0x222211 : 0xffeeaa;
            const bulbMaterial = new THREE.MeshBasicMaterial({
                color: bulbColor,
                transparent: true,
                opacity: state === 'broken' ? 0.4 : 0.9
            });
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
            bulb.position.y = -0.2;
            lampGroup.add(bulb);

            scene.add(lampGroup);

            // Add point light for working lamps
            let light = null;
            if (state !== 'broken') {
                light = new THREE.PointLight(0xffddaa, 1.5, 15);
                light.position.set(cx, CONFIG.WALL_HEIGHT - 0.8, cz);
                scene.add(light);
            }

            addLamp({
                group: lampGroup,
                bulb: bulb,
                bulbMaterial: bulbMaterial,
                light: light,
                state: state,
                flickerTime: Math.random() * 100,
                flickerSpeed: 2 + Math.random() * 8,
                flickerIntensity: 0.4 + Math.random() * 0.6,
                baseIntensity: 1.5,
                // Random timing for irregular flicker
                nextFlickerChange: Math.random() * 2,
                flickerPause: false
            });
        }
    }
}

export function updateLamps(delta) {
    for (const lamp of lamps) {
        if (lamp.state === 'flickering' && lamp.light) {
            lamp.flickerTime += delta;
            lamp.nextFlickerChange -= delta;

            // Random state changes for irregular flickering
            if (lamp.nextFlickerChange <= 0) {
                lamp.flickerPause = Math.random() < 0.3; // 30% chance to pause
                lamp.nextFlickerChange = 0.5 + Math.random() * 3; // Random interval 0.5-3.5s
                lamp.flickerSpeed = 2 + Math.random() * 12; // Randomize speed
            }

            if (lamp.flickerPause) {
                // Lamp is temporarily stable
                lamp.light.intensity = lamp.baseIntensity * 0.8;
                lamp.bulbMaterial.opacity = 0.85;
            } else {
                // Active flickering with random patterns
                const t = lamp.flickerTime * lamp.flickerSpeed;
                const flicker1 = Math.sin(t * 1.7) * 0.5 + 0.5;
                const flicker2 = Math.sin(t * 4.3) * 0.5 + 0.5;
                const randomCut = Math.random() > 0.92 ? 0.1 : 1; // Random brief cuts

                const intensity = (flicker1 * 0.5 + flicker2 * 0.3 + randomCut * 0.2) * lamp.flickerIntensity;
                lamp.light.intensity = intensity * lamp.baseIntensity;
                lamp.bulbMaterial.opacity = 0.3 + intensity * 0.6;

                // Occasional longer blackouts
                if (Math.random() < 0.005) {
                    lamp.light.intensity = lamp.baseIntensity * 0.1;
                    lamp.bulbMaterial.opacity = 0.2;
                }
            }
        }
    }
}

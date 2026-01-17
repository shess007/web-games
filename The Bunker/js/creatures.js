import { scene, player1, player2, player1Mesh, player2Mesh, setPlayer1Mesh, setPlayer2Mesh } from './state.js';

/**
 * Player Creature Models - Underground humanoid creatures
 */

export function createCreature(color, isPlayer1) {
    const creature = new THREE.Group();

    // Color variations
    const skinColor = isPlayer1 ? 0x3a4a6a : 0x6a3a3a;
    const eyeColor = isPlayer1 ? 0x4488ff : 0xff4444;

    const skinMaterial = new THREE.MeshStandardMaterial({
        color: skinColor,
        roughness: 0.9,
        metalness: 0.1
    });

    const darkSkinMaterial = new THREE.MeshStandardMaterial({
        color: isPlayer1 ? 0x2a3a4a : 0x4a2a2a,
        roughness: 0.95,
        metalness: 0.05
    });

    // Hunched body/torso
    const torsoGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    torsoGeometry.scale(1, 1.2, 0.9);
    const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
    torso.position.y = 0.8;
    torso.rotation.x = 0.4;
    creature.add(torso);

    // Spine bumps
    for (let i = 0; i < 5; i++) {
        const bumpGeometry = new THREE.SphereGeometry(0.08 - i * 0.01, 6, 6);
        const bump = new THREE.Mesh(bumpGeometry, darkSkinMaterial);
        bump.position.set(0, 0.9 + i * 0.12, -0.25 + i * 0.05);
        creature.add(bump);
    }

    // Head - elongated and unsettling
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    headGeometry.scale(0.9, 1.1, 1.2);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(0, 1.35, 0.15);
    creature.add(head);

    // Sunken eye sockets
    const socketGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    const socketMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const leftSocket = new THREE.Mesh(socketGeometry, socketMaterial);
    leftSocket.position.set(-0.1, 1.4, 0.35);
    creature.add(leftSocket);

    const rightSocket = new THREE.Mesh(socketGeometry, socketMaterial);
    rightSocket.position.set(0.1, 1.4, 0.35);
    creature.add(rightSocket);

    // Glowing eyes
    const eyeGeometry = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({
        color: eyeColor,
        transparent: true,
        opacity: 0.9
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.4, 0.38);
    creature.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.4, 0.38);
    creature.add(rightEye);

    // Add eye glow light
    const eyeLight = new THREE.PointLight(eyeColor, 0.3, 3);
    eyeLight.position.set(0, 1.4, 0.4);
    creature.add(eyeLight);

    // Mouth - wide gash
    const mouthGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.05);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x1a0a0a });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.25, 0.38);
    creature.add(mouth);

    // Arms
    createArms(creature, skinMaterial, darkSkinMaterial);

    // Legs
    createLegs(creature, skinMaterial, darkSkinMaterial);

    // Store reference to eyes for animation
    creature.userData.leftEye = leftEye;
    creature.userData.rightEye = rightEye;
    creature.userData.eyeLight = eyeLight;
    creature.userData.eyeMaterial = eyeMaterial;

    return creature;
}

function createArms(creature, skinMaterial, darkSkinMaterial) {
    const armGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.6, 6);
    const forearmGeometry = new THREE.CylinderGeometry(0.03, 0.025, 0.5, 6);
    const handGeometry = new THREE.SphereGeometry(0.06, 6, 6);
    const clawGeometry = new THREE.ConeGeometry(0.015, 0.08, 4);
    const clawMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    // Left arm
    const leftUpperArm = new THREE.Mesh(armGeometry, skinMaterial);
    leftUpperArm.position.set(-0.4, 0.7, 0);
    leftUpperArm.rotation.z = 0.8;
    leftUpperArm.rotation.x = 0.3;
    creature.add(leftUpperArm);

    const leftForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
    leftForearm.position.set(-0.65, 0.35, 0.15);
    leftForearm.rotation.z = 0.3;
    leftForearm.rotation.x = -0.5;
    creature.add(leftForearm);

    const leftHand = new THREE.Mesh(handGeometry, darkSkinMaterial);
    leftHand.position.set(-0.7, 0.1, 0.3);
    creature.add(leftHand);

    // Right arm
    const rightUpperArm = new THREE.Mesh(armGeometry, skinMaterial);
    rightUpperArm.position.set(0.4, 0.7, 0);
    rightUpperArm.rotation.z = -0.8;
    rightUpperArm.rotation.x = 0.3;
    creature.add(rightUpperArm);

    const rightForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
    rightForearm.position.set(0.65, 0.35, 0.15);
    rightForearm.rotation.z = -0.3;
    rightForearm.rotation.x = -0.5;
    creature.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeometry, darkSkinMaterial);
    rightHand.position.set(0.7, 0.1, 0.3);
    creature.add(rightHand);

    // Claws
    for (let i = 0; i < 3; i++) {
        const leftClaw = new THREE.Mesh(clawGeometry, clawMaterial);
        leftClaw.position.set(-0.72 + i * 0.03, 0.05, 0.35);
        leftClaw.rotation.x = -0.5;
        creature.add(leftClaw);

        const rightClaw = new THREE.Mesh(clawGeometry, clawMaterial);
        rightClaw.position.set(0.68 + i * 0.03, 0.05, 0.35);
        rightClaw.rotation.x = -0.5;
        creature.add(rightClaw);
    }
}

function createLegs(creature, skinMaterial, darkSkinMaterial) {
    const thighGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 6);
    const shinGeometry = new THREE.CylinderGeometry(0.045, 0.035, 0.45, 6);
    const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.25);

    // Left leg
    const leftThigh = new THREE.Mesh(thighGeometry, skinMaterial);
    leftThigh.position.set(-0.15, 0.45, -0.1);
    leftThigh.rotation.x = 0.3;
    creature.add(leftThigh);

    const leftShin = new THREE.Mesh(shinGeometry, skinMaterial);
    leftShin.position.set(-0.15, 0.15, 0.05);
    leftShin.rotation.x = -0.4;
    creature.add(leftShin);

    const leftFoot = new THREE.Mesh(footGeometry, darkSkinMaterial);
    leftFoot.position.set(-0.15, 0.02, 0.2);
    creature.add(leftFoot);

    // Right leg
    const rightThigh = new THREE.Mesh(thighGeometry, skinMaterial);
    rightThigh.position.set(0.15, 0.45, -0.1);
    rightThigh.rotation.x = 0.3;
    creature.add(rightThigh);

    const rightShin = new THREE.Mesh(shinGeometry, skinMaterial);
    rightShin.position.set(0.15, 0.15, 0.05);
    rightShin.rotation.x = -0.4;
    creature.add(rightShin);

    const rightFoot = new THREE.Mesh(footGeometry, darkSkinMaterial);
    rightFoot.position.set(0.15, 0.02, 0.2);
    creature.add(rightFoot);
}

export function createPlayerMeshes() {
    // Player 1 mesh - visible only to camera 2 (layer 1)
    const mesh1 = createCreature(0x4444ff, true);
    setLayerRecursive(mesh1, 1);
    scene.add(mesh1);
    setPlayer1Mesh(mesh1);

    // Player 2 mesh - visible only to camera 1 (layer 2)
    const mesh2 = createCreature(0xff4444, false);
    setLayerRecursive(mesh2, 2);
    scene.add(mesh2);
    setPlayer2Mesh(mesh2);
}

// Helper to set layer for object and all children
function setLayerRecursive(object, layer) {
    object.layers.set(layer);
    object.traverse((child) => {
        child.layers.set(layer);
    });
}

export function updatePlayerMeshes() {
    // Update player 1 mesh position and rotation
    player1Mesh.position.set(player1.x, 0, player1.z);
    player1Mesh.rotation.y = player1.rotation + Math.PI;

    // Update player 2 mesh position and rotation
    player2Mesh.position.set(player2.x, 0, player2.z);
    player2Mesh.rotation.y = player2.rotation + Math.PI;

    // Subtle idle animation - eye flicker
    const time = Date.now() * 0.001;
    const eyeFlicker1 = 0.7 + Math.sin(time * 3) * 0.3;
    const eyeFlicker2 = 0.7 + Math.sin(time * 3.5 + 1) * 0.3;

    player1Mesh.userData.eyeMaterial.opacity = eyeFlicker1;
    player1Mesh.userData.eyeLight.intensity = eyeFlicker1 * 0.3;

    player2Mesh.userData.eyeMaterial.opacity = eyeFlicker2;
    player2Mesh.userData.eyeLight.intensity = eyeFlicker2 * 0.3;
}

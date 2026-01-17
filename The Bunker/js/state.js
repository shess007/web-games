import { CONFIG } from './config.js';

/**
 * Game State Management
 */
export const gameState = {
    phase: 'gameplay', // 'gameplay' or 'map'
    timer: CONFIG.GAMEPLAY_DURATION,
    isRunning: false,
    winner: null
};

// Three.js components
export let scene = null;
export let renderer = null;
export let camera1 = null;
export let camera2 = null;

// Player data
export let player1 = null;
export let player2 = null;
export let player1Mesh = null;
export let player2Mesh = null;

// World data
export let maze = [];
export let walls = [];
export let lamps = [];

// Input state
export const keys = {};

// Camera bobbing
export let player1BobPhase = 0;
export let player2BobPhase = 0;

// Timing
export let lastTime = 0;
export let phaseTimer = 0;

// Setters for module variables
export function setScene(s) { scene = s; }
export function setRenderer(r) { renderer = r; }
export function setCamera1(c) { camera1 = c; }
export function setCamera2(c) { camera2 = c; }
export function setPlayer1(p) { player1 = p; }
export function setPlayer2(p) { player2 = p; }
export function setPlayer1Mesh(m) { player1Mesh = m; }
export function setPlayer2Mesh(m) { player2Mesh = m; }
export function setMaze(m) { maze = m; }
export function setWalls(w) { walls = w; }
export function setLamps(l) { lamps = l; }
export function setPlayer1BobPhase(p) { player1BobPhase = p; }
export function setPlayer2BobPhase(p) { player2BobPhase = p; }
export function setLastTime(t) { lastTime = t; }
export function setPhaseTimer(t) { phaseTimer = t; }

export function resetWalls() { walls = []; }
export function resetLamps() { lamps = []; }
export function addWall(wall) { walls.push(wall); }
export function addLamp(lamp) { lamps.push(lamp); }

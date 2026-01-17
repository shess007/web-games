class InputManager {
    constructor() {
        this.keys = {};
        this.gamepads = [null, null];
        this.gamepadDeadzone = 0.3;

        this.initKeyboard();
        this.initGamepad();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Prevent default for game keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    initGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad ${e.gamepad.index} connected: ${e.gamepad.id}`);
            if (e.gamepad.index < 2) {
                this.gamepads[e.gamepad.index] = e.gamepad;
            }
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log(`Gamepad ${e.gamepad.index} disconnected`);
            if (e.gamepad.index < 2) {
                this.gamepads[e.gamepad.index] = null;
            }
        });
    }

    updateGamepads() {
        const pads = navigator.getGamepads();
        for (let i = 0; i < 2; i++) {
            if (pads[i]) {
                this.gamepads[i] = pads[i];
            }
        }
    }

    getPlayerInput(playerNum) {
        const keyMap = playerNum === 1 ? KEYS_P1 : KEYS_P2;
        const gamepadIndex = playerNum - 1;

        const input = {
            up: false,
            left: false,
            right: false,
            shoot: false
        };

        // Check keyboard
        input.up = keyMap.up.some(k => this.keys[k]);
        input.left = keyMap.left.some(k => this.keys[k]);
        input.right = keyMap.right.some(k => this.keys[k]);
        input.shoot = keyMap.shoot.some(k => this.keys[k]);

        // Check gamepad
        this.updateGamepads();
        const pad = this.gamepads[gamepadIndex];
        if (pad) {
            // Left stick horizontal
            if (pad.axes[0] < -this.gamepadDeadzone) input.left = true;
            if (pad.axes[0] > this.gamepadDeadzone) input.right = true;

            // D-pad (buttons 12-15: up, down, left, right)
            if (pad.buttons[14]?.pressed) input.left = true;
            if (pad.buttons[15]?.pressed) input.right = true;
            if (pad.buttons[12]?.pressed) input.up = true;

            // A button (button 0) or left stick up for thrust
            if (pad.buttons[0]?.pressed) input.up = true;
            if (pad.axes[1] < -this.gamepadDeadzone) input.up = true;

            // Right trigger (button 7) or B button (button 1) for shoot
            if (pad.buttons[7]?.pressed || pad.buttons[1]?.pressed) input.shoot = true;
        }

        return input;
    }

    isKeyPressed(code) {
        return this.keys[code] || false;
    }

    anyKeyPressed() {
        return Object.values(this.keys).some(v => v);
    }

    clearKey(code) {
        this.keys[code] = false;
    }

    // Check if any gamepad has a start/confirm button pressed (for menus)
    isGamepadStartPressed() {
        this.updateGamepads();
        for (const pad of this.gamepads) {
            if (pad) {
                // A button (0), Start button (9)
                if (pad.buttons[0]?.pressed || pad.buttons[9]?.pressed) {
                    return true;
                }
            }
        }
        return false;
    }
}

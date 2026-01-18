// Input Handler

/**
 * Creates an input manager instance
 * @param {Object} state - Game state reference
 * @param {HTMLCanvasElement} canvas - Game canvas for touch events
 * @returns {Object} Input manager API
 */
export function createInputManager(state, canvas) {
    let touchStartX = 0;
    let touchStartY = 0;
    let usingTouch = false;

    // Event handler references for cleanup
    const handlers = {
        devicemotion: null,
        touchstart: null,
        touchmove: null,
        touchend: null,
        touchmoveBody: null,
        keydown: null,
        keyup: null
    };

    /**
     * Handles device motion events
     * @param {DeviceMotionEvent} event
     */
    function handleMotion(event) {
        const { accelerationIncludingGravity } = event;
        if (!accelerationIncludingGravity) return;

        let x = accelerationIncludingGravity.x || 0;
        let y = accelerationIncludingGravity.y || 0;

        // Adjust for portrait orientation (marble rolls "downhill")
        state.tilt.x = x;
        state.tilt.y = -y;
    }

    /**
     * Handles touch start events
     * @param {TouchEvent} event
     */
    function handleTouchStart(event) {
        if (!state.playing) return;
        event.preventDefault();
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        usingTouch = true;
    }

    /**
     * Handles touch move events
     * @param {TouchEvent} event
     */
    function handleTouchMove(event) {
        if (!state.playing || !usingTouch) return;
        event.preventDefault();
        const touch = event.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        // Apply as tilt (scaled down)
        state.tilt.x = Math.max(-10, Math.min(10, deltaX * 0.15));
        state.tilt.y = Math.max(-10, Math.min(10, deltaY * 0.15));
    }

    /**
     * Handles touch end events
     */
    function handleTouchEnd() {
        state.tilt.x = 0;
        state.tilt.y = 0;
        usingTouch = false;
    }

    /**
     * Handles body touch move to prevent scrolling
     * @param {TouchEvent} event
     */
    function handleBodyTouchMove(event) {
        if (event.target === canvas) {
            event.preventDefault();
        }
    }

    /**
     * Handles keyboard down events
     * @param {KeyboardEvent} event
     */
    function handleKeyDown(event) {
        const force = 5;
        switch(event.key) {
            case 'ArrowLeft': state.tilt.x = -force; break;
            case 'ArrowRight': state.tilt.x = force; break;
            case 'ArrowUp': state.tilt.y = -force; break;
            case 'ArrowDown': state.tilt.y = force; break;
        }
    }

    /**
     * Handles keyboard up events
     * @param {KeyboardEvent} event
     */
    function handleKeyUp(event) {
        if (['ArrowLeft', 'ArrowRight'].includes(event.key)) state.tilt.x = 0;
        if (['ArrowUp', 'ArrowDown'].includes(event.key)) state.tilt.y = 0;
    }

    /**
     * Requests motion permission for iOS devices
     * @returns {Promise<boolean>} True if motion enabled
     */
    async function requestMotionPermission() {
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    handlers.devicemotion = handleMotion;
                    console.log('Motion permission granted');
                    return true;
                } else {
                    console.log('Motion permission denied - using touch controls');
                    return false;
                }
            } catch (e) {
                console.log('Motion permission error - using touch controls', e);
                return false;
            }
        } else if (typeof DeviceMotionEvent !== 'undefined') {
            // Non-iOS browsers - just add listener
            window.addEventListener('devicemotion', handleMotion);
            handlers.devicemotion = handleMotion;
            console.log('Motion events enabled (no permission needed)');
            return true;
        } else {
            console.log('No motion support - using touch controls');
            return false;
        }
    }

    /**
     * Initializes all input listeners
     */
    function init() {
        // Touch controls
        handlers.touchstart = handleTouchStart;
        handlers.touchmove = handleTouchMove;
        handlers.touchend = handleTouchEnd;
        handlers.touchmoveBody = handleBodyTouchMove;
        handlers.keydown = handleKeyDown;
        handlers.keyup = handleKeyUp;

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);

        document.body.addEventListener('touchmove', handleBodyTouchMove, { passive: false });

        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }

    /**
     * Removes all input listeners
     */
    function destroy() {
        if (handlers.devicemotion) {
            window.removeEventListener('devicemotion', handlers.devicemotion);
        }
        canvas.removeEventListener('touchstart', handlers.touchstart);
        canvas.removeEventListener('touchmove', handlers.touchmove);
        canvas.removeEventListener('touchend', handlers.touchend);
        document.body.removeEventListener('touchmove', handlers.touchmoveBody);
        document.removeEventListener('keydown', handlers.keydown);
        document.removeEventListener('keyup', handlers.keyup);
    }

    /**
     * Triggers haptic feedback
     */
    function triggerHaptic() {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }

    /**
     * Triggers celebration haptic pattern
     */
    function triggerCelebrationHaptic() {
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50, 50, 100]);
        }
    }

    return {
        init,
        destroy,
        requestMotionPermission,
        triggerHaptic,
        triggerCelebrationHaptic
    };
}

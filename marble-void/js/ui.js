// UI Controller

/**
 * Creates a UI controller instance
 * @param {Object} elements - DOM element references
 * @returns {Object} UI controller API
 */
export function createUI(elements) {
    const {
        startScreen,
        winScreen,
        hud,
        levelNum,
        timerDisplay,
        winTime,
        startBtn,
        nextBtn
    } = elements;

    /**
     * Shows the start screen
     */
    function showStart() {
        startScreen.classList.remove('hidden');
        winScreen.classList.remove('visible');
        hud.classList.remove('visible');
    }

    /**
     * Hides the start screen and shows HUD
     */
    function hideStart() {
        startScreen.classList.add('hidden');
        hud.classList.add('visible');
    }

    /**
     * Shows the win screen with elapsed time
     * @param {number} elapsedMs - Elapsed time in milliseconds
     */
    function showWin(elapsedMs) {
        const seconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        winTime.textContent = 'TIME: ' +
            String(minutes).padStart(2, '0') + ':' +
            String(secs).padStart(2, '0');

        winScreen.classList.add('visible');
    }

    /**
     * Hides the win screen
     */
    function hideWin() {
        winScreen.classList.remove('visible');
    }

    /**
     * Hides all overlay screens
     */
    function hideScreens() {
        startScreen.classList.add('hidden');
        winScreen.classList.remove('visible');
    }

    /**
     * Updates the timer display
     * @param {number} elapsedMs - Elapsed time in milliseconds
     */
    function updateTimer(elapsedMs) {
        const seconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        timerDisplay.textContent =
            String(minutes).padStart(2, '0') + ':' +
            String(secs).padStart(2, '0');
    }

    /**
     * Updates the level display
     * @param {number} level - Current level number
     */
    function updateLevel(level) {
        levelNum.textContent = level;
    }

    /**
     * Sets up button click handlers
     * @param {Function} onStart - Start button callback
     * @param {Function} onNext - Next level button callback
     */
    function setupButtons(onStart, onNext) {
        function handleStart(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Start button pressed');
            onStart();
        }

        function handleNext(e) {
            e.preventDefault();
            e.stopPropagation();
            onNext();
        }

        startBtn.addEventListener('click', handleStart);
        startBtn.addEventListener('touchstart', handleStart, { passive: false });

        nextBtn.addEventListener('click', handleNext);
        nextBtn.addEventListener('touchstart', handleNext, { passive: false });
    }

    return {
        showStart,
        hideStart,
        showWin,
        hideWin,
        hideScreens,
        updateTimer,
        updateLevel,
        setupButtons
    };
}

/**
 * PixiRenderer Minimap Module
 * Handles minimap rendering (Canvas 2D)
 */

const PixiMinimapMixin = {
    setMinimapContainer(container) {
        if (!container) return;
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.width = 160;
        this.minimapCanvas.height = 120;
        this.minimapCanvas.style.width = '100%';
        this.minimapCanvas.style.height = '100%';
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        container.innerHTML = '';
        container.appendChild(this.minimapCanvas);
    },

    drawMinimap(state) {
        const mCtx = this.minimapCtx;
        const level = state.level;
        if (!level || !mCtx) return;

        const scaleW = 160 / level.w;
        const scaleH = 120 / level.h;

        // Dark background
        mCtx.fillStyle = 'rgba(0, 5, 15, 0.9)';
        mCtx.fillRect(0, 0, 160, 120);

        // Grid lines
        mCtx.strokeStyle = 'rgba(0, 100, 150, 0.2)';
        mCtx.lineWidth = 0.5;
        for (let i = 0; i < 160; i += 20) {
            mCtx.beginPath();
            mCtx.moveTo(i, 0);
            mCtx.lineTo(i, 120);
            mCtx.stroke();
        }
        for (let i = 0; i < 120; i += 20) {
            mCtx.beginPath();
            mCtx.moveTo(0, i);
            mCtx.lineTo(160, i);
            mCtx.stroke();
        }

        // Asteroids
        mCtx.fillStyle = '#6a5040';
        level.asteroids?.forEach(a => {
            const size = Math.max(3, a.size * scaleW * 0.8);
            mCtx.beginPath();
            mCtx.arc(a.x * scaleW, a.y * scaleH, size, 0, Math.PI * 2);
            mCtx.fill();
        });

        // Debris
        mCtx.fillStyle = '#555';
        level.debris?.forEach(d => {
            mCtx.fillRect(d.x * scaleW - 1, d.y * scaleH - 1, 2, 2);
        });

        // Meteors
        level.meteors?.forEach(m => {
            mCtx.fillStyle = '#ff6600';
            mCtx.beginPath();
            mCtx.arc(m.x * scaleW, m.y * scaleH, 3, 0, Math.PI * 2);
            mCtx.fill();

            mCtx.strokeStyle = '#ff9944';
            mCtx.lineWidth = 1;
            mCtx.beginPath();
            mCtx.moveTo(m.x * scaleW, m.y * scaleH);
            mCtx.lineTo((m.x - m.vx * 10) * scaleW, (m.y - m.vy * 10) * scaleH);
            mCtx.stroke();
        });

        // Platforms
        const passengers = level.passengers || [];
        const passIdx = state.passengerIndex || 0;
        const currentPass = passengers[passIdx];

        level.platforms?.forEach(p => {
            const isTarget = state.activePassenger && currentPass && (
                (state.activePassenger.state === 'WAITING' && p.id === currentPass.f) ||
                (state.activePassenger.state === 'IN_TAXI' && p.id === currentPass.t)
            );
            mCtx.fillStyle = isTarget ? '#fff' : (p.fuel ? '#00aaff' : '#444');
            mCtx.fillRect(p.x * scaleW, p.y * scaleH, p.w * scaleW, p.h * scaleH);

            if (isTarget) {
                mCtx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 150) * 0.5})`;
                mCtx.lineWidth = 1;
                mCtx.strokeRect(p.x * scaleW - 2, p.y * scaleH - 2, p.w * scaleW + 4, p.h * scaleH + 4);
            }
        });

        // Enemies
        level.enemies?.forEach(e => {
            mCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            mCtx.beginPath();
            mCtx.arc(e.x * scaleW, e.y * scaleH, 4, 0, Math.PI * 2);
            mCtx.fill();
            mCtx.fillStyle = '#ff0000';
            mCtx.fillRect(e.x * scaleW - 1, e.y * scaleH - 1, 2, 2);
        });

        // Taxi
        mCtx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        mCtx.fillRect(state.taxi.x * scaleW - 4, state.taxi.y * scaleH - 4, 8, 8);
        mCtx.fillStyle = '#fbbf24';
        mCtx.fillRect(state.taxi.x * scaleW - 2, state.taxi.y * scaleH - 2, 4, 4);

        // Border
        mCtx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
        mCtx.lineWidth = 1;
        mCtx.strokeRect(0, 0, 160, 120);
    }
};

// Export for use
window.PixiMinimapMixin = PixiMinimapMixin;

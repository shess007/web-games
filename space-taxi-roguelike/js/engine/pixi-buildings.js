/**
 * PixiRenderer Buildings Module
 * Handles platform and building rendering
 */

const PixiBuildingsMixin = {
    updatePlatforms(state) {
        const platforms = state.level?.platforms;
        if (!platforms) return;

        // Platform colors - Cozy Plushcore Pastels
        // Fuel platforms are soft mint
        const fuelColor = 0xB8E0D2;
        // Passenger platforms use cozy pastel colors
        const passengerColors = [
            0xFFCDB2,  // Soft peach
            0xE2D1F9,  // Lavender
            0xF5B7B1,  // Soft coral
            0xF9E79F,  // Butter yellow
            0xD4A5A5,  // Dusty rose
            0xB8E0D2,  // Soft mint
            0xFAD7A0,  // Warm peach
            0xD5DBDB   // Soft gray
        ];

        // Determine target platform
        const passengers = state.level.passengers || [];
        const passIdx = state.passengerIndex || 0;
        const currentPass = passengers[passIdx];
        let targetPlatformId = null;
        if (state.activePassenger && currentPass) {
            if (state.activePassenger.state === 'WAITING') {
                targetPlatformId = currentPass.f;
            } else if (state.activePassenger.state === 'IN_TAXI') {
                targetPlatformId = currentPass.t;
            }
        }

        platforms.forEach(p => {
            let platformGraphics = this.platformSprites.get(p.id);

            if (!platformGraphics) {
                // Create new platform graphics
                platformGraphics = new PIXI.Graphics();
                this.platformSprites.set(p.id, platformGraphics);
                this.containers.platforms.addChild(platformGraphics);
            }

            const isTarget = p.id === targetPlatformId;
            // Fuel platforms are soft mint, passenger platforms get cozy pastel based on their id
            const color = p.fuel ? fuelColor : passengerColors[p.id % passengerColors.length];
            const glowIntensity = isTarget ? 0.4 : 0.2;

            // Redraw platform
            platformGraphics.clear();

            // Soft diffuse glow underneath (v7 API)
            for (let i = 5; i >= 1; i--) {
                const ratio = i / 5;
                const alpha = glowIntensity * (1 - ratio) * 0.25;
                platformGraphics.beginFill(color, alpha);
                platformGraphics.drawEllipse(p.w / 2, 5, (p.w / 2 + 20) * ratio, 15 * ratio);
                platformGraphics.endFill();
            }

            // Platform body - warm cream color with rounded corners (v7 API)
            platformGraphics.beginFill(0xFFF5E4);
            platformGraphics.drawRoundedRect(0, 0, p.w, p.h, 10);
            platformGraphics.endFill();

            // Top strip with pulse - rounded corners (v7 API)
            const pulse = 0.7 + Math.sin(this.time * 3) * 0.3;
            platformGraphics.beginFill(color, pulse);
            platformGraphics.drawRoundedRect(0, 0, p.w, 4, 8);
            platformGraphics.endFill();

            // Light dots for target/fuel platforms - rounded (v7 API)
            if (isTarget || p.fuel) {
                for (let i = 0; i < 5; i++) {
                    const dotPulse = 0.3 + Math.sin(this.time * 4 + i) * 0.7;
                    platformGraphics.beginFill(color, dotPulse);
                    platformGraphics.drawCircle(10 + i * (p.w - 20) / 4 + 1.5, p.h - 4.5, 2);
                    platformGraphics.endFill();
                }
            }

            platformGraphics.x = p.x;
            platformGraphics.y = p.y;
        });
    },

    updateBuildings(state) {
        const platforms = state.level?.platforms;
        if (!platforms) return;

        // Clear buildings when sector changes
        const sectorIndex = state.level?.sectorIndex;
        if (sectorIndex !== this.currentSectorIndex) {
            // Remove all existing building sprites
            this.buildingSprites.forEach(sprite => {
                this.containers.buildings.removeChild(sprite);
                sprite.destroy({ children: true });
            });
            this.buildingSprites.clear();
            this.currentSectorIndex = sectorIndex;
        }

        platforms.forEach(p => {
            // Skip platforms without building types
            if (!p.buildingType) return;

            let buildingContainer = this.buildingSprites.get(p.id);

            if (!buildingContainer) {
                // Create new building
                buildingContainer = this.createBuildingGraphics(p);
                this.buildingSprites.set(p.id, buildingContainer);
                this.containers.buildings.addChild(buildingContainer);
            }

            // Update building window animations
            this.updateBuildingWindows(buildingContainer, p);
        });
    },

    createBuildingGraphics(platform) {
        const buildingType = BUILDING_TYPES[platform.buildingType];
        if (!buildingType) return new PIXI.Container();

        const container = new PIXI.Container();
        const graphics = new PIXI.Graphics();

        const { width, height, doorX, color, style } = buildingType;

        // Position building on LEFT side of platform, leaving right side for landing
        const buildingX = platform.x + 5; // Small margin from left edge
        const buildingY = platform.y - height;

        // Draw based on building style
        switch (style) {
            case 'residential':
                this.drawResidentialBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'luxury':
                this.drawLuxuryBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'industrial':
                this.drawIndustrialBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'entertainment':
                this.drawDiscoBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'hospitality':
                this.drawPubBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'fuel':
                this.drawFuelStationBuilding(graphics, 0, 0, width, height, color);
                break;
            case 'base_port':
                this.drawBasePortBuilding(graphics, 0, 0, width, height, color);
                break;
            default:
                this.drawResidentialBuilding(graphics, 0, 0, width, height, color);
        }

        // Draw door
        graphics.beginFill(0x1a1a1a);
        graphics.drawRect(doorX - 5, height - 15, 10, 15);
        graphics.endFill();

        // Door frame highlight
        graphics.beginFill(0x333333);
        graphics.drawRect(doorX - 6, height - 16, 12, 2);
        graphics.endFill();

        container.addChild(graphics);
        container.x = buildingX;
        container.y = buildingY;
        container.buildingType = platform.buildingType;
        container.doorWorldX = buildingX + doorX;
        container.doorWorldY = platform.y - 2;

        return container;
    },

    drawResidentialBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 15, width, height - 15);
        graphics.endFill();

        // Triangular roof
        graphics.beginFill(this.lightenColor(color, 0.2));
        graphics.moveTo(x - 3, y + 15);
        graphics.lineTo(x + width / 2, y);
        graphics.lineTo(x + width + 3, y + 15);
        graphics.closePath();
        graphics.endFill();

        // Roof highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.moveTo(x - 3, y + 15);
        graphics.lineTo(x + width / 2, y);
        graphics.lineTo(x + width / 2, y + 5);
        graphics.lineTo(x, y + 15);
        graphics.closePath();
        graphics.endFill();

        // Windows (2x2 grid)
        this.drawWindows(graphics, x + 5, y + 20, 2, 2, 10, 8);

        // Chimney
        graphics.beginFill(this.darkenColor(color, 0.3));
        graphics.drawRect(x + width - 12, y - 5, 8, 20);
        graphics.endFill();
    },

    drawLuxuryBuilding(graphics, x, y, width, height, color) {
        // Main body with slight gradient effect
        graphics.beginFill(color);
        graphics.drawRect(x, y + 20, width, height - 20);
        graphics.endFill();

        // Body highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(x, y + 20, width * 0.4, height - 20);
        graphics.endFill();

        // Dome roof
        graphics.beginFill(this.lightenColor(color, 0.3));
        graphics.arc(x + width / 2, y + 20, width / 2, Math.PI, 0);
        graphics.endFill();

        // Dome highlight
        graphics.beginFill(0xffffff, 0.15);
        graphics.arc(x + width / 2, y + 20, width / 2 - 2, Math.PI, Math.PI + 0.8);
        graphics.endFill();

        // Large windows (3x2)
        this.drawWindows(graphics, x + 8, y + 28, 3, 2, 12, 10);

        // Decorative columns
        graphics.beginFill(this.lightenColor(color, 0.15));
        graphics.drawRect(x + 3, y + 25, 4, height - 25);
        graphics.drawRect(x + width - 7, y + 25, 4, height - 25);
        graphics.endFill();
    },

    drawIndustrialBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 5, width, height - 5);
        graphics.endFill();

        // Flat roof with edge
        graphics.beginFill(this.darkenColor(color, 0.2));
        graphics.drawRect(x - 2, y, width + 4, 8);
        graphics.endFill();

        // Industrial stripes
        graphics.beginFill(0xffaa00, 0.6);
        for (let i = 0; i < 3; i++) {
            graphics.drawRect(x, y + 12 + i * 15, width, 3);
        }
        graphics.endFill();

        // Large industrial windows
        this.drawWindows(graphics, x + 8, y + 18, 3, 2, 14, 8);

        // Chimney/smokestack
        graphics.beginFill(this.darkenColor(color, 0.4));
        graphics.drawRect(x + width - 18, y - 20, 12, 25);
        graphics.endFill();

        // Smoke rings
        graphics.beginFill(0x666666, 0.4);
        graphics.drawRect(x + width - 20, y - 22, 16, 4);
        graphics.endFill();

        // Second smaller chimney
        graphics.beginFill(this.darkenColor(color, 0.3));
        graphics.drawRect(x + width - 32, y - 10, 8, 15);
        graphics.endFill();
    },

    drawDiscoBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 10, width, height - 10);
        graphics.endFill();

        // Curved/dome roof
        graphics.beginFill(this.lightenColor(color, 0.2));
        graphics.arc(x + width / 2, y + 12, width / 2, Math.PI, 0);
        graphics.endFill();

        // Neon sign area at top
        graphics.beginFill(0xff00ff, 0.3);
        graphics.drawRect(x + 5, y + 2, width - 10, 12);
        graphics.endFill();

        // Neon border
        graphics.lineStyle(2, 0xff00ff, 0.8);
        graphics.drawRect(x + 4, y + 1, width - 8, 14);
        graphics.lineStyle(0);

        // Disco ball style windows (circular)
        const windowY = y + 20;
        for (let i = 0; i < 3; i++) {
            const wx = x + 8 + i * 15;
            graphics.beginFill(0x4444ff, 0.6);
            graphics.drawCircle(wx + 4, windowY + 10, 5);
            graphics.endFill();
        }

        // Second row
        for (let i = 0; i < 2; i++) {
            const wx = x + 15 + i * 15;
            graphics.beginFill(0xff44ff, 0.6);
            graphics.drawCircle(wx + 4, windowY + 25, 5);
            graphics.endFill();
        }
    },

    drawPubBuilding(graphics, x, y, width, height, color) {
        // Main body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 8, width, height - 8);
        graphics.endFill();

        // Slanted roof
        graphics.beginFill(this.darkenColor(color, 0.3));
        graphics.moveTo(x - 2, y + 8);
        graphics.lineTo(x + width / 2, y);
        graphics.lineTo(x + width + 2, y + 8);
        graphics.closePath();
        graphics.endFill();

        // Sign hanging area
        graphics.beginFill(0x8b4513);
        graphics.drawRect(x + width - 15, y + 12, 12, 8);
        graphics.endFill();

        // Sign text placeholder (small yellow rectangle)
        graphics.beginFill(0xffdd00);
        graphics.drawRect(x + width - 13, y + 14, 8, 4);
        graphics.endFill();

        // Traditional windows (2x1)
        this.drawWindows(graphics, x + 5, y + 18, 2, 1, 12, 10);

        // Warm light from windows
        graphics.beginFill(0xffaa44, 0.3);
        graphics.drawRect(x + 5, y + 18, 12, 10);
        graphics.drawRect(x + 22, y + 18, 12, 10);
        graphics.endFill();
    },

    drawFuelStationBuilding(graphics, x, y, width, height, color) {
        // Main booth/kiosk
        graphics.beginFill(color);
        graphics.drawRect(x, y + 10, width * 0.5, height - 10);
        graphics.endFill();

        // Booth highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(x, y + 10, width * 0.2, height - 10);
        graphics.endFill();

        // Flat roof with overhang/canopy extending to the right
        graphics.beginFill(this.darkenColor(color, 0.2));
        graphics.drawRect(x - 3, y + 5, width + 6, 8);
        graphics.endFill();

        // Canopy support pillars
        graphics.beginFill(0x444444);
        graphics.drawRect(x + width - 8, y + 13, 4, height - 13);
        graphics.endFill();

        // Fuel pump (on the right side under canopy)
        graphics.beginFill(0x00aaff);
        graphics.drawRect(x + width - 18, y + height - 20, 12, 20);
        graphics.endFill();

        // Pump screen/display
        graphics.beginFill(0x001122);
        graphics.drawRect(x + width - 16, y + height - 18, 8, 6);
        graphics.endFill();

        // Pump nozzle holder
        graphics.beginFill(0x222222);
        graphics.drawRect(x + width - 17, y + height - 10, 10, 3);
        graphics.endFill();

        // Fuel hose (curved line effect)
        graphics.lineStyle(2, 0x222222, 1);
        graphics.moveTo(x + width - 12, y + height - 7);
        graphics.quadraticCurveTo(x + width - 5, y + height - 12, x + width - 2, y + height - 5);
        graphics.lineStyle(0);

        // Nozzle
        graphics.beginFill(0x00ccff);
        graphics.drawRect(x + width - 4, y + height - 7, 4, 7);
        graphics.endFill();

        // Booth window
        graphics.beginFill(0x88ccff, 0.6);
        graphics.drawRect(x + 4, y + 14, width * 0.4 - 8, 10);
        graphics.endFill();

        // Window shine
        graphics.beginFill(0xffffff, 0.3);
        graphics.drawRect(x + 5, y + 15, 5, 4);
        graphics.endFill();

        // "FUEL" sign - tall pole with sign on top
        // Pole
        graphics.beginFill(0x444444);
        graphics.drawRect(x + width - 25, y - 25, 3, 30);
        graphics.endFill();

        // Sign background
        graphics.beginFill(0x002244);
        graphics.drawRect(x + width - 38, y - 35, 30, 14);
        graphics.endFill();

        // Sign border glow
        for (let i = 4; i >= 1; i--) {
            graphics.beginFill(0x00ffff, 0.15);
            graphics.drawRect(x + width - 38 - i, y - 35 - i, 30 + i * 2, 14 + i * 2);
            graphics.endFill();
        }

        // "FUEL" text as blocks (4 letters)
        graphics.beginFill(0x00ffff);
        // F
        graphics.drawRect(x + width - 35, y - 32, 2, 8);
        graphics.drawRect(x + width - 35, y - 32, 5, 2);
        graphics.drawRect(x + width - 35, y - 28, 4, 2);
        // U
        graphics.drawRect(x + width - 28, y - 32, 2, 8);
        graphics.drawRect(x + width - 24, y - 32, 2, 8);
        graphics.drawRect(x + width - 28, y - 26, 6, 2);
        // E
        graphics.drawRect(x + width - 20, y - 32, 2, 8);
        graphics.drawRect(x + width - 20, y - 32, 5, 2);
        graphics.drawRect(x + width - 20, y - 28, 4, 2);
        graphics.drawRect(x + width - 20, y - 26, 5, 2);
        // L
        graphics.drawRect(x + width - 13, y - 32, 2, 8);
        graphics.drawRect(x + width - 13, y - 26, 5, 2);
        graphics.endFill();

        // Price display on booth
        graphics.beginFill(0x00ff00, 0.8);
        graphics.drawRect(x + 3, y + height - 12, 10, 6);
        graphics.endFill();
    },

    drawBasePortBuilding(graphics, x, y, width, height, color) {
        // Main hangar body
        graphics.beginFill(color);
        graphics.drawRect(x, y + 15, width * 0.7, height - 15);
        graphics.endFill();

        // Hangar body highlight (left side)
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(x, y + 15, width * 0.15, height - 15);
        graphics.endFill();

        // Curved hangar roof
        graphics.beginFill(this.darkenColor(color, 0.15));
        graphics.arc(x + width * 0.35, y + 18, width * 0.38, Math.PI, 0);
        graphics.endFill();

        // Roof highlight
        graphics.beginFill(0xffffff, 0.08);
        graphics.arc(x + width * 0.35, y + 18, width * 0.35, Math.PI, Math.PI * 1.5);
        graphics.endFill();

        // Control tower (right side, taller)
        const towerX = x + width * 0.7;
        const towerW = width * 0.3;
        const towerH = height + 25;

        // Tower body
        graphics.beginFill(this.darkenColor(color, 0.2));
        graphics.drawRect(towerX, y - 25, towerW, towerH);
        graphics.endFill();

        // Tower highlight
        graphics.beginFill(0xffffff, 0.1);
        graphics.drawRect(towerX, y - 25, towerW * 0.3, towerH);
        graphics.endFill();

        // Tower observation window (large)
        graphics.beginFill(0x001122);
        graphics.drawRect(towerX + 3, y - 20, towerW - 6, 12);
        graphics.endFill();

        // Window glass reflection
        graphics.beginFill(0x4488ff, 0.4);
        graphics.drawRect(towerX + 4, y - 19, towerW - 8, 10);
        graphics.endFill();

        // Window shine
        graphics.beginFill(0xffffff, 0.3);
        graphics.drawRect(towerX + 5, y - 18, 4, 3);
        graphics.endFill();

        // Antenna mast on tower
        graphics.beginFill(0x555555);
        graphics.drawRect(towerX + towerW / 2 - 2, y - 45, 4, 22);
        graphics.endFill();

        // Antenna dish
        graphics.beginFill(0x666666);
        graphics.arc(towerX + towerW / 2, y - 43, 8, Math.PI * 0.8, Math.PI * 0.2);
        graphics.endFill();

        // Beacon light on top (red warning light)
        for (let i = 3; i >= 1; i--) {
            graphics.beginFill(0xff0000, 0.2);
            graphics.drawCircle(towerX + towerW / 2, y - 47, i * 2 + 2);
            graphics.endFill();
        }
        graphics.beginFill(0xff3333);
        graphics.drawCircle(towerX + towerW / 2, y - 47, 3);
        graphics.endFill();

        // Large hangar door (where taxi comes from)
        graphics.beginFill(0x1a1a2a);
        graphics.drawRect(x + width * 0.25, y + 25, width * 0.35, height - 25);
        graphics.endFill();

        // Hangar door frame
        graphics.beginFill(0x444466);
        graphics.drawRect(x + width * 0.24, y + 23, width * 0.37, 3);
        graphics.drawRect(x + width * 0.24, y + 23, 3, height - 23);
        graphics.drawRect(x + width * 0.59, y + 23, 3, height - 23);
        graphics.endFill();

        // Hangar door horizontal lines (industrial look)
        graphics.beginFill(0x333344);
        for (let i = 0; i < 4; i++) {
            graphics.drawRect(x + width * 0.26, y + 32 + i * 8, width * 0.33, 2);
        }
        graphics.endFill();

        // Landing guide lights on hangar (green = clear)
        for (let i = 0; i < 3; i++) {
            // Glow
            graphics.beginFill(0x00ff00, 0.3);
            graphics.drawCircle(x + 8 + i * 12, y + height - 6, 4);
            graphics.endFill();
            // Light
            graphics.beginFill(0x00ff44);
            graphics.drawCircle(x + 8 + i * 12, y + height - 6, 2);
            graphics.endFill();
        }

        // "BASE" sign on hangar
        // Sign background
        graphics.beginFill(0x001133);
        graphics.drawRect(x + 5, y + 3, 32, 10);
        graphics.endFill();

        // Sign border glow (cyan)
        for (let i = 2; i >= 1; i--) {
            graphics.beginFill(0x00ccff, 0.2);
            graphics.drawRect(x + 5 - i, y + 3 - i, 32 + i * 2, 10 + i * 2);
            graphics.endFill();
        }

        // "BASE" text as pixel blocks
        graphics.beginFill(0x00ccff);
        // B
        graphics.drawRect(x + 7, y + 5, 2, 6);
        graphics.drawRect(x + 7, y + 5, 4, 1);
        graphics.drawRect(x + 7, y + 7, 4, 1);
        graphics.drawRect(x + 7, y + 10, 4, 1);
        graphics.drawRect(x + 10, y + 5, 1, 2);
        graphics.drawRect(x + 10, y + 8, 1, 2);
        // A
        graphics.drawRect(x + 13, y + 5, 4, 1);
        graphics.drawRect(x + 13, y + 6, 1, 5);
        graphics.drawRect(x + 16, y + 6, 1, 5);
        graphics.drawRect(x + 14, y + 8, 2, 1);
        // S
        graphics.drawRect(x + 19, y + 5, 4, 1);
        graphics.drawRect(x + 19, y + 6, 1, 2);
        graphics.drawRect(x + 19, y + 7, 4, 1);
        graphics.drawRect(x + 22, y + 8, 1, 2);
        graphics.drawRect(x + 19, y + 10, 4, 1);
        // E
        graphics.drawRect(x + 25, y + 5, 1, 6);
        graphics.drawRect(x + 25, y + 5, 4, 1);
        graphics.drawRect(x + 25, y + 7, 3, 1);
        graphics.drawRect(x + 25, y + 10, 4, 1);
        graphics.endFill();

        // Small windows on main hangar
        graphics.beginFill(0x88aaff, 0.4);
        graphics.drawRect(x + 5, y + 18, 8, 5);
        graphics.drawRect(x + width * 0.62, y + 18, 6, 5);
        graphics.endFill();
    },

    drawWindows(graphics, startX, startY, cols, rows, cellWidth, cellHeight) {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const wx = startX + col * (cellWidth + 4);
                const wy = startY + row * (cellHeight + 4);

                // Window frame
                graphics.beginFill(0x222222);
                graphics.drawRect(wx - 1, wy - 1, cellWidth + 2, cellHeight + 2);
                graphics.endFill();

                // Window glass (will be animated)
                graphics.beginFill(0x88aaff, 0.5);
                graphics.drawRect(wx, wy, cellWidth, cellHeight);
                graphics.endFill();
            }
        }
    },

    updateBuildingWindows(container, platform) {
        // Animate window lights based on time
        const windows = container.children.filter(c => c.isWindow);
        const pulse = 0.3 + Math.sin(this.time * 2 + platform.id) * 0.2;

        // For now, the windows are drawn statically
        // Future enhancement: add animated window sprites
    },

    lightenColor(color, amount) {
        const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(255 * amount));
        const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(255 * amount));
        const b = Math.min(255, (color & 0xff) + Math.floor(255 * amount));
        return (r << 16) | (g << 8) | b;
    },

    darkenColor(color, amount) {
        const r = Math.max(0, Math.floor(((color >> 16) & 0xff) * (1 - amount)));
        const g = Math.max(0, Math.floor(((color >> 8) & 0xff) * (1 - amount)));
        const b = Math.max(0, Math.floor((color & 0xff) * (1 - amount)));
        return (r << 16) | (g << 8) | b;
    }
};

// Export for use
window.PixiBuildingsMixin = PixiBuildingsMixin;

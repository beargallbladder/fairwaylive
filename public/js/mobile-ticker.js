// Mobile-First Stock Ticker Design System
class MobileTickerUI {
    constructor() {
        this.state = {
            tickerMessages: [],
            currentOdds: {},
            emotions: [],
            uiMode: 'compact', // compact, expanded
            activeZone: null // betting, social, odds
        };
        
        this.init();
    }

    init() {
        this.createMobileLayout();
        this.setupStockTicker();
        this.setupSwipeGestures();
        this.setupResponsiveZones();
    }

    // MOBILE-FIRST LAYOUT
    createMobileLayout() {
        // Remove old overlapping feeds
        this.removeOldFeeds();
        
        // Create new structured layout
        const mobileContainer = document.createElement('div');
        mobileContainer.id = 'mobile-container';
        mobileContainer.className = 'mobile-ticker-container';
        
        mobileContainer.innerHTML = `
            <!-- TOP STOCK TICKER -->
            <div class="stock-ticker-top">
                <div class="ticker-content" id="top-ticker">
                    <span class="ticker-item">🦈 Vinny: Smart money moving on this shot...</span>
                </div>
            </div>

            <!-- SPACER FOR MAIN GAME AREA -->
            <div class="game-area-spacer"></div>

            <!-- ODDS STRIP (HORIZONTAL) -->
            <div class="odds-strip" id="odds-strip">
                <div class="odds-container">
                    <div class="odds-item">
                        <span class="odds-label">BIRDIE</span>
                        <span class="odds-value">+350</span>
                    </div>
                    <div class="odds-item">
                        <span class="odds-label">PAR</span>
                        <span class="odds-value">+110</span>
                    </div>
                    <div class="odds-item">
                        <span class="odds-label">BOGEY</span>
                        <span class="odds-value">+200</span>
                    </div>
                </div>
            </div>

            <!-- EMOTION BAR (BOTTOM) -->
            <div class="emotion-bar" id="emotion-bar">
                <div class="emotion-reactions" id="emotion-reactions">
                    <!-- Emotions appear here -->
                </div>
            </div>

            <!-- EXPANDABLE ZONES -->
            <div class="expandable-zones">
                <!-- Betting Panel -->
                <div class="zone-panel betting-panel" id="betting-panel">
                    <div class="zone-header" onclick="mobileUI.toggleZone('betting')">
                        <span>📊 BETTING</span>
                        <span class="zone-toggle">▼</span>
                    </div>
                    <div class="zone-content">
                        <div class="betting-lines" id="betting-lines">
                            <!-- Betting content -->
                        </div>
                    </div>
                </div>

                <!-- Social Panel -->
                <div class="zone-panel social-panel" id="social-panel">
                    <div class="zone-header" onclick="mobileUI.toggleZone('social')">
                        <span>💬 REACTIONS</span>
                        <span class="zone-toggle">▼</span>
                    </div>
                    <div class="zone-content">
                        <div class="social-feed" id="social-feed">
                            <!-- Social content -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert mobile container but don't replace the main app
        document.body.insertBefore(mobileContainer, document.body.firstChild);
        
        this.addMobileStyles();
    }

    // STOCK TICKER SYSTEM
    setupStockTicker() {
        this.tickerInterval = setInterval(() => {
            this.updateTicker();
        }, 4000);
        
        // Start with some initial messages
        this.addTickerMessage("📊 Market opening... Lines being set...");
    }

    addTickerMessage(message, priority = 'normal') {
        this.state.tickerMessages.push({
            id: Date.now(),
            message: message,
            priority: priority,
            timestamp: Date.now()
        });

        // Keep only last 10 messages
        if (this.state.tickerMessages.length > 10) {
            this.state.tickerMessages = this.state.tickerMessages.slice(-10);
        }

        this.updateTickerDisplay();
    }

    updateTicker() {
        // Generate new ticker content
        const messages = [
            "🦈 Heavy action on birdie line",
            "📊 Odds shifting: Par +110 → +115", 
            "🎯 Sharp money on the under",
            "💰 Volume spike detected",
            "🌪️ Wind affecting distance models",
            "📈 Public hammering the favorite"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.addTickerMessage(randomMessage);
    }

    updateTickerDisplay() {
        const ticker = document.getElementById('top-ticker');
        if (!ticker) return;

        const latest = this.state.tickerMessages.slice(-3); // Show last 3
        const tickerHTML = latest.map(msg => 
            `<span class="ticker-item">${msg.message}</span>`
        ).join('<span class="ticker-separator">•</span>');
        
        ticker.innerHTML = tickerHTML;
    }

    // ODDS DISPLAY SYSTEM
    updateOddsStrip(odds) {
        const oddsContainer = document.querySelector('.odds-container');
        if (!oddsContainer) return;

        this.state.currentOdds = odds;
        
        const oddsHTML = Object.entries(odds).map(([outcome, value]) => `
            <div class="odds-item ${this.getOddsMovement(outcome, value)}">
                <span class="odds-label">${outcome.toUpperCase()}</span>
                <span class="odds-value">${value > 0 ? '+' : ''}${value}</span>
            </div>
        `).join('');
        
        oddsContainer.innerHTML = oddsHTML;
    }

    getOddsMovement(outcome, value) {
        // Simple odds movement indicator
        const lastValue = this.state.currentOdds[outcome];
        if (!lastValue) return '';
        
        if (value > lastValue) return 'odds-up';
        if (value < lastValue) return 'odds-down';
        return 'odds-same';
    }

    // EMOTION SYSTEM
    showEmotion(emotion, message, duration = 3000) {
        const emotionBar = document.getElementById('emotion-reactions');
        if (!emotionBar) return;

        const emotionDiv = document.createElement('div');
        emotionDiv.className = 'emotion-bubble';
        emotionDiv.innerHTML = `
            <span class="emotion-icon">${emotion}</span>
            <span class="emotion-text">${message}</span>
        `;

        emotionBar.appendChild(emotionDiv);

        // Animate in
        setTimeout(() => emotionDiv.classList.add('active'), 100);

        // Remove after duration
        setTimeout(() => {
            emotionDiv.classList.remove('active');
            setTimeout(() => emotionDiv.remove(), 500);
        }, duration);
    }

    // EXPANDABLE ZONES
    toggleZone(zoneName) {
        const panel = document.getElementById(`${zoneName}-panel`);
        const toggle = panel.querySelector('.zone-toggle');
        
        if (this.state.activeZone === zoneName) {
            // Close current zone
            panel.classList.remove('expanded');
            toggle.textContent = '▼';
            this.state.activeZone = null;
        } else {
            // Close any open zone
            this.closeAllZones();
            
            // Open new zone
            panel.classList.add('expanded');
            toggle.textContent = '▲';
            this.state.activeZone = zoneName;
        }
    }

    closeAllZones() {
        const panels = document.querySelectorAll('.zone-panel');
        panels.forEach(panel => {
            panel.classList.remove('expanded');
            const toggle = panel.querySelector('.zone-toggle');
            if (toggle) toggle.textContent = '▼';
        });
        this.state.activeZone = null;
    }

    // BETTING LINES UPDATE
    updateBettingLines(lines) {
        const bettingContainer = document.getElementById('betting-lines');
        if (!bettingContainer) return;

        const linesHTML = lines.map(line => `
            <div class="betting-line">
                <div class="line-info">
                    <span class="line-type">${line.type}</span>
                    <span class="line-description">${line.description}</span>
                </div>
                <div class="line-odds">
                    <button class="bet-button" onclick="mobileUI.placeBet('${line.id}', ${line.odds})">
                        ${line.odds > 0 ? '+' : ''}${line.odds}
                    </button>
                </div>
            </div>
        `).join('');

        bettingContainer.innerHTML = linesHTML;
    }

    // SOCIAL FEED UPDATE  
    updateSocialFeed(messages) {
        const socialContainer = document.getElementById('social-feed');
        if (!socialContainer) return;

        const messagesHTML = messages.slice(-5).map(msg => `
            <div class="social-message">
                <span class="social-avatar">${msg.avatar}</span>
                <span class="social-content">${msg.content}</span>
            </div>
        `).join('');

        socialContainer.innerHTML = messagesHTML;
    }

    // SWIPE GESTURES
    setupSwipeGestures() {
        let startY = 0;
        let startX = 0;

        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const endX = e.changedTouches[0].clientX;
            const diffY = startY - endY;
            const diffX = startX - endX;

            // Vertical swipes for zones
            if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
                if (diffY > 0) {
                    // Swipe up - open betting
                    this.toggleZone('betting');
                } else {
                    // Swipe down - close zones
                    this.closeAllZones();
                }
            }
        });
    }

    // RESPONSIVE ZONES
    setupResponsiveZones() {
        // Auto-adjust based on screen size
        const adjustLayout = () => {
            const screenHeight = window.innerHeight;
            const gameArea = document.querySelector('.game-area-wrapper');
            
            if (screenHeight < 600) {
                // Very small screens - ultra compact
                this.state.uiMode = 'ultra-compact';
                if (gameArea) gameArea.style.minHeight = '300px';
            } else if (screenHeight < 800) {
                // Small screens - compact
                this.state.uiMode = 'compact';
                if (gameArea) gameArea.style.minHeight = '400px';
            } else {
                // Larger screens - normal
                this.state.uiMode = 'normal';
                if (gameArea) gameArea.style.minHeight = '500px';
            }
        };

        window.addEventListener('resize', adjustLayout);
        adjustLayout();
    }

    // UTILITY FUNCTIONS
    removeOldFeeds() {
        // Remove overlapping elements
        const oldFeeds = [
            'advocate-feed',
            'excuse-feed', 
            'bookmaker-feed'
        ];
        
        oldFeeds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
    }

    placeBet(lineId, odds) {
        this.showEmotion('💰', `Bet placed! ${odds > 0 ? '+' : ''}${odds}`);
        this.addTickerMessage(`📊 NEW BET: Line ${lineId} at ${odds > 0 ? '+' : ''}${odds}`, 'high');
    }

    // MOBILE STYLES
    addMobileStyles() {
        const mobileStyles = document.createElement('style');
        mobileStyles.id = 'mobile-ticker-styles';
        mobileStyles.textContent = `
            .mobile-ticker-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 100;
                display: flex;
                flex-direction: column;
                background: transparent;
                pointer-events: none;
            }

            .mobile-ticker-container .stock-ticker-top,
            .mobile-ticker-container .odds-strip,
            .mobile-ticker-container .emotion-bar,
            .mobile-ticker-container .expandable-zones {
                pointer-events: auto;
            }

            .game-area-spacer {
                flex: 1;
                pointer-events: none;
            }
            
            /* Make sure main app stays interactive */
            #app {
                position: relative;
                z-index: 50;
                pointer-events: auto !important;
                margin-top: 35px; /* Space for ticker */
                margin-bottom: 150px; /* Space for bottom UI */
            }

            /* STOCK TICKER */
            .stock-ticker-top {
                background: linear-gradient(90deg, #000 0%, #1a1a1a 50%, #000 100%);
                color: #00ff41;
                height: 35px;
                overflow: hidden;
                border-bottom: 2px solid #00ff41;
                position: relative;
            }

            .ticker-content {
                display: flex;
                align-items: center;
                height: 100%;
                animation: tickerScroll 30s linear infinite;
                white-space: nowrap;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                font-weight: bold;
            }

            @keyframes tickerScroll {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }

            .ticker-item {
                margin-right: 40px;
            }

            .ticker-separator {
                margin: 0 20px;
                color: #666;
            }

            /* GAME AREA */
            .game-area-wrapper {
                flex: 1;
                overflow-y: auto;
                position: relative;
                min-height: 400px;
            }

            /* ODDS STRIP */
            .odds-strip {
                background: rgba(0,0,0,0.9);
                border-top: 1px solid #333;
                padding: 8px 0;
                position: relative;
            }

            .odds-container {
                display: flex;
                justify-content: space-around;
                align-items: center;
                max-width: 100%;
                overflow-x: auto;
                padding: 0 10px;
            }

            .odds-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 80px;
                padding: 5px;
                border-radius: 8px;
                background: rgba(255,255,255,0.1);
                transition: all 0.3s ease;
            }

            .odds-label {
                font-size: 10px;
                font-weight: bold;
                color: #ccc;
                margin-bottom: 2px;
            }

            .odds-value {
                font-size: 16px;
                font-weight: bold;
                color: #fff;
            }

            .odds-up { background: rgba(34, 197, 94, 0.3); }
            .odds-down { background: rgba(239, 68, 68, 0.3); }
            .odds-same { background: rgba(156, 163, 175, 0.3); }

            /* EMOTION BAR */
            .emotion-bar {
                background: rgba(0,0,0,0.8);
                min-height: 50px;
                display: flex;
                align-items: center;
                padding: 5px 10px;
                border-top: 1px solid #333;
            }

            .emotion-reactions {
                display: flex;
                gap: 10px;
                overflow-x: auto;
                flex: 1;
            }

            .emotion-bubble {
                display: flex;
                align-items: center;
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 8px 12px;
                white-space: nowrap;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
            }

            .emotion-bubble.active {
                opacity: 1;
                transform: translateY(0);
            }

            .emotion-icon {
                font-size: 18px;
                margin-right: 5px;
            }

            .emotion-text {
                font-size: 12px;
                color: #fff;
                font-weight: 500;
            }

            /* EXPANDABLE ZONES */
            .expandable-zones {
                position: fixed;
                bottom: 100px;
                left: 0;
                right: 0;
                z-index: 1001;
                pointer-events: auto;
            }

            .zone-panel {
                background: rgba(0,0,0,0.95);
                margin: 2px 10px;
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s ease;
                max-height: 40px;
            }

            .zone-panel.expanded {
                max-height: 300px;
            }

            .zone-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: rgba(255,255,255,0.1);
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                color: #fff;
            }

            .zone-content {
                padding: 15px;
                max-height: 260px;
                overflow-y: auto;
            }

            /* BETTING LINES */
            .betting-line {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .line-type {
                font-weight: bold;
                color: #00ff41;
                font-size: 12px;
            }

            .line-description {
                color: #ccc;
                font-size: 11px;
            }

            .bet-button {
                background: linear-gradient(45deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 15px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .bet-button:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
            }

            /* SOCIAL MESSAGES */
            .social-message {
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .social-avatar {
                font-size: 20px;
                margin-right: 10px;
            }

            .social-content {
                color: #fff;
                font-size: 13px;
                flex: 1;
            }

            /* RESPONSIVE */
            @media (max-width: 768px) {
                .ticker-content {
                    font-size: 12px;
                }
                
                .odds-item {
                    min-width: 70px;
                }
                
                .odds-value {
                    font-size: 14px;
                }
                
                .zone-header {
                    font-size: 13px;
                    padding: 8px 12px;
                }
            }

            @media (max-height: 600px) {
                .stock-ticker-top {
                    height: 30px;
                }
                
                .zone-panel.expanded {
                    max-height: 200px;
                }
                
                .emotion-bar {
                    min-height: 40px;
                }
            }
        `;
        
        document.head.appendChild(mobileStyles);
    }

    // PUBLIC API
    showBookmakerMessage(message) {
        this.addTickerMessage(message, 'bookmaker');
    }

    showAdvocateReaction(emotion, message) {
        this.showEmotion(emotion, message);
    }

    updateGameOdds(odds) {
        this.updateOddsStrip(odds);
    }
}

// Initialize mobile ticker UI
window.mobileUI = new MobileTickerUI();
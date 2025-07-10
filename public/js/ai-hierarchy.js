// AI Hierarchy System - Smart Bot Role Management
class AIHierarchyManager {
    constructor() {
        this.state = {
            mode: 'solo', // 'solo' or 'friends'
            onlineFriends: [],
            activeBots: {
                advocates: true,
                excuses: true,
                bookmakers: false,
                socialFeeds: false
            }
        };
        
        this.bookmakerDialogue = [];
        this.lastFriendCheck = 0;
        this.init();
    }

    init() {
        this.detectFriendPresence();
        this.setupBookmakerBots();
        this.startHierarchyEngine();
        
        // Check for friends every 5 seconds
        setInterval(() => {
            this.detectFriendPresence();
        }, 5000);
    }

    // FRIEND DETECTION SYSTEM
    detectFriendPresence() {
        // Simulate friend detection (in real app, this would check WebSocket connections)
        const mockFriends = this.getMockOnlineFriends();
        
        const previousMode = this.state.mode;
        const newMode = mockFriends.length > 0 ? 'friends' : 'solo';
        
        if (previousMode !== newMode) {
            this.switchMode(newMode, mockFriends);
        }
        
        this.state.onlineFriends = mockFriends;
    }

    getMockOnlineFriends() {
        // Simulate friends coming online/offline
        const allFriends = [
            { id: 'mike', name: 'Mike', status: 'watching' },
            { id: 'sarah', name: 'Sarah', status: 'betting' },
            { id: 'tom', name: 'Tom', status: 'lurking' }
        ];
        
        // Random chance friends are online
        return allFriends.filter(() => Math.random() > 0.7);
    }

    // MODE SWITCHING
    switchMode(newMode, friends) {
        console.log(`🤖 AI Hierarchy: Switching from ${this.state.mode} to ${newMode}`);
        
        this.state.mode = newMode;
        
        if (newMode === 'friends') {
            this.activateFriendsMode(friends);
        } else {
            this.activateSoloMode();
        }
        
        this.announceTransition(newMode, friends);
    }

    activateFriendsMode(friends) {
        // Bots back off from player support
        this.state.activeBots.advocates = false;
        this.state.activeBots.excuses = false;
        
        // Bots become betting infrastructure
        this.state.activeBots.bookmakers = true;
        this.state.activeBots.socialFeeds = true;
        
        // Notify existing bot systems
        if (window.botAdvocates) {
            window.botAdvocates.mode = 'background';
        }
        if (window.excuseAgents) {
            window.excuseAgents.mode = 'background';
        }
        
        // Activate bookmaker dialogue
        this.startBookmakerDialogue();
        
        this.displayFriendNotification(friends);
    }

    activateSoloMode() {
        // Bots become player support
        this.state.activeBots.advocates = true;
        this.state.activeBots.excuses = true;
        
        // Background betting bots quiet down
        this.state.activeBots.bookmakers = false;
        this.state.activeBots.socialFeeds = false;
        
        // Notify existing bot systems
        if (window.botAdvocates) {
            window.botAdvocates.mode = 'active';
        }
        if (window.excuseAgents) {
            window.excuseAgents.mode = 'active';
        }
        
        // Stop bookmaker chatter
        this.stopBookmakerDialogue();
    }

    // BOOKMAKER BOT DIALOGUE SYSTEM
    setupBookmakerBots() {
        this.bookmakerBots = {
            'vinny-sharp': {
                id: 'vinny-sharp',
                name: 'Vinny "The Sharp"',
                avatar: '🦈',
                personality: 'aggressive_bettor',
                specialties: ['line_movement', 'sharp_money', 'insider_info']
            },
            'odds-oracle': {
                id: 'odds-oracle',
                name: 'Odds Oracle',
                avatar: '🔮',
                personality: 'data_driven',
                specialties: ['statistical_analysis', 'weather_factors', 'historical_patterns']
            },
            'market-mike': {
                id: 'market-mike',
                name: 'Market Mike',
                avatar: '📊',
                personality: 'market_maker',
                specialties: ['volume_tracking', 'public_sentiment', 'line_setting']
            },
            'prop-pete': {
                id: 'prop-pete',
                name: 'Prop Pete',
                avatar: '🎲',
                personality: 'prop_specialist',
                specialties: ['creative_bets', 'micro_markets', 'entertainment_value']
            }
        };
    }

    startBookmakerDialogue() {
        if (this.bookmakerInterval) return;
        
        // Start bookmaker chatter every 8-15 seconds
        this.bookmakerInterval = setInterval(() => {
            this.generateBookmakerDialogue();
        }, 8000 + Math.random() * 7000);
        
        // Initial greeting
        setTimeout(() => {
            this.displayBookmakerMessage(
                "🦈 Vinny \"The Sharp\": Friends in the house! Time to get serious about these lines...",
                'bookmaker_activation'
            );
        }, 1000);
    }

    stopBookmakerDialogue() {
        if (this.bookmakerInterval) {
            clearInterval(this.bookmakerInterval);
            this.bookmakerInterval = null;
        }
    }

    generateBookmakerDialogue() {
        if (this.state.mode !== 'friends') return;
        
        const scenarios = [
            this.createOddsDiscussion(),
            this.createLineMovementChatter(),
            this.createWeatherAnalysis(),
            this.createVolumeAlert(),
            this.createPropBetCreation(),
            this.createSharpMoneyAlert()
        ];
        
        const selectedScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        this.displayBookmakerConversation(selectedScenario);
    }

    createOddsDiscussion() {
        return [
            {
                bot: 'odds-oracle',
                message: "📊 Line movement on Sam's next putt: opened at +140, now +165"
            },
            {
                bot: 'vinny-sharp',
                message: "🦈 Smart money's on the miss. I'm seeing heavy action from the regulars",
                delay: 2000
            },
            {
                bot: 'market-mike',
                message: "📈 Public's hammering the make at +165. Easy fade for the sharps",
                delay: 3500
            }
        ];
    }

    createLineMovementChatter() {
        return [
            {
                bot: 'market-mike',
                message: "📊 Birdie odds just moved from 3:1 to 4:1. Someone knows something..."
            },
            {
                bot: 'vinny-sharp',
                message: "🦈 Tiger AI just placed a monster bet on bogey. That bot's got inside info",
                delay: 2500
            }
        ];
    }

    createWeatherAnalysis() {
        return [
            {
                bot: 'odds-oracle',
                message: "🔮 Wind just shifted 15 degrees. Adjusting carry distance models..."
            },
            {
                bot: 'prop-pete',
                message: "🎲 Opening new prop: 'Player blames wind on next shot' -110",
                delay: 3000
            },
            {
                bot: 'vinny-sharp',
                message: "🦈 I'll take that action. Excuse Agent's been quiet - he's due",
                delay: 4500
            }
        ];
    }

    createVolumeAlert() {
        return [
            {
                bot: 'market-mike',
                message: "📊 ALERT: Heavy volume on 'Three-putt' market. Limit raised to $500"
            },
            {
                bot: 'prop-pete',
                message: "🎲 Someone just bet the house on a chunk shot. Balls of steel!",
                delay: 2000
            }
        ];
    }

    createPropBetCreation() {
        return [
            {
                bot: 'prop-pete',
                message: "🎲 NEW PROP: 'Equipment Eddie mentions shaft flex' -150"
            },
            {
                bot: 'odds-oracle',
                message: "🔮 Historical data shows 73% chance on windy days like today",
                delay: 2000
            },
            {
                bot: 'vinny-sharp',
                message: "🦈 Lock it in. That bot's predictable as sunrise",
                delay: 3500
            }
        ];
    }

    createSharpMoneyAlert() {
        return [
            {
                bot: 'vinny-sharp',
                message: "🦈 SHARP ALERT: Big money just hit the 'Over 6 strokes' line"
            },
            {
                bot: 'market-mike',
                message: "📊 Moving line to 6.5. Can't let the sharks feast",
                delay: 2500
            }
        ];
    }

    // DISPLAY SYSTEMS
    displayBookmakerConversation(conversation) {
        conversation.forEach((message, index) => {
            setTimeout(() => {
                const bot = this.bookmakerBots[message.bot];
                const fullMessage = `${bot.avatar} ${bot.name}: ${message.message}`;
                this.displayBookmakerMessage(fullMessage, 'conversation');
            }, message.delay || index * 1500);
        });
    }

    displayBookmakerMessage(message, type = 'general') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `bookmaker-message bookmaker-${type}`;
        
        messageDiv.innerHTML = `
            <div class="bookmaker-bubble">
                <div class="bookmaker-content">
                    ${message}
                </div>
                <div class="bookmaker-timestamp">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;

        // Add to bookmaker feed
        const feedContainer = document.getElementById('bookmaker-feed') || this.createBookmakerFeed();
        feedContainer.appendChild(messageDiv);

        // Animate in
        setTimeout(() => {
            messageDiv.classList.add('animate-in');
        }, 100);

        // Auto-scroll to latest
        feedContainer.scrollTop = feedContainer.scrollHeight;

        // Auto-remove older messages
        this.cleanupOldMessages(feedContainer);
    }

    createBookmakerFeed() {
        const feedContainer = document.createElement('div');
        feedContainer.id = 'bookmaker-feed';
        feedContainer.className = 'bookmaker-feed';
        
        // Position on left side (opposite of excuse feed)
        const gameContainer = document.getElementById('game-container') || document.body;
        gameContainer.appendChild(feedContainer);
        
        return feedContainer;
    }

    displayFriendNotification(friends) {
        const friendNames = friends.map(f => f.name).join(', ');
        const notification = document.createElement('div');
        notification.className = 'friend-notification';
        notification.innerHTML = `
            <div class="friend-notification-content">
                <span class="friend-icon">👥</span>
                <span class="friend-text">
                    ${friendNames} joined your round!
                    <br><small>Bots switching to betting mode...</small>
                </span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    announceTransition(mode, friends) {
        if (mode === 'friends') {
            this.displaySystemMessage(`🤖 AI System: Friends detected! Bots switching to market-making mode...`);
        } else {
            this.displaySystemMessage(`🤖 AI System: Flying solo! Your bot crew is back online...`);
        }
    }

    displaySystemMessage(message) {
        console.log(message);
        // Could also show in UI if needed
    }

    cleanupOldMessages(container) {
        const messages = container.querySelectorAll('.bookmaker-message');
        if (messages.length > 8) {
            messages[0].remove();
        }
    }

    // PUBLIC API
    forceMode(mode, mockFriends = []) {
        // For testing - force a specific mode
        this.switchMode(mode, mockFriends);
    }

    isInFriendsMode() {
        return this.state.mode === 'friends';
    }

    getActiveBots() {
        return this.state.activeBots;
    }

    // Simulate friend joining for demo
    simulateFriendJoining(friendName = 'Mike') {
        const mockFriend = { id: friendName.toLowerCase(), name: friendName, status: 'watching' };
        this.switchMode('friends', [mockFriend]);
    }

    simulateFriendLeaving() {
        this.switchMode('solo', []);
    }
}

// Add CSS for bookmaker and friend systems
const hierarchyStyles = document.createElement('style');
hierarchyStyles.textContent = `
    .bookmaker-feed {
        position: fixed;
        top: 100px;
        left: 20px;
        width: 320px;
        max-height: 400px;
        overflow-y: auto;
        z-index: 998;
        pointer-events: none;
    }

    .bookmaker-message {
        margin: 8px 0;
        opacity: 0;
        transform: translateX(-100px);
        transition: all 0.5s ease;
    }

    .bookmaker-message.animate-in {
        opacity: 1;
        transform: translateX(0);
    }

    .bookmaker-bubble {
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
        border-radius: 12px;
        padding: 10px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        border: 2px solid #3498db;
        position: relative;
    }

    .bookmaker-bubble::before {
        content: '💰';
        position: absolute;
        top: -8px;
        left: 8px;
        background: #3498db;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
    }

    .bookmaker-content {
        color: #ecf0f1;
        font-weight: 600;
        font-size: 0.8rem;
        line-height: 1.3;
        font-family: 'Courier New', monospace;
    }

    .bookmaker-timestamp {
        font-size: 0.65rem;
        color: rgba(236,240,241,0.6);
        margin-top: 3px;
        text-align: right;
    }

    .bookmaker-conversation .bookmaker-bubble {
        border-color: #e74c3c;
        background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
    }

    .friend-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        transition: all 0.5s ease;
        text-align: center;
    }

    .friend-notification.show {
        transform: translateX(-50%) translateY(0);
    }

    .friend-notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .friend-icon {
        font-size: 1.5rem;
    }

    .friend-text {
        font-weight: 600;
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .bookmaker-feed {
            left: 10px;
            width: 280px;
            top: 80px;
        }
        
        .bookmaker-content {
            font-size: 0.75rem;
        }
        
        .friend-notification {
            left: 10px;
            right: 10px;
            transform: translateY(-100px);
            width: auto;
        }
        
        .friend-notification.show {
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(hierarchyStyles);

// Initialize the AI hierarchy system
window.aiHierarchy = new AIHierarchyManager();
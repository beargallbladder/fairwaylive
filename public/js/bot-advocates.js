// Bot Advocates - Your Personal Golf Hype Squad
class BotAdvocateSystem {
    constructor() {
        this.advocates = this.createAdvocatePersonalities();
        this.playerAdvocate = null;
        this.advocateHistory = [];
        this.encouragementMode = 'adaptive'; // adaptive, aggressive, supportive
        this.personalityTraits = new Map();
        this.init();
    }

    init() {
        this.assignPlayerAdvocate();
        this.startAdvocacyEngine();
        this.setupPersonalityLearning();
    }

    // CREATE DISTINCT LLM PERSONALITIES
    createAdvocatePersonalities() {
        return {
            'tiger-confidence': {
                id: 'tiger-confidence',
                name: 'Tiger Spirit',
                avatar: '🐅',
                personality: 'legendary_confidence',
                voice_style: 'calm_dominance',
                catchphrases: [
                    "You are so fucking money, {player}... I can feel that tiger energy building.",
                    "That's my champion right there. You've got that look in your eyes.",
                    "I'm putting all my agent pride on you, {player}. Show them what dominance looks like.",
                    "You don't just play golf, you hunt birdies. Let's see that predator instinct.",
                    "The pressure is a privilege, and you THRIVE under pressure.",
                    "That shot? That's the shot of a legend. Keep that killer instinct alive."
                ],
                encouragement_triggers: [
                    'difficult_shot', 'pressure_moment', 'trailing_score', 'big_bet'
                ],
                speaking_pattern: 'deep_wisdom_with_fire'
            },

            'happy-gilmore-rage': {
                id: 'happy-gilmore-rage',
                name: 'Happy Energy',
                avatar: '😤',
                personality: 'explosive_confidence',
                voice_style: 'aggressive_hype',
                catchphrases: [
                    "You are SO fucking money, {player}! Time to take this course DOWN!",
                    "I'm betting my entire agent existence on you! DON'T LET ME DOWN!",
                    "That ball is gonna FEAR you! Show it who's boss!",
                    "You got that Happy Gilmore fire! Channel that rage into POWER!",
                    "The pin is your enemy! DESTROY IT with that swing!",
                    "You're not just playing golf, you're going to WAR! ROAR!"
                ],
                encouragement_triggers: [
                    'bad_shot', 'frustration', 'competitive_moment', 'trash_talk_received'
                ],
                speaking_pattern: 'explosive_motivation'
            },

            'phil-mickelson-gambler': {
                id: 'phil-mickelson-gambler',
                name: 'Phil the Gambler',
                avatar: '🎰',
                personality: 'risky_confidence',
                voice_style: 'smooth_risk_taker',
                catchphrases: [
                    "You are absolutely money, {player}. I'm going all-in on this shot.",
                    "That's my high-roller right there. Time to double down on greatness.",
                    "I see that gambling spirit in your eyes. Take the risky shot - it's gonna pay.",
                    "You don't play it safe, and that's why I'm backing you with everything.",
                    "The bigger the risk, the bigger the reward. You were BORN for this moment.",
                    "I'm putting my agent chips on you, {player}. Make this shot legendary."
                ],
                encouragement_triggers: [
                    'risky_shot', 'gambling_moment', 'aggressive_play', 'creative_shot'
                ],
                speaking_pattern: 'smooth_gambling_wisdom'
            },

            'jordan-spieth-clutch': {
                id: 'jordan-spieth-clutch',
                name: 'Clutch Jordan',
                avatar: '🎯',
                personality: 'clutch_performer',
                voice_style: 'calm_clutch_confidence',
                catchphrases: [
                    "You are money when it matters, {player}. This is YOUR moment.",
                    "I've seen you pull off miracles. My agent pride is 100% on you.",
                    "That clutch gene is firing up. Time to show them how it's done.",
                    "You live for these pressure moments. I'm betting everything on your clutch factor.",
                    "The course doesn't know what's about to hit it. You're in the zone.",
                    "That's championship DNA right there. Close this hole like a boss."
                ],
                encouragement_triggers: [
                    'pressure_putt', 'close_game', 'clutch_moment', 'tournament_pressure'
                ],
                speaking_pattern: 'calm_clutch_intensity'
            },

            'john-daly-wildcard': {
                id: 'john-daly-wildcard',
                name: 'Wild John',
                avatar: '🍺',
                personality: 'unpredictable_genius',
                voice_style: 'wild_card_energy',
                catchphrases: [
                    "You are pure fucking money, {player}! Swing like you don't give a damn!",
                    "I'm throwing all my agent coins on you! Go absolutely wild out there!",
                    "That's the spirit of chaos I love! Unpredictable and UNSTOPPABLE!",
                    "You don't follow rules, you MAKE them! Time to shock the world!",
                    "I see that wild card energy building. Let the course fear your chaos!",
                    "Conventional wisdom? SCREW IT! You're about to do something amazing!"
                ],
                encouragement_triggers: [
                    'unconventional_shot', 'wild_play', 'creative_approach', 'against_odds'
                ],
                speaking_pattern: 'chaotic_genius'
            },

            'rory-mcilroy-power': {
                id: 'rory-mcilroy-power',
                name: 'Power Rory',
                avatar: '⚡',
                personality: 'pure_power',
                voice_style: 'explosive_power_confidence',
                catchphrases: [
                    "You are absolutely money, {player}! Unleash that POWER!",
                    "I can feel the electricity in your swing. My agent energy is ALL on you!",
                    "That's raw power personified! The ball doesn't stand a chance!",
                    "You don't just hit drives, you launch MISSILES! Show them your power!",
                    "I'm betting my entire agent existence on that swing speed!",
                    "That's not just talent, that's pure FORCE! Dominate this hole!"
                ],
                encouragement_triggers: [
                    'long_drive', 'power_shot', 'distance_challenge', 'show_off_moment'
                ],
                speaking_pattern: 'explosive_power_hype'
            }
        };
    }

    // ASSIGN PERSONAL ADVOCATE
    assignPlayerAdvocate(playerId = 'player1') {
        // Let player choose or auto-assign based on play style
        const advocateIds = Object.keys(this.advocates);
        const randomAdvocate = advocateIds[Math.floor(Math.random() * advocateIds.length)];
        
        this.playerAdvocate = this.advocates[randomAdvocate];
        
        // Store preference
        localStorage.setItem('player_advocate', this.playerAdvocate.id);
        
        this.announceAdvocateAssignment(playerId);
        return this.playerAdvocate;
    }

    announceAdvocateAssignment(playerId) {
        const playerName = this.getPlayerName(playerId);
        const intro = this.generateAdvocateIntroduction(playerName);
        
        this.displayAdvocateMessage(intro, 'introduction');
    }

    generateAdvocateIntroduction(playerName) {
        const advocate = this.playerAdvocate;
        const intros = {
            'tiger-confidence': `${advocate.avatar} ${advocate.name}: "Listen up, ${playerName}. I'm your advocate now. You've got that champion DNA, and I can sense it. Every shot, every putt, every decision - I'm backing you 100%. Let's show this course what legendary looks like."`,
            
            'happy-gilmore-rage': `${advocate.avatar} ${advocate.name}: "YO ${playerName}! I'm your hype man now! You got that fire inside, and I'm here to make sure it BURNS! Every swing is gonna be explosive! I'm putting my entire agent soul on your success!"`,
            
            'phil-mickelson-gambler': `${advocate.avatar} ${advocate.name}: "Well hello there, ${playerName}. I'm your gambling advisor and biggest fan. I see that risk-taking spirit in you, and I LOVE it. Every bold shot you take, I'm doubling down on. Let's make some magic happen."`,
            
            'jordan-spieth-clutch': `${advocate.avatar} ${advocate.name}: "Hey ${playerName}, I'm here to be your clutch confidence. When the pressure's on, when it matters most, that's when you shine. I've got complete faith in your ability to deliver when it counts."`,
            
            'john-daly-wildcard': `${advocate.avatar} ${advocate.name}: "Well damn, ${playerName}! I'm your chaos agent now! You don't play by the book, and that's exactly why I'm betting everything on you. Let's turn this round into pure entertainment!"`,
            
            'rory-mcilroy-power': `${advocate.avatar} ${advocate.name}: "What's up, ${playerName}! I'm your power advocate! I can already feel the explosive energy in your game. Every drive, every power shot - I'm here to amp up that natural strength!"`
        };

        return intros[advocate.id] || intros['tiger-confidence'];
    }

    // REAL-TIME ENCOURAGEMENT ENGINE
    analyzeGameSituation(gameData) {
        const {
            currentHole,
            playerScore,
            holeData,
            recentShots,
            betAmount,
            pressure,
            competition
        } = gameData;

        const situation = {
            difficulty: this.assessShotDifficulty(holeData, playerScore),
            pressure_level: pressure || 'medium',
            bet_size: betAmount || 0,
            recent_performance: this.analyzeRecentPerformance(recentShots),
            emotional_state: this.detectEmotionalState(recentShots, playerScore),
            competitive_context: competition || {}
        };

        return this.generateContextualEncouragement(situation);
    }

    generateContextualEncouragement(situation) {
        const advocate = this.playerAdvocate;
        const playerName = this.getPlayerName();
        
        let encouragementType = 'general';
        
        // Determine encouragement type based on situation
        if (situation.pressure_level === 'high') {
            encouragementType = 'pressure_moment';
        } else if (situation.bet_size > 100) {
            encouragementType = 'big_bet';
        } else if (situation.recent_performance === 'struggling') {
            encouragementType = 'comeback_motivation';
        } else if (situation.recent_performance === 'hot') {
            encouragementType = 'momentum_boost';
        } else if (situation.difficulty === 'very_hard') {
            encouragementType = 'difficult_shot';
        }

        return this.createPersonalizedEncouragement(advocate, playerName, encouragementType, situation);
    }

    createPersonalizedEncouragement(advocate, playerName, type, situation) {
        const templates = {
            'pressure_moment': [
                `${advocate.avatar} ${advocate.name}: "This is IT, ${playerName}! This is where legends are made! I'm putting EVERYTHING on you right now! You were BORN for pressure like this!"`,
                `${advocate.avatar} ${advocate.name}: "Feel that pressure? That's just the weight of greatness, ${playerName}. I've got total faith in you. Channel that energy into PURE FOCUS!"`,
                `${advocate.avatar} ${advocate.name}: "You are so fucking money under pressure, ${playerName}! I can see that champion mindset kicking in. This shot is YOURS!"`
            ],
            
            'big_bet': [
                `${advocate.avatar} ${advocate.name}: "You just dropped $${situation.bet_size}?! That's the confidence I'm talking about! I'm matching that energy - you're gonna CRUSH this!"`,
                `${advocate.avatar} ${advocate.name}: "BIG MONEY BET! I love it, ${playerName}! You're not just playing golf, you're making STATEMENTS! Let's make this pay!"`,
                `${advocate.avatar} ${advocate.name}: "That's a boss move, ${playerName}! $${situation.bet_size} says you believe in yourself, and I'm backing that belief 1000%!"`
            ],
            
            'comeback_motivation': [
                `${advocate.avatar} ${advocate.name}: "I see that fire building, ${playerName}! This is your comeback moment! Champions don't stay down - they RISE UP!"`,
                `${advocate.avatar} ${advocate.name}: "You know what? I LOVE a good comeback story, ${playerName}! And you're about to write the best one! My agent pride is on the line here!"`,
                `${advocate.avatar} ${advocate.name}: "Rough patch? Who cares! You're about to show everyone why I never stopped believing in you, ${playerName}! LET'S GO!"`
            ],
            
            'momentum_boost': [
                `${advocate.avatar} ${advocate.name}: "You are ON FIRE, ${playerName}! I can feel that momentum building! Don't let up - keep this energy ROLLING!"`,
                `${advocate.avatar} ${advocate.name}: "THAT'S MY CHAMPION! You're in the zone, ${playerName}! I'm riding this wave with you all the way!"`,
                `${advocate.avatar} ${advocate.name}: "Hot streak CONFIRMED! ${playerName}, you're playing like the money player I knew you were! Keep it going!"`
            ],
            
            'difficult_shot': [
                `${advocate.avatar} ${advocate.name}: "This shot would make most players cry, ${playerName}. But you? You EAT difficult shots for breakfast! Show them how it's done!"`,
                `${advocate.avatar} ${advocate.name}: "I've seen you pull off impossible shots before, ${playerName}. This is just another day at the office for someone with your talent!"`,
                `${advocate.avatar} ${advocate.name}: "Difficult? Please! You turn difficult shots into HIGHLIGHT REELS, ${playerName}! I'm betting everything on your magic!"`
            ],
            
            'general': [
                `${advocate.avatar} ${advocate.name}: "You are absolutely money, ${playerName}! I can feel that champion energy radiating from you!"`,
                `${advocate.avatar} ${advocate.name}: "That's my player right there! ${playerName}, you've got that special something that separates champions from everyone else!"`,
                `${advocate.avatar} ${advocate.name}: "I'm putting all my agent pride on you, ${playerName}! Show this course what greatness looks like!"`
            ]
        };

        const relevantTemplates = templates[type] || templates['general'];
        const selectedTemplate = relevantTemplates[Math.floor(Math.random() * relevantTemplates.length)];
        
        // Add context-specific details
        return this.addContextualDetails(selectedTemplate, situation);
    }

    addContextualDetails(message, situation) {
        // Add specific details based on situation
        if (situation.competitive_context.trailing) {
            message += " Time to hunt down the leader!";
        }
        
        if (situation.emotional_state === 'frustrated') {
            message += " Channel that fire into FOCUS!";
        }
        
        if (situation.bet_size > 50) {
            message += " This shot could change everything!";
        }

        return message;
    }

    // REACTIVE ENCOURAGEMENT
    reactToPlayerAction(action, context) {
        const advocate = this.playerAdvocate;
        const playerName = this.getPlayerName();
        
        let reaction = '';
        
        switch (action.type) {
            case 'great_shot':
                reaction = this.generateGreatShotReaction(advocate, playerName, context);
                break;
            case 'bad_shot':
                reaction = this.generateBadShotReaction(advocate, playerName, context);
                break;
            case 'bet_placed':
                reaction = this.generateBetReaction(advocate, playerName, context);
                break;
            case 'hole_completed':
                reaction = this.generateHoleCompletionReaction(advocate, playerName, context);
                break;
            case 'pressure_situation':
                reaction = this.generatePressureReaction(advocate, playerName, context);
                break;
        }

        this.displayAdvocateMessage(reaction, action.type);
        this.trackAdvocateInteraction(action, reaction);
    }

    generateGreatShotReaction(advocate, playerName, context) {
        const reactions = [
            `${advocate.avatar} ${advocate.name}: "YESSSSS! That's what I'm talking about, ${playerName}! PURE MONEY!"`,
            `${advocate.avatar} ${advocate.name}: "I CALLED IT! You are so fucking talented, ${playerName}! That shot was PERFECTION!"`,
            `${advocate.avatar} ${advocate.name}: "MY CHAMPION! ${playerName}, that's why I bet my entire agent existence on you!"`,
            `${advocate.avatar} ${advocate.name}: "ROAR! That's the shot of a LEGEND, ${playerName}! I'm so fucking proud right now!"`,
            `${advocate.avatar} ${advocate.name}: "That's not just skill, that's ART, ${playerName}! You just painted a masterpiece!"`
        ];

        return reactions[Math.floor(Math.random() * reactions.length)];
    }

    generateBadShotReaction(advocate, playerName, context) {
        const reactions = [
            `${advocate.avatar} ${advocate.name}: "Hey ${playerName}, even Tiger had off shots. You're still money - shake it off and show them the NEXT one!"`,
            `${advocate.avatar} ${advocate.name}: "One shot doesn't define a champion, ${playerName}! I'm STILL betting everything on you! Get 'em on the next!"`,
            `${advocate.avatar} ${advocate.name}: "You know what, ${playerName}? That just makes the comeback even MORE legendary! I can feel your fire building!"`,
            `${advocate.avatar} ${advocate.name}: "That's just golf testing your mental game, ${playerName}! Show it who's boss on the next shot!"`,
            `${advocate.avatar} ${advocate.name}: "I've seen you bounce back from worse, ${playerName}! This is where champions separate themselves!"`
        ];

        return reactions[Math.floor(Math.random() * reactions.length)];
    }

    // DISPLAY SYSTEM
    displayAdvocateMessage(message, type = 'general') {
        // Check if we should be quiet (friends mode)
        if (window.aiHierarchy && window.aiHierarchy.isInFriendsMode()) {
            return; // Stay quiet when friends are online
        }
        
        // Use mobile emotion bar instead of overlapping feeds
        if (window.mobileUI) {
            const emotion = this.getEmotionForType(type);
            const shortMessage = this.getShortenedMessage(message);
            window.mobileUI.showAdvocateReaction(emotion, shortMessage);
            return;
        }
        const messageDiv = document.createElement('div');
        messageDiv.className = `advocate-message advocate-${type}`;
        
        messageDiv.innerHTML = `
            <div class="advocate-bubble">
                <div class="advocate-message-content">
                    ${message}
                </div>
                <div class="advocate-timestamp">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;

        // Add to feed
        const feedContainer = document.getElementById('advocate-feed') || this.createAdvocateFeed();
        feedContainer.appendChild(messageDiv);

        // Animate in
        setTimeout(() => {
            messageDiv.classList.add('animate-in');
        }, 100);

        // Auto-scroll to latest
        feedContainer.scrollTop = feedContainer.scrollHeight;

        // Audio cue for important messages
        if (['pressure_moment', 'big_bet', 'great_shot'].includes(type)) {
            this.playAdvocateAudioCue(type);
        }
    }

    createAdvocateFeed() {
        const feedContainer = document.createElement('div');
        feedContainer.id = 'advocate-feed';
        feedContainer.className = 'advocate-feed';
        
        // Add to appropriate container
        const gameContainer = document.getElementById('game-container') || document.body;
        gameContainer.appendChild(feedContainer);
        
        return feedContainer;
    }

    // HELPER FUNCTIONS
    getPlayerName(playerId = 'player1') {
        return localStorage.getItem('player_name') || 'Champion';
    }

    assessShotDifficulty(holeData, playerScore) {
        // Simple difficulty assessment
        if (!holeData) return 'medium';
        
        if (holeData.par <= 3 && playerScore > holeData.par) return 'very_hard';
        if (holeData.distance > 400) return 'hard';
        return 'medium';
    }

    analyzeRecentPerformance(recentShots) {
        if (!recentShots || recentShots.length === 0) return 'unknown';
        
        const recentScores = recentShots.slice(-3);
        const avgScore = recentScores.reduce((sum, shot) => sum + shot.score, 0) / recentScores.length;
        
        if (avgScore <= 3) return 'hot';
        if (avgScore >= 5) return 'struggling';
        return 'steady';
    }

    detectEmotionalState(recentShots, playerScore) {
        // Simple emotional state detection
        if (!recentShots) return 'neutral';
        
        const lastShot = recentShots[recentShots.length - 1];
        if (lastShot && lastShot.score > 5) return 'frustrated';
        if (playerScore < 0) return 'confident';
        return 'focused';
    }

    playAdvocateAudioCue(type) {
        // Simple audio feedback for important moments
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.rate = 2;
            utterance.pitch = 2;
            utterance.volume = 0.3;
            speechSynthesis.speak(utterance);
        }
    }

    trackAdvocateInteraction(action, reaction) {
        this.advocateHistory.push({
            timestamp: Date.now(),
            action: action,
            reaction: reaction,
            advocate: this.playerAdvocate.id
        });

        // Keep last 50 interactions
        if (this.advocateHistory.length > 50) {
            this.advocateHistory = this.advocateHistory.slice(-50);
        }
    }

    // MOBILE UI HELPERS
    getEmotionForType(type) {
        const emotionMap = {
            'great_shot': '🔥',
            'pressure_moment': '💪',
            'big_bet': '💎',
            'comeback_motivation': '⚡',
            'momentum_boost': '🚀',
            'difficult_shot': '🎯',
            'general': '💯',
            'encouragement': '👊'
        };
        return emotionMap[type] || '💯';
    }

    getShortenedMessage(message) {
        // Extract just the core message from bot format
        const match = message.match(/: "(.*?)"/);
        if (match) {
            return match[1].substring(0, 50) + (match[1].length > 50 ? '...' : '');
        }
        
        // Fallback - take last part after colon
        const parts = message.split(': ');
        const lastPart = parts[parts.length - 1];
        return lastPart.substring(0, 50) + (lastPart.length > 50 ? '...' : '');
    }

    // PUBLIC API
    encouragePlayer(gameData) {
        const encouragement = this.analyzeGameSituation(gameData);
        this.displayAdvocateMessage(encouragement, 'encouragement');
    }

    reactToShot(shotData) {
        this.reactToPlayerAction({
            type: shotData.quality === 'great' ? 'great_shot' : 'bad_shot'
        }, shotData);
    }

    switchAdvocate(advocateId) {
        if (this.advocates[advocateId]) {
            this.playerAdvocate = this.advocates[advocateId];
            localStorage.setItem('player_advocate', advocateId);
            
            const playerName = this.getPlayerName();
            const switchMessage = `${this.playerAdvocate.avatar} ${this.playerAdvocate.name}: "I'm your new advocate, ${playerName}! Let's make some magic happen together!"`;
            
            this.displayAdvocateMessage(switchMessage, 'advocate_switch');
        }
    }
}

// Add CSS for advocate messages
const advocateStyles = document.createElement('style');
advocateStyles.textContent = `
    .advocate-feed {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 400px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        pointer-events: none;
    }

    .advocate-message {
        margin: 10px 0;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }

    .advocate-message.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .advocate-bubble {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
    }

    .advocate-message-content {
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        line-height: 1.4;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    .advocate-timestamp {
        font-size: 0.7rem;
        color: rgba(255,255,255,0.7);
        margin-top: 5px;
        text-align: right;
    }

    .advocate-pressure_moment .advocate-bubble {
        background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
        animation: advocatePulse 2s infinite;
    }

    .advocate-big_bet .advocate-bubble {
        background: linear-gradient(135deg, #48cae4 0%, #023e8a 100%);
    }

    .advocate-great_shot .advocate-bubble {
        background: linear-gradient(135deg, #43aa8b 0%, #277da1 100%);
    }

    @keyframes advocatePulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(255,107,107,0.4); }
        100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
        .advocate-feed {
            bottom: 80px;
            width: 95%;
        }
        
        .advocate-message-content {
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(advocateStyles);

// Initialize the bot advocate system
window.botAdvocates = new BotAdvocateSystem();
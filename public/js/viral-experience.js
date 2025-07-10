// FairwayLive Viral Experience - So Good Callaway Will Throw Money At Us
class ViralGolfExperience {
    constructor() {
        this.state = {
            currentHole: 1,
            players: [],
            liveConditions: null,
            position: null,
            proComparison: null,
            socialMoments: [],
            viralContent: []
        };
        
        this.premiumAPIs = new PremiumGolfAPIs();
        this.personalities = this.createViralPersonalities();
        this.init();
    }
    
    init() {
        this.setupWorldClassUX();
        this.startLiveUpdates();
        this.initializeViralMechanics();
    }
    
    // WORLD CLASS UX - So Simple Anyone Can Use It
    setupWorldClassUX() {
        // Big, obvious buttons
        this.createMegaButtons();
        
        // Voice instructions that sound human
        this.setupVoiceGuidance();
        
        // Visual feedback that screams what's happening
        this.setupVisualFeedback();
        
        // One-tap everything
        this.setupOneTapActions();
    }
    
    createMegaButtons() {
        const style = document.createElement('style');
        style.textContent = `
            .mega-button {
                font-size: 2rem !important;
                padding: 2rem 3rem !important;
                border-radius: 25px !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                letter-spacing: 2px !important;
                box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
                transition: all 0.2s ease !important;
                border: none !important;
                cursor: pointer !important;
            }
            
            .mega-button:hover {
                transform: translateY(-3px) !important;
                box-shadow: 0 12px 30px rgba(0,0,0,0.4) !important;
            }
            
            .mega-button:active {
                transform: translateY(0) !important;
                animation: megaPulse 0.3s ease !important;
            }
            
            @keyframes megaPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .viral-indicator {
                position: absolute;
                top: -10px;
                right: -10px;
                background: linear-gradient(45deg, #ff6b6b, #feca57);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                animation: viralPulse 2s infinite;
            }
            
            @keyframes viralPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); box-shadow: 0 0 20px rgba(255,107,107,0.5); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // LIVE CONDITIONS - The "Holy Shit" Feature
    async updateLiveConditions() {
        try {
            // Get user's exact position
            const position = await this.getCurrentPosition();
            
            // Get REAL course conditions
            const conditions = await this.premiumAPIs.getLiveCourseConditions(
                'pebble-beach',
                position.coords.latitude,
                position.coords.longitude
            );
            
            this.state.liveConditions = conditions;
            this.displayLiveConditions(conditions);
            this.updateBettingOdds(conditions);
            
        } catch (error) {
            // Fallback with realistic mock data
            this.displayMockConditions();
        }
    }
    
    displayLiveConditions(conditions) {
        const conditionsPanel = this.createConditionsPanel(conditions);
        
        // Show as overlay with dramatic effect
        conditionsPanel.innerHTML = `
            <div class="conditions-hero">
                <div class="conditions-title">
                    <span class="live-pulse">🔴 LIVE</span>
                    Course Conditions
                </div>
                
                <div class="conditions-grid">
                    <div class="condition-card wind">
                        <div class="condition-icon">💨</div>
                        <div class="condition-value">${conditions.windSpeed} mph</div>
                        <div class="condition-impact">
                            ${conditions.distanceAdjustment > 0 ? '+' : ''}${conditions.distanceAdjustment} yards
                        </div>
                    </div>
                    
                    <div class="condition-card temp">
                        <div class="condition-icon">🌡️</div>
                        <div class="condition-value">${conditions.temperature}°F</div>
                        <div class="condition-impact">
                            ${conditions.clubRecommendation.reason}
                        </div>
                    </div>
                    
                    <div class="condition-card green">
                        <div class="condition-icon">⛳</div>
                        <div class="condition-value">${conditions.greenSpeed}</div>
                        <div class="condition-impact">
                            ${conditions.greenSpeed > 10 ? 'Lightning fast!' : 'Normal speed'}
                        </div>
                    </div>
                </div>
                
                <div class="viral-moment">
                    <div class="ai-comment">
                        ${conditions.conditions_emoji} ${conditions.trash_talk_weather}
                    </div>
                </div>
                
                <div class="pro-comparison">
                    <span>Tiger would use ${conditions.clubRecommendation.recommended_club}-iron here</span>
                </div>
            </div>
        `;
        
        this.animateIn(conditionsPanel);
    }
    
    // VIRAL PERSONALITIES - AI That Feels Human
    createViralPersonalities() {
        return {
            'tiger-ai': {
                name: 'Tiger AI',
                avatar: '🐅',
                style: 'legendary',
                phrases: [
                    "I've played this shot 10,000 times in my mind",
                    "This is where champions are made",
                    "The hardest part is believing you belong here",
                    "Pressure is a privilege"
                ]
            },
            'happy-gilmore': {
                name: 'Happy',
                avatar: '😤',
                style: 'aggressive',
                phrases: [
                    "The price is WRONG, bitch!",
                    "Just tap it in... TAP IT IN!",
                    "You're gonna die clown!",
                    "I eat pieces of shit like you for breakfast!"
                ]
            },
            'caddie-wisdom': {
                name: 'Old Tom',
                avatar: '👴',
                style: 'wise',
                phrases: [
                    "I've seen that shot make men cry",
                    "Course is playing two clubs longer today",
                    "Wind's swirling like my ex-wife's emotions",
                    "That pin position is nastier than gas station sushi"
                ]
            },
            'vegas-shark': {
                name: 'Vinny',
                avatar: '🦈',
                style: 'betting',
                phrases: [
                    "Smart money's moving on this shot",
                    "I got insider info - that green's reading different",
                    "Line's about to shift, get your action in",
                    "This is where fortunes are made and lost"
                ]
            },
            'social-queen': {
                name: 'Insta',
                avatar: '📸',
                style: 'social',
                phrases: [
                    "This is SO going on your story!",
                    "OMG the lighting is perfect for this shot",
                    "Your followers are gonna die when they see this",
                    "Say something cool for the camera!"
                ]
            }
        };
    }
    
    // VIRAL CONTENT GENERATION
    generateViralMoment(type, context) {
        const moments = {
            'impossible_shot': {
                template: '🚀 {player} just pulled off the impossible! {distance} yards over water! This is why we play golf! 🔥',
                shareText: 'Watch this INSANE golf shot!',
                hashtags: ['#GolfMagic', '#HeyHomeboy', '#ImpossibleShot']
            },
            'epic_fail': {
                template: '💀 {player} found the water... AGAIN! That\'s shot #{count} today! 😂',
                shareText: 'Golf fails that will make you feel better about your game',
                hashtags: ['#GolfFail', '#HeyHomeboy', '#FeelsBadMan']
            },
            'betting_win': {
                template: '💰 {player} just won ${amount} on that shot! Called it like a boss! 🎯',
                shareText: 'Making money on the golf course!',
                hashtags: ['#GolfBetting', '#HeyHomeboy', '#MoneyShot']
            },
            'weather_drama': {
                template: '🌪️ Wind just picked up to {windSpeed}mph! This changes EVERYTHING! ⛈️',
                shareText: 'When Mother Nature joins your golf game',
                hashtags: ['#GolfWeather', '#HeyHomeboy', '#NatureVsGolf']
            }
        };
        
        const moment = moments[type];
        const content = this.fillTemplate(moment.template, context);
        
        return {
            content,
            shareData: {
                title: 'Hey Homeboy',
                text: content,
                url: `https://heyhomeboy.com/share/${this.generateShareId()}`
            },
            socialPost: {
                text: content,
                hashtags: moment.hashtags,
                image: this.generateShareImage(type, context)
            }
        };
    }
    
    // ONE-TAP SHARING - Make It Go Viral
    async shareViralMoment(moment) {
        try {
            // Native sharing if available
            if (navigator.share) {
                await navigator.share(moment.shareData);
                this.trackShare('native', moment.type);
                return;
            }
            
            // Platform-specific sharing
            const platforms = [
                {
                    name: 'Instagram Stories',
                    icon: '📷',
                    action: () => this.shareToInstagramStory(moment)
                },
                {
                    name: 'TikTok',
                    icon: '🎵',
                    action: () => this.shareToTikTok(moment)
                },
                {
                    name: 'Twitter',
                    icon: '🐦',
                    action: () => this.shareToTwitter(moment)
                },
                {
                    name: 'Copy Link',
                    icon: '🔗',
                    action: () => this.copyShareLink(moment)
                }
            ];
            
            this.showShareMenu(platforms, moment);
            
        } catch (error) {
            this.fallbackShare(moment);
        }
    }
    
    // AI REACTIONS - Feel Like Playing With Friends
    generateAIReaction(event) {
        const personality = this.getRandomPersonality();
        const reaction = this.createPersonalizedReaction(personality, event);
        
        // Show with dramatic timing
        setTimeout(() => {
            this.displayAIReaction(personality, reaction);
        }, 1000 + Math.random() * 2000);
        
        // Chain reactions from other personalities
        if (Math.random() > 0.6) {
            setTimeout(() => {
                const secondPersonality = this.getRandomPersonality(personality.name);
                const followUp = this.createFollowUpReaction(secondPersonality, event, reaction);
                this.displayAIReaction(secondPersonality, followUp);
            }, 3000 + Math.random() * 2000);
        }
    }
    
    createPersonalizedReaction(personality, event) {
        const templates = {
            'great_shot': [
                `${personality.avatar} ${personality.name}: "That's why you play the game!"`,
                `${personality.avatar} ${personality.name}: "Pure as the driven snow!"`,
                `${personality.avatar} ${personality.name}: "I felt that one from here!"`
            ],
            'bad_shot': [
                `${personality.avatar} ${personality.name}: "That's gonna leave a mark..."`,
                `${personality.avatar} ${personality.name}: "I've seen that shot before... in my nightmares."`,
                `${personality.avatar} ${personality.name}: "Someone call the search party!"`
            ],
            'bet_placed': [
                `${personality.avatar} ${personality.name}: "Ooh, I like the confidence!"`,
                `${personality.avatar} ${personality.name}: "Bold move, Cotton!"`,
                `${personality.avatar} ${personality.name}: "This is where legends are born!"`
            ]
        };
        
        const relevantTemplates = templates[event.type] || templates['great_shot'];
        return relevantTemplates[Math.floor(Math.random() * relevantTemplates.length)];
    }
    
    // GAMIFICATION - Keep Them Coming Back
    setupGameMechanics() {
        // Daily challenges
        this.generateDailyChallenge();
        
        // Achievement system
        this.trackAchievements();
        
        // Leaderboards
        this.updateLeaderboards();
        
        // Streak tracking
        this.trackStreaks();
        
        // Surprise rewards
        this.setupSurpriseRewards();
    }
    
    generateDailyChallenge() {
        const challenges = [
            {
                title: "Wind Warrior",
                description: "Make 3 shots in 15+ mph winds",
                reward: "500 Pride Points",
                icon: "💨",
                difficulty: "Medium"
            },
            {
                title: "Birdie Hunter",
                description: "Record 2 birdies today",
                reward: "1000 Pride Points + Special Badge",
                icon: "🎯",
                difficulty: "Hard"
            },
            {
                title: "Trash Talk King",
                description: "Generate 5 viral moments",
                reward: "Premium Features Unlocked",
                icon: "👑",
                difficulty: "Easy"
            }
        ];
        
        const today = new Date().toDateString();
        const savedChallenge = localStorage.getItem(`challenge_${today}`);
        
        if (!savedChallenge) {
            const challenge = challenges[Math.floor(Math.random() * challenges.length)];
            localStorage.setItem(`challenge_${today}`, JSON.stringify(challenge));
            this.displayChallenge(challenge);
        }
    }
    
    // CALLAWAY INTEGRATION HOOKS
    setupCallawayIntegration() {
        // Club recommendations based on conditions
        this.trackClubUsage();
        
        // Performance analytics for equipment
        this.analyzeEquipmentPerformance();
        
        // Upselling opportunities
        this.identifyUpgradeOpportunities();
        
        // Social proof for equipment
        this.showEquipmentSocialProof();
    }
    
    getClubRecommendation(conditions, shot) {
        const baseClub = this.calculateBaseClub(shot.distance);
        const weatherAdjustment = this.getWeatherAdjustment(conditions);
        const personalAdjustment = this.getPersonalAdjustment();
        
        const recommended = baseClub + weatherAdjustment + personalAdjustment;
        
        return {
            club: this.getClubName(recommended),
            reason: this.getRecommendationReason(weatherAdjustment, personalAdjustment),
            confidence: this.getConfidenceLevel(conditions),
            // Callaway upsell
            upgrade_suggestion: this.getCallawayUpgrade(recommended),
            pro_insight: this.getProInsight(recommended, conditions)
        };
    }
    
    // HELPERS
    fillTemplate(template, context) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return context[key] || match;
        });
    }
    
    generateShareId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getRandomPersonality(exclude) {
        const names = Object.keys(this.personalities).filter(name => name !== exclude);
        const selected = names[Math.floor(Math.random() * names.length)];
        return this.personalities[selected];
    }
    
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    }
    
    animateIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px)';
        document.body.appendChild(element);
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    }
}

// Initialize the viral experience
window.viralGolf = new ViralGolfExperience();
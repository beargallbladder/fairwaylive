// Excuse Agents - The Golf Losers Who Always Have An Excuse
class ExcuseAgentSystem {
    constructor() {
        this.excuseAgents = this.createExcusePersonalities();
        this.activeExcuseAgent = null;
        this.weatherData = null;
        this.courseConditions = null;
        this.equipmentData = null;
        this.init();
    }

    init() {
        this.assignExcuseAgent();
        this.setupExcuseEngine();
        this.trackEnvironmentalFactors();
    }

    // CREATE EXCUSE-MAKING PERSONALITIES
    createExcusePersonalities() {
        return {
            'equipment-blamer': {
                id: 'equipment-blamer',
                name: 'Equipment Eddie',
                avatar: '🏌️‍♂️',
                personality: 'gear_obsessed_loser',
                voice_style: 'whiny_technical',
                favorite_excuses: [
                    "These shafts are way too whippy for this wind, {player}.",
                    "Your lie angle is clearly off - that's why it went right.",
                    "These grips are slippery as hell today. Need new ones.",
                    "This driver face is getting worn - losing distance for sure.",
                    "The loft on that wedge is wrong for this shot, obviously.",
                    "These balls are scuffed up. Can't get proper spin with damaged balls."
                ],
                excuse_triggers: ['bad_drive', 'missed_iron', 'poor_contact', 'distance_short']
            },

            'weather-whiner': {
                id: 'weather-whiner',
                name: 'Weather Willie',
                avatar: '🌪️',
                personality: 'meteorologist_victim',
                voice_style: 'dramatic_weather_reporter',
                favorite_excuses: [
                    "This wind is swirling like crazy, {player}! No one could read that.",
                    "The humidity is making the air thick - ball won't carry.",
                    "Temperature dropped 3 degrees - that's why it came up short.",
                    "Sun got in your eyes right at impact. Timing killer.",
                    "Barometric pressure is all over the place today.",
                    "This headwind picked up right when you swung. Classic."
                ],
                excuse_triggers: ['wind_conditions', 'weather_change', 'sun_glare', 'temperature_shift']
            },

            'course-condition-critic': {
                id: 'course-condition-critic',
                name: 'Condition Carl',
                avatar: '🌱',
                personality: 'course_perfectionist',
                voice_style: 'groundskeeper_expert',
                favorite_excuses: [
                    "Look at these divots, {player}! Course is beat to shit.",
                    "Greens are bumpy as hell - that putt had no chance.",
                    "Fairway's got more mud than grass. Impossible lie.",
                    "Tee box is uneven. Can't get proper footing.",
                    "Sand in the bunkers is too soft - club just dug in.",
                    "Pin placement is ridiculous. Borderline unfair today."
                ],
                excuse_triggers: ['bad_lie', 'poor_green', 'bunker_trouble', 'uneven_terrain']
            },

            'rules-lawyer': {
                id: 'rules-lawyer',
                name: 'Rules Rudy',
                avatar: '📋',
                personality: 'technicality_obsessed',
                voice_style: 'rule_book_nerd',
                favorite_excuses: [
                    "Should be winter rules, {player}. Playing it as it lies is brutal.",
                    "That's clearly ground under repair - you get relief.",
                    "Casual water affected that shot. Free drop situation.",
                    "Someone's cart damaged this area. That's not your fault.",
                    "Ball was clearly moved by outside agency. Replay the shot.",
                    "Pace of play is too slow - throws off your rhythm."
                ],
                excuse_triggers: ['bad_lie', 'slow_play', 'course_damage', 'technical_issue']
            },

            'psychological-victim': {
                id: 'psychological-victim',
                name: 'Mental Mike',
                avatar: '🧠',
                personality: 'head_case_analyst',
                voice_style: 'amateur_psychologist',
                favorite_excuses: [
                    "That group ahead is playing too slow - messed up your tempo.",
                    "Too much pressure from those guys betting against you.",
                    "You're overthinking it because of that last bad hole.",
                    "Cart path noise right during your backswing. Concentration killer.",
                    "Playing too fast - need time to visualize the shot properly.",
                    "That guy's bright shirt is distracting in your peripheral vision."
                ],
                excuse_triggers: ['pressure_situation', 'distraction', 'mental_game', 'pace_issues']
            },

            'physical-ailment-andy': {
                id: 'physical-ailment-andy',
                name: 'Ailment Andy',
                avatar: '🤕',
                personality: 'injury_prone_complainer',
                voice_style: 'hypochondriac_golfer',
                favorite_excuses: [
                    "Back's a little tight today, {player}. Couldn't get full rotation.",
                    "Wrist is bothering me from that practice session yesterday.",
                    "Didn't stretch enough this morning - muscles are stiff.",
                    "Shoulder's acting up. Can't get the club back properly.",
                    "Feet are killing me in these spikes. Throwing off balance.",
                    "Haven't been to the range in a week - timing's off."
                ],
                excuse_triggers: ['poor_swing', 'lack_practice', 'physical_discomfort', 'timing_off']
            }
        };
    }

    // ASSIGN EXCUSE AGENT BASED ON PLAYER TYPE
    assignExcuseAgent(playerType = 'random') {
        const agentIds = Object.keys(this.excuseAgents);
        
        // For now, just rotate through them or pick based on situation
        if (playerType === 'random') {
            const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
            this.activeExcuseAgent = this.excuseAgents[randomAgent];
        }
        
        // Store preference
        localStorage.setItem('excuse_agent', this.activeExcuseAgent.id);
        
        this.announceExcuseAgent();
        return this.activeExcuseAgent;
    }

    announceExcuseAgent() {
        const playerName = this.getPlayerName();
        const intro = this.generateExcuseAgentIntro(playerName);
        
        this.displayExcuseMessage(intro, 'introduction');
    }

    generateExcuseAgentIntro(playerName) {
        const agent = this.activeExcuseAgent;
        const intros = {
            'equipment-blamer': `${agent.avatar} ${agent.name}: "Hey ${playerName}, I'm here to help you understand why your equipment is letting you down. Don't worry - it's rarely the golfer's fault when you've got subpar gear!"`,
            
            'weather-whiner': `${agent.avatar} ${agent.name}: "What's up ${playerName}! I'm your weather analyst. I'll make sure you know exactly how Mother Nature is screwing with your game today!"`,
            
            'course-condition-critic': `${agent.avatar} ${agent.name}: "Yo ${playerName}! I'm here to point out every course maintenance issue that's affecting your shots. You deserve better conditions!"`,
            
            'rules-lawyer': `${agent.avatar} ${agent.name}: "Hello ${playerName}. I'm your rules expert. I'll identify every technicality and unfair advantage others are getting that you're not!"`,
            
            'psychological-victim': `${agent.avatar} ${agent.name}: "Hey there ${playerName}. I specialize in identifying all the mental distractions and pressure situations that are throwing off your natural game!"`,
            
            'physical-ailment-andy': `${agent.avatar} ${agent.name}: "What's good ${playerName}! I understand that the body doesn't always cooperate. I'll help explain when physical limitations affect your performance!"`
        };

        return intros[agent.id] || intros['equipment-blamer'];
    }

    // EXCUSE GENERATION ENGINE
    generateExcuseForBadShot(shotData, environmentalData) {
        const agent = this.activeExcuseAgent;
        const playerName = this.getPlayerName();
        
        // Analyze the shot and find the best excuse
        const excuseType = this.determineBestExcuse(shotData, environmentalData);
        const excuse = this.createContextualExcuse(agent, playerName, excuseType, shotData, environmentalData);
        
        return excuse;
    }

    determineBestExcuse(shotData, environmentalData) {
        const agent = this.activeExcuseAgent;
        
        // Match excuse type to agent specialty and conditions
        if (agent.id === 'weather-whiner' && environmentalData.windSpeed > 10) {
            return 'wind_excuse';
        } else if (agent.id === 'equipment-blamer' && shotData.type === 'drive') {
            return 'equipment_excuse';
        } else if (agent.id === 'course-condition-critic' && shotData.lie === 'rough') {
            return 'course_excuse';
        } else if (agent.id === 'rules-lawyer' && shotData.lie === 'divot') {
            return 'rules_excuse';
        } else if (agent.id === 'psychological-victim' && shotData.pressure === 'high') {
            return 'mental_excuse';
        } else if (agent.id === 'physical-ailment-andy') {
            return 'physical_excuse';
        }
        
        // Default to agent's specialty
        return 'general_excuse';
    }

    createContextualExcuse(agent, playerName, excuseType, shotData, environmentalData) {
        const excuseTemplates = {
            'wind_excuse': [
                `${agent.avatar} ${agent.name}: "That wind gust hit right at impact, ${playerName}! Went from 8mph to ${environmentalData.windSpeed}mph in seconds!"`,
                `${agent.avatar} ${agent.name}: "Nobody could've read that swirling wind, ${playerName}. It's like a tornado out here!"`,
                `${agent.avatar} ${agent.name}: "Headwind killed that shot, ${playerName}. Add 15 yards and it's perfect!"`
            ],
            
            'equipment_excuse': [
                `${agent.avatar} ${agent.name}: "Those shafts are way too whippy for this wind, ${playerName}. Need something stiffer."`,
                `${agent.avatar} ${agent.name}: "Driver face is clearly losing its pop, ${playerName}. Time for an upgrade!"`,
                `${agent.avatar} ${agent.name}: "Ball compression is all wrong for this temperature, ${playerName}. That's physics!"`
            ],
            
            'course_excuse': [
                `${agent.avatar} ${agent.name}: "Look at these divots everywhere, ${playerName}! Course maintenance is garbage today."`,
                `${agent.avatar} ${agent.name}: "Fairway's harder than concrete, ${playerName}. Ball had no chance to stop."`,
                `${agent.avatar} ${agent.name}: "Green's bumpier than a washboard, ${playerName}. That putt was never going in!"`
            ],
            
            'rules_excuse': [
                `${agent.avatar} ${agent.name}: "Should be winter rules, ${playerName}. Playing it as it lies is brutal in these conditions."`,
                `${agent.avatar} ${agent.name}: "That's clearly casual water affecting your lie, ${playerName}. You deserve relief!"`,
                `${agent.avatar} ${agent.name}: "Pace of play is killing your rhythm, ${playerName}. Can't get in a groove!"`
            ],
            
            'mental_excuse': [
                `${agent.avatar} ${agent.name}: "Too much pressure from those bets, ${playerName}. Hard to swing freely."`,
                `${agent.avatar} ${agent.name}: "That group ahead is playing like snails, ${playerName}. Throws off your timing!"`,
                `${agent.avatar} ${agent.name}: "Cart noise right during your backswing, ${playerName}. Total concentration killer!"`
            ],
            
            'physical_excuse': [
                `${agent.avatar} ${agent.name}: "Back's a little tight today, ${playerName}. Couldn't get full rotation on that one."`,
                `${agent.avatar} ${agent.name}: "Wrist is bothering me from yesterday's practice, ${playerName}. Affecting your release!"`,
                `${agent.avatar} ${agent.name}: "Haven't been to the range in a week, ${playerName}. Timing's just off!"`
            ],
            
            'general_excuse': [
                `${agent.avatar} ${agent.name}: "Just one of those shots, ${playerName}. Everything looked perfect!"`,
                `${agent.avatar} ${agent.name}: "Ball took a weird bounce, ${playerName}. Nothing you could do about that!"`,
                `${agent.avatar} ${agent.name}: "Conditions are just brutal today, ${playerName}. Not your fault at all!"`
            ]
        };

        const relevantExcuses = excuseTemplates[excuseType] || excuseTemplates['general_excuse'];
        const selectedExcuse = relevantExcuses[Math.floor(Math.random() * relevantExcuses.length)];
        
        return this.addEnvironmentalDetails(selectedExcuse, environmentalData);
    }

    addEnvironmentalDetails(excuse, environmentalData) {
        // Add specific details about current conditions
        if (environmentalData.windSpeed > 15) {
            excuse += ` Wind's ${environmentalData.windSpeed}mph - that's insane!`;
        }
        
        if (environmentalData.temperature < 50) {
            excuse += ` Cold weather makes everything play different!`;
        }
        
        if (environmentalData.humidity > 80) {
            excuse += ` Humidity's killing ball flight today!`;
        }

        return excuse;
    }

    // REACTIVE EXCUSE SYSTEM
    reactToBadShot(shotData) {
        // Get current environmental data
        const environmentalData = this.getCurrentEnvironmentalData();
        
        // Generate appropriate excuse
        const excuse = this.generateExcuseForBadShot(shotData, environmentalData);
        
        // Display with slight delay (let the disappointment sink in first)
        setTimeout(() => {
            this.displayExcuseMessage(excuse, 'bad_shot_excuse');
        }, 1500);
    }

    getCurrentEnvironmentalData() {
        // Get real or mock environmental data
        return {
            windSpeed: 8 + Math.random() * 15,
            temperature: 65 + Math.random() * 25,
            humidity: 40 + Math.random() * 40,
            courseCondition: 'average',
            lie: 'fairway'
        };
    }

    // EXCUSE VARIETY SYSTEM
    getEquipmentExcuse(shotType, playerName) {
        const excuses = {
            'drive': [
                `Those shafts are too whippy, ${playerName}. Need something stiffer for your swing speed.`,
                `Driver face is losing its coefficient of restitution. Time for a new one.`,
                `Lie angle on that driver is clearly wrong for your swing plane.`,
                `Grip size is throwing off your release, ${playerName}. Too thick!`
            ],
            'iron': [
                `Iron heads are too blade-y, ${playerName}. Need more forgiveness.`,
                `Shaft flex is all wrong for your tempo and transition.`,
                `Lie angle needs adjustment - that's why it went right.`,
                `Club face has micro-scratches affecting ball contact.`
            ],
            'putt': [
                `Putter face isn't balanced properly, ${playerName}. Pulls left every time.`,
                `Green speeds are inconsistent - impossible to judge distance.`,
                `Ball has a scuff mark that's affecting the roll.`,
                `Putter length is wrong for your posture, ${playerName}.`
            ]
        };
        
        const shotExcuses = excuses[shotType] || excuses['iron'];
        return shotExcuses[Math.floor(Math.random() * shotExcuses.length)];
    }

    getCourseConditionExcuse(lie, playerName) {
        const excuses = {
            'rough': [
                `This rough is penal as hell, ${playerName}. PGA wouldn't play it this thick.`,
                `Grass is growing against you - impossible to get clean contact.`,
                `Rough has different grass types mixed in. Unpredictable lies.`,
                `They haven't cut this rough in weeks, ${playerName}. Ridiculous.`
            ],
            'fairway': [
                `Fairway's got more divots than grass, ${playerName}. Course is beat up.`,
                `Ground's hard as concrete - no way to get spin on that.`,
                `Sprinkler head right behind your ball affected the swing.`,
                `Fairway slopes are way more severe than they look.`
            ],
            'bunker': [
                `Sand's too soft today, ${playerName}. Club just digs right in.`,
                `Someone didn't rake this properly - ball was in a footprint.`,
                `Sand has different textures mixed in. Impossible to judge.`,
                `Bunker lips are too high - shot had no chance to clear.`
            ]
        };
        
        const lieExcuses = excuses[lie] || excuses['fairway'];
        return lieExcuses[Math.floor(Math.random() * lieExcuses.length)];
    }

    // DISPLAY SYSTEM
    displayExcuseMessage(message, type = 'general') {
        // Check if we should be quiet (friends mode)
        if (window.aiHierarchy && window.aiHierarchy.isInFriendsMode()) {
            return; // Stay quiet when friends are online
        }
        
        // Use mobile emotion bar for excuses
        if (window.mobileUI) {
            const emotion = this.getExcuseEmotion(type);
            const shortMessage = this.getShortenedExcuse(message);
            window.mobileUI.showAdvocateReaction(emotion, shortMessage);
            return;
        }
        const messageDiv = document.createElement('div');
        messageDiv.className = `excuse-message excuse-${type}`;
        
        messageDiv.innerHTML = `
            <div class="excuse-bubble">
                <div class="excuse-content">
                    ${message}
                </div>
                <div class="excuse-timestamp">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
        `;

        // Add to feed
        const feedContainer = document.getElementById('excuse-feed') || this.createExcuseFeed();
        feedContainer.appendChild(messageDiv);

        // Animate in
        setTimeout(() => {
            messageDiv.classList.add('animate-in');
        }, 100);

        // Auto-scroll to latest
        feedContainer.scrollTop = feedContainer.scrollHeight;

        // Auto-remove after a while
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 15000);
    }

    createExcuseFeed() {
        const feedContainer = document.createElement('div');
        feedContainer.id = 'excuse-feed';
        feedContainer.className = 'excuse-feed';
        
        // Add to appropriate container
        const gameContainer = document.getElementById('game-container') || document.body;
        gameContainer.appendChild(feedContainer);
        
        return feedContainer;
    }

    // HELPER FUNCTIONS
    getPlayerName() {
        return localStorage.getItem('player_name') || 'buddy';
    }

    // MOBILE UI HELPERS
    getExcuseEmotion(type) {
        const emotionMap = {
            'bad_shot_excuse': '😤',
            'equipment_excuse': '🔧',
            'weather_excuse': '🌪️',
            'course_excuse': '🌱',
            'rules_excuse': '📋',
            'mental_excuse': '🧠',
            'physical_excuse': '🤕',
            'general': '🤷‍♂️'
        };
        return emotionMap[type] || '🤷‍♂️';
    }

    getShortenedExcuse(message) {
        // Extract the core excuse from agent format
        const match = message.match(/: "(.*?)"/);
        if (match) {
            return match[1].substring(0, 45) + (match[1].length > 45 ? '...' : '');
        }
        
        // Fallback
        const parts = message.split(': ');
        const excuse = parts[parts.length - 1];
        return excuse.substring(0, 45) + (excuse.length > 45 ? '...' : '');
    }

    // PUBLIC API
    makeExcuseForShot(shotData) {
        this.reactToBadShot(shotData);
    }

    switchExcuseAgent(agentId) {
        if (this.excuseAgents[agentId]) {
            this.activeExcuseAgent = this.excuseAgents[agentId];
            localStorage.setItem('excuse_agent', agentId);
            
            const playerName = this.getPlayerName();
            const switchMessage = `${this.activeExcuseAgent.avatar} ${this.activeExcuseAgent.name}: "I'm your new excuse specialist, ${playerName}! Don't worry - nothing's ever really your fault!"`;
            
            this.displayExcuseMessage(switchMessage, 'agent_switch');
        }
    }

    // Auto-generate excuse based on conditions
    generateSmartExcuse(conditions) {
        const agent = this.activeExcuseAgent;
        const playerName = this.getPlayerName();
        
        let excuse = "";
        
        // Prioritize excuses based on conditions
        if (conditions.windSpeed > 15) {
            excuse = `${agent.avatar} ${agent.name}: "This wind is absolutely brutal, ${playerName}! ${conditions.windSpeed}mph gusts - nobody could play in this!"`;
        } else if (conditions.courseCondition === 'poor') {
            excuse = `${agent.avatar} ${agent.name}: "Course conditions are terrible today, ${playerName}. Maintenance crew should be ashamed!"`;
        } else if (conditions.equipment === 'subpar') {
            excuse = `${agent.avatar} ${agent.name}: "Your equipment is definitely holding you back, ${playerName}. Need some upgrades!"`;
        } else {
            excuse = this.activeExcuseAgent.favorite_excuses[Math.floor(Math.random() * this.activeExcuseAgent.favorite_excuses.length)].replace('{player}', playerName);
        }
        
        this.displayExcuseMessage(excuse, 'smart_excuse');
    }
}

// Add CSS for excuse messages
const excuseStyles = document.createElement('style');
excuseStyles.textContent = `
    .excuse-feed {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        overflow-y: auto;
        z-index: 999;
        pointer-events: none;
    }

    .excuse-message {
        margin: 10px 0;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.5s ease;
    }

    .excuse-message.animate-in {
        opacity: 1;
        transform: translateX(0);
    }

    .excuse-bubble {
        background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
        border-radius: 15px;
        padding: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        border: 2px solid rgba(255,255,255,0.1);
        position: relative;
    }

    .excuse-bubble::before {
        content: '😤';
        position: absolute;
        top: -8px;
        left: 10px;
        background: #ff9800;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
    }

    .excuse-content {
        color: #333;
        font-weight: 600;
        font-size: 0.85rem;
        line-height: 1.3;
        font-style: italic;
    }

    .excuse-timestamp {
        font-size: 0.7rem;
        color: rgba(51,51,51,0.7);
        margin-top: 4px;
        text-align: right;
    }

    .excuse-bad_shot_excuse .excuse-bubble {
        background: linear-gradient(135deg, #ff7043 0%, #d84315 100%);
        animation: excuseShake 1s ease-in-out;
    }

    .excuse-introduction .excuse-bubble {
        background: linear-gradient(135deg, #66bb6a 0%, #388e3c 100%);
    }

    @keyframes excuseShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    @media (max-width: 768px) {
        .excuse-feed {
            right: 10px;
            width: 250px;
            top: 80px;
        }
        
        .excuse-content {
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(excuseStyles);

// Initialize the excuse system
window.excuseAgents = new ExcuseAgentSystem();
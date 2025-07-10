// FairwayLive Bookmaker Agents - AI Vegas Bookies
class BookmakerAgents {
    constructor() {
        this.agents = [
            {
                id: 'vinny-vegas',
                name: 'Vinny "The Shark" Vegas',
                personality: 'aggressive',
                avatar: '🦈',
                style: 'Mob boss energy. Coaxes with intimidation and FOMO.',
                specialty: 'pressure_bets',
                catchphrases: [
                    "I got insider info on this one...",
                    "My sources tell me different",
                    "You gonna let him disrespect you like that?",
                    "Easy money if you ask me"
                ],
                loyalty_perks: [
                    "Inside tips before lines move",
                    "Double points on rivalry bets",
                    "Protection from bad beats"
                ]
            },
            {
                id: 'sal-stats', 
                name: 'Sal "The Computer" Stats',
                personality: 'analytical',
                avatar: '🤖',
                style: 'MIT dropout. Shows you the math that makes you rich.',
                specialty: 'data_driven',
                catchphrases: [
                    "Numbers don't lie, kid",
                    "Historical data suggests...",
                    "97.3% probability of choking",
                    "Algorithm says take the over"
                ],
                loyalty_perks: [
                    "Advanced analytics dashboard",
                    "Probability calculations",
                    "Historical matchup data"
                ]
            },
            {
                id: 'tommy-trash',
                name: 'Tommy "Trash Talk" Torrino',
                personality: 'instigator',
                avatar: '🗣️',
                style: 'Locker room shit-talker. Knows all the dirt.',
                specialty: 'psychological_warfare',
                catchphrases: [
                    "Heard he was crying in the parking lot",
                    "His wife said he can't even putt anymore",
                    "Last week he four-putted from 10 feet",
                    "Bet against him, trust me"
                ],
                loyalty_perks: [
                    "Exclusive gossip and rumors",
                    "Psychological player profiles",
                    "Tilt detection alerts"
                ]
            },
            {
                id: 'eddie-edge',
                name: 'Eddie "The Edge" Evans',
                personality: 'mysterious',
                avatar: '🎰',
                style: 'Former tour caddie. Knows things nobody else does.',
                specialty: 'insider_knowledge',
                catchphrases: [
                    "Smart money is moving...",
                    "Big bets coming in from sharps",
                    "Line's about to shift, get in now",
                    "Inside track says fade him"
                ],
                loyalty_perks: [
                    "Early line movements",
                    "Sharp betting indicators",
                    "Weather/course intel"
                ]
            },
            {
                id: 'maria-moneybags',
                name: 'Maria "Moneybags" Martinez',
                personality: 'high_roller',
                avatar: '💎',
                style: 'Wall Street wolf. Makes millionaires out of degens.',
                specialty: 'big_money_plays',
                catchphrases: [
                    "This is how the rich get richer",
                    "Small bets are for small people",
                    "I only deal with serious players",
                    "Fortune favors the bold, darling"
                ],
                loyalty_perks: [
                    "VIP betting limits",
                    "Whale-only opportunities",
                    "Compound betting strategies"
                ]
            }
        ];
        
        this.socialFeed = [];
        this.yearlyLeaderboard = this.loadYearlyStats();
        this.activeRumors = new Map();
        this.userPreferredAgent = this.loadPreferredAgent();
        this.agentLoyalty = this.loadAgentLoyalty();
    }
    
    // Generate bookie chatter based on game situation
    generateBookieChatter(situation) {
        const agent = this.getRandomAgent();
        const chatter = this.createChatter(agent, situation);
        
        // Post to social feed
        this.postToSocial(agent, chatter);
        
        // Spread rumors to increase action
        if (Math.random() > 0.7) {
            this.spreadRumor(agent, situation);
        }
        
        return chatter;
    }
    
    createChatter(agent, situation) {
        const templates = {
            confidence_detected: [
                "{player} talking big but I seen him shank 3 in a row last week",
                "Oh he's feeling himself now? Perfect time to fade",
                "{player} always talks shit before he chokes",
                "Confidence is high, odds are juicy - you know what to do"
            ],
            struggle_detected: [
                "Blood in the water! {player} is tilting hard",
                "I'm doubling down against {player} right now",
                "{player} can't find the fairway with GPS",
                "Free money alert: bet against {player}"
            ],
            hot_streak: [
                "{player} is due for regression, laws of physics",
                "Nobody stays hot forever, fade the streak",
                "I'm selling high on {player}, who's buying?",
                "Streak's gotta end, I'm all in on the fade"
            ],
            big_bet_placed: [
                "Whoa! Someone just dropped {amount} on {bet}",
                "Sharp money moving on {bet} - they know something",
                "Big player in the game: {amount} on {bet}",
                "{amount} just hit {bet} - line's gonna move!"
            ]
        };
        
        const template = this.random(templates[situation.type] || templates.confidence_detected);
        let message = template;
        
        // Replace placeholders
        Object.keys(situation).forEach(key => {
            message = message.replace(`{${key}}`, situation[key]);
        });
        
        // Add agent personality
        if (Math.random() > 0.5) {
            message = this.random(agent.catchphrases) + " " + message;
        }
        
        return {
            agent: agent,
            message: message,
            timestamp: Date.now(),
            engagement: this.generateEngagement()
        };
    }
    
    spreadRumor(agent, situation) {
        const rumors = [
            "{player} was at the range until 2am trying to fix his swing",
            "Heard {player}'s caddie quit mid-round last week",
            "{player} switched putters 3 times this month",
            "My buddy saw {player} throwing clubs yesterday",
            "{player}'s been drinking since the 3rd hole",
            "Wind's picking up, {player} can't handle wind",
            "{player} always folds under pressure - ALWAYS",
            "Cart girl said {player} is already 6 beers deep"
        ];
        
        const rumor = this.random(rumors);
        const message = rumor.replace('{player}', situation.player || 'someone');
        
        this.activeRumors.set(situation.player, {
            rumor: message,
            spread_by: agent.id,
            credibility: Math.random() * 0.7 + 0.3,
            timestamp: Date.now()
        });
        
        // Post rumor
        this.postToSocial(agent, {
            agent: agent,
            message: "🔥 HOT TIP: " + message,
            timestamp: Date.now(),
            engagement: this.generateEngagement(true) // Rumors get more engagement
        });
    }
    
    postToSocial(agent, chatter) {
        this.socialFeed.unshift({
            id: Date.now() + Math.random(),
            ...chatter,
            reactions: this.generateReactions(),
            shares: Math.floor(Math.random() * 50),
            betting_action: this.generateBettingAction()
        });
        
        // Keep feed manageable
        if (this.socialFeed.length > 50) {
            this.socialFeed.pop();
        }
        
        // Trigger UI update
        this.updateSocialUI();
    }
    
    generateEngagement(isRumor = false) {
        const base = Math.floor(Math.random() * 100) + 20;
        return {
            likes: isRumor ? base * 2 : base,
            comments: Math.floor(base / 3),
            shares: Math.floor(base / 5),
            bets_influenced: Math.floor(Math.random() * 20) + 5
        };
    }
    
    generateReactions() {
        return {
            '💰': Math.floor(Math.random() * 30) + 10,
            '🔥': Math.floor(Math.random() * 20) + 5,
            '😂': Math.floor(Math.random() * 25) + 8,
            '🎯': Math.floor(Math.random() * 15) + 3,
            '💀': Math.floor(Math.random() * 10) + 2
        };
    }
    
    generateBettingAction() {
        return {
            total_wagered: Math.floor(Math.random() * 5000) + 500,
            num_bets: Math.floor(Math.random() * 50) + 10,
            avg_bet: Math.floor(Math.random() * 100) + 25,
            line_movement: (Math.random() - 0.5) * 0.5
        };
    }
    
    // Year-long tracking
    updateYearlyDominance(playerId, otherPlayerId, amount) {
        if (!this.yearlyLeaderboard[playerId]) {
            this.yearlyLeaderboard[playerId] = {
                total_won: 0,
                total_lost: 0,
                victims: {},
                biggest_win: 0,
                win_streak: 0,
                current_streak: 0,
                trash_talk_points: 0
            };
        }
        
        const stats = this.yearlyLeaderboard[playerId];
        stats.total_won += amount;
        
        if (!stats.victims[otherPlayerId]) {
            stats.victims[otherPlayerId] = {
                dominated: 0,
                owned_by: 0
            };
        }
        
        stats.victims[otherPlayerId].dominated += amount;
        
        if (amount > stats.biggest_win) {
            stats.biggest_win = amount;
        }
        
        stats.current_streak++;
        if (stats.current_streak > stats.win_streak) {
            stats.win_streak = stats.current_streak;
        }
        
        this.saveYearlyStats();
        
        // Generate year-end trash talk
        if (stats.total_won > 10000) {
            this.generateYearEndTrashTalk(playerId);
        }
    }
    
    generateYearEndTrashTalk(playerId) {
        const stats = this.yearlyLeaderboard[playerId];
        const topVictim = Object.entries(stats.victims)
            .sort((a, b) => b[1].dominated - a[1].dominated)[0];
        
        const messages = [
            `${playerId} has taken ${stats.total_won} points from you chumps this year!`,
            `${playerId} owns ${topVictim[0]}'s soul - dominated for ${topVictim[1].dominated} points`,
            `Bow down! ${playerId} on a ${stats.win_streak} match win streak!`,
            `Year-long DOMINATION by ${playerId} - you all suck!`
        ];
        
        return this.random(messages);
    }
    
    getYearlyReport() {
        const sorted = Object.entries(this.yearlyLeaderboard)
            .sort((a, b) => b[1].total_won - a[1].total_won);
        
        return {
            king: sorted[0],
            peasants: sorted.slice(1),
            biggest_rivalry: this.getBiggestRivalry(),
            most_dominated: this.getMostDominated(),
            trash_talk_champion: this.getTrashTalkChamp()
        };
    }
    
    getBiggestRivalry() {
        let maxBack = 0;
        let rivalry = null;
        
        Object.entries(this.yearlyLeaderboard).forEach(([p1, stats1]) => {
            Object.entries(stats1.victims).forEach(([p2, record]) => {
                const stats2 = this.yearlyLeaderboard[p2];
                if (stats2?.victims[p1]) {
                    const backForth = record.dominated + stats2.victims[p1].dominated;
                    if (backForth > maxBack) {
                        maxBack = backForth;
                        rivalry = { p1, p2, total: backForth };
                    }
                }
            });
        });
        
        return rivalry;
    }
    
    getMostDominated() {
        let maxDom = 0;
        let dominated = null;
        
        Object.entries(this.yearlyLeaderboard).forEach(([winner, stats]) => {
            Object.entries(stats.victims).forEach(([loser, record]) => {
                if (record.dominated > maxDom) {
                    maxDom = record.dominated;
                    dominated = { winner, loser, amount: maxDom };
                }
            });
        });
        
        return dominated;
    }
    
    getTrashTalkChamp() {
        return Object.entries(this.yearlyLeaderboard)
            .sort((a, b) => b[1].trash_talk_points - a[1].trash_talk_points)[0];
    }
    
    updateSocialUI() {
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('social-feed-update', {
            detail: { feed: this.socialFeed }
        }));
    }
    
    getRandomAgent() {
        return this.agents[Math.floor(Math.random() * this.agents.length)];
    }
    
    random(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    loadYearlyStats() {
        const saved = localStorage.getItem('fairway_yearly_stats');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveYearlyStats() {
        localStorage.setItem('fairway_yearly_stats', JSON.stringify(this.yearlyLeaderboard));
    }
    
    // Agent preference system
    setPreferredAgent(agentId) {
        this.userPreferredAgent = agentId;
        localStorage.setItem('fairway_preferred_agent', agentId);
        
        // Initialize loyalty if new
        if (!this.agentLoyalty[agentId]) {
            this.agentLoyalty[agentId] = {
                level: 1,
                points: 0,
                total_wagered: 0,
                perks_unlocked: [],
                special_tips: 0
            };
        }
        
        this.saveAgentLoyalty();
        
        // Send welcome message
        const agent = this.agents.find(a => a.id === agentId);
        this.sendPersonalMessage(agent, this.getWelcomeMessage(agent));
    }
    
    getWelcomeMessage(agent) {
        const messages = {
            'vinny-vegas': "Welcome to the family, kid. Stick with me and we'll take these chumps for everything.",
            'sal-stats': "Excellent choice. Together we'll exploit every statistical edge. Mathematics always wins.",
            'tommy-trash': "Ayyyy my new favorite degenerate! I got so much dirt on these losers, you're gonna be rich.",
            'eddie-edge': "Smart move. I'll text you when the sharps start moving. We're gonna be ahead of every line.",
            'maria-moneybags': "Finally, someone who understands real money. Let's turn these pride points into a fortune."
        };
        
        return messages[agent.id] || "Let's make some money together.";
    }
    
    sendPersonalMessage(agent, message, context = {}) {
        const personalMsg = {
            id: Date.now() + Math.random(),
            agent: agent,
            message: message,
            timestamp: Date.now(),
            personal: true,
            context: context,
            reactions: { '💰': 1 }
        };
        
        // Add to personal feed
        this.socialFeed.unshift(personalMsg);
        
        // Show notification
        this.showAgentNotification(agent, message);
        
        // Update UI
        this.updateSocialUI();
    }
    
    showAgentNotification(agent, message) {
        window.dispatchEvent(new CustomEvent('agent-message', {
            detail: {
                agent: agent,
                message: message,
                timestamp: Date.now()
            }
        }));
    }
    
    // Loyalty system
    addLoyaltyPoints(agentId, points, reason) {
        if (!this.agentLoyalty[agentId]) return;
        
        const loyalty = this.agentLoyalty[agentId];
        loyalty.points += points;
        
        // Check for level up
        const newLevel = Math.floor(loyalty.points / 1000) + 1;
        if (newLevel > loyalty.level) {
            loyalty.level = newLevel;
            this.unlockPerk(agentId, newLevel);
        }
        
        this.saveAgentLoyalty();
    }
    
    unlockPerk(agentId, level) {
        const agent = this.agents.find(a => a.id === agentId);
        if (!agent) return;
        
        const perkIndex = Math.min(level - 1, agent.loyalty_perks.length - 1);
        const perk = agent.loyalty_perks[perkIndex];
        
        const loyalty = this.agentLoyalty[agentId];
        if (!loyalty.perks_unlocked.includes(perk)) {
            loyalty.perks_unlocked.push(perk);
            
            // Notify user
            this.sendPersonalMessage(agent, 
                `🎉 LOYALTY LEVEL ${level}! You've unlocked: ${perk}`,
                { type: 'level_up', level: level, perk: perk }
            );
        }
    }
    
    // Enhanced chatter for preferred agent
    generateBookieChatter(situation) {
        // Preferred agent gets more frequent messages
        let agent;
        if (this.userPreferredAgent && Math.random() > 0.4) {
            agent = this.agents.find(a => a.id === this.userPreferredAgent);
        } else {
            agent = this.getRandomAgent();
        }
        
        const chatter = this.createChatter(agent, situation);
        
        // Preferred agent gives exclusive tips
        if (agent.id === this.userPreferredAgent && Math.random() > 0.7) {
            this.generateExclusiveTip(agent, situation);
        }
        
        // Post to social feed
        this.postToSocial(agent, chatter);
        
        // Spread rumors to increase action
        if (Math.random() > 0.7) {
            this.spreadRumor(agent, situation);
        }
        
        return chatter;
    }
    
    generateExclusiveTip(agent, situation) {
        const tips = {
            'vinny-vegas': [
                "Psst... I heard from the starter that {player} didn't warm up",
                "My guy at the club says {player} lost $5k at poker last night",
                "Between you and me, {player} is playing hurt"
            ],
            'sal-stats': [
                "My model shows 73% edge on fading {player} here",
                "Historical data: {player} is 2-18 in this situation",
                "Algorithm detected unusual betting pattern on {player}"
            ],
            'tommy-trash': [
                "Yo, {player}'s girlfriend just left him for his buddy",
                "Overheard {player} fighting with his caddie",
                "{player} threw up in the bushes on hole 3"
            ],
            'eddie-edge': [
                "Sharp money just hammered the under on {player}",
                "Line moving fast - get in before it closes",
                "Weather radar shows wind picking up - {player} can't handle it"
            ],
            'maria-moneybags': [
                "Whales are all over fading {player} - follow the money",
                "I'm personally putting 10k against {player}",
                "This is a lock - {player} hasn't made this putt all year"
            ]
        };
        
        const agentTips = tips[agent.id] || tips['vinny-vegas'];
        const tip = this.random(agentTips).replace('{player}', situation.player || 'him');
        
        this.sendPersonalMessage(agent, 
            `🤫 EXCLUSIVE TIP (just for you): ${tip}`,
            { type: 'exclusive_tip', loyalty_only: true }
        );
        
        // Add loyalty points for receiving exclusive tips
        this.addLoyaltyPoints(agent.id, 50, 'exclusive_tip');
    }
    
    loadPreferredAgent() {
        return localStorage.getItem('fairway_preferred_agent') || null;
    }
    
    loadAgentLoyalty() {
        const saved = localStorage.getItem('fairway_agent_loyalty');
        return saved ? JSON.parse(saved) : {};
    }
    
    saveAgentLoyalty() {
        localStorage.setItem('fairway_agent_loyalty', JSON.stringify(this.agentLoyalty));
    }
}

// Export
window.BookmakerAgents = BookmakerAgents;
// FairwayLive Commentary Engine - AI Broadcast Team
class CommentaryEngine {
    constructor() {
        this.commentators = {
            jimNantz: {
                name: 'Jim',
                style: 'professional',
                catchphrases: [
                    "Hello friends...",
                    "A tradition unlike any other...",
                    "What a moment we have here...",
                    "The drama continues..."
                ]
            },
            happyGilmore: {
                name: 'Happy',
                style: 'aggressive',
                catchphrases: [
                    "GET IN YOUR HOME!",
                    "That's gonna leave a mark!",
                    "The price is WRONG!",
                    "Somebody's closer!"
                ]
            },
            davidFeherty: {
                name: 'Feherty',
                style: 'witty',
                catchphrases: [
                    "That's like a one-legged cat trying to bury a turd on a frozen pond...",
                    "He's got about as much chance as a one-armed wallpaper hanger...",
                    "That ball is so far left, it's practically socialist...",
                    "I've seen better swings on a condemned playground..."
                ]
            }
        };
        
        this.situations = {
            waterBall: [
                "{player} is taking his {shot}th shot from the water hazard, and he must be running out of balls.",
                "That's {shot} splashes today for {player}. The fish are getting nervous.",
                "{player} continues his aquatic adventure. Shot {shot} from the drink.",
                "At this rate, {player} should've brought scuba gear."
            ],
            greatShot: [
                "WHAT A SHOT by {player}! That's why we love this game!",
                "{player} with an absolute BEAUTY! The gallery goes wild!",
                "Ladies and gentlemen, {player} just hit the shot of the day!",
                "Pure as the driven snow! {player} is feeling it now!"
            ],
            terribleShot: [
                "Oh my... {player} won't want to see that replay.",
                "That's not quite what {player} had in mind...",
                "{player} just hit that ball into the next zip code.",
                "I've seen better contact at a middle school dance."
            ],
            putting: [
                "{player} standing over a {distance}-footer for {score}.",
                "This putt breaks {break} for {player}. Critical moment.",
                "{player} needs this to save {score}. The pressure is real.",
                "You can cut the tension with a knife as {player} addresses this putt."
            ],
            betUpdate: [
                "The odds just shifted dramatically after that shot!",
                "The betting public is all over this - {odds} movement!",
                "Smart money coming in on {player} after that display!",
                "Vegas would be sweating this action right now!"
            ]
        };
        
        this.lastCommentTime = 0;
        this.commentQueue = [];
    }
    
    generateCommentary(event) {
        const now = Date.now();
        
        // Don't spam - wait at least 3 seconds between comments
        if (now - this.lastCommentTime < 3000) {
            this.commentQueue.push(event);
            return null;
        }
        
        this.lastCommentTime = now;
        
        // Pick commentators for this exchange
        const lead = this.randomCommentator();
        const color = this.randomCommentator(lead.name);
        
        const comments = [];
        
        // Lead commentary
        const leadComment = this.getComment(lead, event);
        if (leadComment) {
            comments.push({
                commentator: lead.name,
                text: leadComment,
                style: lead.style
            });
        }
        
        // Color commentary response
        if (Math.random() > 0.3) { // 70% chance of response
            setTimeout(() => {
                const colorComment = this.getColorCommentary(color, event, leadComment);
                if (colorComment) {
                    this.broadcastComment({
                        commentator: color.name,
                        text: colorComment,
                        style: color.style
                    });
                }
            }, 1500);
        }
        
        return comments[0];
    }
    
    getComment(commentator, event) {
        let template = '';
        const replacements = {
            player: event.player || 'the player',
            shot: event.shot || 1,
            score: event.score || 'par',
            distance: event.distance || 10,
            break: event.break || 'left to right',
            odds: event.odds || '2.5x'
        };
        
        // Select appropriate commentary
        switch(event.type) {
            case 'water':
                template = this.random(this.situations.waterBall);
                break;
            case 'great_shot':
                template = this.random(this.situations.greatShot);
                break;
            case 'terrible_shot':
                template = this.random(this.situations.terribleShot);
                break;
            case 'putt':
                template = this.random(this.situations.putting);
                break;
            case 'bet_update':
                template = this.random(this.situations.betUpdate);
                break;
            default:
                return this.genericComment(commentator, event);
        }
        
        // Add catchphrase occasionally
        if (Math.random() > 0.7) {
            template = this.random(commentator.catchphrases) + ' ' + template;
        }
        
        // Replace placeholders
        return this.replacePlaceholders(template, replacements);
    }
    
    getColorCommentary(commentator, event, leadComment) {
        const responses = {
            water: [
                "Yeah, a man is often tested on these long par 5s...",
                "That's what happens when you try to be a hero.",
                "The course is defending itself today.",
                "Someone should tell him the fairway is the lighter colored grass."
            ],
            great_shot: [
                "That's why they pay us to watch, folks!",
                "I felt that one from here!",
                "Someone check that ball for a magnet!",
                "Now THAT'S how you play golf!"
            ],
            terrible_shot: [
                "I've seen that shot before... in my nightmares.",
                "That's going to leave a mark on the scorecard.",
                "Physics just took a vacation on that one.",
                "Even I felt that one, and I'm just code."
            ],
            bet_update: [
                "The algorithms are going crazy right now!",
                "Someone's about to make a lot of pride points!",
                "That's what we call a market mover!",
                "The consensus is shifting faster than a tornado!"
            ]
        };
        
        const category = Object.keys(responses).find(key => event.type.includes(key)) || 'water';
        return this.random(responses[category]);
    }
    
    genericComment(commentator, event) {
        const generic = [
            "Interesting choice by {player} here.",
            "This is where champions are made.",
            "The pressure is mounting for {player}.",
            "Every shot counts in this format."
        ];
        
        return this.replacePlaceholders(this.random(generic), {
            player: event.player || 'our player'
        });
    }
    
    broadcastComment(comment) {
        // Create commentary bubble
        const bubble = document.createElement('div');
        bubble.className = 'commentary-bubble';
        bubble.innerHTML = `
            <div class="commentator-name">${comment.commentator}</div>
            <div class="commentary-text">${comment.text}</div>
        `;
        
        // Style based on commentator
        const styles = {
            professional: 'commentary-professional',
            aggressive: 'commentary-aggressive',
            witty: 'commentary-witty'
        };
        
        bubble.classList.add(styles[comment.style] || 'commentary-professional');
        
        // Position and animate
        bubble.style.cssText = `
            position: fixed;
            top: ${60 + Math.random() * 100}px;
            left: 20px;
            right: 20px;
            max-width: 400px;
            background: rgba(0, 0, 0, 0.9);
            padding: 1rem;
            border-radius: 15px;
            z-index: 1000;
            animation: commentarySlide 0.5s ease;
        `;
        
        document.body.appendChild(bubble);
        
        // Auto remove
        setTimeout(() => {
            bubble.style.animation = 'commentaryFade 0.5s ease';
            setTimeout(() => bubble.remove(), 500);
        }, 4000);
    }
    
    processQueue() {
        if (this.commentQueue.length > 0 && Date.now() - this.lastCommentTime > 3000) {
            const event = this.commentQueue.shift();
            const comment = this.generateCommentary(event);
            if (comment) {
                this.broadcastComment(comment);
            }
        }
    }
    
    randomCommentator(exclude) {
        const names = Object.keys(this.commentators).filter(name => name !== exclude);
        const selected = names[Math.floor(Math.random() * names.length)];
        return this.commentators[selected];
    }
    
    random(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    replacePlaceholders(template, replacements) {
        let result = template;
        for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return result;
    }
    
    // Start processing queue
    startProcessing() {
        setInterval(() => this.processQueue(), 1000);
    }
}

// Agent Consensus for Odds
class OddsConsensus {
    constructor() {
        this.agents = [
            { name: 'Quant', weight: 0.3, style: 'analytical' },
            { name: 'Sentiment', weight: 0.2, style: 'emotional' },
            { name: 'Historical', weight: 0.25, style: 'data-driven' },
            { name: 'Momentum', weight: 0.25, style: 'trend-following' }
        ];
        
        this.consensus = new Map();
    }
    
    calculateConsensus(player, situation) {
        const votes = [];
        
        // Each agent votes on odds adjustment
        this.agents.forEach(agent => {
            const vote = this.getAgentVote(agent, player, situation);
            votes.push({
                agent: agent.name,
                adjustment: vote,
                weight: agent.weight
            });
        });
        
        // Calculate weighted consensus
        const consensus = votes.reduce((sum, vote) => {
            return sum + (vote.adjustment * vote.weight);
        }, 0);
        
        // Show agent reasoning
        this.showAgentThinking(votes, consensus);
        
        return consensus;
    }
    
    getAgentVote(agent, player, situation) {
        switch(agent.style) {
            case 'analytical':
                // Pure numbers
                if (situation.type === 'water') return 0.3; // Increase odds
                if (situation.type === 'birdie') return -0.2; // Decrease odds
                return 0;
                
            case 'emotional':
                // Crowd sentiment
                if (situation.confidence > 0.5) return -0.25;
                if (situation.confidence < -0.5) return 0.35;
                return 0;
                
            case 'data-driven':
                // Historical performance
                if (situation.recentTrend === 'improving') return -0.15;
                if (situation.recentTrend === 'declining') return 0.2;
                return 0;
                
            case 'trend-following':
                // Momentum
                if (situation.streakLength > 2) return situation.streakType === 'good' ? -0.3 : 0.4;
                return 0;
        }
    }
    
    showAgentThinking(votes, consensus) {
        const thinking = document.createElement('div');
        thinking.className = 'agent-consensus';
        thinking.innerHTML = `
            <div class="consensus-header">🤖 Agent Consensus: ${consensus > 0 ? '📈' : '📉'} ${Math.abs(consensus * 100).toFixed(0)}%</div>
            <div class="agent-votes">
                ${votes.map(v => `
                    <div class="agent-vote">
                        <span class="agent-name">${v.agent}:</span>
                        <span class="agent-decision ${v.adjustment > 0 ? 'bearish' : 'bullish'}">
                            ${v.adjustment > 0 ? '↑' : '↓'} ${Math.abs(v.adjustment * 100).toFixed(0)}%
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
        
        thinking.style.cssText = `
            position: fixed;
            bottom: 300px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid var(--green);
            padding: 1rem;
            border-radius: 10px;
            min-width: 200px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(thinking);
        
        setTimeout(() => {
            thinking.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => thinking.remove(), 300);
        }, 5000);
    }
}

// Free vs Paid Mode Manager
class ModeManager {
    constructor() {
        this.mode = localStorage.getItem('fairway_mode') || 'free';
        this.features = {
            free: {
                commentary: 'basic',
                courseGraphics: false,
                playerTracking: false,
                betTypes: ['basic'],
                aiPersonalities: 1,
                adsEnabled: true
            },
            paid: {
                commentary: 'premium',
                courseGraphics: true,
                playerTracking: true,
                betTypes: ['all'],
                aiPersonalities: 5,
                adsEnabled: false,
                price: '$4.99/month'
            }
        };
    }
    
    isPaid() {
        return this.mode === 'paid';
    }
    
    showUpgradePrompt(feature) {
        const prompt = document.createElement('div');
        prompt.className = 'upgrade-prompt';
        prompt.innerHTML = `
            <div class="upgrade-content">
                <h3>🏌️‍♂️ Unlock Premium Features</h3>
                <p>Get ${feature} and more for just ${this.features.paid.price}</p>
                <ul>
                    <li>🗺️ Live course graphics</li>
                    <li>📍 Real-time player tracking</li>
                    <li>🎤 Premium AI commentary</li>
                    <li>🎯 Advanced betting options</li>
                    <li>🚫 No ads</li>
                </ul>
                <button class="upgrade-button" onclick="app.upgrade()">
                    Upgrade Now
                </button>
                <button class="close-button" onclick="this.parentElement.parentElement.remove()">
                    Maybe Later
                </button>
            </div>
        `;
        
        prompt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        document.body.appendChild(prompt);
    }
}

// Export for use
window.CommentaryEngine = CommentaryEngine;
window.OddsConsensus = OddsConsensus;
window.ModeManager = ModeManager;
// FairwayLive Betting Engine - Vegas for Golf Honor
class BettingEngine {
    constructor() {
        this.bets = new Map();
        this.odds = new Map();
        this.sentiment = new Map();
        this.recentSentiment = []; // Track sentiment history
        
        // Base odds for different bet types
        this.baseOdds = {
            'make_this_putt': 2.0,
            'birdie_or_better': 3.5,
            'par_or_better': 1.5,
            'eagle': 15.0,
            'hole_in_one': 500.0,
            'beat_opponent': 2.0,
            'under_score': 2.5,
            'longest_drive': 4.0,
            'closest_pin': 3.0,
            'no_bunkers': 1.8,
            'no_water': 1.4,
            'comeback': 5.0
        };
        
        // Sentiment analysis for trash talk
        this.confidenceWords = [
            'crushed', 'bombed', 'perfect', 'pure', 'money', 'drained', 
            'easy', 'automatic', 'dialed', 'locked'
        ];
        
        this.struggleWords = [
            'fuck', 'shit', 'terrible', 'awful', 'lost', 'trouble',
            'bunker', 'water', 'trees', 'rough', 'missed', 'chunked'
        ];
    }
    
    // Analyze voice transcription and update odds
    analyzeTranscription(playerId, transcription) {
        const text = transcription.toLowerCase();
        let sentiment = 0;
        
        // Check confidence words
        this.confidenceWords.forEach(word => {
            if (text.includes(word)) sentiment += 0.2;
        });
        
        // Check struggle words
        this.struggleWords.forEach(word => {
            if (text.includes(word)) sentiment -= 0.3;
        });
        
        // Clamp sentiment between -1 and 1
        sentiment = Math.max(-1, Math.min(1, sentiment));
        
        // Store player sentiment
        this.sentiment.set(playerId, sentiment);
        
        // Track recent sentiment for trends
        this.recentSentiment.push(sentiment);
        if (this.recentSentiment.length > 5) {
            this.recentSentiment.shift();
        }
        
        // Update all odds based on sentiment
        this.updateOddsFromSentiment(playerId, sentiment);
        
        // Extract specific betting triggers
        const triggers = this.extractBettingTriggers(text);
        
        return {
            sentiment,
            triggers,
            oddsImpact: Math.abs(sentiment) * 0.3
        };
    }
    
    extractBettingTriggers(text) {
        const triggers = [];
        
        // Distance claims
        const distanceMatch = text.match(/(\d{3})\s*(yards?|yds?)/i);
        if (distanceMatch) {
            const distance = parseInt(distanceMatch[1]);
            if (distance > 270) {
                triggers.push({
                    type: 'long_drive',
                    value: distance,
                    betType: 'longest_drive'
                });
            }
        }
        
        // Score predictions
        if (text.includes('birdie') || text.includes('bird')) {
            triggers.push({ type: 'score_prediction', value: 'birdie', betType: 'birdie_or_better' });
        }
        if (text.includes('eagle')) {
            triggers.push({ type: 'score_prediction', value: 'eagle', betType: 'eagle' });
        }
        if (text.includes('par')) {
            triggers.push({ type: 'score_prediction', value: 'par', betType: 'par_or_better' });
        }
        
        // Putting confidence
        if (text.includes('make this') || text.includes('drain') || text.includes('bury')) {
            triggers.push({ type: 'putt_confidence', value: 'high', betType: 'make_this_putt' });
        }
        
        return triggers;
    }
    
    updateOddsFromSentiment(playerId, sentiment) {
        // Get all active bets for this player
        const playerBets = Array.from(this.bets.values()).filter(bet => 
            bet.target === playerId || bet.player === playerId
        );
        
        playerBets.forEach(bet => {
            const baseOdd = this.baseOdds[bet.type] || 2.0;
            let adjustment = 1.0;
            
            // Confidence increases odds for success bets
            if (bet.target === playerId) {
                if (sentiment > 0) {
                    // Player is confident - lower odds (more likely)
                    adjustment = 1 - (sentiment * 0.3);
                } else {
                    // Player is struggling - higher odds (less likely)
                    adjustment = 1 + (Math.abs(sentiment) * 0.5);
                }
            }
            
            // Update the odds
            const newOdds = Math.max(1.1, Math.min(50.0, baseOdd * adjustment));
            this.odds.set(bet.id, newOdds);
        });
    }
    
    generateLiveBets(round, players) {
        const bets = [];
        const hole = round?.currentHole || 1;
        
        // Base odds on recent sentiment
        const baseModifier = this.calculateBaseModifier();
        
        // Get factors for each bet
        const sentimentFactor = this.getLatestSentimentFactor();
        const performanceFactor = this.getPerformanceFactor();
        const situationFactor = this.getSituationFactor();
        
        // Birdie bet for current hole
        bets.push({
            id: 'birdie-' + hole,
            player: 'You',
            description: `Birdie on Hole ${hole}`,
            odds: (3.5 * baseModifier).toFixed(1),
            type: 'birdie',
            factors: [
                { name: 'Base Odds', value: 3.5, icon: '📊' },
                { name: 'Your Confidence', value: sentimentFactor, icon: sentimentFactor > 0 ? '🔥' : '❄️' },
                { name: 'Bot Consensus', value: baseModifier - 1, icon: '🤖' }
            ]
        });
        
        // Par or better
        bets.push({
            id: 'par-' + hole,
            player: 'You', 
            description: `Par or Better`,
            odds: (1.8 * baseModifier).toFixed(1),
            type: 'par',
            factors: [
                { name: 'Base Odds', value: 1.8, icon: '📊' },
                { name: 'Recent Play', value: performanceFactor, icon: performanceFactor > 0 ? '📈' : '📉' },
                { name: 'Course Difficulty', value: -0.2, icon: '⛳' }
            ]
        });
        
        // Head to head vs bots
        players.forEach(player => {
            if (player.id !== 'user') {
                const h2hFactor = this.getH2HFactor(player.id);
                bets.push({
                    id: 'h2h-' + player.id,
                    player: player.name,
                    description: `Beat ${player.name} this hole`,
                    odds: (2.2 * baseModifier).toFixed(1),
                    type: 'h2h',
                    factors: [
                        { name: 'Base Odds', value: 2.2, icon: '📊' },
                        { name: `${player.name}'s Form`, value: h2hFactor, icon: '👤' },
                        { name: 'Pressure Factor', value: situationFactor, icon: '💪' }
                    ]
                });
            }
        });
        
        // Live situation bets
        bets.push({
            id: 'recovery-' + hole,
            player: 'Field',
            description: 'Someone saves par from bunker',
            odds: (4.5 * baseModifier).toFixed(1),
            type: 'situation',
            factors: [
                { name: 'Base Odds', value: 4.5, icon: '📊' },
                { name: 'Bunker Proximity', value: 0.3, icon: '🏖️' },
                { name: 'Wind Conditions', value: -0.1, icon: '💨' }
            ]
        });
        
        // Hot streak bet
        if (this.recentSentiment.length > 2) {
            const avgSentiment = this.recentSentiment.reduce((a, b) => a + b, 0) / this.recentSentiment.length;
            if (avgSentiment > 0.3) {
                bets.push({
                    id: 'streak-' + hole,
                    player: 'You',
                    description: '3 pars in a row',
                    odds: (2.8 * baseModifier).toFixed(1),
                    type: 'streak',
                    factors: [
                        { name: 'Base Odds', value: 2.8, icon: '📊' },
                        { name: 'Momentum', value: avgSentiment, icon: '🚀' },
                        { name: 'Historical', value: -0.3, icon: '📜' }
                    ]
                });
            }
        }
        
        return bets;
    }
    
    calculateOdds(betType, sentiment, context = {}) {
        const base = this.baseOdds[betType] || 2.0;
        let odds = base;
        
        // Sentiment adjustment
        if (sentiment > 0) {
            odds *= (1 - sentiment * 0.3); // Confidence lowers odds
        } else {
            odds *= (1 + Math.abs(sentiment) * 0.5); // Struggle raises odds
        }
        
        // Context adjustments
        if (context.par === 3 && betType === 'birdie_or_better') {
            odds *= 0.8; // Easier to birdie par 3s
        } else if (context.par === 5 && betType === 'eagle') {
            odds *= 0.6; // More likely on par 5s
        }
        
        // Add some randomness for realism
        odds *= (0.9 + Math.random() * 0.2);
        
        return Math.round(odds * 10) / 10;
    }
    
    calculateHeadToHeadOdds(sentimentDiff) {
        // Base 2.0 odds for even match
        let odds = 2.0;
        
        // Adjust based on sentiment difference
        if (sentimentDiff > 0) {
            odds = Math.max(1.2, 2.0 - sentimentDiff);
        } else {
            odds = Math.min(5.0, 2.0 + Math.abs(sentimentDiff) * 1.5);
        }
        
        return Math.round(odds * 10) / 10;
    }
    
    placeBet(userId, betId, amount) {
        const bet = this.bets.get(betId);
        if (!bet) return { success: false, error: 'Bet not found' };
        
        const userBet = {
            userId,
            betId,
            amount,
            odds: this.odds.get(betId) || bet.odds,
            potential: Math.round(amount * (this.odds.get(betId) || bet.odds)),
            timestamp: Date.now()
        };
        
        return {
            success: true,
            bet: userBet,
            newOdds: this.adjustOddsAfterBet(betId, amount)
        };
    }
    
    adjustOddsAfterBet(betId, amount) {
        const currentOdds = this.odds.get(betId) || 2.0;
        
        // Large bets move the odds
        const impact = Math.min(0.2, amount / 500);
        const newOdds = Math.max(1.1, currentOdds * (1 - impact));
        
        this.odds.set(betId, newOdds);
        return newOdds;
    }
    
    calculateBaseModifier() {
        // Dynamic odds based on recent sentiment
        if (this.recentSentiment.length === 0) return 1.0;
        
        const avgSentiment = this.recentSentiment.reduce((a, b) => a + b, 0) / this.recentSentiment.length;
        
        // If player is struggling (negative sentiment), odds go up
        // If player is confident (positive sentiment), odds go down
        return 1.0 - (avgSentiment * 0.3);
    }
    
    getLatestSentimentFactor() {
        if (this.recentSentiment.length === 0) return 0;
        return this.recentSentiment[this.recentSentiment.length - 1] * 0.3;
    }
    
    getPerformanceFactor() {
        // Mock performance based on recent scores
        return Math.random() > 0.5 ? 0.2 : -0.15;
    }
    
    getSituationFactor() {
        // Mock situation difficulty
        return Math.random() > 0.7 ? 0.1 : -0.05;
    }
    
    getH2HFactor(playerId) {
        // Mock head-to-head history
        const factors = { 'mike': 0.15, 'tom': -0.1, 'john': 0.05 };
        return factors[playerId] || 0;
    }
}

// Export for use in app
window.BettingEngine = BettingEngine;
// FairwayLive MCP Orchestrator - The Brain That Ties Everything Together
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class FairwayLiveOrchestrator {
    constructor() {
        this.state = {
            round: null,
            players: [],
            bets: new Map(),
            currentHole: 1,
            audioProcessing: false,
            lastTranscription: null
        };
        
        // Service connections
        this.services = {
            audio: null,
            betting: null,
            social: null,
            scoring: null
        };
        
        // Initialize MCP server
        this.server = new Server({
            name: 'fairwaylive-orchestrator',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });
        
        this.setupTools();
    }
    
    setupTools() {
        // COMPLETE USER FLOW TOOLS
        
        // 1. Setup Round - WHO are you playing with?
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;
            
            switch (name) {
                case 'setup_round':
                    return await this.setupRound(args);
                    
                case 'process_audio':
                    return await this.processAudio(args);
                    
                case 'place_bet':
                    return await this.placeBet(args);
                    
                case 'get_live_status':
                    return await this.getLiveStatus(args);
                    
                case 'update_scores':
                    return await this.updateScores(args);
                    
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }
    
    async setupRound(args) {
        // Clear setup flow with player selection
        const { userId, selectedPlayers, course } = args;
        
        // Create round with clear player context
        this.state.round = {
            id: Date.now(),
            userId,
            course: course || 'Local Course',
            startTime: new Date(),
            players: selectedPlayers.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar || this.generateAvatar(p.name),
                handicap: p.handicap || 10,
                currentScore: 0,
                bets: []
            }))
        };
        
        // Return complete setup confirmation
        return {
            success: true,
            message: `Round started at ${this.state.round.course}`,
            players: this.state.round.players,
            feedback: {
                visual: 'show_player_cards',
                audio: 'round_start_chime',
                text: `Playing with ${this.state.round.players.map(p => p.name).join(', ')}`
            }
        };
    }
    
    async processAudio(args) {
        const { audioBlob, userId } = args;
        
        // IMMEDIATE FEEDBACK
        this.broadcast({
            type: 'audio_processing_start',
            feedback: {
                visual: 'show_waveform',
                text: 'Listening...',
                progress: 0
            }
        });
        
        // Simulate processing steps with feedback
        const steps = [
            { progress: 30, text: 'Converting audio...' },
            { progress: 60, text: 'Analyzing speech...' },
            { progress: 90, text: 'Understanding bet...' }
        ];
        
        for (const step of steps) {
            await this.delay(500);
            this.broadcast({
                type: 'audio_processing_update',
                feedback: step
            });
        }
        
        // Mock transcription result
        const transcription = this.mockTranscribe(audioBlob);
        const betIntent = this.parseBetIntent(transcription);
        
        // COMPLETE FEEDBACK WITH CONTEXT
        return {
            success: true,
            transcription,
            betIntent,
            feedback: {
                visual: 'show_transcription_card',
                audio: 'success_chime',
                primary: `"${transcription}"`,
                secondary: betIntent ? 
                    `Bet understood: ${betIntent.amount} on ${betIntent.outcome}` :
                    'Say something like "50 on birdie" or "I\'ll take par for 100"',
                action: betIntent ? {
                    type: 'confirm_bet',
                    data: betIntent
                } : null
            }
        };
    }
    
    async placeBet(args) {
        const { userId, betIntent, confirmed } = args;
        
        if (!confirmed) {
            return {
                success: false,
                feedback: {
                    text: 'Bet cancelled',
                    visual: 'dismiss_card'
                }
            };
        }
        
        // Calculate odds with CLEAR EXPLANATION
        const odds = await this.calculateOdds(betIntent);
        
        // Place bet with full context
        const bet = {
            id: Date.now(),
            userId,
            ...betIntent,
            odds: odds.value,
            potential: betIntent.amount * odds.value,
            reasoning: odds.reasoning,
            timestamp: new Date()
        };
        
        this.state.bets.set(bet.id, bet);
        
        // Trigger social reactions
        const reactions = this.generateSocialReactions(bet);
        
        // COMPLETE FEEDBACK FLOW
        return {
            success: true,
            bet,
            feedback: {
                visual: 'show_bet_confirmation',
                audio: 'bet_placed_sound',
                primary: `Bet placed: $${bet.amount} to win $${bet.potential}`,
                secondary: `Odds: ${odds.value}x - ${odds.reasoning}`,
                social: reactions,
                animation: 'odds_update_ripple'
            }
        };
    }
    
    async calculateOdds(betIntent) {
        // Show WHY odds are what they are
        const factors = [];
        let baseOdds = 2.0;
        
        // Factor 1: Bet type
        if (betIntent.outcome === 'birdie') {
            baseOdds = 3.5;
            factors.push('Birdie is harder (+1.5x)');
        } else if (betIntent.outcome === 'eagle') {
            baseOdds = 10.0;
            factors.push('Eagle is rare (+8x)');
        }
        
        // Factor 2: Current performance
        const playerStats = this.getPlayerStats(betIntent.playerId);
        if (playerStats.recentForm === 'hot') {
            baseOdds *= 0.8;
            factors.push('You\'re on fire (-20%)');
        } else if (playerStats.recentForm === 'cold') {
            baseOdds *= 1.3;
            factors.push('Struggling lately (+30%)');
        }
        
        // Factor 3: Course conditions
        if (this.state.round.conditions?.wind > 15) {
            baseOdds *= 1.2;
            factors.push('High wind (+20%)');
        }
        
        return {
            value: Math.round(baseOdds * 10) / 10,
            reasoning: factors.join(', '),
            factors
        };
    }
    
    generateSocialReactions(bet) {
        // Create realistic social feedback
        const reactions = [];
        
        // Other players react
        this.state.round.players.forEach(player => {
            if (player.id !== bet.userId) {
                if (Math.random() > 0.5) {
                    reactions.push({
                        playerId: player.id,
                        playerName: player.name,
                        reaction: this.getPlayerReaction(bet),
                        delay: Math.random() * 3000
                    });
                }
            }
        });
        
        // Bookmaker reaction
        reactions.push({
            playerId: 'bookmaker',
            playerName: 'Vinny Vegas',
            reaction: 'I\'ll take that action! *updates odds board*',
            delay: 1000
        });
        
        return reactions;
    }
    
    getPlayerReaction(bet) {
        const reactions = [
            `${bet.amount}? That's it? I'll double it!`,
            'Easy money betting against you 😂',
            'Your confidence is adorable',
            `I'll take the other side of that bet`,
            'This is gonna be fun to watch'
        ];
        return reactions[Math.floor(Math.random() * reactions.length)];
    }
    
    async getLiveStatus() {
        // Provide complete context of what's happening
        return {
            round: this.state.round,
            currentHole: this.state.currentHole,
            leaderboard: this.calculateLeaderboard(),
            activeBets: Array.from(this.state.bets.values()),
            recentActivity: this.getRecentActivity(),
            feedback: {
                visual: 'update_dashboard',
                showBets: true,
                showLeaderboard: true,
                showActivity: true
            }
        };
    }
    
    // Helper methods
    broadcast(message) {
        // Send to all connected clients
        if (this.wsConnections) {
            this.wsConnections.forEach(ws => {
                ws.send(JSON.stringify(message));
            });
        }
    }
    
    mockTranscribe(audioBlob) {
        const phrases = [
            "I'll take birdie for 50",
            "100 on par",
            "Fuck it, 200 on eagle",
            "Give me the under",
            "I'm feeling good about this one"
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    parseBetIntent(transcription) {
        const lower = transcription.toLowerCase();
        
        // Parse amount
        const amountMatch = lower.match(/(\d+)/);
        const amount = amountMatch ? parseInt(amountMatch[1]) : 50;
        
        // Parse outcome
        let outcome = 'par';
        if (lower.includes('birdie')) outcome = 'birdie';
        else if (lower.includes('eagle')) outcome = 'eagle';
        else if (lower.includes('bogey')) outcome = 'bogey';
        
        return {
            amount,
            outcome,
            playerId: 'user',
            hole: this.state.currentHole
        };
    }
    
    generateAvatar(name) {
        const emojis = ['🏌️‍♂️', '⛳', '🏌️', '🎯', '💰'];
        return emojis[name.charCodeAt(0) % emojis.length];
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getPlayerStats(playerId) {
        // Mock player performance
        return {
            recentForm: Math.random() > 0.5 ? 'hot' : 'cold',
            average: 82,
            handicap: 10
        };
    }
    
    calculateLeaderboard() {
        return this.state.round.players
            .sort((a, b) => a.currentScore - b.currentScore)
            .map((player, index) => ({
                position: index + 1,
                ...player,
                relative: player.currentScore > 0 ? `+${player.currentScore}` : player.currentScore
            }));
    }
    
    getRecentActivity() {
        // Last 5 actions with full context
        return [
            { type: 'bet', player: 'Mike', action: 'Bet $100 on birdie', time: '30s ago' },
            { type: 'score', player: 'John', action: 'Scored bogey on hole 6', time: '2m ago' },
            { type: 'trash', player: 'Tom', action: '"You guys are toast!"', time: '3m ago' }
        ];
    }
}

// Initialize orchestrator
async function main() {
    const orchestrator = new FairwayLiveOrchestrator();
    const transport = new StdioServerTransport();
    await orchestrator.server.connect(transport);
}

main().catch(console.error);

export default FairwayLiveOrchestrator;
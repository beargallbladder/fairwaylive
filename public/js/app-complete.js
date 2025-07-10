// FairwayLive - COMPLETE User Experience Flow
class FairwayLiveComplete {
    constructor() {
        this.state = {
            screen: 'player-select',  // Start with WHO you're playing with
            round: null,
            players: [],
            selectedPlayers: [],
            currentHole: 1,
            activeBets: [],
            audioFeedback: null,
            lastTranscription: null
        };
        
        // Available players (your golf buddies)
        this.availablePlayers = [
            { id: 'mike', name: 'Mike', avatar: '🏌️‍♂️', handicap: 12, tagline: 'Always talks shit' },
            { id: 'tom', name: 'Tom', avatar: '⛳', handicap: 8, tagline: 'Mr. Consistent' },
            { id: 'john', name: 'John', avatar: '🎯', handicap: 15, tagline: 'Luck over skill' },
            { id: 'sarah', name: 'Sarah', avatar: '💰', handicap: 10, tagline: 'Takes your money' }
        ];
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
        
        // Initialize bot advocates and excuse agents
        this.botAdvocates = window.botAdvocates;
        this.excuseAgents = window.excuseAgents;
        
        if (this.botAdvocates) {
            // Assign advocate when app starts
            setTimeout(() => {
                this.botAdvocates.assignPlayerAdvocate('player1');
            }, 2000);
        }
        
        if (this.excuseAgents) {
            // Assign excuse agent too
            setTimeout(() => {
                this.excuseAgents.assignExcuseAgent('random');
            }, 4000);
        }
    }
    
    render() {
        const app = document.getElementById('app');
        
        switch(this.state.screen) {
            case 'player-select':
                app.innerHTML = this.renderPlayerSelect();
                break;
            case 'round-active':
                app.innerHTML = this.renderActiveRound();
                break;
            case 'bet-confirmation':
                app.innerHTML = this.renderBetConfirmation();
                break;
        }
        
        this.attachDynamicListeners();
    }
    
    renderPlayerSelect() {
        return `
            <div class="screen player-select active">
                <div class="header-complete">
                    <h1>⛳ Hey Homeboy</h1>
                    <p>Who's playing today?</p>
                </div>
                
                <div class="player-grid">
                    ${this.availablePlayers.map(player => `
                        <div class="player-card ${this.state.selectedPlayers.includes(player.id) ? 'selected' : ''}" 
                             onclick="app.togglePlayer('${player.id}')">
                            <div class="player-avatar">${player.avatar}</div>
                            <div class="player-info">
                                <div class="player-name">${player.name}</div>
                                <div class="player-handicap">HC: ${player.handicap}</div>
                                <div class="player-tagline">${player.tagline}</div>
                            </div>
                            <div class="player-check">
                                ${this.state.selectedPlayers.includes(player.id) ? '✓' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="player-select-footer">
                    <p class="selection-count">
                        ${this.state.selectedPlayers.length} players selected
                    </p>
                    <button class="btn-primary" 
                            onclick="app.startRoundWithPlayers()"
                            ${this.state.selectedPlayers.length === 0 ? 'disabled' : ''}>
                        Start Round
                    </button>
                </div>
            </div>
        `;
    }
    
    renderActiveRound() {
        return `
            <div class="screen round-active active">
                <!-- Top Bar - Shows WHO is playing -->
                <div class="round-header">
                    <div class="hole-info">
                        <h2>Hole ${this.state.currentHole}</h2>
                        <span>Par 4 • 385 yds</span>
                    </div>
                    <div class="players-bar">
                        ${this.state.players.map(p => `
                            <div class="player-bubble">
                                ${p.avatar} ${p.currentScore > 0 ? '+' : ''}${p.currentScore || 'E'}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Main Action Area -->
                <div class="action-area">
                    <!-- Voice Recording with Visual Feedback -->
                    <div class="voice-section">
                        <button class="voice-button ${this.state.recording ? 'recording' : ''}" 
                                id="voiceBtn">
                            <span class="voice-icon">🎙️</span>
                            ${this.state.recording ? 
                                '<div class="recording-indicator">Recording...</div>' : 
                                '<div class="voice-hint">Hold to place bet</div>'
                            }
                        </button>
                        
                        <!-- Audio Feedback Display -->
                        ${this.state.audioFeedback ? `
                            <div class="audio-feedback">
                                <div class="transcription-card">
                                    <div class="what-you-said">
                                        <label>What you said:</label>
                                        <p>"${this.state.audioFeedback.transcription}"</p>
                                    </div>
                                    ${this.state.audioFeedback.betIntent ? `
                                        <div class="bet-understood">
                                            <label>Bet understood:</label>
                                            <p>$${this.state.audioFeedback.betIntent.amount} on ${this.state.audioFeedback.betIntent.outcome}</p>
                                            <div class="bet-actions">
                                                <button class="btn-primary" onclick="app.confirmBet()">
                                                    Place Bet
                                                </button>
                                                <button class="btn-secondary" onclick="app.cancelBet()">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="bet-help">
                                            <p>💡 Try saying: "50 on birdie" or "I'll take par for 100"</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Active Bets with Clear Context -->
                    <div class="active-bets-section">
                        <h3>Active Bets This Hole</h3>
                        ${this.state.activeBets.length > 0 ? `
                            <div class="bets-list">
                                ${this.state.activeBets.map(bet => `
                                    <div class="bet-card">
                                        <div class="bet-who">
                                            ${bet.playerName} bet $${bet.amount}
                                        </div>
                                        <div class="bet-what">
                                            ${bet.outcome} • ${bet.odds}x odds
                                        </div>
                                        <div class="bet-why">
                                            ${bet.reasoning}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p class="no-bets">No bets yet. Be the first!</p>
                        `}
                    </div>
                    
                    <!-- Live Activity Feed -->
                    <div class="activity-feed">
                        <h3>Live Activity</h3>
                        <div class="activity-items">
                            ${this.getRecentActivity().map(activity => `
                                <div class="activity-item ${activity.type}">
                                    <span class="activity-player">${activity.player}</span>
                                    <span class="activity-action">${activity.action}</span>
                                    <span class="activity-time">${activity.time}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Quick Score Entry -->
                <div class="score-section">
                    <label>Score this hole:</label>
                    <div class="score-buttons">
                        ${[2, 3, 4, 5, 6].map(score => `
                            <button class="score-btn" onclick="app.submitScore(${score})">
                                ${score}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderBetConfirmation() {
        const bet = this.state.pendingBet;
        return `
            <div class="bet-confirmation-overlay">
                <div class="bet-confirmation-card">
                    <h2>Confirm Your Bet</h2>
                    
                    <div class="bet-details">
                        <div class="bet-row">
                            <label>Betting on:</label>
                            <span>${bet.outcome} on hole ${bet.hole}</span>
                        </div>
                        <div class="bet-row">
                            <label>Amount:</label>
                            <span>$${bet.amount}</span>
                        </div>
                        <div class="bet-row">
                            <label>Odds:</label>
                            <span>${bet.odds}x</span>
                        </div>
                        <div class="bet-row highlight">
                            <label>Potential win:</label>
                            <span>$${bet.potential}</span>
                        </div>
                    </div>
                    
                    <div class="odds-explanation">
                        <h4>Why these odds?</h4>
                        <ul>
                            ${bet.factors.map(factor => `<li>${factor}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="bet-actions">
                        <button class="btn-primary" onclick="app.placeBet()">
                            Confirm Bet
                        </button>
                        <button class="btn-secondary" onclick="app.cancelBet()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Player Selection
    togglePlayer(playerId) {
        const index = this.state.selectedPlayers.indexOf(playerId);
        if (index > -1) {
            this.state.selectedPlayers.splice(index, 1);
        } else {
            this.state.selectedPlayers.push(playerId);
        }
        this.render();
    }
    
    startRoundWithPlayers() {
        if (this.state.selectedPlayers.length === 0) return;
        
        // Create player objects
        this.state.players = [
            { id: 'user', name: 'You', avatar: '🙋‍♂️', currentScore: 0 },
            ...this.state.selectedPlayers.map(id => {
                const player = this.availablePlayers.find(p => p.id === id);
                return {
                    ...player,
                    currentScore: 0
                };
            })
        ];
        
        // Start round
        this.state.round = {
            id: Date.now(),
            startTime: new Date(),
            course: 'Pebble Beach'
        };
        
        this.state.screen = 'round-active';
        this.render();
        
        // Show welcome message
        this.showNotification(`Round started with ${this.state.players.slice(1).map(p => p.name).join(', ')}`);
    }
    
    // Voice Recording with Feedback
    async startRecording() {
        this.state.recording = true;
        this.state.audioFeedback = null;
        this.render();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
            this.mediaRecorder.onstop = () => this.processRecording();
            
            this.mediaRecorder.start();
            
            // Visual feedback
            if (navigator.vibrate) navigator.vibrate(50);
            
        } catch (err) {
            this.showNotification('Microphone access required', 'error');
            this.state.recording = false;
            this.render();
        }
    }
    
    stopRecording() {
        if (!this.state.recording) return;
        
        this.state.recording = false;
        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        this.render();
    }
    
    async processRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Simulate processing with feedback
        this.showProcessingFeedback();
        
        // Mock transcription and bet parsing
        setTimeout(() => {
            const transcription = this.mockTranscription();
            const betIntent = this.parseBetIntent(transcription);
            
            this.state.audioFeedback = {
                transcription,
                betIntent
            };
            
            // Trigger bot advocate reaction to bet placement
            if (this.botAdvocates && betIntent.amount > 0) {
                this.botAdvocates.reactToPlayerAction({
                    type: 'bet_placed'
                }, {
                    betAmount: betIntent.amount,
                    confidence: betIntent.confidence || 'medium',
                    transcription: transcription
                });
            }
            
            this.render();
        }, 1500);
    }
    
    mockTranscription() {
        const phrases = [
            "I'll take birdie for 50",
            "100 on par",
            "Give me eagle for 200",
            "50 bucks says I make this",
            "I'm going under par"
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    parseBetIntent(text) {
        const lower = text.toLowerCase();
        const amountMatch = lower.match(/(\d+)/);
        
        if (!amountMatch) return null;
        
        let outcome = 'par';
        if (lower.includes('birdie')) outcome = 'birdie';
        else if (lower.includes('eagle')) outcome = 'eagle';
        else if (lower.includes('bogey')) outcome = 'bogey';
        
        const amount = parseInt(amountMatch[1]);
        const odds = this.calculateOdds(outcome);
        
        return {
            amount,
            outcome,
            hole: this.state.currentHole,
            odds: odds.value,
            potential: amount * odds.value,
            factors: odds.factors
        };
    }
    
    calculateOdds(outcome) {
        const factors = [];
        let odds = 2.0;
        
        switch(outcome) {
            case 'birdie':
                odds = 3.5;
                factors.push('Birdie is harder than par (+1.5x)');
                break;
            case 'eagle':
                odds = 10.0;
                factors.push('Eagle is extremely rare (+8x)');
                break;
            case 'bogey':
                odds = 1.2;
                factors.push('Bogey is likely (-0.8x)');
                break;
        }
        
        // Add context factors
        if (this.state.players.length > 2) {
            odds *= 1.1;
            factors.push('More players = more competition (+10%)');
        }
        
        return {
            value: Math.round(odds * 10) / 10,
            factors
        };
    }
    
    confirmBet() {
        if (!this.state.audioFeedback?.betIntent) return;
        
        this.state.pendingBet = this.state.audioFeedback.betIntent;
        this.state.screen = 'bet-confirmation';
        this.render();
    }
    
    placeBet() {
        const bet = {
            ...this.state.pendingBet,
            id: Date.now(),
            playerId: 'user',
            playerName: 'You',
            reasoning: this.state.pendingBet.factors.join(', '),
            timestamp: new Date()
        };
        
        this.state.activeBets.push(bet);
        this.state.screen = 'round-active';
        this.state.audioFeedback = null;
        this.render();
        
        // Show confirmation
        this.showNotification(`Bet placed! $${bet.amount} to win $${bet.potential}`);
        
        // Trigger bot reactions
        this.triggerBotReactions(bet);
    }
    
    cancelBet() {
        this.state.audioFeedback = null;
        this.state.pendingBet = null;
        this.state.screen = 'round-active';
        this.render();
    }
    
    triggerBotReactions(bet) {
        // Other players react to your bet
        setTimeout(() => {
            const reactions = [
                { player: 'Mike', action: 'matched your bet', time: 'just now' },
                { player: 'Tom', action: 'laughed at your bet', time: 'just now' }
            ];
            
            reactions.forEach((reaction, i) => {
                setTimeout(() => {
                    this.addActivity('bet', reaction.player, reaction.action);
                    this.render();
                }, i * 1000);
            });
        }, 1500);
    }
    
    // Activity Management
    getRecentActivity() {
        return this.state.recentActivity || [
            { type: 'join', player: 'Mike', action: 'joined the round', time: '5m ago' },
            { type: 'score', player: 'Tom', action: 'scored birdie on 1', time: '3m ago' }
        ];
    }
    
    addActivity(type, player, action) {
        if (!this.state.recentActivity) {
            this.state.recentActivity = [];
        }
        
        this.state.recentActivity.unshift({
            type,
            player,
            action,
            time: 'just now'
        });
        
        if (this.state.recentActivity.length > 10) {
            this.state.recentActivity.pop();
        }
    }
    
    // Helpers
    showNotification(message, type = 'success') {
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 1rem 2rem;
            background: ${type === 'error' ? 'var(--hot)' : 'var(--green)'};
            color: var(--white);
            border-radius: 25px;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
    
    showProcessingFeedback() {
        const processing = document.createElement('div');
        processing.className = 'processing-overlay';
        processing.innerHTML = `
            <div class="processing-card">
                <div class="processing-spinner"></div>
                <p>Analyzing your bet...</p>
            </div>
        `;
        document.body.appendChild(processing);
        
        setTimeout(() => processing.remove(), 1500);
    }
    
    submitScore(score) {
        this.showNotification(`Scored ${score} on hole ${this.state.currentHole}`);
        
        // Update scores
        this.state.players[0].currentScore += (score - 4);
        
        // Trigger bot advocate reaction to shot performance
        const parDiff = score - 4; // Assume par 4 for now
        let shotQuality = 'average';
        
        if (parDiff <= -2) shotQuality = 'great'; // Eagle or better
        else if (parDiff === -1) shotQuality = 'great'; // Birdie
        else if (parDiff === 0) shotQuality = 'good'; // Par
        else if (parDiff >= 2) shotQuality = 'bad'; // Double bogey or worse
        
        if (this.botAdvocates) {
            this.botAdvocates.reactToPlayerAction({
                type: shotQuality === 'great' || shotQuality === 'good' ? 'great_shot' : 'bad_shot'
            }, {
                score: score,
                par: 4,
                quality: shotQuality,
                hole: this.state.currentHole
            });
        }
        
        // Trigger excuse agent for bad shots
        if (this.excuseAgents && (shotQuality === 'bad' || parDiff >= 1)) {
            this.excuseAgents.makeExcuseForShot({
                score: score,
                par: 4,
                type: 'general',
                quality: shotQuality,
                hole: this.state.currentHole,
                lie: 'fairway',
                pressure: this.state.activeBets.length > 0 ? 'high' : 'low'
            });
        }
        
        // Move to next hole
        setTimeout(() => {
            this.state.currentHole++;
            this.state.activeBets = [];
            this.state.audioFeedback = null;
            this.render();
        }, 1000);
    }
    
    attachEventListeners() {
        // Global event listeners
    }
    
    attachDynamicListeners() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startRecording();
            });
            
            voiceBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopRecording();
            });
            
            voiceBtn.addEventListener('mousedown', () => this.startRecording());
            voiceBtn.addEventListener('mouseup', () => this.stopRecording());
        }
    }
}

// Initialize the complete app
window.app = new FairwayLiveComplete();
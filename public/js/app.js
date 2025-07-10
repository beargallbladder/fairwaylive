// FairwayLive - Lightweight Web App
// Using Claude-Flow Neural Swarm Architecture

class FairwayLive {
    constructor() {
        this.state = {
            screen: 'landing',
            round: null,
            user: null,
            location: null,
            ws: null,
            recording: false,
            mediaRecorder: null,
            audioChunks: []
        };
        
        this.swarm = new SwarmClient();
        this.betting = new BettingEngine();
        this.bookmakers = window.socialFeed ? window.socialFeed.bookmakers : null;
        this.players = [
            { id: 'user', name: 'You' },
            { id: 'mike', name: 'Mike' },
            { id: 'tom', name: 'Tom' },
            { id: 'john', name: 'John' }
        ];
        this.init();
    }

    async init() {
        // Service worker for offline & caching
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }

        // Connect to swarm
        try {
            await this.swarm.connect();
        } catch (err) {
            console.warn('Swarm connection failed, running standalone');
        }

        // Render initial screen
        this.render();
        
        // Event listeners
        this.attachEventListeners();
        
        // Check for existing session
        this.checkSession();
        
        // Listen for battery optimization
        window.addEventListener('battery-mode-change', (e) => {
            this.handleBatteryMode(e.detail);
        });
        
        // Initialize social feed
        if (window.socialFeed) {
            window.socialFeed.init(document.body);
        }
    }

    render() {
        const app = document.getElementById('app');
        
        switch(this.state.screen) {
            case 'landing':
                app.innerHTML = this.renderLanding();
                break;
            case 'round':
                app.innerHTML = this.renderRound();
                break;
            case 'watch':
                app.innerHTML = this.renderWatch();
                break;
        }
        
        // Re-attach dynamic event listeners
        this.attachDynamicListeners();
    }

    renderLanding() {
        return `
            <div class="screen landing active">
                <div class="logo">⛳ FairwayLive</div>
                <div class="tagline">Live golf betting with your boys</div>
                
                <button class="btn-primary" onclick="app.startRound()">
                    START ROUND
                </button>
                
                <button class="btn-secondary" onclick="app.watchLive()">
                    WATCH LIVE
                </button>
                
                <div class="mt-3">
                    <a href="#" onclick="app.signIn()" style="color: var(--gray); font-size: 0.9rem;">
                        Sign in
                    </a>
                </div>
            </div>
        `;
    }

    renderRound() {
        const hole = this.state.round?.currentHole || 1;
        const par = this.state.round?.holes?.[hole-1]?.par || 4;
        const yards = this.state.round?.holes?.[hole-1]?.yards || 385;
        
        return `
            <div class="screen round-screen active">
                <div class="hole-info">
                    <h2>Hole ${hole}</h2>
                    <div class="hole-details">
                        <span>Par ${par}</span>
                        <span>${yards} yds</span>
                    </div>
                </div>
                
                <div class="voice-area">
                    <button class="voice-button" id="voiceBtn">
                        <span class="voice-icon">🎙️</span>
                    </button>
                    <div class="voice-hint">Hold to talk trash or call your shot</div>
                    
                    <div class="transcription" id="transcription"></div>
                </div>
                
                <div class="quick-score">
                    <div class="score-label">Quick Score:</div>
                    <div class="score-picker">
                        ${this.renderScoreButtons(par)}
                    </div>
                </div>
                
                ${this.renderBettingTicker()}
            </div>
        `;
    }

    renderScoreButtons(par) {
        const scores = [];
        for (let i = par - 2; i <= par + 3; i++) {
            if (i > 0) {
                scores.push(`
                    <button class="score-btn ${i === par ? 'selected' : ''}" 
                            onclick="app.submitScore(${i})">
                        ${i}
                    </button>
                `);
            }
        }
        return scores.join('');
    }

    renderBettingTicker() {
        // Generate live bets based on current state
        const liveBets = this.betting.generateLiveBets(this.state.round, this.players);
        
        // Sort by odds for excitement
        liveBets.sort((a, b) => a.odds - b.odds);
        
        const betsHtml = liveBets.slice(0, 5).map(bet => `
            <div class="bet-item" data-bet-id="${bet.id}" onclick="app.selectBet('${bet.id}')">
                <div class="bet-details">
                    <div class="bet-player">${bet.player || 'Field'}</div>
                    <div class="bet-description">${bet.description}</div>
                </div>
                <div class="bet-odds ${this.getOddsClass(bet.odds)}">${bet.odds}x</div>
            </div>
        `).join('');
        
        return `
            <div class="betting-ticker">
                <div class="ticker-header">
                    <div class="ticker-title">LIVE ODDS</div>
                    <div class="live-indicator">
                        <div class="live-dot"></div>
                        <span style="font-size: 0.8rem;">VEGAS MODE</span>
                    </div>
                </div>
                
                <div class="odds-explainer">
                    <span class="explainer-icon">💡</span>
                    <span class="explainer-text">Odds react to your voice & performance</span>
                </div>
                
                <div class="bets-list" id="betsList">
                    ${betsHtml}
                </div>
                
                <div class="quick-bet-amounts">
                    <button class="bet-amount" onclick="app.placeBet(10)">10</button>
                    <button class="bet-amount" onclick="app.placeBet(25)">25</button>
                    <button class="bet-amount" onclick="app.placeBet(50)">50</button>
                    <button class="bet-amount" onclick="app.placeBet(100)">100</button>
                    <button class="bet-amount" onclick="app.placeBet('allin')">ALL IN</button>
                </div>
            </div>
            
            <button class="social-feed-btn" onclick="socialFeed.toggleFeed()">
                🎰 <span class="feed-indicator">0</span>
            </button>
        `;
    }
    
    getOddsClass(odds) {
        if (odds < 2.0) return 'odds-hot';
        if (odds > 5.0) return 'odds-long';
        return '';
    }

    renderWatch() {
        return `
            <div class="screen watch-screen active">
                <div class="watch-header">
                    <div class="player-avatar">TM</div>
                    <div class="player-info">
                        <h2>Tom's Round</h2>
                        <div class="player-status">Hole 7 • +4</div>
                    </div>
                </div>
                
                <div class="watch-feed" id="watchFeed">
                    <div class="update-item">
                        <div class="update-time">23 seconds ago</div>
                        <div class="update-content">
                            "Fuck this hole"
                        </div>
                    </div>
                </div>
                
                <div class="trash-talk-input">
                    <button class="talk-button" onclick="app.sendTrashTalk()">
                        🎙️
                    </button>
                    <button class="btn-primary" style="flex: 1;" onclick="app.betOnPlayer()">
                        💰 BET ON TOM
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Global listeners that persist
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTracking();
            } else {
                this.resumeTracking();
            }
        });
    }

    attachDynamicListeners() {
        // Voice button with touch events
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            // Touch events for mobile
            voiceBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startRecording();
            });
            
            voiceBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopRecording();
            });
            
            // Mouse events for desktop testing
            voiceBtn.addEventListener('mousedown', () => this.startRecording());
            voiceBtn.addEventListener('mouseup', () => this.stopRecording());
        }
    }

    async startRound() {
        // Show instant feedback
        this.showLoading('Detecting course...');
        
        // Get location (battery efficient)
        this.state.location = await this.getLocation();
        
        // Use swarm for intelligent course detection
        if (this.swarm.ws?.readyState === WebSocket.OPEN) {
            try {
                const swarmResult = await this.swarm.request('course-detection', {
                    latitude: this.state.location.latitude,
                    longitude: this.state.location.longitude,
                    accuracy: this.state.location.accuracy
                }, { priority: 'urgent' });
                
                if (swarmResult.courseDetected) {
                    // Swarm found course with high confidence
                    this.state.round = swarmResult.round;
                    this.state.screen = 'round';
                    this.hideLoading();
                    this.render();
                    this.connectWebSocket();
                    return;
                }
            } catch (err) {
                console.warn('Swarm detection failed, falling back');
            }
        }
        
        // Fallback to traditional API
        const response = await fetch('/api/rounds/quick-start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: this.state.location.latitude,
                longitude: this.state.location.longitude
            })
        });
        
        const data = await response.json();
        
        this.state.round = data.round;
        this.state.screen = 'round';
        
        // Connect WebSocket for real-time
        this.connectWebSocket();
        
        this.hideLoading();
        this.render();
    }

    async getLocation() {
        return new Promise((resolve) => {
            // Quick timeout - don't wait forever
            const timeout = setTimeout(() => {
                resolve({ latitude: 37.5665, longitude: 126.9780 }); // Default
            }, 3000);
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeout);
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                () => {
                    clearTimeout(timeout);
                    resolve({ latitude: 37.5665, longitude: 126.9780 }); // Default
                },
                { enableHighAccuracy: false, timeout: 3000 }
            );
        });
    }

    connectWebSocket() {
        this.state.ws = new WebSocket(`ws://${window.location.host}`);
        
        this.state.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleRealtimeUpdate(data);
        };
    }

    handleRealtimeUpdate(data) {
        switch(data.type) {
            case 'bet:new':
                this.addBetToTicker(data.bet);
                break;
            case 'score:update':
                this.updateLeaderboard(data);
                break;
            case 'voice:received':
                this.showVoiceUpdate(data);
                break;
        }
    }

    async startRecording() {
        if (this.state.recording) return;
        
        this.state.recording = true;
        this.state.audioChunks = [];
        
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.add('recording');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000 // Lower sample rate for smaller files
                } 
            });
            
            // Use lower quality for faster upload
            this.state.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 16000
            });
            
            this.state.mediaRecorder.ondataavailable = (event) => {
                this.state.audioChunks.push(event.data);
            };
            
            this.state.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.state.audioChunks, { type: 'audio/webm' });
                await this.uploadVoice(audioBlob);
            };
            
            this.state.mediaRecorder.start();
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } catch (err) {
            console.error('Mic error:', err);
            this.state.recording = false;
            voiceBtn.classList.remove('recording');
        }
    }

    async stopRecording() {
        if (!this.state.recording) return;
        
        this.state.recording = false;
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.remove('recording');
        
        if (this.state.mediaRecorder && this.state.mediaRecorder.state === 'recording') {
            this.state.mediaRecorder.stop();
            this.state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    async uploadVoice(audioBlob) {
        const transcriptionDiv = document.getElementById('transcription');
        transcriptionDiv.textContent = 'Processing...';
        transcriptionDiv.classList.add('show');
        
        // Parallel processing strategy
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('roundId', this.state.round.id);
        formData.append('batteryMode', this.swarm.batteryOptimizer.mode);
        
        // Try swarm first for instant prediction
        const swarmPromise = this.swarm.ws?.readyState === WebSocket.OPEN ? 
            this.swarm.request('quick-transcribe', {
                audioSize: audioBlob.size,
                roundContext: {
                    hole: this.state.round.currentHole,
                    par: this.state.round.holes?.[this.state.round.currentHole - 1]?.par
                }
            }, { priority: 'urgent' }) : null;
        
        // Upload in parallel
        const uploadPromise = fetch('/api/voice/upload', {
            method: 'POST',
            body: formData
        }).then(r => r.json());
        
        try {
            // Use swarm prediction while upload happens
            if (swarmPromise) {
                const prediction = await Promise.race([
                    swarmPromise,
                    new Promise(resolve => setTimeout(() => resolve(null), 500))
                ]);
                
                if (prediction?.likelyScore) {
                    // Show predicted score immediately
                    this.highlightScore(prediction.likelyScore);
                    transcriptionDiv.textContent = 'Got it! Processing details...';
                }
            }
            
            // Wait for actual result
            const data = await uploadPromise;
            
            // Update with real transcription
            transcriptionDiv.textContent = data.transcription;
            
            // ANALYZE TRANSCRIPTION FOR BETTING
            const analysis = this.betting.analyzeTranscription('user', data.transcription);
            
            // Update odds immediately based on sentiment
            if (Math.abs(analysis.sentiment) > 0.2) {
                this.showOddsChange(analysis.sentiment);
                this.updateBettingTicker();
            }
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                transcriptionDiv.classList.remove('show');
            }, 3000);
            
            // Update UI if score was detected
            if (data.scoreDetected) {
                this.highlightScore(data.score);
                
                // Auto-submit score if high confidence
                if (data.confidence > 0.9) {
                    setTimeout(() => {
                        this.submitScore(data.score + this.state.round.holes?.[this.state.round.currentHole - 1]?.par || 4);
                    }, 1000);
                }
            }
            
            // Trigger bot reactions
            if (analysis.sentiment < -0.5) {
                this.triggerBotReaction('struggle');
                // Bookmakers react to struggle
                if (this.bookmakers) {
                    this.bookmakers.generateBookieChatter({
                        type: 'struggle_detected',
                        player: 'You',
                        sentiment: analysis.sentiment
                    });
                }
            } else if (analysis.sentiment > 0.5) {
                this.triggerBotReaction('confidence');
                // Bookmakers react to confidence
                if (this.bookmakers) {
                    this.bookmakers.generateBookieChatter({
                        type: 'confidence_detected', 
                        player: 'You',
                        sentiment: analysis.sentiment
                    });
                }
            }
            
            // Let swarm learn from this
            if (this.swarm.ws?.readyState === WebSocket.OPEN) {
                this.swarm.request('training-feedback', {
                    predicted: swarmPromise?.likelyScore,
                    actual: data.score,
                    transcription: data.transcription
                }, { priority: 'low' });
            }
            
        } catch (err) {
            console.error('Upload error:', err);
            transcriptionDiv.textContent = 'No worries, try again';
            
            // Still hide after delay
            setTimeout(() => {
                transcriptionDiv.classList.remove('show');
            }, 2000);
        }
    }

    async submitScore(score) {
        // Visual feedback
        document.querySelectorAll('.score-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        if (event?.target) {
            event.target.classList.add('selected');
        }
        
        // Quick haptic
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
        
        // Store score locally
        if (!this.state.round.scores) {
            this.state.round.scores = [];
        }
        
        this.state.round.scores.push({
            hole: this.state.round.currentHole,
            score: score,
            par: this.state.round.holes[this.state.round.currentHole - 1].par
        });
        
        // Send to backend
        await fetch('/api/rounds/' + this.state.round.id + '/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hole: this.state.round.currentHole,
                score: score
            })
        }).catch(err => console.log('Score save failed, continuing...'));
        
        // Check if round is complete
        if (this.state.round.currentHole >= 18) {
            setTimeout(() => {
                this.showRoundSummary();
            }, 1000);
        } else {
            // Auto-advance after 1 second
            setTimeout(() => {
                this.state.round.currentHole++;
                this.render();
            }, 1000);
        }
    }
    
    showRoundSummary() {
        const scores = this.state.round.scores || [];
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        const totalPar = scores.reduce((sum, s) => sum + s.par, 0);
        const relativeToPar = totalScore - totalPar;
        
        // Calculate stats
        const birdies = scores.filter(s => s.score < s.par).length;
        const pars = scores.filter(s => s.score === s.par).length;
        const bogeys = scores.filter(s => s.score > s.par).length;
        
        // Generate trash talk summary
        const summary = this.generateTrashTalkSummary(relativeToPar, birdies);
        
        // Create summary screen
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen summary-screen active">
                <h1>Round Complete! 🏌️‍♂️</h1>
                
                <div class="summary-stats">
                    <div class="stat-row">
                        <span class="stat-label">Total Score</span>
                        <span class="stat-value">${totalScore}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">To Par</span>
                        <span class="stat-value ${relativeToPar < 0 ? 'under' : 'over'}">
                            ${relativeToPar > 0 ? '+' : ''}${relativeToPar}
                        </span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Birdies</span>
                        <span class="stat-value">${birdies}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Betting W/L</span>
                        <span class="stat-value">+250 pts</span>
                    </div>
                </div>
                
                <div class="trash-talk-summary">
                    <h3>${summary.title}</h3>
                    <p>${summary.message}</p>
                </div>
                
                <div class="share-section">
                    <button class="share-button" onclick="app.shareRound()">
                        Share the Glory 🔥
                    </button>
                    
                    <button class="btn-secondary mt-2" onclick="app.newRound()">
                        New Round
                    </button>
                </div>
            </div>
        `;
    }
    
    generateTrashTalkSummary(relativeToPar, birdies) {
        if (relativeToPar < -5) {
            return {
                title: "🔥 ABSOLUTE FIRE!",
                message: "Someone call the tour, you're going pro!"
            };
        } else if (relativeToPar < 0) {
            return {
                title: "💪 Solid Round!",
                message: `${birdies} birdies? Not bad for a weekend warrior.`
            };
        } else if (relativeToPar < 10) {
            return {
                title: "😅 Room for Improvement",
                message: "At least the beer was cold..."
            };
        } else {
            return {
                title: "💀 Rough Day",
                message: "Maybe try bowling next time?"
            };
        }
    }
    
    async shareRound() {
        const text = `Just finished my round on FairwayLive! ${this.state.round.scores.length} holes played. Who wants to bet against me next time? 🏌️‍♂️💰`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'FairwayLive Round',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard!');
        }
    }
    
    newRound() {
        this.state.round = null;
        this.state.screen = 'landing';
        this.render();
    }

    async placeBet(amount) {
        // Quick feedback
        event.target.style.transform = 'scale(0.9)';
        setTimeout(() => {
            event.target.style.transform = '';
        }, 100);
        
        if (!this.state.selectedBet) {
            this.showNotification('Select a bet first!', 'warning');
            return;
        }
        
        // Place the bet
        const result = this.betting.placeBet('user', this.state.selectedBet, amount === 'allin' ? 1000 : amount);
        
        if (result.success) {
            this.showNotification(`Bet placed! ${amount} points at ${result.bet.odds}x`, 'success');
            
            // Bookmakers react to big bets
            if (this.bookmakers && (amount > 50 || amount === 'allin')) {
                this.bookmakers.generateBookieChatter({
                    type: 'big_bet_placed',
                    amount: amount === 'allin' ? 'ALL IN' : amount,
                    bet: this.state.selectedBet,
                    player: 'You'
                });
            }
            
            // Add loyalty points for preferred bookmaker
            if (this.bookmakers && this.bookmakers.userPreferredAgent) {
                this.bookmakers.addLoyaltyPoints(
                    this.bookmakers.userPreferredAgent,
                    amount === 'allin' ? 100 : Math.floor(amount / 10),
                    'bet_placed'
                );
            }
        }
    }

    // Battery saving functions
    pauseTracking() {
        // Stop GPS when app is hidden
        if (this.state.gpsInterval) {
            clearInterval(this.state.gpsInterval);
        }
    }

    resumeTracking() {
        // Resume GPS when app is visible
        if (this.state.round) {
            this.startLazyGPS();
        }
    }

    startLazyGPS() {
        // Only update GPS every 2 minutes
        this.state.gpsInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.updateLocation();
            }
        }, 120000); // 2 minutes
    }

    async updateLocation() {
        const location = await this.getLocation();
        
        // Send to MCP backend for hole detection
        fetch('/api/rounds/' + this.state.round.id + '/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location)
        });
    }

    // Stub functions for now
    watchLive() {
        this.state.screen = 'watch';
        this.render();
    }

    signIn() {
        console.log('Sign in flow');
    }

    sendTrashTalk() {
        console.log('Trash talk');
    }

    betOnPlayer() {
        console.log('Bet on player');
    }

    highlightScore(score) {
        const scoreBtns = document.querySelectorAll('.score-btn');
        scoreBtns.forEach(btn => {
            if (parseInt(btn.textContent) === score) {
                btn.classList.add('selected');
            }
        });
    }

    checkSession() {
        // Check for existing session
        const session = localStorage.getItem('fairway_session');
        if (session) {
            this.state.user = JSON.parse(session);
        }
    }
    
    handleBatteryMode(detail) {
        console.log('Battery mode:', detail.mode, 'Level:', detail.level);
        
        // Adjust behavior based on battery
        if (detail.mode === 'critical') {
            // Reduce GPS updates
            if (this.state.gpsInterval) {
                clearInterval(this.state.gpsInterval);
                this.startLazyGPS(); // Will use longer interval
            }
            
            // Show battery warning
            this.showNotification('Low battery - reducing GPS updates', 'warning');
        }
    }
    
    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.id = 'loading';
        loading.textContent = message;
        document.body.appendChild(loading);
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.remove();
        }
    }
    
    showOddsChange(sentiment) {
        const message = sentiment > 0 
            ? `🔥 ODDS DROPPING - Confidence detected!` 
            : `📈 ODDS RISING - Struggle detected!`;
        
        this.showNotification(message, sentiment > 0 ? 'hot' : 'cold');
    }
    
    updateBettingTicker() {
        const ticker = document.querySelector('.betting-ticker');
        if (ticker) {
            ticker.outerHTML = this.renderBettingTicker();
        }
    }
    
    triggerBotReaction(type) {
        const reactions = {
            struggle: [
                "😂 Mike: That's gonna cost you!",
                "🎯 Tom: I'm taking the over on your score",
                "💰 John: Easy money betting against you",
                "🔥 Mike: Wheels are falling off!",
                "😈 Tom: This is painful to watch"
            ],
            confidence: [
                "😤 Mike: Lucky shot incoming...",
                "🙄 Tom: He's due for a shank",
                "💸 John: I'll take that bet",
                "😬 Mike: Pride comes before the fall",
                "🎲 Tom: All in on the choke"
            ]
        };
        
        const reaction = reactions[type][Math.floor(Math.random() * reactions[type].length)];
        
        // Show bot chatter
        const chatter = document.createElement('div');
        chatter.className = 'bot-chatter';
        chatter.textContent = reaction;
        chatter.style.cssText = `
            position: fixed;
            bottom: 200px;
            left: 20px;
            right: 20px;
            background: rgba(26, 26, 26, 0.95);
            color: var(--white);
            padding: 1rem;
            border-radius: 10px;
            border-left: 3px solid ${type === 'struggle' ? 'var(--hot)' : 'var(--green)'};
            animation: slideInLeft 0.3s ease;
            z-index: 100;
        `;
        
        document.body.appendChild(chatter);
        
        setTimeout(() => {
            chatter.style.animation = 'slideOutLeft 0.3s ease';
            setTimeout(() => chatter.remove(), 300);
        }, 3000);
        
        // Update odds based on bot sentiment
        this.simulateBotBetting(type);
    }
    
    simulateBotBetting(sentiment) {
        // Bots place bets based on player performance
        const betAmount = Math.floor(Math.random() * 50) + 10;
        const targetBet = sentiment === 'struggle' ? 'against' : 'fade';
        
        // Show betting activity
        const activity = document.createElement('div');
        activity.className = 'bet-activity';
        activity.textContent = `💰 Bots betting ${betAmount} ${targetBet} you`;
        activity.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--green);
            color: var(--black);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            animation: fadeInRight 0.3s ease;
        `;
        
        document.body.appendChild(activity);
        
        setTimeout(() => {
            activity.style.animation = 'fadeOutRight 0.3s ease';
            setTimeout(() => activity.remove(), 300);
        }, 2000);
    }
    
    selectBet(betId) {
        // Highlight selected bet
        document.querySelectorAll('.bet-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedBet = document.querySelector(`[data-bet-id="${betId}"]`);
        if (selectedBet) {
            selectedBet.classList.add('selected');
            this.state.selectedBet = betId;
            
            // Show odds breakdown
            const liveBets = this.betting.generateLiveBets(this.state.round, this.players);
            const bet = liveBets.find(b => b.id === betId);
            
            if (bet && bet.factors) {
                this.showOddsBreakdown(bet);
            }
        }
    }
    
    showOddsBreakdown(bet) {
        // Remove any existing breakdown
        const existingBreakdown = document.querySelector('.odds-breakdown');
        if (existingBreakdown) {
            existingBreakdown.remove();
        }
        
        // Create breakdown element
        const breakdown = document.createElement('div');
        breakdown.className = 'odds-breakdown';
        
        const factorsHtml = bet.factors.map(factor => `
            <div class="factor-row">
                <span class="factor-icon">${factor.icon}</span>
                <span class="factor-name">${factor.name}</span>
                <span class="factor-value ${factor.value > 0 ? 'positive' : factor.value < 0 ? 'negative' : ''}">${factor.value > 0 ? '+' : ''}${(factor.value * 100).toFixed(0)}%</span>
            </div>
        `).join('');
        
        breakdown.innerHTML = `
            <div class="breakdown-header">
                <h4>📊 Odds Breakdown</h4>
                <span class="close-btn" onclick="this.parentElement.parentElement.remove()">×</span>
            </div>
            <div class="factors-list">
                ${factorsHtml}
            </div>
            <div class="breakdown-footer">
                <div class="final-odds">
                    <span>Final Odds:</span>
                    <span class="odds-value">${bet.odds}x</span>
                </div>
            </div>
        `;
        
        breakdown.style.cssText = `
            position: fixed;
            bottom: 320px;
            left: 20px;
            right: 20px;
            max-width: 350px;
            background: rgba(26, 26, 26, 0.98);
            border: 2px solid var(--green);
            border-radius: 15px;
            padding: 1rem;
            z-index: 100;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(breakdown);
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'warning' ? 'var(--hot)' : 'var(--green)'};
            color: var(--white);
            padding: 1rem 2rem;
            border-radius: 50px;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize app
const app = new FairwayLive();

// Make app globally available for onclick handlers
window.app = app;

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
    
    .notification {
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
`;
document.head.appendChild(style);
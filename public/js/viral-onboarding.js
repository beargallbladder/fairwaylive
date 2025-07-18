// Viral Onboarding Flow - Hook Users Immediately
class ViralOnboarding {
    constructor() {
        this.state = {
            step: 0,
            hasSeenDemo: false,
            playerName: '',
            referralCode: null,
            permissions: {
                location: false,
                mic: false,
                notifications: false
            }
        };
        
        this.steps = [
            { id: 'demo', title: 'Watch Live Demo', action: 'showDemo' },
            { id: 'name', title: 'Choose Your Name', action: 'getName' },
            { id: 'permissions', title: 'Enable Features', action: 'getPermissions' },
            { id: 'ready', title: 'Start Playing', action: 'startPlaying' }
        ];
        
        this.init();
    }

    init() {
        // Check if user has been onboarded
        const hasOnboarded = localStorage.getItem('hasOnboarded');
        if (hasOnboarded === 'true') {
            // Skip to main experience
            this.skipOnboarding();
            return;
        }
        
        // Check for referral code
        const urlParams = new URLSearchParams(window.location.search);
        this.state.referralCode = urlParams.get('ref');
        
        // Start onboarding
        this.render();
    }

    render() {
        const app = document.getElementById('app');
        const step = this.steps[this.state.step];
        
        let content = '';
        
        switch (step.id) {
            case 'demo':
                content = this.renderDemoStep();
                break;
            case 'name':
                content = this.renderNameStep();
                break;
            case 'permissions':
                content = this.renderPermissionsStep();
                break;
            case 'ready':
                content = this.renderReadyStep();
                break;
        }
        
        app.innerHTML = `
            <div class="onboarding-container">
                <div class="onboarding-progress">
                    ${this.renderProgress()}
                </div>
                <div class="onboarding-content">
                    ${content}
                </div>
            </div>
        `;
        
        this.attachListeners();
    }

    renderProgress() {
        return this.steps.map((s, i) => `
            <div class="progress-dot ${i <= this.state.step ? 'active' : ''}"></div>
        `).join('');
    }

    renderDemoStep() {
        return `
            <div class="demo-step">
                <h2>🎯 Watch Tom Make $340 in 30 Seconds</h2>
                <div class="demo-video">
                    <div class="demo-player">
                        <div class="demo-screen">
                            <div class="demo-ui">
                                <div class="demo-hole">Hole 7 • Par 4</div>
                                <div class="demo-players">
                                    <span class="demo-player-active">🏌️‍♂️ Tom +2</span>
                                    <span>⛳ Mike E</span>
                                </div>
                            </div>
                            <div class="demo-action">
                                <div class="demo-mic-pulse">🎤</div>
                                <div class="demo-transcript">"I'll take birdie for 100"</div>
                            </div>
                            <div class="demo-odds">
                                <div class="odds-flash">BIRDIE +350</div>
                            </div>
                            <div class="demo-result">
                                <div class="demo-win">🔥 TOM WINS $340!</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="demo-highlights">
                    <div class="highlight">
                        <span class="highlight-emoji">🎤</span>
                        <span>Voice bets in seconds</span>
                    </div>
                    <div class="highlight">
                        <span class="highlight-emoji">💰</span>
                        <span>Real money, real friends</span>
                    </div>
                    <div class="highlight">
                        <span class="highlight-emoji">🤖</span>
                        <span>AI bots talking trash</span>
                    </div>
                </div>
                <button class="onboarding-cta" onclick="onboarding.nextStep()">
                    I WANT THIS
                </button>
                <button class="skip-demo" onclick="onboarding.skipDemo()">
                    Skip Demo
                </button>
            </div>
        `;
    }

    renderNameStep() {
        return `
            <div class="name-step">
                <h2>👋 What Should We Call You?</h2>
                <input 
                    type="text" 
                    id="playerName" 
                    class="name-input" 
                    placeholder="Your golf name"
                    value="${this.state.playerName}"
                    maxlength="20"
                    autocomplete="off"
                >
                <div class="name-suggestions">
                    <span onclick="onboarding.setName('Tiger')">Tiger</span>
                    <span onclick="onboarding.setName('Happy')">Happy</span>
                    <span onclick="onboarding.setName('Shooter')">Shooter</span>
                    <span onclick="onboarding.setName('Lefty')">Lefty</span>
                </div>
                ${this.state.referralCode ? `
                    <div class="referral-bonus">
                        🎁 Referred by ${this.state.referralCode}! 
                        <br>You both get $100 betting credits!
                    </div>
                ` : ''}
                <button 
                    class="onboarding-cta" 
                    onclick="onboarding.saveName()"
                    ${!this.state.playerName ? 'disabled' : ''}
                >
                    THAT'S ME
                </button>
            </div>
        `;
    }

    renderPermissionsStep() {
        return `
            <div class="permissions-step">
                <h2>🚀 Enable The Good Stuff</h2>
                <div class="permissions-list">
                    <div class="permission-item ${this.state.permissions.mic ? 'granted' : ''}">
                        <div class="permission-icon">🎤</div>
                        <div class="permission-info">
                            <div class="permission-title">Voice Betting</div>
                            <div class="permission-desc">Say "50 on birdie" to bet instantly</div>
                        </div>
                        <button 
                            class="permission-button"
                            onclick="onboarding.requestMic()"
                            ${this.state.permissions.mic ? 'disabled' : ''}
                        >
                            ${this.state.permissions.mic ? '✓' : 'Enable'}
                        </button>
                    </div>
                    
                    <div class="permission-item ${this.state.permissions.location ? 'granted' : ''}">
                        <div class="permission-icon">📍</div>
                        <div class="permission-info">
                            <div class="permission-title">Course Detection</div>
                            <div class="permission-desc">Auto-detect which course you're on</div>
                        </div>
                        <button 
                            class="permission-button"
                            onclick="onboarding.requestLocation()"
                            ${this.state.permissions.location ? 'disabled' : ''}
                        >
                            ${this.state.permissions.location ? '✓' : 'Enable'}
                        </button>
                    </div>
                    
                    <div class="permission-item ${this.state.permissions.notifications ? 'granted' : ''}">
                        <div class="permission-icon">🔔</div>
                        <div class="permission-info">
                            <div class="permission-title">Live Updates</div>
                            <div class="permission-desc">Get notified when friends are playing</div>
                        </div>
                        <button 
                            class="permission-button"
                            onclick="onboarding.requestNotifications()"
                            ${this.state.permissions.notifications ? 'disabled' : ''}
                        >
                            ${this.state.permissions.notifications ? '✓' : 'Enable'}
                        </button>
                    </div>
                </div>
                
                <div class="permissions-note">
                    You can change these anytime in settings
                </div>
                
                <button class="onboarding-cta" onclick="onboarding.nextStep()">
                    ${Object.values(this.state.permissions).some(p => p) ? 'CONTINUE' : 'SKIP FOR NOW'}
                </button>
            </div>
        `;
    }

    renderReadyStep() {
        return `
            <div class="ready-step">
                <h1>🔥 Welcome ${this.state.playerName}!</h1>
                <div class="ready-message">
                    You're about to join <strong>2,847 players</strong> 
                    turning golf into Vegas
                </div>
                
                <div class="starter-bonus">
                    <div class="bonus-icon">💰</div>
                    <div class="bonus-text">
                        <strong>$100 FREE CREDITS</strong>
                        <br>
                        <small>To get you started</small>
                    </div>
                </div>
                
                ${this.state.referralCode ? `
                    <div class="referral-success">
                        ✅ Referral bonus activated! 
                        <br>You and ${this.state.referralCode} both get $100!
                    </div>
                ` : ''}
                
                <button class="onboarding-cta pulse" onclick="onboarding.complete()">
                    START PLAYING NOW
                </button>
                
                <div class="share-prompt">
                    <p>Invite friends and get $100 for each!</p>
                    <button class="share-button" onclick="onboarding.shareInvite()">
                        Share Your Link
                    </button>
                </div>
            </div>
        `;
    }

    // STEP ACTIONS
    nextStep() {
        if (this.state.step < this.steps.length - 1) {
            this.state.step++;
            this.render();
            
            // Track progress
            this.trackEvent('onboarding_step', {
                step: this.steps[this.state.step].id
            });
        }
    }

    skipDemo() {
        this.state.hasSeenDemo = false;
        this.nextStep();
    }

    setName(name) {
        document.getElementById('playerName').value = name;
        this.state.playerName = name;
        this.render();
    }

    saveName() {
        const input = document.getElementById('playerName');
        const name = input.value.trim();
        
        if (name) {
            this.state.playerName = name;
            localStorage.setItem('player_name', name);
            this.nextStep();
        }
    }

    // PERMISSION REQUESTS
    async requestMic() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            this.state.permissions.mic = true;
            this.render();
            this.trackEvent('permission_granted', { type: 'microphone' });
        } catch (error) {
            console.error('Mic permission denied:', error);
            this.trackEvent('permission_denied', { type: 'microphone' });
        }
    }

    async requestLocation() {
        try {
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            this.state.permissions.location = true;
            this.render();
            this.trackEvent('permission_granted', { type: 'location' });
        } catch (error) {
            console.error('Location permission denied:', error);
            this.trackEvent('permission_denied', { type: 'location' });
        }
    }

    async requestNotifications() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.state.permissions.notifications = true;
                this.render();
                this.trackEvent('permission_granted', { type: 'notifications' });
            }
        } catch (error) {
            console.error('Notification permission denied:', error);
            this.trackEvent('permission_denied', { type: 'notifications' });
        }
    }

    // COMPLETION
    complete() {
        localStorage.setItem('hasOnboarded', 'true');
        
        // Track completion
        this.trackEvent('onboarding_complete', {
            name: this.state.playerName,
            permissions: this.state.permissions,
            referral: this.state.referralCode
        });
        
        // Apply referral bonus if exists
        if (this.state.referralCode) {
            this.applyReferralBonus();
        }
        
        // Give starter bonus
        this.giveStarterBonus();
        
        // Start main experience
        window.location.href = '/complete.html';
    }

    skipOnboarding() {
        // User has already onboarded
        if (window.location.pathname === '/complete.html') {
            // Already on the right page
            return;
        }
        window.location.href = '/complete.html';
    }

    // SHARING
    shareInvite() {
        const playerName = this.state.playerName || 'Player';
        const shareUrl = `https://heyhomeboy.com/?ref=${playerName}`;
        const shareText = `Join me on Hey Homeboy! We both get $100 free betting credits. Turn golf into Vegas! 🎰⛳`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Hey Homeboy - Golf Betting',
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareUrl);
            alert('Invite link copied! Share it with friends.');
        }
        
        this.trackEvent('share_invite', { from: 'onboarding' });
    }

    // BONUSES
    giveStarterBonus() {
        const credits = parseInt(localStorage.getItem('betting_credits') || '0');
        localStorage.setItem('betting_credits', credits + 100);
    }

    applyReferralBonus() {
        // In real app, this would hit an API
        const credits = parseInt(localStorage.getItem('betting_credits') || '0');
        localStorage.setItem('betting_credits', credits + 100);
        
        // Track referral
        this.trackEvent('referral_applied', {
            referrer: this.state.referralCode,
            referee: this.state.playerName
        });
    }

    // HELPERS
    attachListeners() {
        const input = document.getElementById('playerName');
        if (input) {
            input.addEventListener('input', (e) => {
                this.state.playerName = e.target.value;
                const button = document.querySelector('.onboarding-cta');
                if (button) {
                    button.disabled = !e.target.value.trim();
                }
            });
        }
    }

    trackEvent(eventName, parameters = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
        console.log('Track:', eventName, parameters);
    }
}

// ONBOARDING STYLES
const onboardingStyles = document.createElement('style');
onboardingStyles.textContent = `
    .onboarding-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
        display: flex;
        flex-direction: column;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .onboarding-progress {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 100;
    }

    .progress-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transition: all 0.3s ease;
    }

    .progress-dot.active {
        background: #0f0;
        box-shadow: 0 0 10px rgba(0,255,0,0.5);
    }

    .onboarding-content {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        margin-top: 50px;
    }

    /* DEMO STEP */
    .demo-step {
        text-align: center;
        max-width: 400px;
        width: 100%;
    }

    .demo-step h2 {
        font-size: 24px;
        margin-bottom: 20px;
    }

    .demo-video {
        background: rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 20px;
    }

    .demo-screen {
        background: #000;
        border-radius: 10px;
        padding: 20px;
        min-height: 300px;
        position: relative;
        overflow: hidden;
    }

    .demo-ui {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
    }

    .demo-action {
        text-align: center;
        margin: 40px 0;
    }

    .demo-mic-pulse {
        font-size: 48px;
        animation: pulse 2s infinite;
    }

    .demo-transcript {
        margin-top: 10px;
        font-style: italic;
        color: #0f0;
    }

    .demo-odds {
        text-align: center;
        margin: 20px 0;
    }

    .odds-flash {
        font-size: 24px;
        font-weight: bold;
        color: #0f0;
        animation: flash 0.5s ease 2;
    }

    @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }

    .demo-win {
        font-size: 28px;
        font-weight: bold;
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: bounce 0.5s ease 3;
    }

    @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    .demo-highlights {
        display: flex;
        justify-content: space-around;
        margin: 20px 0;
    }

    .highlight {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }

    .highlight-emoji {
        font-size: 24px;
    }

    /* NAME STEP */
    .name-step {
        text-align: center;
        max-width: 400px;
        width: 100%;
    }

    .name-input {
        width: 100%;
        padding: 20px;
        font-size: 24px;
        text-align: center;
        background: rgba(255,255,255,0.1);
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 15px;
        color: #fff;
        margin: 20px 0;
        transition: all 0.3s ease;
    }

    .name-input:focus {
        outline: none;
        border-color: #0f0;
        background: rgba(0,255,0,0.1);
    }

    .name-suggestions {
        display: flex;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 20px;
    }

    .name-suggestions span {
        padding: 8px 15px;
        background: rgba(255,255,255,0.1);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .name-suggestions span:hover {
        background: rgba(0,255,0,0.3);
    }

    .referral-bonus {
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        color: #000;
        padding: 15px;
        border-radius: 10px;
        font-weight: bold;
        margin: 20px 0;
    }

    /* PERMISSIONS STEP */
    .permissions-step {
        max-width: 400px;
        width: 100%;
    }

    .permissions-list {
        margin: 20px 0;
    }

    .permission-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: rgba(255,255,255,0.05);
        border-radius: 15px;
        margin-bottom: 15px;
        transition: all 0.3s ease;
    }

    .permission-item.granted {
        background: rgba(0,255,0,0.1);
        border: 1px solid rgba(0,255,0,0.3);
    }

    .permission-icon {
        font-size: 32px;
    }

    .permission-info {
        flex: 1;
        text-align: left;
    }

    .permission-title {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .permission-desc {
        font-size: 14px;
        color: #999;
    }

    .permission-button {
        padding: 8px 20px;
        background: #0f0;
        color: #000;
        border: none;
        border-radius: 20px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .permission-button:disabled {
        background: rgba(0,255,0,0.3);
        cursor: not-allowed;
    }

    .permissions-note {
        font-size: 12px;
        color: #666;
        margin-top: 10px;
    }

    /* READY STEP */
    .ready-step {
        text-align: center;
        max-width: 400px;
        width: 100%;
    }

    .ready-message {
        font-size: 18px;
        margin: 20px 0;
        color: #ccc;
    }

    .starter-bonus {
        display: flex;
        align-items: center;
        gap: 15px;
        background: linear-gradient(45deg, #0f0, #00ff41);
        color: #000;
        padding: 20px;
        border-radius: 15px;
        margin: 20px 0;
    }

    .bonus-icon {
        font-size: 48px;
    }

    .referral-success {
        background: rgba(0,255,0,0.1);
        border: 1px solid rgba(0,255,0,0.3);
        padding: 15px;
        border-radius: 10px;
        margin: 20px 0;
    }

    .share-prompt {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
    }

    .share-button {
        background: transparent;
        border: 2px solid #0f0;
        color: #0f0;
        padding: 10px 30px;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 10px;
    }

    .share-button:hover {
        background: rgba(0,255,0,0.1);
    }

    /* COMMON */
    .onboarding-cta {
        background: linear-gradient(45deg, #0f0, #00ff41);
        color: #000;
        border: none;
        padding: 20px 50px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 50px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
        margin-top: 20px;
    }

    .onboarding-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0,255,65,0.5);
    }

    .onboarding-cta:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .onboarding-cta.pulse {
        animation: pulse 2s infinite;
    }

    .skip-demo {
        background: transparent;
        border: none;
        color: #666;
        text-decoration: underline;
        cursor: pointer;
        margin-top: 10px;
        font-size: 14px;
    }

    @media (max-width: 768px) {
        .onboarding-content {
            padding: 10px;
        }
        
        .demo-step h2 {
            font-size: 20px;
        }
        
        .name-input {
            font-size: 20px;
            padding: 15px;
        }
    }
`;
document.head.appendChild(onboardingStyles);

// Initialize onboarding
window.onboarding = new ViralOnboarding();
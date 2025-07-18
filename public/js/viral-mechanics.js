// Viral Mechanics - Make People Share This Shit
class ViralMechanics {
    constructor() {
        this.state = {
            shareCount: 0,
            viralMoments: [],
            referrals: [],
            challenges: []
        };
        
        this.init();
    }

    init() {
        this.setupShareTriggers();
        this.setupViralChallenges();
        this.trackReferrals();
        this.createShareableContent();
    }

    // SHAREABLE MOMENT DETECTION
    detectShareableMoment(event, data) {
        const shareable = {
            'epic_win': {
                threshold: 500,
                template: 'Just won ${amount} on a {shot}! 🔥',
                image: 'win'
            },
            'brutal_fail': {
                threshold: 3, // water balls
                template: 'Found the water {count} times today 💀',
                image: 'fail'
            },
            'hot_streak': {
                threshold: 5,
                template: '{count} {result} in a row! On fire! 🔥',
                image: 'streak'
            },
            'trash_talk': {
                threshold: null,
                template: 'Bot just roasted me: "{quote}" 😂',
                image: 'roast'
            },
            'domination': {
                threshold: 1000,
                template: 'Up ${amount} today. Absolute domination 💰',
                image: 'money'
            }
        };

        const moment = shareable[event];
        if (!moment) return null;

        // Check if moment is share-worthy
        if (moment.threshold && data.value < moment.threshold) return null;

        // Create shareable content
        const content = this.createShareContent(moment, data);
        this.state.viralMoments.push({
            id: Date.now(),
            type: event,
            content: content,
            timestamp: Date.now()
        });

        // Auto-prompt sharing for epic moments
        if (['epic_win', 'domination'].includes(event)) {
            setTimeout(() => this.promptShare(content), 2000);
        }

        return content;
    }

    createShareContent(moment, data) {
        // Fill in template
        let text = moment.template;
        Object.entries(data).forEach(([key, value]) => {
            text = text.replace(`{${key}}`, value);
        });

        // Generate share image
        const imageUrl = this.generateShareImage(moment.image, data);

        // Create share data
        return {
            title: 'Hey Homeboy - Golf Betting',
            text: `${text}\n\nJoin me on Hey Homeboy! Get $100 free credits: `,
            url: `https://heyhomeboy.com/?ref=${this.getPlayerName()}&moment=${moment.image}`,
            image: imageUrl,
            hashtags: ['HeyHomeboy', 'GolfBetting', 'GolfLife']
        };
    }

    generateShareImage(type, data) {
        // Create canvas for dynamic image
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext('2d');

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 630);

        // Logo
        ctx.font = 'bold 80px Arial';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('HEY HOMEBOY', 600, 150);

        // Main content based on type
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#fff';
        
        switch(type) {
            case 'win':
                ctx.fillText(`💰 WON $${data.amount}! 💰`, 600, 315);
                break;
            case 'fail':
                ctx.fillText(`💀 ${data.count} WATER BALLS 💀`, 600, 315);
                break;
            case 'streak':
                ctx.fillText(`🔥 ${data.count} IN A ROW! 🔥`, 600, 315);
                break;
            case 'roast':
                ctx.font = '40px Arial';
                ctx.fillText(`"${data.quote}"`, 600, 315);
                break;
            case 'money':
                ctx.fillText(`📈 UP $${data.amount} TODAY 📈`, 600, 315);
                break;
        }

        // Call to action
        ctx.font = '30px Arial';
        ctx.fillStyle = '#0f0';
        ctx.fillText('Get $100 FREE credits → heyhomeboy.com', 600, 500);

        // Convert to data URL
        return canvas.toDataURL('image/png');
    }

    // SHARING PROMPTS
    promptShare(content) {
        const prompt = document.createElement('div');
        prompt.className = 'share-prompt-modal';
        prompt.innerHTML = `
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>🔥 EPIC MOMENT!</h3>
                    <button class="close-modal" onclick="viralMechanics.closePrompt()">×</button>
                </div>
                <div class="share-preview">
                    <p>${content.text}</p>
                </div>
                <div class="share-incentive">
                    <div class="incentive-icon">🎁</div>
                    <div class="incentive-text">
                        Share this and get <strong>50 credits</strong>
                        <br>
                        <small>Plus $100 for each friend who joins!</small>
                    </div>
                </div>
                <div class="share-buttons">
                    <button class="share-btn twitter" onclick="viralMechanics.shareToTwitter('${btoa(JSON.stringify(content))}')">
                        🐦 Twitter
                    </button>
                    <button class="share-btn instagram" onclick="viralMechanics.shareToInstagram('${btoa(JSON.stringify(content))}')">
                        📷 Story
                    </button>
                    <button class="share-btn text" onclick="viralMechanics.shareViaText('${btoa(JSON.stringify(content))}')">
                        💬 Text
                    </button>
                    <button class="share-btn copy" onclick="viralMechanics.copyShareLink('${btoa(JSON.stringify(content))}')">
                        🔗 Copy
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(prompt);
        
        // Animate in
        setTimeout(() => prompt.classList.add('show'), 100);
    }

    closePrompt() {
        const prompt = document.querySelector('.share-prompt-modal');
        if (prompt) {
            prompt.classList.remove('show');
            setTimeout(() => prompt.remove(), 300);
        }
    }

    // SHARING ACTIONS
    async shareToTwitter(encodedContent) {
        const content = JSON.parse(atob(encodedContent));
        const text = encodeURIComponent(`${content.text} ${content.url}`);
        const hashtags = content.hashtags.join(',');
        
        window.open(
            `https://twitter.com/intent/tweet?text=${text}&hashtags=${hashtags}`,
            '_blank'
        );
        
        this.trackShare('twitter', content);
        this.rewardShare();
    }

    async shareToInstagram(encodedContent) {
        const content = JSON.parse(atob(encodedContent));
        
        // Download image for Instagram
        const link = document.createElement('a');
        link.download = 'heyhomeboy-moment.png';
        link.href = content.image;
        link.click();
        
        // Copy text to clipboard
        const text = `${content.text}\n\n${content.hashtags.map(h => `#${h}`).join(' ')}`;
        await navigator.clipboard.writeText(text);
        
        alert('Image downloaded! Text copied to clipboard. Post to your story!');
        
        this.trackShare('instagram', content);
        this.rewardShare();
    }

    async shareViaText(encodedContent) {
        const content = JSON.parse(atob(encodedContent));
        const text = `${content.text}\n\n${content.url}`;
        
        if ('sms' in navigator) {
            window.location.href = `sms:?body=${encodeURIComponent(text)}`;
        } else {
            await navigator.clipboard.writeText(text);
            alert('Message copied! Send to your golf buddies!');
        }
        
        this.trackShare('text', content);
        this.rewardShare();
    }

    async copyShareLink(encodedContent) {
        const content = JSON.parse(atob(encodedContent));
        await navigator.clipboard.writeText(content.url);
        
        // Show confirmation
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
        
        this.trackShare('copy', content);
        this.rewardShare();
    }

    // VIRAL CHALLENGES
    setupViralChallenges() {
        this.challenges = [
            {
                id: 'first_birdie',
                name: 'First Birdie',
                description: 'Share your first birdie',
                reward: 100,
                icon: '🎯'
            },
            {
                id: 'water_warrior',
                name: 'Water Warrior',
                description: 'Share finding water 3 times',
                reward: 50,
                icon: '💀'
            },
            {
                id: 'trash_talker',
                name: 'Trash Talker',
                description: 'Share a bot roast',
                reward: 75,
                icon: '😂'
            },
            {
                id: 'big_winner',
                name: 'Big Winner',
                description: 'Share a $500+ win',
                reward: 200,
                icon: '💰'
            },
            {
                id: 'recruiter',
                name: 'Recruiter',
                description: 'Get 3 friends to join',
                reward: 500,
                icon: '👥'
            }
        ];

        // Check challenge progress
        this.checkChallenges();
    }

    checkChallenges() {
        this.challenges.forEach(challenge => {
            const completed = localStorage.getItem(`challenge_${challenge.id}`);
            if (!completed) {
                // Check if challenge is complete
                this.evaluateChallenge(challenge);
            }
        });
    }

    evaluateChallenge(challenge) {
        // Challenge-specific logic
        switch(challenge.id) {
            case 'first_birdie':
                // Check if user has scored a birdie
                break;
            case 'water_warrior':
                // Check water ball count
                break;
            case 'recruiter':
                if (this.state.referrals.length >= 3) {
                    this.completeChallenge(challenge);
                }
                break;
        }
    }

    completeChallenge(challenge) {
        localStorage.setItem(`challenge_${challenge.id}`, 'true');
        
        // Give reward
        const credits = parseInt(localStorage.getItem('betting_credits') || '0');
        localStorage.setItem('betting_credits', credits + challenge.reward);
        
        // Show celebration
        this.showChallengeComplete(challenge);
    }

    showChallengeComplete(challenge) {
        const celebration = document.createElement('div');
        celebration.className = 'challenge-complete';
        celebration.innerHTML = `
            <div class="challenge-icon">${challenge.icon}</div>
            <div class="challenge-name">${challenge.name}</div>
            <div class="challenge-reward">+${challenge.reward} credits!</div>
        `;
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            celebration.classList.remove('show');
            setTimeout(() => celebration.remove(), 500);
        }, 3000);
    }

    // REFERRAL TRACKING
    trackReferrals() {
        // Check URL for referral
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');
        
        if (referrer && !localStorage.getItem('referrer')) {
            localStorage.setItem('referrer', referrer);
            this.applyReferralBonus(referrer);
        }
        
        // Load existing referrals
        const referrals = JSON.parse(localStorage.getItem('my_referrals') || '[]');
        this.state.referrals = referrals;
    }

    applyReferralBonus(referrer) {
        // In real app, this would hit an API
        console.log('Applied referral from:', referrer);
        
        // Track event
        this.trackEvent('referral_applied', { referrer });
    }

    // REWARDS
    rewardShare() {
        const credits = parseInt(localStorage.getItem('betting_credits') || '0');
        localStorage.setItem('betting_credits', credits + 50);
        
        this.state.shareCount++;
        this.closePrompt();
        
        // Show reward notification
        this.showReward('+50 credits for sharing!');
    }

    showReward(message) {
        const reward = document.createElement('div');
        reward.className = 'reward-notification';
        reward.textContent = message;
        
        document.body.appendChild(reward);
        
        setTimeout(() => reward.classList.add('show'), 100);
        setTimeout(() => {
            reward.classList.remove('show');
            setTimeout(() => reward.remove(), 500);
        }, 3000);
    }

    // HELPERS
    getPlayerName() {
        return localStorage.getItem('player_name') || 'Player';
    }

    trackShare(platform, content) {
        this.trackEvent('share', {
            platform: platform,
            content_type: content.type,
            value: content.value
        });
    }

    trackEvent(name, params) {
        if (typeof gtag !== 'undefined') {
            gtag('event', name, params);
        }
        console.log('Track:', name, params);
    }
}

// VIRAL STYLES
const viralStyles = document.createElement('style');
viralStyles.textContent = `
    /* SHARE PROMPT MODAL */
    .share-prompt-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .share-prompt-modal.show {
        opacity: 1;
    }

    .share-modal-content {
        background: #1a1a1a;
        border-radius: 20px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 50px rgba(0,0,0,0.5);
        border: 2px solid #0f0;
    }

    .share-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .share-modal-header h3 {
        margin: 0;
        color: #0f0;
        font-size: 24px;
    }

    .close-modal {
        background: none;
        border: none;
        color: #666;
        font-size: 30px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
    }

    .share-preview {
        background: rgba(255,255,255,0.05);
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        text-align: center;
        font-size: 18px;
    }

    .share-incentive {
        display: flex;
        align-items: center;
        gap: 15px;
        background: linear-gradient(45deg, rgba(0,255,0,0.1), rgba(0,255,65,0.1));
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
        border: 1px solid rgba(0,255,0,0.3);
    }

    .incentive-icon {
        font-size: 40px;
    }

    .incentive-text strong {
        color: #0f0;
    }

    .share-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .share-btn {
        padding: 15px;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 16px;
    }

    .share-btn.twitter {
        background: #1DA1F2;
        color: white;
    }

    .share-btn.instagram {
        background: linear-gradient(45deg, #405DE6, #C13584, #F56040);
        color: white;
    }

    .share-btn.text {
        background: #25D366;
        color: white;
    }

    .share-btn.copy {
        background: #666;
        color: white;
    }

    .share-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    }

    /* CHALLENGE COMPLETE */
    .challenge-complete {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        color: #000;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 50px rgba(255,215,0,0.5);
        z-index: 10001;
        opacity: 0;
        transition: all 0.5s ease;
    }

    .challenge-complete.show {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    .challenge-icon {
        font-size: 60px;
        margin-bottom: 10px;
    }

    .challenge-name {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .challenge-reward {
        font-size: 20px;
        font-weight: bold;
    }

    /* REWARD NOTIFICATION */
    .reward-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: linear-gradient(45deg, #0f0, #00ff41);
        color: #000;
        padding: 15px 30px;
        border-radius: 30px;
        font-weight: bold;
        box-shadow: 0 5px 20px rgba(0,255,0,0.5);
        z-index: 10002;
        transition: transform 0.3s ease;
    }

    .reward-notification.show {
        transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 768px) {
        .share-buttons {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(viralStyles);

// Initialize viral mechanics
window.viralMechanics = new ViralMechanics();
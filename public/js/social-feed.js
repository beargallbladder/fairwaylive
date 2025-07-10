// FairwayLive Social Feed - Where Bookies Spread Rumors
class SocialFeed {
    constructor() {
        this.bookmakers = new BookmakerAgents();
        this.feedElement = null;
        this.isVisible = false;
        
        // Listen for updates
        window.addEventListener('social-feed-update', (e) => {
            this.updateFeed(e.detail.feed);
        });
        
        window.addEventListener('agent-message', (e) => {
            this.showAgentNotification(e.detail);
        });
    }
    
    init(container) {
        this.createFeedUI(container);
        this.startSimulation();
    }
    
    createFeedUI(container) {
        const feed = document.createElement('div');
        feed.className = 'social-feed';
        feed.innerHTML = `
            <div class="feed-header">
                <h3>🎰 Bookmaker Chatter</h3>
                <button class="feed-toggle" onclick="socialFeed.toggleFeed()">
                    <span class="feed-count">0</span>
                </button>
            </div>
            
            <div class="agent-selector">
                <div class="selector-title">Choose Your Bookmaker:</div>
                <div class="agents-grid">
                    ${this.bookmakers.agents.map(agent => `
                        <div class="agent-card ${this.bookmakers.userPreferredAgent === agent.id ? 'selected' : ''}" 
                             onclick="socialFeed.selectAgent('${agent.id}')">
                            <div class="agent-avatar">${agent.avatar}</div>
                            <div class="agent-name">${agent.name}</div>
                            <div class="agent-style">${agent.style}</div>
                            ${this.bookmakers.agentLoyalty[agent.id] ? 
                                `<div class="agent-loyalty">Level ${this.bookmakers.agentLoyalty[agent.id].level}</div>` : 
                                ''
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="feed-content" id="feedContent">
                <!-- Feed items here -->
            </div>
            
            <div class="yearly-dominance">
                <h4>🏆 Year-Long Domination</h4>
                <div id="yearlyStats"></div>
            </div>
        `;
        
        feed.style.cssText = `
            position: fixed;
            right: -400px;
            top: 0;
            bottom: 0;
            width: 400px;
            background: var(--black);
            border-left: 2px solid var(--green);
            z-index: 1000;
            transition: right 0.3s ease;
            overflow-y: auto;
        `;
        
        container.appendChild(feed);
        this.feedElement = feed;
    }
    
    toggleFeed() {
        this.isVisible = !this.isVisible;
        this.feedElement.style.right = this.isVisible ? '0' : '-400px';
        
        if (this.isVisible) {
            this.updateYearlyStats();
        }
    }
    
    selectAgent(agentId) {
        this.bookmakers.setPreferredAgent(agentId);
        
        // Update UI
        document.querySelectorAll('.agent-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`.agent-card[onclick="socialFeed.selectAgent('${agentId}')"]`)
            .classList.add('selected');
    }
    
    updateFeed(feed) {
        const content = document.getElementById('feedContent');
        if (!content) return;
        
        // Update count
        document.querySelector('.feed-count').textContent = feed.length;
        
        content.innerHTML = feed.slice(0, 20).map(item => `
            <div class="feed-item ${item.personal ? 'personal' : ''}">
                <div class="feed-header">
                    <span class="agent-info">
                        ${item.agent.avatar} ${item.agent.name}
                    </span>
                    <span class="feed-time">${this.getTimeAgo(item.timestamp)}</span>
                </div>
                <div class="feed-message">${item.message}</div>
                ${item.personal ? '<div class="personal-tag">Just for you</div>' : ''}
                ${item.betting_action ? `
                    <div class="betting-action">
                        💰 ${item.betting_action.num_bets} bets totaling ${item.betting_action.total_wagered} pts
                    </div>
                ` : ''}
                <div class="feed-reactions">
                    ${Object.entries(item.reactions || {}).map(([emoji, count]) => 
                        `<span class="reaction">${emoji} ${count}</span>`
                    ).join('')}
                </div>
            </div>
        `).join('');
    }
    
    updateYearlyStats() {
        const stats = this.bookmakers.getYearlyReport();
        const container = document.getElementById('yearlyStats');
        
        if (stats.king) {
            container.innerHTML = `
                <div class="stat-card">
                    <div class="stat-title">👑 KING OF THE YEAR</div>
                    <div class="stat-value">${stats.king[0]}</div>
                    <div class="stat-detail">+${stats.king[1].total_won} points</div>
                </div>
                
                ${stats.most_dominated ? `
                    <div class="stat-card">
                        <div class="stat-title">💀 MOST DOMINATED</div>
                        <div class="stat-value">${stats.most_dominated.winner} owns ${stats.most_dominated.loser}</div>
                        <div class="stat-detail">+${stats.most_dominated.amount} points taken</div>
                    </div>
                ` : ''}
                
                ${stats.biggest_rivalry ? `
                    <div class="stat-card">
                        <div class="stat-title">🔥 BIGGEST RIVALRY</div>
                        <div class="stat-value">${stats.biggest_rivalry.p1} vs ${stats.biggest_rivalry.p2}</div>
                        <div class="stat-detail">${stats.biggest_rivalry.total} points exchanged</div>
                    </div>
                ` : ''}
            `;
        }
    }
    
    showAgentNotification(detail) {
        const notification = document.createElement('div');
        notification.className = 'agent-notification';
        notification.innerHTML = `
            <div class="notif-agent">
                ${detail.agent.avatar} ${detail.agent.name}
            </div>
            <div class="notif-message">${detail.message}</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(26, 26, 26, 0.98);
            border: 2px solid var(--green);
            padding: 1rem;
            border-radius: 10px;
            max-width: 300px;
            z-index: 2000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    startSimulation() {
        // Simulate bookmaker activity
        setInterval(() => {
            if (Math.random() > 0.7) {
                const situations = [
                    { type: 'confidence_detected', player: 'Mike' },
                    { type: 'struggle_detected', player: 'Tom' },
                    { type: 'hot_streak', player: 'John' },
                    { type: 'big_bet_placed', amount: 500, bet: 'Mike to bogey' }
                ];
                
                const situation = situations[Math.floor(Math.random() * situations.length)];
                this.bookmakers.generateBookieChatter(situation);
            }
        }, 10000);
    }
    
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }
}

// Initialize
const socialFeed = new SocialFeed();

// Export
window.SocialFeed = SocialFeed;
window.socialFeed = socialFeed;
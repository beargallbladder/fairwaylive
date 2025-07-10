// FairwayLive Swarm Client
// Lightweight client that delegates heavy processing to backend swarm

class SwarmClient {
    constructor() {
        this.ws = null;
        this.pendingRequests = new Map();
        this.cache = new Map();
        this.batteryOptimizer = new BatteryOptimizer();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(`ws://${window.location.host}/swarm`);
            
            this.ws.onopen = () => {
                console.log('🚀 Connected to swarm');
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleSwarmMessage(message);
            };
            
            this.ws.onerror = reject;
        });
    }

    handleSwarmMessage(message) {
        if (message.requestId && this.pendingRequests.has(message.requestId)) {
            const { resolve } = this.pendingRequests.get(message.requestId);
            this.pendingRequests.delete(message.requestId);
            resolve(message.result);
        }
        
        // Handle push updates
        if (message.type === 'prediction') {
            this.handlePrediction(message);
        }
    }

    async request(taskType, data, options = {}) {
        const requestId = this.generateRequestId();
        
        // Check cache first
        const cacheKey = `${taskType}:${JSON.stringify(data)}`;
        if (!options.skipCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.result;
            }
        }
        
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });
            
            this.ws.send(JSON.stringify({
                requestId,
                taskType,
                data,
                priority: options.priority || 'normal',
                context: this.getContext()
            }));
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Swarm request timeout'));
                }
            }, 5000);
        });
    }

    getContext() {
        return {
            batteryLevel: this.batteryOptimizer.level,
            networkType: navigator.connection?.effectiveType || 'unknown',
            timestamp: Date.now(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    handlePrediction(message) {
        // Swarm predicted user's next action
        if (message.prediction === 'score-entry') {
            // Preload score UI elements
            this.preloadScoreUI();
        } else if (message.prediction === 'voice-note') {
            // Pre-warm microphone
            this.prewarmMicrophone();
        }
    }

    preloadScoreUI() {
        // Create hidden score elements to reduce perceived latency
        const preload = document.createElement('div');
        preload.className = 'score-picker hidden';
        preload.id = 'preloaded-score';
        document.body.appendChild(preload);
    }

    async prewarmMicrophone() {
        // Request mic permission early to reduce latency
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (e) {
            // Ignore errors
        }
    }
}

// Battery optimization helper
class BatteryOptimizer {
    constructor() {
        this.level = 1.0;
        this.isCharging = false;
        this.mode = 'normal'; // 'normal', 'saving', 'critical'
        
        this.init();
    }

    async init() {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            this.level = battery.level;
            this.isCharging = battery.charging;
            
            battery.addEventListener('levelchange', () => {
                this.level = battery.level;
                this.updateMode();
            });
            
            battery.addEventListener('chargingchange', () => {
                this.isCharging = battery.charging;
                this.updateMode();
            });
            
            this.updateMode();
        }
    }

    updateMode() {
        if (this.isCharging) {
            this.mode = 'normal';
        } else if (this.level < 0.15) {
            this.mode = 'critical';
        } else if (this.level < 0.30) {
            this.mode = 'saving';
        } else {
            this.mode = 'normal';
        }
        
        // Notify app of mode change
        window.dispatchEvent(new CustomEvent('battery-mode-change', { 
            detail: { mode: this.mode, level: this.level } 
        }));
    }

    shouldReduceGPS() {
        return this.mode !== 'normal';
    }

    shouldCompressAudio() {
        return this.mode === 'critical';
    }

    getGPSInterval() {
        switch(this.mode) {
            case 'critical': return 300000; // 5 minutes
            case 'saving': return 180000; // 3 minutes
            default: return 120000; // 2 minutes
        }
    }
}

// Export for use in main app
window.SwarmClient = SwarmClient;
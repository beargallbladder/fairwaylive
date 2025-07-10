// FairwayLive Course Graphics - Paid Mode Only
class CourseGraphics {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.players = new Map();
        this.currentHole = 1;
        this.holeLayout = null;
    }
    
    init(container) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'course-canvas';
        this.canvas.width = container.clientWidth;
        this.canvas.height = 200;
        container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.drawHole();
    }
    
    drawHole() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw fairway (gradient green)
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#0a5f0a');
        gradient.addColorStop(0.1, '#0d7a0d');
        gradient.addColorStop(0.9, '#0d7a0d');
        gradient.addColorStop(1, '#0a5f0a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.3, width, height * 0.4);
        
        // Draw rough
        ctx.fillStyle = '#0a4a0a';
        ctx.fillRect(0, 0, width, height * 0.3);
        ctx.fillRect(0, height * 0.7, width, height * 0.3);
        
        // Draw tee box
        ctx.fillStyle = '#0d7a0d';
        ctx.fillRect(20, height * 0.4, 30, height * 0.2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, height * 0.4, 30, height * 0.2);
        
        // Draw green
        ctx.beginPath();
        ctx.arc(width - 60, height * 0.5, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#0fa00f';
        ctx.fill();
        
        // Draw flag
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width - 60, height * 0.5);
        ctx.lineTo(width - 60, height * 0.3);
        ctx.stroke();
        
        // Flag
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(width - 60, height * 0.3);
        ctx.lineTo(width - 40, height * 0.35);
        ctx.lineTo(width - 60, height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Draw hazards
        this.drawHazards();
        
        // Draw players
        this.drawPlayers();
    }
    
    drawHazards() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Water hazard
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(width * 0.5, height * 0.25, 60, height * 0.5);
        
        // Bunkers
        ctx.fillStyle = '#f4e4bc';
        ctx.beginPath();
        ctx.arc(width * 0.3, height * 0.6, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width - 100, height * 0.4, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawPlayers() {
        this.players.forEach((player, id) => {
            const ctx = this.ctx;
            
            // Player dot
            ctx.beginPath();
            ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = player.color || '#fff';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Player name
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(player.name, player.x, player.y - 12);
            
            // Shot trail
            if (player.trail && player.trail.length > 1) {
                ctx.strokeStyle = player.color + '66'; // Semi-transparent
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(player.trail[0].x, player.trail[0].y);
                player.trail.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }
    
    updatePlayerPosition(playerId, position, shot) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Convert position to canvas coordinates
        let x, y;
        
        if (position.area === 'tee') {
            x = 35;
            y = height * 0.5;
        } else if (position.area === 'fairway') {
            x = width * (0.2 + position.progress * 0.6);
            y = height * 0.5 + (Math.random() - 0.5) * height * 0.2;
        } else if (position.area === 'rough') {
            x = width * (0.2 + position.progress * 0.6);
            y = Math.random() > 0.5 ? height * 0.2 : height * 0.8;
        } else if (position.area === 'green') {
            x = width - 60 + (Math.random() - 0.5) * 30;
            y = height * 0.5 + (Math.random() - 0.5) * 30;
        } else if (position.area === 'water') {
            x = width * 0.53;
            y = height * 0.5;
        }
        
        const player = this.players.get(playerId) || {
            name: playerId,
            color: this.getPlayerColor(playerId),
            trail: []
        };
        
        // Add to trail
        if (player.x && player.y) {
            player.trail.push({ x: player.x, y: player.y });
            if (player.trail.length > 5) player.trail.shift();
        }
        
        player.x = x;
        player.y = y;
        player.shot = shot;
        
        this.players.set(playerId, player);
        
        // Animate
        this.animateShot(player, position);
        
        // Redraw
        this.drawHole();
    }
    
    animateShot(player, position) {
        // Show shot animation
        const shotInfo = document.createElement('div');
        shotInfo.className = 'shot-info';
        shotInfo.textContent = `${player.name}: ${position.area} (Shot ${player.shot})`;
        shotInfo.style.cssText = `
            position: absolute;
            left: ${player.x}px;
            top: ${player.y - 30}px;
            background: ${player.color};
            color: #fff;
            padding: 0.25rem 0.5rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
            animation: shotPop 0.5s ease;
            pointer-events: none;
        `;
        
        this.canvas.parentElement.appendChild(shotInfo);
        
        setTimeout(() => shotInfo.remove(), 2000);
    }
    
    getPlayerColor(playerId) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f'];
        return colors[Math.abs(playerId.charCodeAt(0)) % colors.length];
    }
    
    reset() {
        this.players.clear();
        this.drawHole();
    }
}

// Export
window.CourseGraphics = CourseGraphics;
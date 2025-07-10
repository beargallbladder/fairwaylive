// Simple FairwayLive Server - No BS, Just Golf
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock data store
const rounds = new Map();
const bets = new Map();

// Quick start endpoint
app.post('/api/rounds/quick-start', (req, res) => {
    const { latitude, longitude } = req.body;
    
    const roundId = `round-${Date.now()}`;
    const round = {
        id: roundId,
        courseId: 'pebble-beach',
        courseName: 'Pebble Beach Golf Links',
        currentHole: 1,
        holes: generateHoles(),
        status: 'active'
    };
    
    rounds.set(roundId, round);
    
    res.json({ round });
});

// Voice upload endpoint
app.post('/api/voice/upload', (req, res) => {
    // Mock response
    setTimeout(() => {
        const mockTranscriptions = [
            "Just crushed it 280 down the middle",
            "Made par on that one",
            "This hole is kicking my ass",
            "Drained a 20 footer for birdie"
        ];
        
        const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
        const scoreDetected = Math.random() > 0.5;
        
        res.json({
            transcription,
            scoreDetected,
            score: scoreDetected ? Math.floor(Math.random() * 3) - 1 : null,
            confidence: 0.85,
            processingTime: 127
        });
    }, 500);
});

// WebSocket for real-time
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join-round', (roundId) => {
        socket.join(`round:${roundId}`);
        
        // Send fake betting updates
        setInterval(() => {
            socket.emit('bet:new', {
                player: 'Mike',
                type: 'birdie this hole',
                odds: (Math.random() * 3 + 1.5).toFixed(1) + 'x'
            });
        }, 10000);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Swarm WebSocket endpoint
io.of('/swarm').on('connection', (socket) => {
    socket.on('message', (data) => {
        const message = JSON.parse(data);
        
        // Mock swarm responses
        setTimeout(() => {
            socket.emit('message', JSON.stringify({
                requestId: message.requestId,
                result: {
                    success: true,
                    courseDetected: true,
                    confidence: 0.9
                }
            }));
        }, 100);
    });
});

function generateHoles() {
    const holes = [];
    for (let i = 1; i <= 18; i++) {
        const par = Math.random() < 0.2 ? 3 : Math.random() < 0.7 ? 4 : 5;
        holes.push({
            number: i,
            par,
            yards: par === 3 ? 165 : par === 4 ? 385 : 520
        });
    }
    return holes;
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`⛳ FairwayLive running at http://localhost:${PORT}`);
    console.log(`📱 Open on your phone for best experience!`);
});
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from '../routes/auth.js';
import { roundRouter } from '../routes/rounds.js';
import { userRouter } from '../routes/users.js';
import { courseRouter } from '../routes/courses.js';
import { bettingRouter } from '../routes/betting.js';
import { analyticsRouter } from '../routes/analytics.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { initializeDatabase as initDB } from '../services/database.js';
import { initializeRedis as initRedis } from '../services/redis.js';
import { initializeDatabase as initMockDB } from '../services/mock-database.js';
import { initializeRedis as initMockRedis } from '../services/mock-redis.js';

const initializeDatabase = process.env.NODE_ENV === 'production' ? initDB : initMockDB;
const initializeRedis = process.env.NODE_ENV === 'production' ? initRedis : initMockRedis;
import { initializeWebSocket } from '../services/websocket.js';
import { logger } from '../utils/logger.js';
import { voiceRouter } from '../routes/voice.js';
import { quickRouter } from '../routes/quick.js';
import { swarmCoordinator } from '../swarm/swarm-coordinator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api', quickRouter); // Quick routes don't need /quick prefix
app.use('/api/auth', authRouter);
app.use('/api/rounds', roundRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/betting', bettingRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/voice', voiceRouter);

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');
    
    // Initialize Redis
    await initializeRedis();
    logger.info('Redis initialized');
    
    // Initialize WebSocket
    initializeWebSocket(io);
    logger.info('WebSocket initialized');
    
    // Setup swarm WebSocket endpoint
    io.of('/swarm').on('connection', (socket) => {
      logger.info('Swarm client connected:', socket.id);
      
      socket.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          
          // Process through swarm
          const result = await swarmCoordinator.process(
            message.taskType,
            message.data,
            message.priority
          );
          
          socket.emit('message', JSON.stringify({
            requestId: message.requestId,
            result: result.result,
            processingTime: result.processingTime
          }));
        } catch (error) {
          logger.error('Swarm processing error:', error);
          socket.emit('message', JSON.stringify({
            requestId: message.requestId,
            error: 'Processing failed'
          }));
        }
      });
      
      socket.on('disconnect', () => {
        logger.info('Swarm client disconnected:', socket.id);
      });
    });
    
    // Start server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logger.info(`FairwayLive server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
    
    // Start MCP server in separate process
    if (process.env.NODE_ENV === 'production') {
      import('../mcp/server.js');
      logger.info('MCP server started');
    }
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  process.exit(0);
});

startServer();

export { app, io };
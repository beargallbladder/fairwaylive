import { logger } from '../utils/logger.js';
import { redisClient, pubsub } from process.env.NODE_ENV === 'production' ? './redis.js' : './mock-redis.js';
import jwt from 'jsonwebtoken';

let io;

export function initializeWebSocket(socketServer) {
  io = socketServer;
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.user = decoded;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });
  
  // Connection handler
  io.on('connection', async (socket) => {
    logger.info(`User ${socket.userId} connected`);
    
    // Join user's personal room
    socket.join(`user:${socket.userId}`);
    
    // Track online status
    await setUserOnline(socket.userId, true);
    
    // Handle joining rounds
    socket.on('round:join', async (roundId) => {
      try {
        // Verify user has access to round
        const hasAccess = await verifyRoundAccess(socket.userId, roundId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to round' });
          return;
        }
        
        socket.join(`round:${roundId}`);
        socket.roundId = roundId;
        
        // Notify others
        socket.to(`round:${roundId}`).emit('user:joined', {
          userId: socket.userId,
          name: socket.user.name
        });
        
        // Send current round state
        const roundState = await getRoundState(roundId);
        socket.emit('round:state', roundState);
        
        logger.info(`User ${socket.userId} joined round ${roundId}`);
      } catch (error) {
        logger.error('Error joining round:', error);
        socket.emit('error', { message: 'Failed to join round' });
      }
    });
    
    // Handle leaving rounds
    socket.on('round:leave', async (roundId) => {
      socket.leave(`round:${roundId}`);
      socket.to(`round:${roundId}`).emit('user:left', {
        userId: socket.userId,
        name: socket.user.name
      });
    });
    
    // Handle score updates
    socket.on('score:update', async (data) => {
      try {
        const { roundId, hole, score, putts } = data;
        
        // Validate and store score
        await storeScore(socket.userId, roundId, hole, score, putts);
        
        // Broadcast to round participants
        io.to(`round:${roundId}`).emit('score:updated', {
          userId: socket.userId,
          hole,
          score,
          putts,
          timestamp: new Date().toISOString()
        });
        
        // Update leaderboard
        const leaderboard = await updateLeaderboard(roundId);
        io.to(`round:${roundId}`).emit('leaderboard:update', leaderboard);
        
      } catch (error) {
        logger.error('Error updating score:', error);
        socket.emit('error', { message: 'Failed to update score' });
      }
    });
    
    // Handle location updates
    socket.on('location:update', async (data) => {
      try {
        const { roundId, latitude, longitude, accuracy } = data;
        
        // Store location
        await storeLocation(socket.userId, roundId, latitude, longitude);
        
        // Broadcast to viewers (not exact location)
        socket.to(`round:${roundId}`).emit('location:updated', {
          userId: socket.userId,
          hole: data.hole,
          area: data.area // fairway, rough, green, etc
        });
        
      } catch (error) {
        logger.error('Error updating location:', error);
      }
    });
    
    // Handle voice notes
    socket.on('voice:send', async (data) => {
      try {
        const { roundId, audioUrl, transcript, duration } = data;
        
        // Store voice note
        const voiceNote = await storeVoiceNote(socket.userId, roundId, audioUrl, transcript, duration);
        
        // Broadcast to round participants
        io.to(`round:${roundId}`).emit('voice:received', {
          userId: socket.userId,
          name: socket.user.name,
          audioUrl,
          transcript,
          duration,
          timestamp: voiceNote.timestamp
        });
        
      } catch (error) {
        logger.error('Error sending voice note:', error);
        socket.emit('error', { message: 'Failed to send voice note' });
      }
    });
    
    // Handle betting
    socket.on('bet:place', async (data) => {
      try {
        const { roundId, betType, amount, target, prediction } = data;
        
        // Process bet through MCP
        const bet = await placeBet(socket.userId, roundId, betType, amount, target, prediction);
        
        // Notify bettor
        socket.emit('bet:confirmed', bet);
        
        // Broadcast to betting room
        io.to(`round:${roundId}:betting`).emit('bet:placed', {
          betType,
          amount,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Error placing bet:', error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle reactions
    socket.on('reaction:send', async (data) => {
      const { roundId, reaction, targetUserId } = data;
      
      io.to(`round:${roundId}`).emit('reaction:received', {
        fromUserId: socket.userId,
        fromName: socket.user.name,
        targetUserId,
        reaction,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(`User ${socket.userId} disconnected`);
      
      // Update online status
      await setUserOnline(socket.userId, false);
      
      // Notify rounds
      if (socket.roundId) {
        socket.to(`round:${socket.roundId}`).emit('user:offline', {
          userId: socket.userId
        });
      }
    });
  });
  
  // Subscribe to Redis pub/sub for cross-server communication
  setupRedisPubSub();
  
  return io;
}

// Helper functions
async function verifyRoundAccess(userId, roundId) {
  const round = await redisClient.hGet('rounds', roundId);
  if (!round) return false;
  
  const roundData = JSON.parse(round);
  return roundData.players.includes(userId) || roundData.viewers.includes(userId);
}

async function getRoundState(roundId) {
  const state = await redisClient.hGetAll(`round:${roundId}:state`);
  const players = await redisClient.hGetAll(`round:${roundId}:players`);
  
  return {
    ...state,
    players: Object.entries(players).map(([id, data]) => ({
      id,
      ...JSON.parse(data)
    }))
  };
}

async function storeScore(userId, roundId, hole, score, putts) {
  const scoreData = {
    userId,
    hole,
    score,
    putts,
    timestamp: new Date().toISOString()
  };
  
  await redisClient.lPush(
    `round:${roundId}:player:${userId}:scores`,
    JSON.stringify(scoreData)
  );
  
  // Update player stats
  await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'totalScore', score);
  await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'totalPutts', putts || 0);
  await redisClient.hSet(`round:${roundId}:player:${userId}:stats`, 'currentHole', hole + 1);
}

async function updateLeaderboard(roundId) {
  const round = await redisClient.hGet('rounds', roundId);
  const roundData = JSON.parse(round);
  
  const leaderboard = [];
  
  for (const playerId of roundData.players) {
    const stats = await redisClient.hGetAll(`round:${roundId}:player:${playerId}:stats`);
    const playerInfo = await redisClient.hGetAll(`user:${playerId}`);
    
    leaderboard.push({
      playerId,
      name: playerInfo.name,
      totalScore: parseInt(stats.totalScore) || 0,
      currentHole: parseInt(stats.currentHole) || 1,
      totalPutts: parseInt(stats.totalPutts) || 0
    });
  }
  
  return leaderboard.sort((a, b) => a.totalScore - b.totalScore);
}

async function storeLocation(userId, roundId, latitude, longitude) {
  await redisClient.geoAdd(`round:${roundId}:locations`, {
    longitude,
    latitude,
    member: userId
  });
  
  // Keep location history
  await redisClient.lPush(
    `round:${roundId}:player:${userId}:locations`,
    JSON.stringify({ latitude, longitude, timestamp: Date.now() })
  );
  
  // Trim to last 100 locations
  await redisClient.lTrim(`round:${roundId}:player:${userId}:locations`, 0, 99);
}

async function storeVoiceNote(userId, roundId, audioUrl, transcript, duration) {
  const voiceNote = {
    userId,
    audioUrl,
    transcript,
    duration,
    timestamp: new Date().toISOString()
  };
  
  await redisClient.lPush(
    `round:${roundId}:voice_notes`,
    JSON.stringify(voiceNote)
  );
  
  return voiceNote;
}

async function placeBet(userId, roundId, betType, amount, target, prediction) {
  // This would integrate with the MCP betting engine
  // For now, simplified version
  const bet = {
    id: `bet_${Date.now()}_${userId}`,
    userId,
    roundId,
    betType,
    amount,
    target,
    prediction,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  
  await redisClient.hSet(`round:${roundId}:bets`, bet.id, JSON.stringify(bet));
  
  return bet;
}

async function setUserOnline(userId, isOnline) {
  if (isOnline) {
    await redisClient.sAdd('users:online', userId);
  } else {
    await redisClient.sRem('users:online', userId);
  }
  
  await redisClient.hSet(`user:${userId}`, 'lastSeen', new Date().toISOString());
}

function setupRedisPubSub() {
  // Subscribe to round updates from other servers
  pubsub.subscribe('round:updates', (message) => {
    const { roundId, update } = message;
    io.to(`round:${roundId}`).emit(update.type, update.data);
  });
  
  // Subscribe to global notifications
  pubsub.subscribe('global:notifications', (message) => {
    io.emit('notification', message);
  });
}

export { io };
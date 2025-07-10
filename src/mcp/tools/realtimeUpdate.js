import { io } from '../../services/websocket.js';
import { redisClient } from '../../services/redis.js';

export const realtimeUpdateTool = {
  name: 'broadcast_update',
  description: 'Send real-time updates to connected clients',
  parameters: {
    type: 'object',
    properties: {
      updateType: {
        type: 'string',
        enum: ['score', 'location', 'voice_note', 'bet', 'round_status', 'leaderboard']
      },
      roundId: { type: 'string' },
      data: { type: 'object' },
      targetUsers: { type: 'array', items: { type: 'string' } }
    },
    required: ['updateType', 'roundId', 'data']
  },
  handler: async ({ updateType, roundId, data, targetUsers = [] }) => {
    try {
      // Prepare update payload
      const update = {
        type: updateType,
        roundId,
        timestamp: new Date().toISOString(),
        data
      };
      
      // Store in Redis for persistence
      await storeUpdate(roundId, update);
      
      // Get round participants if no specific targets
      if (targetUsers.length === 0) {
        targetUsers = await getRoundParticipants(roundId);
      }
      
      // Broadcast based on update type
      switch (updateType) {
        case 'score':
          await broadcastScoreUpdate(roundId, update, targetUsers);
          break;
          
        case 'location':
          await broadcastLocationUpdate(roundId, update, targetUsers);
          break;
          
        case 'voice_note':
          await broadcastVoiceNote(roundId, update, targetUsers);
          break;
          
        case 'bet':
          await broadcastBetUpdate(roundId, update, targetUsers);
          break;
          
        case 'round_status':
          await broadcastRoundStatus(roundId, update, targetUsers);
          break;
          
        case 'leaderboard':
          await broadcastLeaderboard(roundId, update, targetUsers);
          break;
      }
      
      // Track delivery
      const deliveryStats = await trackDelivery(update, targetUsers);
      
      return {
        success: true,
        updateId: update.id,
        delivered: deliveryStats.delivered,
        failed: deliveryStats.failed,
        timestamp: update.timestamp
      };
    } catch (error) {
      console.error('Realtime update error:', error);
      return {
        success: false,
        message: 'Failed to broadcast update',
        error: error.message
      };
    }
  }
};

async function storeUpdate(roundId, update) {
  update.id = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store in sorted set for timeline
  await redisClient.zAdd(`round:${roundId}:updates`, {
    score: Date.now(),
    value: JSON.stringify(update)
  });
  
  // Keep only last 1000 updates
  await redisClient.zRemRangeByRank(`round:${roundId}:updates`, 0, -1001);
}

async function getRoundParticipants(roundId) {
  const round = await redisClient.hGet('rounds', roundId);
  if (!round) return [];
  
  const roundData = JSON.parse(round);
  const participants = [...roundData.players];
  
  // Add viewers/followers
  const viewers = await redisClient.sMembers(`round:${roundId}:viewers`);
  participants.push(...viewers);
  
  return [...new Set(participants)];
}

async function broadcastScoreUpdate(roundId, update, targetUsers) {
  const { playerId, hole, score, scoreType } = update.data;
  
  // Calculate trends
  const trend = await calculateScoreTrend(playerId, hole);
  update.data.trend = trend;
  
  // Add context
  const leaderPosition = await getLeaderPosition(roundId, playerId);
  update.data.leaderPosition = leaderPosition;
  
  // Emit to room
  io.to(`round:${roundId}`).emit('score:update', update);
  
  // Send push notifications for significant scores
  if (['eagle', 'ace', 'albatross'].includes(scoreType)) {
    await sendPushNotifications(targetUsers, {
      title: `${scoreType.toUpperCase()}! 🔥`,
      body: `${update.data.playerName} just made ${scoreType} on hole ${hole}!`,
      data: { roundId, updateId: update.id }
    });
  }
}

async function broadcastLocationUpdate(roundId, update, targetUsers) {
  const { playerId, hole, location, shot } = update.data;
  
  // Don't broadcast exact coordinates to all users
  update.data.location = {
    hole,
    area: getLocationArea(location) // fairway, rough, bunker, green, etc
  };
  
  io.to(`round:${roundId}`).emit('location:update', update);
}

async function broadcastVoiceNote(roundId, update, targetUsers) {
  const { playerId, audioUrl, transcript, duration } = update.data;
  
  // Add player info
  const playerInfo = await getPlayerInfo(playerId);
  update.data.playerName = playerInfo.name;
  update.data.playerAvatar = playerInfo.avatar;
  
  io.to(`round:${roundId}`).emit('voice:note', update);
  
  // Store for replay
  await redisClient.lPush(`round:${roundId}:voice_notes`, JSON.stringify({
    ...update.data,
    timestamp: update.timestamp
  }));
}

async function broadcastBetUpdate(roundId, update, targetUsers) {
  const { betType, userId, amount, target } = update.data;
  
  // Anonymize sensitive data
  update.data = {
    betType,
    amount,
    target,
    totalPot: await getRoundBettingPot(roundId)
  };
  
  io.to(`round:${roundId}:betting`).emit('bet:placed', update);
}

async function broadcastRoundStatus(roundId, update, targetUsers) {
  const { status, currentHole, message } = update.data;
  
  // Update round state
  await redisClient.hSet(`round:${roundId}:state`, {
    status,
    currentHole: currentHole.toString(),
    lastUpdate: update.timestamp
  });
  
  io.to(`round:${roundId}`).emit('round:status', update);
  
  // Notify all followers when round starts/ends
  if (['started', 'finished'].includes(status)) {
    await sendPushNotifications(targetUsers, {
      title: status === 'started' ? 'Round Started! ⛳' : 'Round Complete! 🏌️',
      body: message,
      data: { roundId }
    });
  }
}

async function broadcastLeaderboard(roundId, update, targetUsers) {
  // Calculate full leaderboard with trends
  const leaderboard = await calculateLeaderboard(roundId);
  update.data = { leaderboard };
  
  io.to(`round:${roundId}`).emit('leaderboard:update', update);
}

async function calculateScoreTrend(playerId, currentHole) {
  if (currentHole <= 3) return 'neutral';
  
  const recentScores = await redisClient.lRange(
    `player:${playerId}:scores`, 
    0, 
    2
  );
  
  if (recentScores.length < 3) return 'neutral';
  
  const scores = recentScores.map(s => JSON.parse(s).relativeToPar);
  const trend = scores[0] < scores[2] ? 'improving' : 
                scores[0] > scores[2] ? 'declining' : 'neutral';
  
  return trend;
}

async function getLeaderPosition(roundId, playerId) {
  const leaderboard = await calculateLeaderboard(roundId);
  const position = leaderboard.findIndex(p => p.playerId === playerId) + 1;
  
  return {
    position,
    total: leaderboard.length,
    strokes: leaderboard[0]?.totalScore || 0
  };
}

async function calculateLeaderboard(roundId) {
  const round = await redisClient.hGet('rounds', roundId);
  if (!round) return [];
  
  const roundData = JSON.parse(round);
  const leaderboard = [];
  
  for (const playerId of roundData.players) {
    const scores = await redisClient.lRange(`round:${roundId}:player:${playerId}:scores`, 0, -1);
    const totalScore = scores.reduce((sum, s) => sum + JSON.parse(s).score, 0);
    
    leaderboard.push({
      playerId,
      totalScore,
      holesPlayed: scores.length,
      currentHole: scores.length + 1,
      trend: await calculateScoreTrend(playerId, scores.length)
    });
  }
  
  return leaderboard.sort((a, b) => a.totalScore - b.totalScore);
}

async function getRoundBettingPot(roundId) {
  const bets = await redisClient.hGetAll(`round:${roundId}:bets`);
  return Object.values(bets).reduce((sum, betJson) => {
    const bet = JSON.parse(betJson);
    return sum + bet.amount;
  }, 0);
}

async function trackDelivery(update, targetUsers) {
  const delivered = [];
  const failed = [];
  
  // In production, track actual WebSocket delivery
  // For now, assume all connected users receive it
  const connectedSockets = await io.in(`round:${update.roundId}`).allSockets();
  
  for (const userId of targetUsers) {
    if (connectedSockets.has(userId)) {
      delivered.push(userId);
    } else {
      failed.push(userId);
    }
  }
  
  return { delivered, failed };
}

function getLocationArea(location) {
  // Simplified location classification
  // In production, use course layout data
  return 'fairway'; // placeholder
}

async function getPlayerInfo(playerId) {
  const info = await redisClient.hGetAll(`user:${playerId}`);
  return {
    name: info.name || 'Unknown Player',
    avatar: info.avatar || null
  };
}

async function sendPushNotifications(userIds, notification) {
  // Implement FCM/APNs push notifications
  console.log('Sending push notifications:', { userIds, notification });
}
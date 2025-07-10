import { redisClient } from '../../services/redis.js';

export const bettingEngineTool = {
  name: 'manage_pride_bets',
  description: 'Handle Pride Points betting system for golf rounds',
  parameters: {
    type: 'object',
    properties: {
      action: { 
        type: 'string', 
        enum: ['place_bet', 'resolve_bet', 'get_odds', 'leaderboard'] 
      },
      betData: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          roundId: { type: 'string' },
          betType: { type: 'string' },
          target: { type: 'string' },
          amount: { type: 'number' },
          prediction: { type: 'string' }
        }
      }
    },
    required: ['action']
  },
  handler: async ({ action, betData }) => {
    try {
      switch (action) {
        case 'place_bet':
          return await placeBet(betData);
          
        case 'resolve_bet':
          return await resolveBet(betData);
          
        case 'get_odds':
          return await calculateOdds(betData);
          
        case 'leaderboard':
          return await getBettingLeaderboard(betData.roundId);
          
        default:
          return { success: false, message: 'Invalid action' };
      }
    } catch (error) {
      console.error('Betting engine error:', error);
      return {
        success: false,
        message: 'Betting operation failed',
        error: error.message
      };
    }
  }
};

async function placeBet(betData) {
  const { userId, roundId, betType, target, amount, prediction } = betData;
  
  // Validate bet amount
  const userBalance = await getUserPridePoints(userId);
  if (userBalance < amount) {
    return {
      success: false,
      message: 'Insufficient Pride Points',
      balance: userBalance,
      required: amount
    };
  }
  
  // Calculate odds based on bet type
  const odds = await calculateBetOdds(betType, target, prediction);
  
  // Create bet record
  const bet = {
    id: `bet_${Date.now()}_${userId}`,
    userId,
    roundId,
    betType,
    target,
    amount,
    prediction,
    odds,
    status: 'pending',
    createdAt: new Date().toISOString(),
    potentialWin: Math.round(amount * odds)
  };
  
  // Store bet and deduct points
  await redisClient.hSet(`round:${roundId}:bets`, bet.id, JSON.stringify(bet));
  await redisClient.hIncrBy(`user:${userId}:pride`, 'balance', -amount);
  await redisClient.hIncrBy(`user:${userId}:pride`, 'wagered', amount);
  
  return {
    success: true,
    bet,
    newBalance: userBalance - amount
  };
}

async function resolveBet(betData) {
  const { betId, roundId, outcome } = betData;
  
  // Get bet details
  const betJson = await redisClient.hGet(`round:${roundId}:bets`, betId);
  if (!betJson) {
    return { success: false, message: 'Bet not found' };
  }
  
  const bet = JSON.parse(betJson);
  if (bet.status !== 'pending') {
    return { success: false, message: 'Bet already resolved' };
  }
  
  // Determine if bet won
  const won = evaluateBet(bet, outcome);
  bet.status = won ? 'won' : 'lost';
  bet.resolvedAt = new Date().toISOString();
  bet.outcome = outcome;
  
  // Update points if won
  if (won) {
    const winnings = bet.potentialWin;
    await redisClient.hIncrBy(`user:${bet.userId}:pride`, 'balance', winnings);
    await redisClient.hIncrBy(`user:${bet.userId}:pride`, 'won', winnings);
    bet.winnings = winnings;
  }
  
  // Update bet record
  await redisClient.hSet(`round:${roundId}:bets`, betId, JSON.stringify(bet));
  
  return {
    success: true,
    bet,
    won,
    winnings: won ? bet.potentialWin : 0
  };
}

async function calculateOdds(betData) {
  const { betType, target, prediction } = betData;
  
  // Base odds by bet type
  const baseOdds = {
    'make_putt': 1.5,
    'hole_score': 2.0,
    'match_winner': 3.0,
    'longest_drive': 4.0,
    'closest_pin': 3.5,
    'streak': 5.0
  };
  
  let odds = baseOdds[betType] || 2.0;
  
  // Adjust based on historical data
  if (target) {
    const playerStats = await getPlayerStats(target);
    
    switch (betType) {
      case 'make_putt':
        const puttSuccess = playerStats.puttsMade / playerStats.puttsAttempted || 0.5;
        odds = 1 / puttSuccess;
        break;
        
      case 'hole_score':
        const avgScore = playerStats.avgScore || 4.5;
        const scoreDiff = Math.abs(parseInt(prediction) - avgScore);
        odds = 1 + (scoreDiff * 0.5);
        break;
        
      case 'streak':
        const recentForm = playerStats.lastFiveRounds || [];
        const hotStreak = recentForm.filter(r => r < 0).length / 5;
        odds = 2 + (1 - hotStreak) * 3;
        break;
    }
  }
  
  // Cap odds
  odds = Math.max(1.1, Math.min(odds, 10.0));
  
  return {
    success: true,
    betType,
    target,
    prediction,
    odds: Math.round(odds * 100) / 100,
    probability: Math.round((1 / odds) * 100)
  };
}

async function getBettingLeaderboard(roundId) {
  // Get all bets for this round
  const allBets = await redisClient.hGetAll(`round:${roundId}:bets`);
  
  // Calculate standings
  const userStats = {};
  
  for (const betJson of Object.values(allBets)) {
    const bet = JSON.parse(betJson);
    
    if (!userStats[bet.userId]) {
      userStats[bet.userId] = {
        userId: bet.userId,
        totalBets: 0,
        won: 0,
        lost: 0,
        pending: 0,
        wagered: 0,
        winnings: 0,
        roi: 0
      };
    }
    
    const stats = userStats[bet.userId];
    stats.totalBets++;
    stats.wagered += bet.amount;
    
    if (bet.status === 'won') {
      stats.won++;
      stats.winnings += bet.winnings || 0;
    } else if (bet.status === 'lost') {
      stats.lost++;
    } else {
      stats.pending++;
    }
  }
  
  // Calculate ROI and sort
  const leaderboard = Object.values(userStats).map(stats => {
    stats.roi = stats.wagered > 0 ? 
      Math.round(((stats.winnings - stats.wagered) / stats.wagered) * 100) : 0;
    return stats;
  }).sort((a, b) => b.winnings - a.winnings);
  
  return {
    success: true,
    roundId,
    leaderboard,
    totalPot: leaderboard.reduce((sum, u) => sum + u.wagered, 0)
  };
}

async function getUserPridePoints(userId) {
  const balance = await redisClient.hGet(`user:${userId}:pride`, 'balance');
  return parseInt(balance) || 1000; // Default 1000 points
}

async function getPlayerStats(playerId) {
  const stats = await redisClient.hGetAll(`player:${playerId}:stats`);
  return {
    puttsMade: parseInt(stats.puttsMade) || 0,
    puttsAttempted: parseInt(stats.puttsAttempted) || 0,
    avgScore: parseFloat(stats.avgScore) || 4.5,
    lastFiveRounds: JSON.parse(stats.lastFiveRounds || '[]')
  };
}

function evaluateBet(bet, outcome) {
  switch (bet.betType) {
    case 'make_putt':
      return outcome.made === true;
      
    case 'hole_score':
      return outcome.score === parseInt(bet.prediction);
      
    case 'match_winner':
      return outcome.winner === bet.target;
      
    case 'longest_drive':
      return outcome.longest === bet.target;
      
    case 'closest_pin':
      return outcome.closest === bet.target;
      
    case 'streak':
      return outcome.streakContinued === (bet.prediction === 'yes');
      
    default:
      return false;
  }
}
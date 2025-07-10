import { redisClient } from '../../services/redis.js';
import { db } from '../../services/database.js';

export const analyticsCollectorTool = {
  name: 'collect_analytics',
  description: 'Collect and process golf round analytics data',
  parameters: {
    type: 'object',
    properties: {
      eventType: {
        type: 'string',
        enum: ['shot', 'score', 'round_complete', 'user_action', 'performance_metric']
      },
      userId: { type: 'string' },
      roundId: { type: 'string' },
      data: { type: 'object' }
    },
    required: ['eventType', 'data']
  },
  handler: async ({ eventType, userId, roundId, data }) => {
    try {
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: eventType,
        userId,
        roundId,
        data,
        timestamp: new Date().toISOString()
      };
      
      // Process based on event type
      switch (eventType) {
        case 'shot':
          await processShotAnalytics(event);
          break;
          
        case 'score':
          await processScoreAnalytics(event);
          break;
          
        case 'round_complete':
          await processRoundAnalytics(event);
          break;
          
        case 'user_action':
          await processUserAnalytics(event);
          break;
          
        case 'performance_metric':
          await processPerformanceMetrics(event);
          break;
      }
      
      // Store raw event
      await storeAnalyticsEvent(event);
      
      // Update real-time metrics
      await updateRealtimeMetrics(event);
      
      return {
        success: true,
        eventId: event.id,
        processed: true,
        insights: await generateInsights(event)
      };
    } catch (error) {
      console.error('Analytics collection error:', error);
      return {
        success: false,
        message: 'Failed to collect analytics',
        error: error.message
      };
    }
  }
};

async function processShotAnalytics(event) {
  const { userId, roundId, data } = event;
  const { club, distance, accuracy, shotType, result, conditions } = data;
  
  // Update shot statistics
  const shotStats = {
    club,
    distance,
    accuracy,
    shotType,
    result,
    conditions,
    timestamp: event.timestamp
  };
  
  // Store in time series
  await redisClient.zAdd(`user:${userId}:shots:${shotType}`, {
    score: Date.now(),
    value: JSON.stringify(shotStats)
  });
  
  // Update aggregates
  await updateShotAggregates(userId, shotStats);
  
  // Calculate strokes gained
  if (distance && accuracy) {
    const strokesGained = await calculateStrokesGained(shotStats);
    await redisClient.hIncrByFloat(
      `user:${userId}:stats`,
      'totalStrokesGained',
      strokesGained
    );
  }
}

async function processScoreAnalytics(event) {
  const { userId, roundId, data } = event;
  const { hole, score, par, putts, penalties, gir } = data;
  
  // Calculate scoring metrics
  const scoreMetrics = {
    hole,
    score,
    par,
    relativeToPar: score - par,
    putts,
    penalties,
    gir, // Green in Regulation
    scrambling: !gir && score <= par
  };
  
  // Update running totals
  await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'totalScore', score);
  await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'totalPutts', putts || 0);
  await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'totalPenalties', penalties || 0);
  
  if (gir) {
    await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'greensInRegulation', 1);
  }
  
  // Store hole data
  await redisClient.lPush(
    `round:${roundId}:player:${userId}:scores`,
    JSON.stringify(scoreMetrics)
  );
  
  // Update handicap calculation data
  await updateHandicapData(userId, scoreMetrics);
}

async function processRoundAnalytics(event) {
  const { userId, roundId, data } = event;
  
  // Get all round data
  const scores = await redisClient.lRange(`round:${roundId}:player:${userId}:scores`, 0, -1);
  const stats = await redisClient.hGetAll(`round:${roundId}:player:${userId}:stats`);
  
  // Calculate round summary
  const roundSummary = {
    roundId,
    userId,
    date: event.timestamp,
    totalScore: parseInt(stats.totalScore) || 0,
    totalPutts: parseInt(stats.totalPutts) || 0,
    fairwaysHit: parseInt(stats.fairwaysHit) || 0,
    greensInRegulation: parseInt(stats.greensInRegulation) || 0,
    penalties: parseInt(stats.totalPenalties) || 0,
    holesPlayed: scores.length,
    scoringAverage: scores.length > 0 ? (parseInt(stats.totalScore) / scores.length) : 0
  };
  
  // Store in database for historical tracking
  await db.query(
    `INSERT INTO round_summaries 
     (round_id, user_id, date, total_score, total_putts, fairways_hit, gir, penalties, holes_played, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      roundId,
      userId,
      new Date(),
      roundSummary.totalScore,
      roundSummary.totalPutts,
      roundSummary.fairwaysHit,
      roundSummary.greensInRegulation,
      roundSummary.penalties,
      roundSummary.holesPlayed,
      JSON.stringify(roundSummary)
    ]
  );
  
  // Update user lifetime stats
  await updateLifetimeStats(userId, roundSummary);
  
  // Generate round insights
  const insights = await generateRoundInsights(userId, roundId, roundSummary);
  
  // Store insights
  await redisClient.set(
    `round:${roundId}:player:${userId}:insights`,
    JSON.stringify(insights),
    { EX: 86400 * 30 } // Keep for 30 days
  );
}

async function processUserAnalytics(event) {
  const { userId, data } = event;
  const { action, context, duration } = data;
  
  // Track user engagement
  await redisClient.hIncrBy(`user:${userId}:engagement`, action, 1);
  
  // Track session data
  if (duration) {
    await redisClient.hIncrByFloat(`user:${userId}:engagement`, 'totalDuration', duration);
  }
  
  // Update daily active user metrics
  const today = new Date().toISOString().split('T')[0];
  await redisClient.sAdd(`metrics:dau:${today}`, userId);
}

async function processPerformanceMetrics(event) {
  const { data } = event;
  const { metric, value, context } = data;
  
  // Store performance metrics for optimization
  await redisClient.zAdd('metrics:performance', {
    score: Date.now(),
    value: JSON.stringify({ metric, value, context, timestamp: event.timestamp })
  });
  
  // Alert if performance degrades
  if (metric === 'api_response_time' && value > 1000) {
    console.warn('High API response time detected:', value, context);
  }
}

async function updateShotAggregates(userId, shotStats) {
  const { shotType, distance, accuracy } = shotStats;
  
  // Update averages
  const key = `user:${userId}:shot_averages:${shotType}`;
  const current = await redisClient.hGetAll(key);
  
  const count = parseInt(current.count || 0) + 1;
  const avgDistance = ((parseFloat(current.avgDistance || 0) * (count - 1)) + distance) / count;
  const avgAccuracy = ((parseFloat(current.avgAccuracy || 0) * (count - 1)) + accuracy) / count;
  
  await redisClient.hSet(key, {
    count: count.toString(),
    avgDistance: avgDistance.toString(),
    avgAccuracy: avgAccuracy.toString(),
    lastUpdated: new Date().toISOString()
  });
}

async function calculateStrokesGained(shotStats) {
  // Simplified strokes gained calculation
  // In production, use PGA Tour baseline data
  const { shotType, distance, result } = shotStats;
  
  const baseline = {
    drive: { 250: 2.8, 275: 2.7, 300: 2.6 },
    approach: { 150: 2.9, 175: 3.0, 200: 3.1 },
    chip: { 20: 2.4, 40: 2.5, 60: 2.6 },
    putt: { 5: 1.5, 10: 1.8, 20: 2.0 }
  };
  
  // Get expected strokes for distance
  const expected = baseline[shotType]?.[Math.round(distance / 25) * 25] || 3.0;
  
  // Calculate actual strokes (simplified)
  const actual = result === 'holed' ? 1 : 
                 result === 'good' ? expected - 0.2 :
                 result === 'poor' ? expected + 0.3 : expected;
  
  return expected - actual;
}

async function updateHandicapData(userId, scoreMetrics) {
  // Store last 20 rounds for handicap calculation
  const handicapKey = `user:${userId}:handicap_rounds`;
  
  await redisClient.lPush(handicapKey, JSON.stringify({
    score: scoreMetrics.score,
    par: scoreMetrics.par,
    date: new Date().toISOString()
  }));
  
  // Keep only last 20 rounds
  await redisClient.lTrim(handicapKey, 0, 19);
}

async function updateLifetimeStats(userId, roundSummary) {
  const updates = {
    roundsPlayed: 1,
    totalStrokes: roundSummary.totalScore,
    totalPutts: roundSummary.totalPutts,
    totalGIR: roundSummary.greensInRegulation,
    totalFairways: roundSummary.fairwaysHit
  };
  
  for (const [stat, value] of Object.entries(updates)) {
    await redisClient.hIncrBy(`user:${userId}:lifetime_stats`, stat, value);
  }
  
  // Update scoring average
  const lifetime = await redisClient.hGetAll(`user:${userId}:lifetime_stats`);
  const scoringAvg = parseInt(lifetime.totalStrokes) / parseInt(lifetime.roundsPlayed);
  
  await redisClient.hSet(`user:${userId}:lifetime_stats`, 'scoringAverage', scoringAvg.toFixed(2));
}

async function generateRoundInsights(userId, roundId, summary) {
  const insights = {
    strengths: [],
    improvements: [],
    trends: [],
    recommendations: []
  };
  
  // Analyze putting
  if (summary.totalPutts / summary.holesPlayed < 1.8) {
    insights.strengths.push('Excellent putting - averaging less than 1.8 putts per hole');
  } else if (summary.totalPutts / summary.holesPlayed > 2.2) {
    insights.improvements.push('Putting needs work - averaging over 2.2 putts per hole');
    insights.recommendations.push('Practice lag putting from 20-30 feet');
  }
  
  // Analyze GIR
  const girPercentage = (summary.greensInRegulation / summary.holesPlayed) * 100;
  if (girPercentage > 65) {
    insights.strengths.push(`Strong ball striking - ${girPercentage.toFixed(0)}% GIR`);
  } else if (girPercentage < 40) {
    insights.improvements.push(`Iron play needs improvement - only ${girPercentage.toFixed(0)}% GIR`);
    insights.recommendations.push('Focus on approach shots from 150-175 yards');
  }
  
  // Compare to recent rounds
  const recentScores = await redisClient.lRange(`user:${userId}:recent_scores`, 0, 4);
  if (recentScores.length >= 3) {
    const avgRecent = recentScores.reduce((sum, s) => sum + parseInt(s), 0) / recentScores.length;
    if (summary.totalScore < avgRecent - 2) {
      insights.trends.push('Improving! This round was better than your recent average');
    } else if (summary.totalScore > avgRecent + 2) {
      insights.trends.push('Tough round - but stay positive, everyone has off days');
    }
  }
  
  return insights;
}

async function storeAnalyticsEvent(event) {
  // Store in time series for querying
  await redisClient.zAdd(`analytics:${event.type}:${event.userId || 'global'}`, {
    score: Date.now(),
    value: JSON.stringify(event)
  });
  
  // Expire old events (keep 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  await redisClient.zRemRangeByScore(
    `analytics:${event.type}:${event.userId || 'global'}`,
    0,
    thirtyDaysAgo
  );
}

async function updateRealtimeMetrics(event) {
  // Update current session metrics
  const now = new Date();
  const hour = now.getHours();
  const minute = Math.floor(now.getMinutes() / 5) * 5; // 5-minute buckets
  
  const metricKey = `metrics:realtime:${now.toISOString().split('T')[0]}:${hour}:${minute}`;
  
  await redisClient.hIncrBy(metricKey, event.type, 1);
  await redisClient.expire(metricKey, 86400); // Expire after 1 day
}

async function generateInsights(event) {
  // Generate immediate insights based on event
  const insights = [];
  
  if (event.type === 'shot' && event.data.shotType === 'drive') {
    if (event.data.distance > 280) {
      insights.push({ type: 'achievement', message: 'Crushed it! Over 280 yards!' });
    }
  }
  
  if (event.type === 'score') {
    if (event.data.relativeToPar <= -2) {
      insights.push({ type: 'highlight', message: 'Eagle or better! Amazing shot!' });
    }
  }
  
  return insights;
}
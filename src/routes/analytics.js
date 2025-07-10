import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { mcpServer } from '../mcp/server.js';
import { logger } from '../utils/logger.js';
import { cache } from '../services/redis.js';
import { db } from '../services/database.js';
import { courseDatabase } from '../services/courseDatabase.js';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Get user analytics dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check cache
    const cacheKey = `analytics:dashboard:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Get various analytics data
    const [
      scoringTrends,
      shotAnalysis,
      coursePerformance,
      improvementAreas
    ] = await Promise.all([
      getScoringTrends(userId),
      getShotAnalysis(userId),
      getCoursePerformance(userId),
      getImprovementAreas(userId)
    ]);
    
    const dashboard = {
      scoringTrends,
      shotAnalysis,
      coursePerformance,
      improvementAreas,
      generatedAt: new Date().toISOString()
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, dashboard, 3600);
    
    res.json(dashboard);
    
  } catch (error) {
    logger.error('Get analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get round analytics
router.get('/rounds/:roundId', async (req, res) => {
  try {
    const { roundId } = req.params;
    const userId = req.user.id;
    
    // Verify user was in the round
    const wasInRound = await verifyRoundParticipation(userId, roundId);
    if (!wasInRound) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get round analytics
    const analytics = await getRoundAnalytics(roundId, userId);
    
    res.json(analytics);
    
  } catch (error) {
    logger.error('Get round analytics error:', error);
    res.status(500).json({ error: 'Failed to get round analytics' });
  }
});

// Get shot analysis
router.get('/shots', async (req, res) => {
  try {
    const userId = req.user.id;
    const { shotType, period = '30d' } = req.query;
    
    // Use MCP analytics collector
    const result = await mcpServer.executeTool('collect_analytics', {
      eventType: 'shot_analysis',
      userId,
      data: {
        shotType,
        period
      }
    });
    
    res.json({
      shotType: shotType || 'all',
      period,
      analysis: result.insights
    });
    
  } catch (error) {
    logger.error('Get shot analysis error:', error);
    res.status(500).json({ error: 'Failed to get shot analysis' });
  }
});

// Get improvement recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's recent performance data
    const recentData = await getUserRecentPerformance(userId);
    
    // Generate recommendations based on weaknesses
    const recommendations = generateRecommendations(recentData);
    
    res.json({ recommendations });
    
  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Track custom event
router.post('/events', async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventType, data } = req.body;
    
    // Validate event type
    const validEventTypes = ['user_action', 'performance_metric', 'custom'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }
    
    // Use MCP analytics collector
    const result = await mcpServer.executeTool('collect_analytics', {
      eventType,
      userId,
      data
    });
    
    res.json({
      eventId: result.eventId,
      processed: result.processed
    });
    
  } catch (error) {
    logger.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Helper functions
async function getScoringTrends(userId) {
  const rounds = await db.query`
    SELECT 
      r.started_at::date as date,
      rp.total_score as score,
      rp.completed_holes as holes
    FROM rounds r
    JOIN round_players rp ON r.id = rp.round_id
    WHERE rp.user_id = ${userId}
      AND r.status = 'completed'
      AND r.started_at > NOW() - INTERVAL '90 days'
    ORDER BY r.started_at
  `;
  
  // Calculate moving average
  const movingAvg = [];
  for (let i = 0; i < rounds.length; i++) {
    const window = rounds.slice(Math.max(0, i - 4), i + 1);
    const avg = window.reduce((sum, r) => sum + r.score, 0) / window.length;
    movingAvg.push({
      date: rounds[i].date,
      score: rounds[i].score,
      average: Math.round(avg * 10) / 10
    });
  }
  
  return {
    raw: rounds,
    movingAverage: movingAvg,
    trend: calculateTrend(movingAvg)
  };
}

async function getShotAnalysis(userId) {
  const shots = await redisClient.hGetAll(`user:${userId}:shot_averages:drive`);
  const approach = await redisClient.hGetAll(`user:${userId}:shot_averages:approach`);
  const putting = await redisClient.hGetAll(`user:${userId}:shot_averages:putt`);
  
  return {
    driving: {
      avgDistance: parseFloat(shots.avgDistance) || 0,
      avgAccuracy: parseFloat(shots.avgAccuracy) || 0,
      totalShots: parseInt(shots.count) || 0
    },
    approach: {
      avgDistance: parseFloat(approach.avgDistance) || 0,
      avgAccuracy: parseFloat(approach.avgAccuracy) || 0,
      totalShots: parseInt(approach.count) || 0
    },
    putting: {
      avgDistance: parseFloat(putting.avgDistance) || 0,
      makePercentage: parseFloat(putting.avgAccuracy) || 0,
      totalPutts: parseInt(putting.count) || 0
    }
  };
}

async function getCoursePerformance(userId) {
  const courseStats = await db.query`
    SELECT 
      r.course_id,
      COUNT(*) as rounds_played,
      AVG(rp.total_score) as avg_score,
      MIN(rp.total_score) as best_score,
      MAX(r.started_at) as last_played
    FROM rounds r
    JOIN round_players rp ON r.id = rp.round_id
    WHERE rp.user_id = ${userId}
      AND r.status = 'completed'
    GROUP BY r.course_id
    ORDER BY rounds_played DESC
    LIMIT 10
  `;
  
  // Enrich with course names
  const enriched = await Promise.all(
    courseStats.map(async (stat) => {
      const course = await courseDatabase.getById(stat.course_id);
      return {
        ...stat,
        courseName: course?.name || 'Unknown',
        avgScoreToPar: stat.avg_score - (course?.par || 72)
      };
    })
  );
  
  return enriched;
}

async function getImprovementAreas(userId) {
  const stats = await getUserStats(userId);
  const areas = [];
  
  // Analyze putting
  if (stats.averagePutts > 2.0) {
    areas.push({
      area: 'Putting',
      priority: 'high',
      currentLevel: `${stats.averagePutts.toFixed(1)} putts/hole`,
      target: '1.8 putts/hole',
      recommendation: 'Focus on lag putting and speed control'
    });
  }
  
  // Analyze GIR
  if (stats.girPercentage < 50) {
    areas.push({
      area: 'Approach Shots',
      priority: 'high',
      currentLevel: `${stats.girPercentage.toFixed(0)}% GIR`,
      target: '60% GIR',
      recommendation: 'Work on iron accuracy from 150-175 yards'
    });
  }
  
  // Analyze fairways
  if (stats.fairwayAccuracy < 60) {
    areas.push({
      area: 'Driving Accuracy',
      priority: 'medium',
      currentLevel: `${stats.fairwayAccuracy.toFixed(0)}% fairways`,
      target: '70% fairways',
      recommendation: 'Focus on consistency over distance'
    });
  }
  
  return areas;
}

async function getUserStats(userId) {
  // Simple stats for development
  return {
    averagePutts: 1.8,
    girPercentage: 55,
    fairwayAccuracy: 65
  };
}

async function getRoundAnalytics(roundId, userId) {
  // Get round data
  const scores = await db.query`
    SELECT * FROM scores
    WHERE round_id = ${roundId} AND user_id = ${userId}
    ORDER BY hole_number
  `;
  
  // Calculate analytics
  const analytics = {
    scorecard: scores,
    summary: {
      totalScore: scores.reduce((sum, s) => sum + s.score, 0),
      totalPutts: scores.reduce((sum, s) => sum + (s.putts || 0), 0),
      fairwaysHit: scores.filter(s => s.fairway_hit).length,
      greensInRegulation: scores.filter(s => s.green_in_regulation).length,
      penalties: scores.reduce((sum, s) => sum + (s.penalties || 0), 0)
    },
    insights: [],
    shotByShot: scores.map(s => ({
      hole: s.hole_number,
      score: s.score,
      putts: s.putts,
      details: JSON.parse(s.shot_data || '[]')
    }))
  };
  
  // Generate insights
  if (analytics.summary.totalPutts / scores.length > 2.0) {
    analytics.insights.push({
      type: 'weakness',
      message: 'Putting was a challenge this round - consider practicing speed control'
    });
  }
  
  const birdiesOrBetter = scores.filter(s => s.score < 4).length; // Simplified
  if (birdiesOrBetter >= 3) {
    analytics.insights.push({
      type: 'strength',
      message: `Great scoring with ${birdiesOrBetter} birdies or better!`
    });
  }
  
  return analytics;
}

async function verifyRoundParticipation(userId, roundId) {
  const [participant] = await db.query`
    SELECT 1 FROM round_players
    WHERE round_id = ${roundId} AND user_id = ${userId}
  `;
  
  return !!participant;
}

async function getUserRecentPerformance(userId) {
  const recentRounds = await db.query`
    SELECT 
      r.id,
      r.started_at,
      rp.total_score,
      rp.total_putts,
      rp.completed_holes
    FROM rounds r
    JOIN round_players rp ON r.id = rp.round_id
    WHERE rp.user_id = ${userId}
      AND r.status = 'completed'
      AND r.started_at > NOW() - INTERVAL '30 days'
    ORDER BY r.started_at DESC
    LIMIT 10
  `;
  
  return recentRounds;
}

function generateRecommendations(performanceData) {
  const recommendations = [];
  
  if (performanceData.length === 0) {
    return [{
      title: 'Play More Rounds',
      description: 'Need more data to generate personalized recommendations',
      priority: 'info'
    }];
  }
  
  // Analyze recent trends
  const avgScore = performanceData.reduce((sum, r) => sum + r.total_score, 0) / performanceData.length;
  const avgPutts = performanceData.reduce((sum, r) => sum + r.total_putts, 0) / performanceData.length;
  
  if (avgPutts / 18 > 2.0) {
    recommendations.push({
      title: 'Putting Practice',
      description: 'Your putting average is high. Focus on:\n- Speed control from 20+ feet\n- Breaking putts from 5-10 feet\n- Pre-putt routine consistency',
      priority: 'high',
      drills: [
        'Gate drill for straight putts',
        'Ladder drill for speed control',
        '3-6-9 drill for pressure putting'
      ]
    });
  }
  
  if (avgScore > 85) {
    recommendations.push({
      title: 'Course Management',
      description: 'Focus on smarter play:\n- Take one more club on approaches\n- Aim for center of greens\n- Avoid hero shots',
      priority: 'medium'
    });
  }
  
  // Check consistency
  const scoreVariance = calculateVariance(performanceData.map(r => r.total_score));
  if (scoreVariance > 25) {
    recommendations.push({
      title: 'Consistency Training',
      description: 'Your scores vary significantly. Work on:\n- Pre-shot routine\n- Mental game\n- Practice under pressure',
      priority: 'medium'
    });
  }
  
  return recommendations;
}

function calculateTrend(data) {
  if (data.length < 3) return 'neutral';
  
  const recent = data.slice(-5);
  const older = data.slice(-10, -5);
  
  const recentAvg = recent.reduce((sum, d) => sum + d.average, 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => sum + d.average, 0) / older.length;
  
  if (recentAvg < olderAvg - 1) return 'improving';
  if (recentAvg > olderAvg + 1) return 'declining';
  return 'stable';
}

function calculateVariance(numbers) {
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  return variance;
}

export { router as analyticsRouter };
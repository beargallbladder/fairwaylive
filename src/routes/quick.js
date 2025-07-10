import { Router } from 'express';
import { swarmCoordinator } from '../swarm/swarm-coordinator.js';
import { courseDatabase } from '../services/courseDatabase.js';
import { redisClient } from '../services/redis.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Ultra-fast round start - no auth required
router.post('/rounds/quick-start', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        
        // Use swarm for instant course detection
        const courseResult = await swarmCoordinator.process('course-detection', {
            latitude,
            longitude
        }, 'urgent');
        
        let course;
        if (courseResult.result?.courseDetected) {
            course = courseResult.result.course;
        } else {
            // Fallback to nearest course
            const nearbyCourses = await courseDatabase.findNearby(latitude, longitude);
            course = nearbyCourses[0] || {
                id: 'default',
                name: 'Local Course',
                holes: 18,
                par: 72
            };
        }
        
        // Generate anonymous round ID
        const roundId = `round-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create round in Redis (no DB for anonymous)
        const roundData = {
            id: roundId,
            courseId: course.id,
            courseName: course.name,
            currentHole: 1,
            holes: generateHoleData(course),
            status: 'active',
            anonymous: true,
            startedAt: new Date().toISOString()
        };
        
        await redisClient.hSet('rounds', roundId, JSON.stringify(roundData));
        await redisClient.expire(`rounds:${roundId}`, 86400); // 24 hour expiry
        
        res.json({
            round: roundData,
            course
        });
        
    } catch (error) {
        logger.error('Quick start error:', error);
        
        // Always return something
        res.json({
            round: {
                id: `round-${Date.now()}`,
                courseId: 'default',
                courseName: 'Golf Course',
                currentHole: 1,
                holes: generateDefaultHoles(),
                anonymous: true
            }
        });
    }
});

function generateHoleData(course) {
    const holes = [];
    const holeCount = course.holes || 18;
    
    for (let i = 1; i <= holeCount; i++) {
        const par = course.teeBoxes?.[i-1]?.par || (Math.random() < 0.2 ? 3 : Math.random() < 0.7 ? 4 : 5);
        const yards = course.teeBoxes?.[i-1]?.yardage || 
                     (par === 3 ? 150 + Math.random() * 50 :
                      par === 4 ? 350 + Math.random() * 100 :
                      500 + Math.random() * 50);
        
        holes.push({
            number: i,
            par,
            yards: Math.round(yards)
        });
    }
    
    return holes;
}

function generateDefaultHoles() {
    return generateHoleData({ holes: 18 });
}

export { router as quickRouter };
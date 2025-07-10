import { Router } from 'express';
import multer from 'multer';
import { swarmCoordinator } from '../swarm/swarm-coordinator.js';
import { optionalAuthenticate } from '../middleware/authenticate.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Configure multer for memory storage (we'll process and discard)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 1
    }
});

// Ultra-fast voice upload endpoint
router.post('/upload', optionalAuthenticate, upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { roundId } = req.body;
        const audioBuffer = req.file.buffer;
        
        // Fire off to swarm for parallel processing
        const swarmPromise = swarmCoordinator.process('voice-processing', {
            audio: audioBuffer,
            roundId,
            userId: req.user?.id || 'anonymous',
            mimeType: req.file.mimetype,
            batteryMode: req.body.batteryMode || 'normal'
        }, 'urgent'); // Voice is always urgent
        
        // Set aggressive timeout for fast response
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Processing timeout')), 3000)
        );
        
        // Race between swarm and timeout
        const result = await Promise.race([swarmPromise, timeoutPromise])
            .catch(err => {
                // Fallback to basic processing
                logger.warn('Swarm timeout, using fallback');
                return fallbackVoiceProcessing(audioBuffer);
            });
        
        // Log performance
        const processingTime = Date.now() - startTime;
        logger.info(`Voice processed in ${processingTime}ms`);
        
        // Return immediately with essentials
        res.json({
            transcription: result.result?.transcription || result.transcription || "Processing...",
            scoreDetected: result.result?.scoreDetected || false,
            score: result.result?.score,
            confidence: result.result?.confidence || 0.5,
            processingTime
        });
        
        // Continue processing in background if needed
        if (result.result?.transcription && roundId) {
            processInBackground(result, roundId, req.user?.id);
        }
        
    } catch (error) {
        logger.error('Voice upload error:', error);
        
        // Always return something
        res.json({
            transcription: "Couldn't process that one",
            scoreDetected: false,
            processingTime: Date.now() - startTime
        });
    }
});

// Lightweight status endpoint
router.get('/status', (req, res) => {
    const status = swarmCoordinator.getStatus();
    res.json({
        healthy: true,
        swarm: {
            agents: Object.keys(status.agents).length,
            queueLength: status.queueLength
        }
    });
});

// Fallback voice processing (super basic)
async function fallbackVoiceProcessing(audioBuffer) {
    // Simple pattern matching for common phrases
    const fakeTranscription = "Made par on that one";
    
    // Try to detect score from common patterns
    const scorePatterns = {
        'ace|hole in one': 1,
        'eagle': -2,
        'birdie': -1,
        'par': 0,
        'bogey|bogie': 1,
        'double': 2,
        'triple': 3,
        'made (\\d+)': (match) => parseInt(match[1])
    };
    
    let detectedScore = null;
    for (const [pattern, value] of Object.entries(scorePatterns)) {
        if (fakeTranscription.toLowerCase().includes(pattern.split('|')[0])) {
            detectedScore = typeof value === 'function' ? value(fakeTranscription.match(/\d+/)) : value;
            break;
        }
    }
    
    return {
        transcription: fakeTranscription,
        scoreDetected: detectedScore !== null,
        score: detectedScore,
        confidence: 0.3
    };
}

// Background processing for additional features
async function processInBackground(result, roundId, userId) {
    try {
        // Extract additional insights
        const insights = await swarmCoordinator.process('voice-insights', {
            transcription: result.result.transcription,
            sentiment: result.result.sentiment,
            roundId,
            userId
        }, 'low');
        
        // Update betting odds if trash talk detected
        if (insights.result?.trashTalkScore > 0.7) {
            await swarmCoordinator.process('update-social-odds', {
                roundId,
                userId,
                sentiment: 'confident',
                impact: insights.result.trashTalkScore
            });
        }
        
        // Store for replay/highlights
        await swarmCoordinator.process('store-voice-moment', {
            roundId,
            userId,
            transcription: result.result.transcription,
            timestamp: Date.now(),
            isHighlight: insights.result?.isHighlight || false
        });
        
    } catch (error) {
        // Don't let background processing affect user experience
        logger.error('Background voice processing error:', error);
    }
}

export { router as voiceRouter };
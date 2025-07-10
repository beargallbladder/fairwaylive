export const scoreParsingTool = {
  name: 'parse_golf_score',
  description: 'Extract golf scores and player information from transcribed text',
  parameters: {
    type: 'object',
    properties: {
      transcript: { type: 'string' },
      players: { type: 'array', items: { type: 'string' } },
      currentHole: { type: 'number' },
      holePar: { type: 'number' }
    },
    required: ['transcript']
  },
  handler: async ({ transcript, players = [], currentHole, holePar }) => {
    try {
      const parsedData = {
        scores: [],
        shotDescriptions: [],
        commentary: '',
        confidence: 0
      };
      
      // Normalize transcript
      const normalizedText = transcript.toLowerCase();
      
      // Extract scores
      const scorePatterns = [
        { pattern: /made (?:a )?(\w+)/g, type: 'score_term' },
        { pattern: /(?:shot|scored|made) (?:a )?(\d+)/g, type: 'score_number' },
        { pattern: /(\w+) (?:for|with) (?:a )?(\w+)/g, type: 'player_score' },
        { pattern: /(\d+) (?:over|under) par/g, type: 'relative_score' }
      ];
      
      // Score term mappings
      const scoreTerms = {
        'ace': 1,
        'eagle': -2,
        'birdie': -1,
        'par': 0,
        'bogey': 1,
        'double': 2,
        'triple': 3,
        'quad': 4
      };
      
      // Extract player scores
      for (const player of players) {
        const playerPattern = new RegExp(`${player.toLowerCase()}.*?(?:made|shot|scored|got)\\s+(?:a\\s+)?(\\w+|\\d+)`, 'g');
        const matches = normalizedText.matchAll(playerPattern);
        
        for (const match of matches) {
          const scoreText = match[1];
          let score = null;
          
          if (scoreTerms[scoreText]) {
            score = holePar ? holePar + scoreTerms[scoreText] : null;
          } else if (!isNaN(scoreText)) {
            score = parseInt(scoreText);
          }
          
          if (score) {
            parsedData.scores.push({
              player,
              hole: currentHole,
              score,
              scoreType: getScoreType(score, holePar),
              raw: match[0]
            });
          }
        }
      }
      
      // Extract shot descriptions
      const shotPatterns = [
        /(?:hit|drove|smashed|crushed)\s+it\s+(\d+)\s*(?:yards?)?/g,
        /(?:in the|hit the|found the)\s+(bunker|water|rough|trees|fairway|green)/g,
        /(\d+)\s*(?:foot|feet|footer)\s+(?:putt|for)/g,
        /(drained|sunk|made|missed)\s+(?:the|it|a)?\s*(?:putt)?/g
      ];
      
      for (const pattern of shotPatterns) {
        const matches = normalizedText.matchAll(pattern);
        for (const match of matches) {
          parsedData.shotDescriptions.push({
            type: detectShotType(match[0]),
            description: match[0],
            detail: match[1]
          });
        }
      }
      
      // Extract general commentary
      parsedData.commentary = extractCommentary(transcript, parsedData.scores, parsedData.shotDescriptions);
      
      // Calculate confidence
      parsedData.confidence = calculateParsingConfidence(parsedData);
      
      return {
        success: true,
        ...parsedData,
        originalTranscript: transcript
      };
    } catch (error) {
      console.error('Score parsing error:', error);
      return {
        success: false,
        message: 'Failed to parse scores',
        error: error.message
      };
    }
  }
};

function getScoreType(score, par) {
  if (!par) return 'unknown';
  const diff = score - par;
  
  if (score === 1) return 'ace';
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double_bogey';
  if (diff >= 3) return 'other';
}

function detectShotType(description) {
  if (/drive|drove|tee/i.test(description)) return 'drive';
  if (/putt|putting|footer/i.test(description)) return 'putt';
  if (/chip|pitch/i.test(description)) return 'chip';
  if (/bunker|sand/i.test(description)) return 'bunker';
  if (/approach|iron/i.test(description)) return 'approach';
  return 'general';
}

function extractCommentary(transcript, scores, shots) {
  // Remove already parsed content to get remaining commentary
  let commentary = transcript;
  
  // Remove score mentions
  scores.forEach(score => {
    commentary = commentary.replace(score.raw, '');
  });
  
  // Remove shot descriptions
  shots.forEach(shot => {
    commentary = commentary.replace(shot.description, '');
  });
  
  // Clean up and return
  return commentary.trim().replace(/\s+/g, ' ');
}

function calculateParsingConfidence(data) {
  let confidence = 0.5; // Base confidence
  
  if (data.scores.length > 0) confidence += 0.2;
  if (data.shotDescriptions.length > 0) confidence += 0.2;
  if (data.commentary.length > 10) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}
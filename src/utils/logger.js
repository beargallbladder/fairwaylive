import winston from 'winston';

const { combine, timestamp, json, errors, colorize, simple } = winston.format;

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'fairwaylive' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' 
        ? json() 
        : combine(colorize(), simple())
    })
  ]
});

// Production logging to files
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
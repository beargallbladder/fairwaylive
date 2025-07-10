import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden'
    });
  }
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not found'
    });
  }
  
  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }
  
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Invalid reference'
    });
  }
  
  // Default error
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
}
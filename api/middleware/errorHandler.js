const logger = require('../utils/logger');

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Supabase errors
const handleSupabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  switch (error.code) {
    case '23505': // Unique constraint violation
      message = 'A record with this information already exists';
      statusCode = 409;
      break;
    case '23503': // Foreign key constraint violation
      message = 'Referenced record does not exist';
      statusCode = 400;
      break;
    case '23502': // Not null constraint violation
      message = 'Required field is missing';
      statusCode = 400;
      break;
    case 'PGRST116': // No rows returned
      message = 'Record not found';
      statusCode = 404;
      break;
    default:
      if (error.message) {
        message = error.message;
      }
  }

  return new AppError(message, statusCode);
};

// Handle JWT errors
const handleJWTError = (error) => {
  let message = 'Authentication failed';
  
  if (error.name === 'JsonWebTokenError') {
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    message = 'Token has expired';
  }
  
  return new AppError(message, 401);
};

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    stack: err.stack,
    details: err
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  } else {
    // Programming errors: don't leak error details
    logger.error('ERROR:', err);
    
    res.status(500).json({
      success: false,
      error: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.code && error.code.startsWith('23')) {
      error = handleSupabaseError(error);
    }
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error = handleJWTError(error);
    }

    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};

module.exports = {
  AppError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler
};
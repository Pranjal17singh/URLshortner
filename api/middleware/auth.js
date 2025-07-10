const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

// Middleware to verify Supabase JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new AppError('Invalid token', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ 
        success: false,
        error: error.message 
      });
    }
    res.status(401).json({ 
      success: false,
      error: 'Token verification failed' 
    });
  }
};

// Legacy authenticate function for backwards compatibility
const authenticate = verifyToken;

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      req.user = user;
    }
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  verifyToken,
  authenticate, // Legacy compatibility
  optionalAuth,
  generateToken
};
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string inputs
  const sanitize = (obj) => {
    for (const key in obj) {
      if (obj[key] !== null && typeof obj[key] === 'object') {
        sanitize(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// CSRF protection for form submissions
const csrfProtection = (req, res, next) => {
  // Skip CSRF for API routes (use tokens instead)
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // For form submissions, check referer
  const referer = req.get('Referer');
  const host = req.get('Host');
  
  if (!referer || !referer.includes(host)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid request origin'
    });
  }
  
  next();
};

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  general: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests'),
  auth: createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts'),
  submission: createRateLimiter(60 * 1000, 3, 'Too many form submissions'),
  urlCreation: createRateLimiter(60 * 1000, 10, 'Too many URL creation attempts')
};

// Validate URL format more strictly
const validateUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block localhost and private IP ranges
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

module.exports = {
  sanitizeInput,
  csrfProtection,
  rateLimiters,
  validateUrl,
  securityHeaders
};
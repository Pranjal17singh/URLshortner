// Production environment configuration
require('dotenv').config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NODE_ENV',
  'PORT',
  'FRONTEND_URL',
  'JWT_SECRET'
];

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

const config = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3001,
  
  // Supabase configuration
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // CORS configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // JWT configuration (fallback)
  JWT_SECRET: process.env.JWT_SECRET || 'your-fallback-jwt-secret-change-in-production',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validate configuration
if (config.NODE_ENV === 'production') {
  if (!config.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set in production. Some features may not work correctly.');
  }
  
  if (config.JWT_SECRET === 'your-fallback-jwt-secret-change-in-production') {
    console.error('❌ JWT_SECRET must be set in production environment');
    process.exit(1);
  }
}

// Log configuration status
console.log('✅ Environment configuration loaded successfully');
console.log(`   - Environment: ${config.NODE_ENV}`);
console.log(`   - Port: ${config.PORT}`);
console.log(`   - Supabase URL: ${config.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   - Service Role Key: ${config.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '⚠️  Not set'}`);

module.exports = config;
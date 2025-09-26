// Environment configuration and validation
require('dotenv').config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET'
];

// Validate required environment variables
const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
};

// Configuration object
const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // Database configuration
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  
  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  }
};

// Validate environment on import
validateEnvironment();

module.exports = config;

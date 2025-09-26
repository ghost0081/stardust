const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config/environment');
const { testConnection } = require('./config/database');
const { authRoutes, userRoutes } = require('./routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Space Explorer API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    error: config.nodeEnv === 'development' ? error.message : undefined,
    stack: config.nodeEnv === 'development' ? error.stack : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start listening
    const server = app.listen(config.port, () => {
      console.log(`🚀 Space Explorer API server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🌐 CORS Origin: ${config.cors.origin}`);
      console.log(`⏱️  Rate Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000}s`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;

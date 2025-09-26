const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/environment');

/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

/**
 * Verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      profile_data: user.profile_data
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Doesn't fail if no token is provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId);
    
    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_data: user.profile_data
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Verify refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} Decoded token data
 */
const verifyRefreshToken = (refreshToken) => {
  return jwt.verify(refreshToken, config.jwt.secret);
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '30d' // Refresh tokens last longer
  });
};

/**
 * Check if user has required permissions
 * @param {Array} requiredRoles - Required roles/permissions
 * @returns {Function} Middleware function
 */
const requirePermissions = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // For now, all authenticated users have basic permissions
    // This can be extended with role-based access control
    const userRoles = req.user.profile_data?.preferences?.roles || ['user'];
    
    const hasPermission = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  requirePermissions
};

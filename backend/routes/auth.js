const express = require('express');
const { User } = require('../models');
const { 
  generateToken, 
  generateRefreshToken, 
  authenticateToken,
  validateBody,
  schemas 
} = require('../middleware');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateBody(schemas.register), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login
    await User.updateLastLogin(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          profile_data: user.profile_data
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateBody(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login
    await User.updateLastLogin(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          last_login: user.last_login,
          profile_data: user.profile_data
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      code: 'LOGIN_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // Server-side logout would require token blacklisting
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          last_login: user.last_login,
          profile_data: user.profile_data
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      code: 'PROFILE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email
 * @access  Public
 */
router.post('/verify-email', validateBody(schemas.verifyEmail), async (req, res) => {
  try {
    const { token } = req.body;

    // In a real implementation, you would verify the email token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', validateBody(schemas.resetPasswordRequest), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // In a real implementation, you would send a password reset email
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed',
      code: 'RESET_REQUEST_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password
 * @access  Public
 */
router.post('/reset-password', validateBody(schemas.resetPassword), async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // In a real implementation, you would verify the reset token
    // and update the user's password
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      code: 'RESET_ERROR'
    });
  }
});

module.exports = router;

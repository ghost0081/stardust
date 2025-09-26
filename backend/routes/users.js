const express = require('express');
const { User } = require('../models');
const { 
  authenticateToken,
  validateBody,
  validateParams,
  schemas 
} = require('../middleware');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await User.getProfile(req.user.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      code: 'PROFILE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, validateBody(schemas.updateProfile), async (req, res) => {
  try {
    const updateData = req.body;
    
    const updatedUser = await User.update(req.user.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          updated_at: updatedUser.updated_at,
          profile_data: updatedUser.profile_data
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      code: 'UPDATE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, validateBody(schemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password hash
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.update(req.user.id, { password_hash: newPasswordHash });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const deactivatedUser = await User.deactivate(req.user.id);

    res.json({
      success: true,
      message: 'Account deactivated successfully',
      data: {
        user: {
          id: deactivatedUser.id,
          name: deactivatedUser.name,
          email: deactivatedUser.email,
          is_active: deactivatedUser.is_active,
          updated_at: deactivatedUser.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      code: 'DELETE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (public profile)
 * @access  Public
 */
router.get('/:id', validateParams(schemas.userId), async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await User.getProfile(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      code: 'USER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

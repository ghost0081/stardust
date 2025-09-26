const bcrypt = require('bcryptjs');
const { supabase, supabaseAdmin } = require('../config/database');

/**
 * User Model for Space Explorer
 * Handles user data operations with Supabase
 */
class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.name = userData.name;
    this.password_hash = userData.password_hash;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
    this.is_active = userData.is_active;
    this.last_login = userData.last_login;
    this.profile_data = userData.profile_data;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    try {
      const { email, password, name } = userData;
      
      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      // Prepare user data
      const newUser = {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password_hash,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_data: {
          avatar: null,
          bio: '',
          preferences: {
            theme: 'space',
            notifications: true,
            language: 'en'
          }
        }
      };

      // Insert user into database
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }

      // Remove password hash from response
      delete data.password_hash;
      return data;
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User data or null
   */
  static async findByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`User lookup failed: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  static async findById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`User lookup failed: ${error.message}`);
    }
  }

  /**
   * Verify user password
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Password match result
   */
  static async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Password verification failed: ${error.message}`);
    }
  }

  /**
   * Update user data
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  static async update(id, updateData) {
    try {
      const updatePayload = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }

      // Remove password hash from response
      delete data.password_hash;
      return data;
    } catch (error) {
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  /**
   * Update last login timestamp
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(id) {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update last login: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Last login update failed: ${error.message}`);
    }
  }

  /**
   * Deactivate user account
   * @param {string} id - User ID
   * @returns {Promise<Object>} Updated user
   */
  static async deactivate(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to deactivate user: ${error.message}`);
      }

      delete data.password_hash;
      return data;
    } catch (error) {
      throw new Error(`User deactivation failed: ${error.message}`);
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Email exists result
   */
  static async emailExists(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Email doesn't exist
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      throw new Error(`Email check failed: ${error.message}`);
    }
  }

  /**
   * Get user profile (public data)
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User profile
   */
  static async getProfile(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, created_at, profile_data')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Profile fetch failed: ${error.message}`);
    }
  }
}

module.exports = User;

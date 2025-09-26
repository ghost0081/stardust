const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client for public operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database connection test
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

// Export clients and utilities
module.exports = {
  supabase,
  supabaseAdmin,
  testConnection
};

-- Space Explorer Database Schema
-- SQL commands for Supabase PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_data JSONB DEFAULT '{
        "avatar": null,
        "bio": "",
        "preferences": {
            "theme": "space",
            "notifications": true,
            "language": "en",
            "roles": ["user"]
        }
    }'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user sessions table (optional - for session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- Create audit log table (optional - for tracking user actions)
CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON user_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON user_audit_log(created_at);

-- Create user preferences table (optional - for extended preferences)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- Create indexes for preferences
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_key ON user_preferences(preference_key);

-- Create trigger for preferences updated_at
DROP TRIGGER IF EXISTS update_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for Supabase
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own data (for registration)
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS on user_sessions table
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Enable RLS on user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    new_users_today BIGINT,
    new_users_this_week BIGINT,
    new_users_this_month BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_users_today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_this_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month
    FROM users;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (optional - for testing)
-- Note: In production, remove this section
INSERT INTO users (email, name, password_hash) VALUES 
('admin@spaceexplorer.com', 'Admin User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5Q5K2'),
('user@spaceexplorer.com', 'Test User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5Q5K2')
ON CONFLICT (email) DO NOTHING;

-- Create view for user profiles (public data only)
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    name,
    email,
    created_at,
    last_login,
    profile_data->>'bio' as bio,
    profile_data->'preferences'->>'theme' as theme,
    profile_data->'preferences'->>'language' as language
FROM users 
WHERE is_active = true;

-- Grant permissions for the view
GRANT SELECT ON user_profiles TO authenticated;

-- Comments for documentation
COMMENT ON TABLE users IS 'Main users table for Space Explorer application';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.profile_data IS 'JSON object containing user profile and preferences';

COMMENT ON TABLE user_sessions IS 'User session management for refresh tokens';
COMMENT ON TABLE user_audit_log IS 'Audit trail for user actions';
COMMENT ON TABLE user_preferences IS 'Extended user preferences storage';

-- Create a function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Add email validation constraint
ALTER TABLE users ADD CONSTRAINT check_valid_email 
CHECK (is_valid_email(email));

-- Create function to automatically clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    -- Delete audit logs older than 1 year
    DELETE FROM user_audit_log WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

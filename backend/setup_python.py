#!/usr/bin/env python3
"""
Space Explorer Backend Python Setup Script
This script sets up the Python Flask backend with Supabase integration
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def create_env_file():
    """Create .env file with Supabase credentials"""
    env_content = """# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xznzussaphaawfjtnbsr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjM5NTQsImV4cCI6MjA3NDQzOTk1NH0.G9_U73SwgG2ZzFl7MTiCFnUOqDLFqkuM0zrpcUy_Ulo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2Mzk1NCwiZXhwIjoyMDc0NDM5OTU0fQ.GijAIsQ_D0FR-BFl3RTT-M3wY1PrJ0DBBO8GWBfjXKk

# JWT Configuration
JWT_SECRET=space_explorer_jwt_secret_key_2024_secure_token
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"""
    
    env_file = Path('.env')
    if not env_file.exists():
        print("📝 Creating .env file with Supabase credentials...")
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ .env file created")
    else:
        print("✅ .env file already exists")

def create_directories():
    """Create necessary directories"""
    directories = ['uploads', 'logs']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Directory '{directory}' created/verified")

def test_backend():
    """Test the backend configuration"""
    print("🧪 Testing backend configuration...")
    try:
        # Test imports
        from app import app, supabase
        print("✅ All imports successful")
        
        # Test Supabase connection
        result = supabase.table('users').select('count').limit(1).execute()
        print("✅ Supabase connection successful")
        
        return True
    except Exception as e:
        print(f"❌ Backend test failed: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🚀 Space Explorer Python Backend Setup")
    print("=" * 40)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    
    print(f"✅ Python version: {sys.version}")
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Create .env file
    create_env_file()
    
    # Create directories
    create_directories()
    
    # Test backend
    if test_backend():
        print("\n🎉 Backend setup completed successfully!")
        print("\nNext steps:")
        print("1. Run the SQL schema in your Supabase dashboard:")
        print("   - Go to https://supabase.com/dashboard")
        print("   - Select your project: xznzussaphaawfjtnbsr")
        print("   - Go to SQL Editor")
        print("   - Copy and paste the content from database/schema.sql")
        print("   - Click Run")
        print("\n2. Start the backend server:")
        print("   python app.py")
        print("\n3. Test the API:")
        print("   curl http://localhost:5000/health")
        print("\nYour backend will be available at: http://localhost:5000")
    else:
        print("\n⚠️  Setup completed but backend test failed.")
        print("Please run the SQL schema in your Supabase dashboard first.")
        print("\nSQL Schema location: database/schema.sql")

if __name__ == "__main__":
    main()

#!/bin/bash

# Space Explorer Backend Quick Setup Script
# This script sets up the backend with your Supabase credentials

echo "🚀 Space Explorer Backend Quick Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Create .env file with Supabase credentials
echo "🔧 Creating .env file with your Supabase credentials..."
cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xznzussaphaawfjtnbsr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjM5NTQsImV4cCI6MjA3NDQzOTk1NH0.G9_U73SwgG2ZzFl7MTiCFnUOqDLFqkuM0zrpcUy_Ulo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bnp1c3NhcGhhYXdmanRuYnNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2Mzk1NCwiZXhwIjoyMDc0NDM5OTU0fQ.GijAIsQ_D0FR-BFl3RTT-M3wY1PrJ0DBBO8GWBfjXKk

# JWT Configuration
JWT_SECRET=space_explorer_jwt_secret_key_2024_$(date +%s)
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ .env file created with your Supabase credentials"

# Create uploads directory
mkdir -p uploads
echo "✅ Uploads directory created"

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"

# Test database connection
echo "🔍 Testing database connection..."
node -e "
const { testConnection } = require('./config/database');
testConnection().then(success => {
  if (success) {
    console.log('✅ Database connection successful!');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed!');
    console.log('Please run the SQL schema in your Supabase dashboard first.');
    process.exit(1);
  }
}).catch(error => {
  console.log('❌ Database connection error:', error.message);
  process.exit(1);
});
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Backend setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run the SQL schema in your Supabase dashboard:"
    echo "   - Go to https://supabase.com/dashboard"
    echo "   - Select your project: xznzussaphaawfjtnbsr"
    echo "   - Go to SQL Editor"
    echo "   - Copy and paste the content from database/schema.sql"
    echo "   - Click Run"
    echo ""
    echo "2. Start the backend server:"
    echo "   npm run dev"
    echo ""
    echo "3. Test the API:"
    echo "   curl http://localhost:5000/health"
    echo ""
    echo "Your backend will be available at: http://localhost:5000"
else
    echo ""
    echo "⚠️  Setup completed but database connection failed."
    echo "Please run the SQL schema in your Supabase dashboard first."
    echo ""
    echo "SQL Schema location: database/schema.sql"
fi

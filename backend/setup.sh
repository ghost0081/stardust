#!/bin/bash

# Space Explorer Backend Setup Script
# This script sets up the backend environment and installs dependencies

echo "🚀 Setting up Space Explorer Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your Supabase credentials."
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
if [ ! -d uploads ]; then
    echo "📁 Creating uploads directory..."
    mkdir uploads
    echo "✅ Uploads directory created"
else
    echo "✅ Uploads directory already exists"
fi

# Create logs directory
if [ ! -d logs ]; then
    echo "📁 Creating logs directory..."
    mkdir logs
    echo "✅ Logs directory created"
else
    echo "✅ Logs directory already exists"
fi

echo ""
echo "🎉 Backend setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with Supabase credentials"
echo "2. Run the SQL schema in your Supabase database"
echo "3. Start the server with: npm run dev"
echo ""
echo "For production deployment:"
echo "1. Set NODE_ENV=production"
echo "2. Configure your production database"
echo "3. Set up SSL certificates"
echo "4. Use: npm start"

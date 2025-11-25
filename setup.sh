#!/bin/bash

# Complaint Portal Setup Script
echo "🚀 Setting up Complaint Portal System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher) first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Firebase CLI if not installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Install functions dependencies
echo "📦 Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please update .env file with your Firebase configuration"
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update firebase.ts with your Firebase configuration"
echo "2. Update .env file with your settings"
echo "3. Set up Firebase project and deploy functions"
echo "4. Run 'npx expo start' to start the development server"
echo ""
echo "📖 For detailed setup instructions, see README.md"

#!/bin/bash

# FairwayLive Quick Start Script

echo "⛳ Welcome to FairwayLive!"
echo "Setting up your development environment..."

# Check dependencies
echo "📋 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose"
    exit 1
fi

echo "✅ All dependencies found!"

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before starting"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start services
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 5

# Run migrations
echo "🗄️  Setting up database..."
npm run migrate || true

# Start development server
echo "🚀 Starting FairwayLive server..."
npm run dev &

echo ""
echo "✅ FairwayLive is ready!"
echo ""
echo "📱 API Server: http://localhost:3000"
echo "🔌 WebSocket: ws://localhost:3000"
echo "🤖 MCP Server: http://localhost:8080"
echo "🗄️  PostgreSQL: localhost:5432"
echo "💾 Redis: localhost:6379"
echo ""
echo "📖 Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Install mobile app: cd mobile && npm install"
echo "3. Start mobile app: cd mobile && npm start"
echo ""
echo "Happy golfing! 🏌️‍♂️"
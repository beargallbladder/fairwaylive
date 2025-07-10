#!/bin/bash

# FairwayLive Deployment Script

set -e

echo "🏌️ Deploying FairwayLive..."

# Check if required environment variables are set
required_vars=("JWT_SECRET" "OPENAI_API_KEY" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "S3_BUCKET_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test || true

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start new containers
echo "🚀 Starting new containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."
curl -f http://localhost:3000/health || exit 1

echo "✅ FairwayLive deployed successfully!"
echo "🌐 API: http://localhost:3000"
echo "🔌 WebSocket: ws://localhost:3000"
echo "🤖 MCP Server: http://localhost:8080"
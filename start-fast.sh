#!/bin/bash

# FairwayLive - Fast Start (No Docker BS)

echo "⛳ FairwayLive - Let's fucking go!"

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "🔴 Starting Redis..."
    redis-server --daemonize yes
fi

# Check if Postgres is running (optional for anonymous mode)
if ! pg_isready > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL not running - anonymous mode only"
fi

# Install deps if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Start the server
echo "🚀 Starting FairwayLive server..."
NODE_ENV=production node src/server/index.js &
SERVER_PID=$!

echo ""
echo "✅ FairwayLive is LIVE!"
echo ""
echo "🌐 Open http://localhost:3000"
echo "📱 Works on your phone too!"
echo ""
echo "🎙️ Just tap and talk - no login required"
echo "💰 Bet pride points on your buddies"
echo "🔋 Battery friendly - we're not Grint"
echo ""
echo "Press Ctrl+C to stop"

# Wait for Ctrl+C
trap "kill $SERVER_PID; exit" INT
wait
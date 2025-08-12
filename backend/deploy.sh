#!/bin/bash

# YouTube MP3 API Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="youtube-mp3-api"
PORT=8080

echo "🚀 Deploying YouTube MP3 API to $ENVIRONMENT environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg first."
    echo "   Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "   macOS: brew install ffmpeg"
    echo "   CentOS/RHEL: sudo yum install ffmpeg"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs downloads temp

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Set environment variables
export NODE_ENV=$ENVIRONMENT
export PORT=$PORT

# Stop existing PM2 process if running
echo "🛑 Stopping existing processes..."
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Start the application with PM2
echo "▶️  Starting application with PM2..."
pm2 start ecosystem.config.js --env $ENVIRONMENT

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "✅ Deployment completed successfully!"
echo "📊 Application status:"
pm2 status

echo ""
echo "🔗 API endpoints:"
echo "   Health check: http://localhost:$PORT/api/health"
echo "   Video info: POST http://localhost:$PORT/api/video/info"
echo "   Audio extract: POST http://localhost:$PORT/api/audio/extract"
echo "   Audio stream: GET http://localhost:$PORT/api/audio/stream"

echo ""
echo "📝 Useful commands:"
echo "   View logs: pm2 logs $APP_NAME"
echo "   Monitor: pm2 monit"
echo "   Restart: pm2 restart $APP_NAME"
echo "   Stop: pm2 stop $APP_NAME"

# YouTube MP3 Extraction API

A robust Express.js API for extracting audio from YouTube videos and converting to MP3.

## Features

- Extract video metadata (title, duration, thumbnails, etc.)
- Convert YouTube videos to MP3
- Stream audio directly without saving to disk
- Rate limiting and security headers
- Caching for improved performance
- Automatic cleanup of old files
- ES modules support

## Installation

1. Install dependencies:

```bash
npm install
```

2. Install FFmpeg on your system:

- macOS: `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt-get install ffmpeg`
- Windows: Download from https://ffmpeg.org/download.html

3. Create .env file with your configuration

4. Start the server:

```bash
npm start
```

## API Endpoints

### Get Video Information

POST /api/video/info
Body: { "url": "https://youtube.com/watch?v=..." }

### Extract Audio as MP3

POST /api/audio/extract
Body: { "url": "...", "bitrate": "192", "quality": "highest" }

### Download MP3

GET /api/audio/download/:downloadId

### Stream Audio

GET /api/audio/stream?url=...

## Notes

- Files are automatically cleaned up after 1 hour
- Rate limited to prevent abuse
- Supports various YouTube URL formats

## 🚀 Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy Options:

#### 🌐 Free Hosting (Recommended for beginners)

1. **Railway.app (Recommended):**

   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

2. **Render.com:**

   - Connect GitHub repo
   - Create Web Service
   - Auto-deploy

3. **Fly.io:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   fly apps create youtube-mp3-api
   fly deploy
   ```

#### 🖥️ Self-Hosted Options

1. **Direct Deployment (VPS/Dedicated Server):**

   ```bash
   ./deploy.sh production
   ```

2. **Docker Deployment:**

   ```bash
   docker-compose up -d
   ```

3. **PM2 Deployment:**
   ```bash
   npm ci --only=production
   pm2 start ecosystem.config.js --env production
   ```

### Environment Setup:

Copy `env.example` to `.env` and configure your settings:

```bash
cp env.example .env
# Edit .env with your configuration
```

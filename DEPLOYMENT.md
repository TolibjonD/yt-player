# YouTube MP3 API - Deployment Guide

This guide covers different deployment options for the YouTube MP3 API, including free hosting platforms.

## 🚀 Quick Start

### Option 1: Free Hosting Platforms

#### A. Railway.app (Recommended - Free Tier)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Deploy
railway up

# 5. Get your URL
railway domain
```

**Features:**

- ✅ Free tier: $5 credit monthly
- ✅ Automatic deployments from Git
- ✅ Built-in environment variables
- ✅ Custom domains
- ✅ SSL certificates included

#### B. Render.com (Free Tier)

```bash
# 1. Connect your GitHub repository
# 2. Create new Web Service
# 3. Configure:
#    - Build Command: npm ci --only=production
#    - Start Command: npm start
#    - Environment: Node
```

**Features:**

- ✅ Free tier: 750 hours/month
- ✅ Automatic deployments
- ✅ Custom domains
- ✅ SSL certificates

#### C. Fly.io (Free Tier)

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Create app
fly apps create youtube-mp3-api

# 4. Deploy
fly deploy
```

**Features:**

- ✅ Free tier: 3 shared-cpu VMs, 3GB persistent volume
- ✅ Global edge deployment
- ✅ Custom domains
- ✅ SSL certificates

#### D. Heroku (Free Tier Discontinued - Alternative: Render)

```bash
# 1. Install Heroku CLI
# 2. Login
heroku login

# 3. Create app
heroku create your-app-name

# 4. Add buildpack for FFmpeg
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git

# 5. Deploy
git push heroku main
```

**Note:** Heroku discontinued free tier, but Render.com is a great alternative.

#### E. Vercel (Free Tier - Limited for Backend)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Follow prompts
```

**Features:**

- ✅ Free tier: 100GB bandwidth/month
- ⚠️ Limited for backend APIs (better for frontend)

### Option 2: Direct Deployment (VPS/Dedicated Server)

1. **Prerequisites:**

   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install FFmpeg
   sudo apt-get install ffmpeg

   # Install PM2 globally
   npm install -g pm2
   ```

2. **Deploy:**

   ```bash
   # Clone your repository
   git clone <your-repo-url>
   cd backend

   # Run deployment script
   ./deploy.sh production
   ```

### Option 2: Docker Deployment

1. **Build and run with Docker Compose:**

   ```bash
   # Build and start
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop
   docker-compose down
   ```

2. **Manual Docker build:**

   ```bash
   # Build image
   docker build -t youtube-mp3-api .

   # Run container
   docker run -d -p 8080:8080 --name youtube-api youtube-mp3-api
   ```

### Option 3: PM2 Deployment

```bash
# Install dependencies
npm ci --only=production

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🌐 Platform-Specific Configurations

### Railway.app Configuration

Create `railway.json` in your backend directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Render.com Configuration

Create `render.yaml` in your backend directory:

```yaml
services:
  - type: web
    name: youtube-mp3-api
    env: node
    buildCommand: npm ci --only=production
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Fly.io Configuration

Create `fly.toml` in your backend directory:

```toml
app = "youtube-mp3-api"
primary_region = "iad"

[build]

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/api/health"
```

## 🔧 Configuration

### FFmpeg Requirements for Free Hosting

Since our API requires FFmpeg for audio conversion, here's how to handle it on different platforms:

#### Railway.app

Railway automatically detects and installs FFmpeg from the `package.json` dependencies.

#### Render.com

Add this to your `package.json`:

```json
{
  "scripts": {
    "build": "apt-get update && apt-get install -y ffmpeg"
  }
}
```

#### Fly.io

Create a `Dockerfile` (already provided) or use the existing one.

#### Vercel

⚠️ **Not recommended** - Vercel has limitations with FFmpeg and long-running processes.

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Server Configuration
PORT=8080
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DOWNLOAD_LIMIT_MAX_REQUESTS=10
```

## 🚀 Step-by-Step Deployment Guides

### Railway.app Deployment

1. **Prepare your repository:**

   ```bash
   # Ensure your backend folder is ready
   cd backend
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Deploy to Railway:**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Link to your project
   railway link

   # Deploy
   railway up
   ```

3. **Configure environment variables:**

   - Go to Railway dashboard
   - Navigate to your project
   - Go to Variables tab
   - Add your environment variables

4. **Get your URL:**
   ```bash
   railway domain
   ```

### Render.com Deployment

1. **Connect your repository:**

   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**

   - **Name:** youtube-mp3-api
   - **Environment:** Node
   - **Build Command:** `npm ci --only=production`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend` (if your backend is in a subfolder)

3. **Set environment variables:**

   - Go to Environment tab
   - Add your environment variables

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Fly.io Deployment

1. **Install Fly CLI:**

   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and create app:**

   ```bash
   fly auth login
   fly apps create youtube-mp3-api
   ```

3. **Deploy:**

   ```bash
   fly deploy
   ```

4. **Open your app:**
   ```bash
   fly open
   ```

### Nginx Reverse Proxy (Optional)

1. **Install Nginx:**

   ```bash
   sudo apt-get install nginx
   ```

2. **Configure Nginx:**

   ```bash
   # Copy the nginx.conf to your site configuration
   sudo cp nginx.conf /etc/nginx/sites-available/youtube-api
   sudo ln -s /etc/nginx/sites-available/youtube-api /etc/nginx/sites-enabled/

   # Update the domain name in the config
   sudo nano /etc/nginx/sites-available/youtube-api

   # Test and reload
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **SSL Certificate (Let's Encrypt):**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## 📊 Monitoring

### PM2 Monitoring

```bash
# View application status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs youtube-mp3-api

# Restart application
pm2 restart youtube-mp3-api
```

### Health Check

```bash
# Test health endpoint
curl http://localhost:8080/api/health
```

## 📊 Free Hosting Platform Comparison

| Platform        | Free Tier          | FFmpeg Support | Auto Deploy | Custom Domain | SSL    | Best For              |
| --------------- | ------------------ | -------------- | ----------- | ------------- | ------ | --------------------- |
| **Railway.app** | $5/month credit    | ✅ Yes         | ✅ Yes      | ✅ Yes        | ✅ Yes | **Recommended**       |
| **Render.com**  | 750 hours/month    | ✅ Yes         | ✅ Yes      | ✅ Yes        | ✅ Yes | **Good Alternative**  |
| **Fly.io**      | 3 VMs, 3GB storage | ✅ Yes         | ✅ Yes      | ✅ Yes        | ✅ Yes | **Global Deployment** |
| **Vercel**      | 100GB bandwidth    | ❌ Limited     | ✅ Yes      | ✅ Yes        | ✅ Yes | **Frontend Only**     |
| **Heroku**      | ❌ Discontinued    | ✅ Yes         | ✅ Yes      | ✅ Yes        | ✅ Yes | **Not Available**     |

## 🔒 Security Considerations

1. **Firewall Configuration:**

   ```bash
   # Allow only necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **Rate Limiting:** Already configured in the application and nginx

3. **CORS:** Configure `ALLOWED_ORIGINS` in your `.env` file

4. **File Cleanup:** Automatic cleanup is enabled (files deleted after 1 hour)

## 📁 Directory Structure

```
backend/
├── server.js              # Main application file
├── package.json           # Dependencies and scripts
├── ecosystem.config.js    # PM2 configuration
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── nginx.conf            # Nginx reverse proxy configuration
├── deploy.sh             # Deployment script
├── env.example           # Environment variables template
├── routes/               # API routes
├── services/             # Business logic
├── downloads/            # Generated MP3 files (auto-cleanup)
├── temp/                 # Temporary files (auto-cleanup)
└── logs/                 # Application logs
```

## 🚨 Troubleshooting

### Free Hosting Platform Issues

#### Railway.app Issues

1. **Build fails with FFmpeg error:**

   ```bash
   # Add this to package.json
   {
     "scripts": {
       "postinstall": "apt-get update && apt-get install -y ffmpeg"
     }
   }
   ```

2. **Environment variables not working:**
   - Check Railway dashboard → Variables tab
   - Ensure variables are set correctly
   - Redeploy after changing variables

#### Render.com Issues

1. **Service goes to sleep:**

   - This is normal for free tier
   - First request after sleep takes longer
   - Consider upgrading to paid plan for always-on

2. **Build timeout:**
   - Increase build timeout in dashboard
   - Optimize build process

#### Fly.io Issues

1. **Deployment fails:**

   ```bash
   # Check logs
   fly logs

   # Restart app
   fly apps restart youtube-mp3-api
   ```

2. **Region issues:**
   ```bash
   # Deploy to specific region
   fly deploy --region iad
   ```

### Common Issues

1. **FFmpeg not found:**

   ```bash
   # Install FFmpeg
   sudo apt-get install ffmpeg
   ```

2. **Port already in use:**

   ```bash
   # Check what's using the port
   sudo lsof -i :8080

   # Kill the process or change port in .env
   ```

3. **Permission denied:**

   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER /path/to/backend
   chmod +x deploy.sh
   ```

4. **Memory issues:**

   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```

5. **CORS errors:**

   - Update `ALLOWED_ORIGINS` in environment variables
   - Include your frontend domain
   - For development: `http://localhost:3000`

6. **Rate limiting:**
   - Free tiers have rate limits
   - Check platform-specific limits
   - Implement client-side retry logic

### Logs Location

- **PM2 logs:** `pm2 logs youtube-mp3-api`
- **Application logs:** `./logs/` directory
- **Nginx logs:** `/var/log/nginx/`

## 🔄 Updates

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm ci --only=production

# Restart application
pm2 restart youtube-mp3-api
```

### Update Dependencies

```bash
# Update dependencies
npm update

# Test the application
npm test

# Restart if needed
pm2 restart youtube-mp3-api
```

## 📞 Support

For issues and questions:

1. Check the logs: `pm2 logs youtube-mp3-api`
2. Test the health endpoint: `curl http://localhost:8080/api/health`
3. Verify FFmpeg installation: `ffmpeg -version`
4. Check Node.js version: `node --version`

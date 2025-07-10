# FairwayLive Deployment Guide

## Overview
FairwayLive uses a split deployment architecture:
- **Frontend**: Deployed to Vercel (static files + CDN)
- **Backend**: Deployed to Render (Node.js API + WebSocket)
- **Database**: PostgreSQL on Render
- **Cache**: Redis on Render

## Prerequisites

1. Install CLIs:
```bash
npm install -g vercel
npm install -g @render-oss/cli
```

2. Create accounts:
- [Vercel](https://vercel.com)
- [Render](https://render.com)

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Set up environment variables in Render dashboard:
- `OPENAI_API_KEY`: Your OpenAI API key
- `JWT_SECRET`: Will be auto-generated
- `DATABASE_URL`: Auto-connected from Render PostgreSQL
- `REDIS_URL`: Auto-connected from Render Redis

## Deployment Steps

### 1. Deploy Backend to Render

```bash
# First time setup
render create

# Deploy
git push render main
```

Or use the Render dashboard:
1. Connect GitHub repository
2. Create new Web Service
3. Use `render.yaml` for configuration
4. Deploy

### 2. Deploy Frontend to Vercel

```bash
# First time setup
vercel

# Production deployment
vercel --prod
```

Configuration:
- Framework Preset: Other
- Build Command: (leave empty)
- Output Directory: `public`
- Install Command: `npm install`

### 3. Update Frontend API Endpoint

After backend deployment, update `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://YOUR-RENDER-URL.onrender.com/api/$1"
    }
  ]
}
```

## Post-Deployment

1. Test the live app:
   - Frontend: `https://fairwaylive.vercel.app`
   - Backend health: `https://your-api.onrender.com/api/health`

2. Set up custom domain (optional):
   - Add domain in Vercel dashboard
   - Configure DNS records

3. Monitor performance:
   - Vercel Analytics for frontend
   - Render metrics for backend

## Continuous Deployment

Both platforms support automatic deployments:

1. **Render**: Automatically deploys on push to main branch
2. **Vercel**: Automatically deploys on push, with preview URLs for PRs

## Troubleshooting

### Frontend not connecting to backend
- Check CORS settings in `src/server/index.js`
- Verify API endpoint in `vercel.json`
- Check browser console for errors

### WebSocket connection issues
- Render supports WebSockets on all plans
- Update WebSocket URL in frontend to use `wss://` protocol

### Database connection errors
- Check DATABASE_URL in Render environment
- Verify PostgreSQL is running
- Check connection pool settings

## Scaling

When ready to scale:

1. **Render**:
   - Upgrade to paid plan for better performance
   - Add more instances for horizontal scaling
   - Enable auto-scaling

2. **Vercel**:
   - Already includes CDN and edge functions
   - Upgrade for increased bandwidth/builds

## Monitoring

Set up monitoring for production:
```bash
# Add to package.json
"scripts": {
  "monitor": "pm2 monit",
  "logs": "render logs --tail"
}
```
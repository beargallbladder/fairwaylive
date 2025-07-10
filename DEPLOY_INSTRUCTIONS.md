# 🚀 FairwayLive Deployment Instructions

Follow these steps to deploy FairwayLive to GitHub, Render, and Vercel.

## Step 1: Authenticate GitHub CLI

```bash
gh auth login
```

Choose:
- GitHub.com
- HTTPS
- Login with web browser

## Step 2: Create GitHub Repository and Push Code

```bash
# Create repo and push in one command
gh repo create fairwaylive --public --source=. --remote=origin --push
```

If that doesn't work, do it manually:

```bash
# Create on GitHub web
# Then add remote
git remote add origin https://github.com/YOUR_USERNAME/fairwaylive.git
git push -u origin main
```

## Step 3: Deploy Backend to Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select the **fairwaylive** repository
5. Render will auto-detect the `render.yaml` file
6. Review the configuration:
   - Name: `fairwaylive-api`
   - Region: Oregon (US West)
   - Branch: main
7. Click **"Create Web Service"**

The backend will deploy automatically. Note your Render URL (e.g., `https://fairwaylive-api.onrender.com`)

## Step 4: Deploy Frontend to Vercel

```bash
# Make sure you're in the fairwaylive directory
cd /Users/samsonkim/developmentsamkim/fairwaylive

# Deploy to Vercel
vercel
```

When prompted:
1. **Set up and deploy?** → Y
2. **Which scope?** → Select your account
3. **Link to existing project?** → N
4. **What's your project's name?** → fairwaylive
5. **In which directory is your code located?** → ./
6. **Want to override the settings?** → Y
   - **Build Command:** (leave empty, press Enter)
   - **Output Directory:** public
   - **Install Command:** npm install

## Step 5: Update Frontend to Use Your Backend

After Render deployment completes:

1. Edit `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://fairwaylive-api.onrender.com/api/$1"
    }
  ]
}
```

2. Redeploy to Vercel:
```bash
vercel --prod
```

## Step 6: Set Environment Variables in Render

In Render dashboard:
1. Go to your service → **Environment**
2. Add:
   - `OPENAI_API_KEY`: Your OpenAI API key (if you have one)
   - `NODE_ENV`: production

## 🎉 Your Apps Are Live!

- **Frontend**: https://fairwaylive.vercel.app
- **Backend**: https://fairwaylive-api.onrender.com
- **GitHub**: https://github.com/YOUR_USERNAME/fairwaylive

## Testing

1. Open the frontend URL
2. Click "START ROUND" to test the app
3. Hold the microphone button and say something
4. Watch the odds change based on your sentiment!

## Troubleshooting

### Frontend can't connect to backend
- Check that the backend URL in `vercel.json` is correct
- Ensure the backend is deployed and running on Render

### WebSocket errors
- Render free tier may sleep after 15 minutes of inactivity
- First request will wake it up (may take 30 seconds)

### Voice recording not working
- Ensure you're using HTTPS (Vercel provides this)
- Allow microphone permissions when prompted
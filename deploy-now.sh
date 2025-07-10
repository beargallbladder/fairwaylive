#!/bin/bash

# FairwayLive Quick Deploy Script
echo "🚀 FairwayLive Deployment Script"
echo "================================"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "📦 Installing GitHub CLI..."
    brew install gh
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Create GitHub repo
echo "🐙 Creating GitHub repository..."
gh repo create fairwaylive --public --source=. --remote=origin --push

# Wait for push to complete
sleep 3

echo "✅ GitHub repository created and code pushed!"
echo ""

# Deploy to Vercel
echo "🌐 Deploying frontend to Vercel..."
echo "When prompted:"
echo "1. Set up and deploy: Y"
echo "2. Which scope: Select your account"
echo "3. Link to existing project: N"
echo "4. Project name: fairwaylive"
echo "5. Directory: ./"
echo "6. Override settings: Y"
echo "7. Output directory: public"
echo ""

vercel --prod

echo ""
echo "✅ Frontend deployed to Vercel!"
echo ""

# Instructions for Render
echo "📝 Next Steps for Render Backend:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub account"
echo "4. Select 'fairwaylive' repository"
echo "5. Render will auto-detect render.yaml"
echo "6. Click 'Create Web Service'"
echo ""
echo "7. After deploy, update vercel.json with your Render URL:"
echo "   - Edit line: \"dest\": \"https://YOUR-APP.onrender.com/api/\$1\""
echo "   - Run: vercel --prod"
echo ""

# Show URLs
echo "🎉 Deployment URLs:"
echo "GitHub: https://github.com/$(gh api user -q .login)/fairwaylive"
echo "Frontend: Check Vercel output above"
echo "Backend: Will be at https://fairwaylive.onrender.com (after Render deploy)"

# Make executable
chmod +x deploy-now.sh
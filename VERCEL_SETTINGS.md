# Vercel Settings to Fix Deployment

## 1. In Vercel Dashboard (vercel.com/dashboard)

Go to your project settings and configure:

### Build & Development Settings
- **Framework Preset**: `Other`
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` OR leave empty
- **Output Directory**: `public`
- **Install Command**: `npm install` OR leave empty
- **Development Command**: Leave empty

### Node.js Version
- **Node.js Version**: `20.x` (recommended)

### Environment Variables
Add these if needed:
- `NODE_ENV`: `production`

## 2. Alternative: Deploy Static Files Only

Since FairwayLive frontend is purely static files (HTML/CSS/JS), we can simplify:

### Option A: Manual Upload
1. Go to https://vercel.com/new
2. Click "Upload Folder"
3. Select the `public` folder from your local machine
4. Deploy!

### Option B: CLI with Static Config
```bash
cd /Users/samsonkim/developmentsamkim/fairwaylive

# Create a minimal vercel.json
cat > vercel.json << 'EOF'
{
  "buildCommand": false,
  "outputDirectory": "public",
  "framework": null
}
EOF

# Deploy
vercel --prod
```

## 3. Fix for Current Deployment

The issue is likely:
1. Vercel is trying to install npm packages (which include backend dependencies)
2. The build script was looking for mobile app build

To fix in dashboard:
1. Go to Project Settings → General
2. Override Build Command to: `echo "No build needed"`
3. Override Install Command to: `echo "No install needed"`
4. Set Output Directory to: `public`

## 4. Quick Fix via CLI

```bash
# Remove the project link
rm -rf .vercel

# Create new deployment with correct settings
vercel --build-env SKIP_BUILD=1 --prod

# When prompted:
- Setup and deploy? Y
- Scope: (your account)
- Link to existing? N
- Project name: fairwaylive-frontend
- Directory: ./
- Override settings? Y
  - Build: (leave empty, just press Enter)
  - Output: public
  - Install: (leave empty, just press Enter)
```

## 5. If Using GitHub Integration

In Vercel Dashboard:
1. Import from Git
2. Select your repository
3. Configure:
   - Root Directory: `./`
   - Framework Preset: `Other`
   - Build Command: Override → Leave empty
   - Output Directory: Override → `public`
   - Install Command: Override → Leave empty

This will deploy only the static frontend files without trying to build the backend.
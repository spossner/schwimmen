# Deployment Guide

## Quick Deploy to Render (FREE)

### Step 1: Push to GitHub

```bash
# Initialize git (already done)
git add .
git commit -m "Initial commit - Schwimmen card game"

# Create GitHub repo (do this on github.com):
# 1. Go to https://github.com/new
# 2. Name it "schwimmen" (or whatever you prefer)
# 3. Don't initialize with README (we already have one)
# 4. Click "Create repository"

# Connect and push (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/schwimmen.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. **Sign up/Login to Render**: https://render.com (free account)

2. **Connect GitHub**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub account
   - Select your `schwimmen` repository
   - Render will auto-detect `render.yaml`

3. **Deploy**:
   - Click "Apply"
   - Render will create TWO services:
     - `schwimmen-server` (backend WebSocket server)
     - `schwimmen-web` (frontend)

4. **Get Your URLs**:
   - Backend: `https://schwimmen-server.onrender.com` (and `wss://schwimmen-server.onrender.com` for WebSocket)
   - Frontend: `https://schwimmen-web.onrender.com`

5. **Configure WebSocket URL**:
   - In Render dashboard, go to `schwimmen-web` service
   - Click "Environment"
   - Add environment variable:
     - Key: `VITE_WS_URL`
     - Value: `wss://schwimmen-server.onrender.com` (use YOUR actual backend URL)
   - Click "Save Changes"
   - Service will auto-redeploy

### Step 3: Auto-Deploy on Every Commit

Already configured! Every time you push to `main` branch, Render will automatically rebuild and deploy.

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push

# Render will automatically deploy! 🚀
```

## Alternative: Simplified Single-Server Deploy

If you want everything on one server (simpler but less scalable):

1. Use Railway.app or fly.io
2. They can run both frontend and backend together
3. Just need one deployment

## Free Tier Limits

**Render Free Tier**:
- Services spin down after 15 minutes of inactivity
- First request may take 30-60 seconds to wake up
- Good for: Demo, testing, low-traffic apps

**For Production**:
- Upgrade to paid plan ($7/month per service)
- Keeps services running 24/7
- Better performance

## Troubleshooting

**WebSocket Connection Issues:**
- Make sure `VITE_WS_URL` uses `wss://` (not `ws://`)
- Check backend URL is correct in environment variables
- Render services need a few minutes on first deploy

**Build Errors:**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- pnpm is supported by default

**Local Testing:**
```bash
pnpm dev:all  # Both servers
# Or separately:
pnpm dev         # Frontend on :3000
pnpm dev:server  # Backend on :3002
```

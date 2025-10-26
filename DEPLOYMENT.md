# GitHub Pages Deployment Guide

## 🚀 Quick Deploy to GitHub Pages

Follow these steps to deploy **HEATMAP // AMSTERDAM** to GitHub Pages:

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it whatever you like (e.g., `amsterdam-heatmap`)
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

### Step 2: Push to GitHub

Copy the commands from GitHub's setup page, or use these:

```bash
cd /mnt/f/made/living-lab/dashboard/ui

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (GitHub's default)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes for deployment

### Step 4: Access Your Site

Your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## 📝 Important Notes

### Works on GitHub Pages ✅

The app automatically detects deployment environment:
- **Local**: Uses Node.js API server (`/api/buildings`)
- **GitHub Pages**: Loads CSV directly in browser

No code changes needed - it works both ways!

### File Size Considerations

The CSV file (`enriched_with_busy_roads.csv`) is ~500KB. GitHub Pages has a 1GB site limit, so this is fine.

### Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file with your domain
2. Configure DNS settings
3. Enable HTTPS in GitHub Pages settings

## 🔧 Local Development

To run locally with the Node.js server:

```bash
npm install
npm start
```

Open `http://localhost:3000`

## 📊 What's Deployed

The following files are included:
- `index.html` - Main page
- `app.js` - Application logic
- `data-loader.js` - Client-side CSV parser
- `styles.css` - Pixel art styling
- `enriched_with_busy_roads.csv` - Building data
- `README.md` - Documentation

**NOT included** (via `.gitignore`):
- `node_modules/` - NPM packages
- `server.js` - Node.js server (not needed for GitHub Pages)

## 🎨 Features

All features work on GitHub Pages:
- ✅ Interactive map with building polygons
- ✅ Custom weighted heatmap configuration
- ✅ Building details panel
- ✅ Pixel art loading screen
- ✅ Hover and click interactions
- ✅ Yellow-to-red gradient visualization

Enjoy your deployed heatmap! 🔥


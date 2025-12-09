# HEATMAP // AMSTERDAM

Interactive building visualization with custom weighted heatmaps.

## 🔥 Live Demo

**https://ams-heat-demo.vercel.app**

## Features

- **Custom Heatmaps** - Weight energy labels, building age, and busy road location
- **Regional View** - See mean scores by Amsterdam neighborhood
- **Interactive Map** - Click buildings for detailed information
- **Pixel Art UI** - Retro terminal-inspired design

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Project Structure

```
├── index.html              # Main page
├── app.js                  # Application logic
├── styles.css              # Styling
├── neighborhoods.js        # Neighborhood boundaries loader
├── api/
│   └── buildings.js        # Vercel serverless function
├── vercel.json             # Vercel configuration
└── package.json            # Dependencies
```

## How It Works

1. **Configure Weights** (must total ≤ 1.0)
   - Energy: Poor efficiency → higher priority
   - Age: Older buildings → higher priority  
   - Busy Road: On busy road → higher priority

2. **Apply Heatmap** - Buildings colored yellow → orange → red

3. **Regional Heatmap** (checkbox) - Show mean scores by neighborhood

## Data

- **371K** address records
- **52K** unique building polygons
- **44** Amsterdam neighborhoods
- Data stored in Vercel Blob Storage

## Tech Stack

- **Frontend**: Vanilla JavaScript, Leaflet.js
- **Backend**: Vercel Serverless Functions
- **Storage**: Vercel Blob
- **Map Tiles**: CARTO Light

---

Built for Living Lab Amsterdam

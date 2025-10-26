# HEATMAP // AMSTERDAM

Interactive building visualization with custom weighted heatmaps.

## Demo

Visit: **https://orlandocloss.github.io/ams-heat-demo/**

## Features

- Interactive map of Amsterdam buildings
- Custom heatmap based on energy labels, building age, and busy roads
- Pixel art retro interface
- Click buildings for detailed information

## Local development

```bash
npm install
npm start
```

Open `http://localhost:3000`

## How it works

Configure three weight factors (must total ≤ 1.0):
- **Energy** - Poor efficiency → higher priority
- **Age** - Older buildings → higher priority
- **Busy Road** - Located on busy road → higher priority

Buildings are colored from yellow (low priority) to red (high priority).

## Data

3,853 addresses across 1,169 unique buildings in Amsterdam.

---

Built for Living Lab Amsterdam Dashboard

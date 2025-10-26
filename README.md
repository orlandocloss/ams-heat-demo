# HEATMAP // AMSTERDAM

Interactive building heatmap visualization for Amsterdam. Visualize building energy efficiency and age with custom weighted heatmaps on a clean, pixel-art inspired interface.

## Features

- 🗺️ **Interactive Map** - Explore Amsterdam buildings with smooth interactions
- 🔥 **Custom Heatmaps** - Weight energy labels and building age to your preference
- 🏢 **Building Details** - Click any building to view all addresses and their data
- 🎨 **Pixel Art UI** - Retro-inspired monospace design with yellow-to-red gradient
- ⚡ **Fast & Responsive** - Built with Leaflet.js and vanilla JavaScript

## Quick Start

### Installation

```bash
npm install
```

### Running

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

## Project Structure

```
├── index.html          # Main HTML page
├── app.js             # Client-side application logic
├── styles.css         # Pixel-art inspired styling
├── server.js          # Express API server
├── enriched.csv       # Building data (BAG + energy labels)
├── package.json       # NPM dependencies
└── README.md          # This file
```

## How It Works

### Data Source

The application uses `enriched.csv` containing:
- **BAG data**: Dutch building registry (addresses, polygons)
- **Energy labels**: A+ to G ratings
- **Building years**: Construction dates (1700s - present)

### Heatmap Configuration

1. **Energy Label Weight** (0.0 - 1.0)
   - Prioritizes buildings with poor energy efficiency
   - Uses the worst label in each building

2. **Building Age Weight** (0.0 - 1.0)
   - Prioritizes older buildings
   - Uses the oldest year in each building

3. **Total Weight** ≤ 1.0
   - Combined weights must not exceed 1.0
   - Allows partial weighting (e.g., 0.3 + 0.3 = 0.6)

### Color Scheme

- 🟡 **Yellow**: Low priority (newer, efficient buildings)
- 🟠 **Orange**: Medium priority
- 🔴 **Red**: High priority (older, inefficient buildings)

## API Endpoints

### `GET /api/buildings`

Returns processed building data as JSON.

**Response Format:**
```json
[
  {
    "polygon": "MULTIPOLYGON(...)",
    "addresses": [
      {
        "address": "Street 123, 1234AB, Amsterdam",
        "energyLabel": "C",
        "buildingYear": "1900",
        "longitude": 4.8967,
        "latitude": 52.3716
      }
    ]
  }
]
```

## Technologies

- **Frontend**: Vanilla JavaScript, Leaflet.js, HTML5, CSS3
- **Backend**: Node.js, Express
- **Map Tiles**: CARTO Light (grayscale)
- **CSV Parsing**: csv-parse

## Statistics

- **3,853** addresses with polygon data
- **1,169** unique building polygons
- Buildings from **1700s** to modern constructions

## Design Philosophy

The interface uses a **pixel art aesthetic** inspired by retro computer terminals:
- Monospace font (Courier New)
- Black background with yellow/orange accents
- Sharp corners and grid-based layouts
- Uppercase text with letter spacing
- Yellow-to-red color progression

## Browser Support

Works in all modern browsers supporting ES6+ JavaScript.

## License

MIT

---

Built for Living Lab Amsterdam Dashboard

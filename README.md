# HEATMAP // AMSTERDAM

Open-source project mapping building heat readiness in Amsterdam.

## 🔥 Live Site

**https://ams-heat-demo.vercel.app**

## About

An open-data initiative by **AMS Institute**, **Gemeente Amsterdam**, and **MADE Living Lab** (Wageningen University & Research) to identify physical characteristics that increase heat vulnerability in Amsterdam buildings.

### Mission

Create a comprehensive, open-access database of building-level heat risk factors including:
- Energy efficiency ratings
- Building age and construction type
- Environmental factors (busy roads, etc.)
- Neighborhood-level aggregations

### Current Status

**Ongoing project** - actively collecting and integrating data:
- ✅ 52K buildings with polygons (predominantly city center)
- ✅ Energy labels, building years, busy road data
- ⚠️ Outskirts and some physical characteristics still being mapped
- 🎯 Goal: Complete Amsterdam coverage with comprehensive metrics

## Features

- **Binary Filter System** - Target specific criteria (e.g., "Energy ≤ D", "Year ≤ 1900")
- **Custom Weighted Heatmaps** - Combine multiple factors
- **Regional Analysis** - Mean scores by neighborhood
- **Address Search** - Find specific buildings instantly
- **Interactive Details** - Click buildings for full information

## Contributing

This is an **open project**:

- 📊 **Data**: Email [orlando.closs@wur.nl](mailto:orlando.closs@wur.nl) to contribute datasets
- 💻 **Code**: Contribute on [GitHub](https://github.com/orlandocloss/ams-heat-demo)
- 📄 **Research**: Research paper coming soon

## Local Development

```bash
npm install
npm run dev
```

## Tech Stack

- Vanilla JavaScript, Leaflet.js
- Vercel Serverless Functions
- Canvas rendering (50K+ polygons)
- Amsterdam Open Data integration

---

**MADE Living Lab** | Wageningen University & Research  
Contact: orlando.closs@wur.nl

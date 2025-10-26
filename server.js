/**
 * HEATMAP // AMSTERDAM
 * Express server for building data API
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = 3000;
const CSV_FILE = 'enriched_with_busy_roads.csv';

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.static(__dirname));

// ============================================================================
// API ENDPOINTS
// ============================================================================

app.get('/api/buildings', (req, res) => {
    const csvPath = path.join(__dirname, CSV_FILE);
    
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading CSV:', err);
            return res.status(500).json({ error: 'Failed to read CSV file' });
        }
        
        try {
            const buildings = processBuildingData(data);
            res.json(buildings);
        } catch (parseErr) {
            console.error('Error parsing CSV:', parseErr);
            res.status(500).json({ error: 'Failed to parse CSV file' });
        }
    });
});

// ============================================================================
// DATA PROCESSING
// ============================================================================

function processBuildingData(csvData) {
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
    });
    
    console.log(`Parsed ${records.length} records from CSV`);
    
    const buildingsMap = new Map();
    let processedCount = 0;
    let skippedCount = 0;
    
    records.forEach(row => {
        if (!row.building_polygon_wkt || row.building_polygon_wkt.trim() === '') {
            skippedCount++;
            return;
        }
        
        const polygonKey = row.building_polygon_wkt;
        
        if (!buildingsMap.has(polygonKey)) {
            buildingsMap.set(polygonKey, {
                polygon: row.building_polygon_wkt,
                addresses: []
            });
        }
        
        buildingsMap.get(polygonKey).addresses.push({
            address: row.full_address,
            energyLabel: row.Energielabel,
            buildingYear: row.Energielabels_Bouwjaar,
            busyRoad: parseInt(row.busy_roads) === 1,
            longitude: parseFloat(row.longitude),
            latitude: parseFloat(row.latitude)
        });
        
        processedCount++;
    });
    
    const buildings = Array.from(buildingsMap.values());
    
    console.log(`Processed ${processedCount} addresses with polygons`);
    console.log(`Skipped ${skippedCount} addresses without polygons`);
    console.log(`Returning ${buildings.length} unique buildings`);
    
    return buildings;
}

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
    console.log(`\n🗺️  HEATMAP // AMSTERDAM`);
    console.log(`\n✓ Server running at http://localhost:${PORT}`);
    console.log(`\n→ Open http://localhost:${PORT} in your browser\n`);
});

/**
 * CLIENT-SIDE CSV LOADER
 * For GitHub Pages static deployment
 */

async function loadCSV(filename) {
    try {
        const response = await fetch(filename);
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error('Error loading CSV:', error);
        throw error;
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        const record = {};
        headers.forEach((header, index) => {
            record[header] = values[index] !== undefined ? values[index] : '';
        });
        records.push(record);
    }
    
    console.log(`Parsed ${records.length} records`);
    if (records.length > 0) {
        console.log('Sample record:', records[0]);
    }
    
    return records;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result.map(v => v.trim());
}

function processBuildingsData(records) {
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
        
        const busyRoadValue = row.busy_roads ? row.busy_roads.trim() : '0';
        
        buildingsMap.get(polygonKey).addresses.push({
            address: row.full_address,
            energyLabel: row.Energielabel,
            buildingYear: row.Energielabels_Bouwjaar,
            busyRoad: busyRoadValue === '1' || busyRoadValue === 1,
            neighborhood: row.neighborhood || 'Unknown',
            longitude: parseFloat(row.longitude),
            latitude: parseFloat(row.latitude)
        });
        
        processedCount++;
    });
    
    const buildings = Array.from(buildingsMap.values());
    
    console.log(`Processed ${processedCount} addresses with polygons`);
    console.log(`Skipped ${skippedCount} addresses without polygons`);
    console.log(`Found ${buildings.length} unique buildings`);
    
    return buildings;
}


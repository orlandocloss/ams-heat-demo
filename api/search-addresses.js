/**
 * Vercel Serverless Function - Address Search (with caching)
 * Returns matching addresses with building polygon reference
 */

const { parse } = require('csv-parse/sync');

// Cache parsed data in memory (persists between invocations)
let cachedRecords = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=3600'); // Cache responses for 1 hour
    
    try {
        const query = req.query.q;
        
        if (!query || query.length < 3) {
            return res.status(400).json({ error: 'Query too short (min 3 chars)' });
        }
        
        // Check if we need to refresh cache
        const now = Date.now();
        if (!cachedRecords || !cacheTimestamp || (now - cacheTimestamp > CACHE_TTL)) {
            console.log('Loading and caching CSV data...');
            const blobUrl = process.env.BLOB_CSV_URL;
            if (!blobUrl) {
                throw new Error('BLOB_CSV_URL not set');
            }
            
            const response = await fetch(blobUrl);
            const data = await response.text();
            
            cachedRecords = parse(data, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true
            });
            cacheTimestamp = now;
            console.log(`Cached ${cachedRecords.length} records`);
        }
        
        // Search cached records
        console.log(`Searching for: ${query}`);
        const queryLower = query.toLowerCase();
        const matches = [];
        
        for (const row of cachedRecords) {
            if (row.full_address && 
                row.full_address.toLowerCase().includes(queryLower) &&
                row.building_polygon_wkt) {
                
                matches.push({
                    address: row.full_address,
                    polygon: row.building_polygon_wkt,
                    neighborhood: row.neighborhood || 'Unknown',
                    latitude: parseFloat(row.latitude),
                    longitude: parseFloat(row.longitude)
                });
                
                // Limit to 15 results
                if (matches.length >= 15) break;
            }
        }
        
        console.log(`Found ${matches.length} matches`);
        res.status(200).json(matches);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
};


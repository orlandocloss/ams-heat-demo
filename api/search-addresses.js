/**
 * Vercel Serverless Function - Address Search
 * Returns matching addresses with building polygon reference
 */

const { parse } = require('csv-parse/sync');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    try {
        const query = req.query.q;
        
        if (!query || query.length < 3) {
            return res.status(400).json({ error: 'Query too short (min 3 chars)' });
        }
        
        const blobUrl = process.env.BLOB_CSV_URL;
        if (!blobUrl) {
            throw new Error('BLOB_CSV_URL not set');
        }
        
        console.log(`Searching for: ${query}`);
        const response = await fetch(blobUrl);
        const data = await response.text();
        
        const records = parse(data, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true
        });
        
        // Search for matching addresses
        const queryLower = query.toLowerCase();
        const matches = [];
        
        records.forEach(row => {
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
                
                // Limit to 20 results for performance
                if (matches.length >= 20) {
                    return false;
                }
            }
        });
        
        console.log(`Found ${matches.length} matches`);
        res.status(200).json(matches);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
};


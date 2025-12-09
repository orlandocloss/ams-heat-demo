/**
 * Vercel Serverless Function - Building Details
 * Returns full address list for a specific building
 */

const { parse } = require('csv-parse/sync');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    try {
        const { polygon } = req.query;
        
        if (!polygon) {
            return res.status(400).json({ error: 'Polygon parameter required' });
        }
        
        const blobUrl = process.env.BLOB_CSV_URL;
        if (!blobUrl) {
            throw new Error('BLOB_CSV_URL not set');
        }
        
        console.log('Fetching building details...');
        const response = await fetch(blobUrl);
        const data = await response.text();
        
        const records = parse(data, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true
        });
        
        // Find all addresses for this building
        const addresses = [];
        
        records.forEach(row => {
            if (row.building_polygon_wkt === polygon) {
                addresses.push({
                    address: row.full_address,
                    energyLabel: row.Energielabel,
                    buildingYear: row.Energielabels_Bouwjaar,
                    busyRoad: parseInt(row.busy_roads) === 1,
                    neighborhood: row.neighborhood || 'Unknown'
                });
            }
        });
        
        console.log(`Found ${addresses.length} addresses for building`);
        res.status(200).json(addresses);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch building details' });
    }
};


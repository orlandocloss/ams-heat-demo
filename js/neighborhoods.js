/**
 * Amsterdam Neighborhoods Data
 * Fetches neighborhood boundaries from Amsterdam Open Data
 */

const NEIGHBORHOODS_GEOJSON_URL = 'https://maps.amsterdam.nl/open_geodata/geojson_lnglat.php?KAARTLAAG=GEBIED_BUURTEN&THEMA=gebiedsindeling';

// Fallback: Load from local cache if API fails
let neighborhoodsGeoJSON = null;

async function loadNeighborhoodsGeoJSON() {
    try {
        const response = await fetch(NEIGHBORHOODS_GEOJSON_URL);
        neighborhoodsGeoJSON = await response.json();
        console.log('Loaded Amsterdam neighborhoods GeoJSON');
        return neighborhoodsGeoJSON;
    } catch (error) {
        console.error('Error loading neighborhoods:', error);
        return null;
    }
}


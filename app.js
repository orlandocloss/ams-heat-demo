/**
 * HEATMAP // AMSTERDAM
 * Interactive building heatmap visualization
 * 
 * Features:
 * - Custom weighted heatmaps (energy, age, busy roads)
 * - Regional neighborhood analysis
 * - Interactive building details
 * - Pixel art retro UI
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    BOUNDS: {
        southwest: [52.2784, 4.7283],
        northeast: [52.4311, 5.0641]
    },
    CENTER: [52.3676, 4.9041],
    DEFAULT_ZOOM: 13,
    MIN_ZOOM: 13,
    MAX_ZOOM: 20,
    MIN_LOAD_TIME: 3000
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
    map: null,
    buildingsData: [],
    buildingLayers: [],
    buildingLayerGroup: null,
    selectedBuilding: null,
    currentHighlightedLayer: null,
    heatmapEnabled: false,
    regionalHeatmapEnabled: false,
    regionalHeatmapLayer: null,
    energyWeight: 0.5,
    yearWeight: 0.5,
    busyRoadWeight: 0.0,
    normalization: {
        minYear: null,
        maxYear: null,
        minEnergy: null,
        maxEnergy: null
    }
};


// ============================================================================
// MAP INITIALIZATION
// ============================================================================

function initMap() {
    state.map = L.map('map', {
        maxBounds: [CONFIG.BOUNDS.southwest, CONFIG.BOUNDS.northeast],
        maxBoundsViscosity: 1.0,
        minZoom: CONFIG.MIN_ZOOM,
        maxZoom: CONFIG.MAX_ZOOM,
        preferCanvas: true,
        renderer: L.canvas({ tolerance: 5 })
    }).setView(CONFIG.CENTER, CONFIG.DEFAULT_ZOOM);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(state.map);
    
    // Create layer group for buildings
    state.buildingLayerGroup = L.layerGroup().addTo(state.map);
    
    setupPanel();
    loadBuildings();
}

// ============================================================================
// PANEL MANAGEMENT
// ============================================================================

/**
 * Setup panel controls and event listeners
 */
function setupPanel() {
    const elements = {
        energySlider: document.getElementById('energy-weight'),
        yearSlider: document.getElementById('year-weight'),
        busyRoadSlider: document.getElementById('busy-road-weight'),
        energyValue: document.getElementById('energy-weight-value'),
        yearValue: document.getElementById('year-weight-value'),
        busyRoadValue: document.getElementById('busy-road-weight-value'),
        totalWeight: document.getElementById('total-weight'),
        warning: document.getElementById('weight-warning'),
        applyBtn: document.getElementById('apply-heatmap'),
        backBtn: document.getElementById('back-to-heatmap')
    };
    
    const updateWeights = () => {
        state.energyWeight = parseFloat(elements.energySlider.value);
        state.yearWeight = parseFloat(elements.yearSlider.value);
        state.busyRoadWeight = parseFloat(elements.busyRoadSlider.value);
        
        elements.energyValue.textContent = state.energyWeight.toFixed(2);
        elements.yearValue.textContent = state.yearWeight.toFixed(2);
        elements.busyRoadValue.textContent = state.busyRoadWeight.toFixed(2);
        
        const total = state.energyWeight + state.yearWeight + state.busyRoadWeight;
        elements.totalWeight.textContent = total.toFixed(2);
        
        elements.warning.classList.toggle('hidden', total <= 1.0);
        elements.applyBtn.disabled = total > 1.0;
    };
    
    elements.energySlider.addEventListener('input', updateWeights);
    elements.yearSlider.addEventListener('input', updateWeights);
    elements.busyRoadSlider.addEventListener('input', updateWeights);
    elements.applyBtn.addEventListener('click', applyHeatmap);
    elements.backBtn.addEventListener('click', showHeatmapView);
    
    // Regional heatmap checkbox
    document.getElementById('show-regional-heatmap').addEventListener('change', toggleRegionalHeatmap);
}

function showHeatmapView() {
    document.getElementById('heatmap-view').classList.remove('hidden');
    document.getElementById('building-view').classList.add('hidden');
    document.getElementById('panel-title').textContent = 'Configuration';
    document.getElementById('back-to-heatmap').classList.add('hidden');
}

function showBuildingView() {
    document.getElementById('heatmap-view').classList.add('hidden');
    document.getElementById('building-view').classList.remove('hidden');
    document.getElementById('panel-title').textContent = 'Details';
    document.getElementById('back-to-heatmap').classList.remove('hidden');
}

// ============================================================================
// LOADING SCREEN
// ============================================================================

const PIXEL_PATTERNS = {
    'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    "'": [[1],[1],[0],[0],[0]],
    'S': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    'G': [[1,1,1],[1,0,0],[1,0,1],[1,0,1],[1,1,1]],
    'E': [[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,1,1]],
    'H': [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    'O': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    'N': [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
    'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
    ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
};

function createPixelText() {
    const gridContainer = document.querySelector('.grid-text');
    const lines = ["IT'S GETTING", "HOT IN HERE"];
    const grid = [];
    let maxCols = 0;
    
    lines.forEach((line, lineIndex) => {
        const startRow = lineIndex * 6;
        let currentCol = 0;
        
        for (const char of line) {
            const pattern = PIXEL_PATTERNS[char] || PIXEL_PATTERNS[' '];
            const letterWidth = pattern[0].length;
            
            for (let row = 0; row < 5; row++) {
                if (!grid[startRow + row]) grid[startRow + row] = [];
                for (let col = 0; col < letterWidth; col++) {
                    grid[startRow + row][currentCol + col] = pattern[row][col];
                }
            }
            currentCol += letterWidth + 1;
        }
        maxCols = Math.max(maxCols, currentCol);
    });
    
    const pixels = [];
    for (let row = 0; row < lines.length * 6; row++) {
        for (let col = 0; col < maxCols; col++) {
            const pixel = document.createElement('div');
            pixel.className = 'grid-pixel' + (grid[row]?.[col] === 1 ? ' active' : '');
            pixels.push(pixel);
        }
    }
    
    gridContainer.style.gridTemplateColumns = `repeat(${maxCols}, 12px)`;
    gridContainer.style.gridTemplateRows = `repeat(${lines.length * 6}, 12px)`;
    pixels.forEach(p => gridContainer.appendChild(p));
}

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load minimal building data from Vercel API
 * Only loads essential data for rendering and heatmap calculation
 */
async function loadBuildings() {
    const startTime = Date.now();
    createPixelText();
    
    try {
        console.log('Loading minimal building data...');
        const response = await fetch('/api/buildings-minimal');
        state.buildingsData = await response.json();
        
        console.log(`Loaded ${state.buildingsData.length} buildings (minimal data)`);
        addBuildingsToMap();
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, CONFIG.MIN_LOAD_TIME - elapsed);
        
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, remaining);
    } catch (error) {
        console.error('Error loading buildings:', error);
        setTimeout(() => {
            document.getElementById('loading').innerHTML = 
                '<div style="color: #CD5C5C; text-align: center;"><h2>Error</h2><p>Please refresh</p></div>';
        }, CONFIG.MIN_LOAD_TIME);
    }
}

// ============================================================================
// BUILDING RENDERING
// ============================================================================

/**
 * Add buildings to map
 * Uses minimal pre-aggregated data - full details loaded on-demand when clicked
 */
function addBuildingsToMap() {
    console.log(`Rendering ${state.buildingsData.length} buildings...`);
    
    let successCount = 0;
    
    state.buildingsData.forEach((building) => {
        try {
            const geoJSON = wktToGeoJSON(building.polygon);
            if (!geoJSON) return;
            
            const polygon = L.geoJSON(geoJSON, {
                style: getDefaultBuildingStyle(),
                onEachFeature: (feature, layer) => {
                    setupBuildingInteractions(layer, building);
                }
            });
            
            polygon.addTo(state.buildingLayerGroup);
            state.buildingLayers.push({ building, layer: polygon });
            successCount++;
        } catch (error) {
            console.error('Error adding building:', error);
        }
    });
    
    console.log(`✓ Rendered ${successCount} buildings`);
}

function getDefaultBuildingStyle() {
    return {
        fillColor: '#ff0000',
        fillOpacity: 0.6,
        color: '#cc0000',
        weight: 2
    };
}

/**
 * Setup building interactions (hover, click)
 */
function setupBuildingInteractions(layer, building) {
    layer.bindTooltip(`${building.addressCount} address(es) - Click for details`, {
        sticky: true
    });
    
    layer.on('mouseover', () => handleBuildingHover(layer, true));
    layer.on('mouseout', () => handleBuildingHover(layer, false));
    layer.on('click', (e) => selectBuilding(building, layer, e.latlng));
    
    layer.buildingData = building;
}

/**
 * Handle building hover effects
 */

function handleBuildingHover(layer, isHovering) {
    if (state.currentHighlightedLayer === layer) return;
    
    if (isHovering) {
        layer.setStyle({
            fillColor: '#ffff00',
            fillOpacity: 0.9,
            color: '#ff6600',
            weight: 4
        });
        layer.bringToFront();
    } else {
        const baseStyle = state.heatmapEnabled ? 
            getHeatmapStyle(layer.buildingData) : 
            getDefaultBuildingStyle();
        layer.setStyle(baseStyle);
    }
}

// ============================================================================
// BUILDING METRICS
// ============================================================================

/**
 * Get energy label from rank score
 */
function getEnergyLabelFromRank(rank) {
    const labels = {
        8: 'A++++', 7: 'A+++', 6: 'A++', 5: 'A+', 4: 'A',
        3: 'B', 2: 'C', 1: 'D', 0: 'E', '-1': 'F', '-2': 'G'
    };
    return labels[rank] || 'Unknown';
}

// ============================================================================
// HEATMAP APPLICATION
// ============================================================================

/**
 * Apply weighted heatmap colors to all buildings
 */
function applyHeatmap() {
    state.heatmapEnabled = true;
    
    calculateNormalization();
    
    state.buildingLayers.forEach(({ building, layer }) => {
        layer.setStyle(getHeatmapStyle(building));
    });
    
    console.log(`Heatmap applied: Energy=${state.energyWeight}, Year=${state.yearWeight}, BusyRoad=${state.busyRoadWeight}`);
    
    // Recalculate regional heatmap if it's currently visible
    if (state.regionalHeatmapEnabled && state.regionalHeatmapLayer) {
        console.log('Recalculating regional heatmap with new weights...');
        state.map.removeLayer(state.regionalHeatmapLayer);
        state.regionalHeatmapLayer = null;
        createRegionalHeatmap();
    }
}

/**
 * Calculate normalization ranges for heatmap scores
 */
function calculateNormalization() {
    state.normalization = {
        minYear: Infinity,
        maxYear: -Infinity,
        minEnergy: Infinity,
        maxEnergy: -Infinity
    };
    
    state.buildingsData.forEach(building => {
        state.normalization.minYear = Math.min(state.normalization.minYear, building.oldestYear);
        state.normalization.maxYear = Math.max(state.normalization.maxYear, building.oldestYear);
        state.normalization.minEnergy = Math.min(state.normalization.minEnergy, building.worstEnergyRank);
        state.normalization.maxEnergy = Math.max(state.normalization.maxEnergy, building.worstEnergyRank);
    });
}

/**
 * Get heatmap style for a building based on weighted score
 */
function getHeatmapStyle(building) {
    const { minYear, maxYear, minEnergy, maxEnergy } = state.normalization;
    
    const yearScore = maxYear > minYear ? 
        1 - (building.oldestYear - minYear) / (maxYear - minYear) : 0.5;
    
    const energyScore = maxEnergy > minEnergy ?
        1 - (building.worstEnergyRank - minEnergy) / (maxEnergy - minEnergy) : 0.5;
    
    const busyRoadScore = building.onBusyRoad ? 1.0 : 0.0;
    
    const weightedScore = 
        (energyScore * state.energyWeight) + 
        (yearScore * state.yearWeight) + 
        (busyRoadScore * state.busyRoadWeight);
    
    const color = getHeatColor(weightedScore);
    
    return {
        fillColor: color,
        fillOpacity: 0.7,
        color: darkenColor(color, 0.3),
        weight: 2
    };
}

/**
 * Convert score (0-1) to heat color (yellow to red)
 */

function getHeatColor(score) {
    const r = 255;
    const g = Math.round(255 * (1 - score));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(color, factor) {
    const match = color.match(/\d+/g);
    if (!match) return color;
    
    return `rgb(${
        Math.round(parseInt(match[0]) * (1 - factor))}, ${
        Math.round(parseInt(match[1]) * (1 - factor))}, ${
        Math.round(parseInt(match[2]) * (1 - factor))
    })`;
}

// ============================================================================
// BUILDING SELECTION
// ============================================================================

/**
 * Select a building and load its full details
 */
async function selectBuilding(building, layer, latlng) {
    state.selectedBuilding = building;
    
    // Reset previous highlight
    if (state.currentHighlightedLayer && state.currentHighlightedLayer !== layer) {
        const baseStyle = state.heatmapEnabled ? 
            getHeatmapStyle(state.currentHighlightedLayer.buildingData) : 
            getDefaultBuildingStyle();
        state.currentHighlightedLayer.setStyle(baseStyle);
    }
    
    // Highlight selected building
    layer.setStyle({
        fillColor: '#0066ff',
        fillOpacity: 0.7,
        color: '#0044cc',
        weight: 3
    });
    state.currentHighlightedLayer = layer;
    
    // Center map on building
    state.map.setView(latlng, 18, { animate: true, duration: 0.5 });
    
    // Show building view and load details
    showBuildingView();
    await loadBuildingDetails(building);
}

/**
 * Load full building details on demand
 */
async function loadBuildingDetails(building) {
    const content = document.getElementById('building-content');
    
    // Show loading state
    content.innerHTML = '<div style="color: #FFD700; text-align: center; padding: 40px;">Loading details...</div>';
    
    try {
        const response = await fetch(`/api/building-details?polygon=${encodeURIComponent(building.polygon)}`);
        const addresses = await response.json();
        
        // Update building with full address data
        building.addresses = addresses;
        
        // Display the details
        showBuildingInfo(building);
    } catch (error) {
        console.error('Error loading building details:', error);
        content.innerHTML = '<div style="color: #CD5C5C; text-align: center; padding: 40px;">Error loading details</div>';
    }
}

/**
 * Display building information in side panel
 */
function showBuildingInfo(building) {
    const content = document.getElementById('building-content');
    
    let html = '<div class="building-info">';
    html += '<div class="building-summary">';
    html += '<h3>Overview</h3>';
    html += `<div class="summary-stat"><strong>Addresses</strong><span>${building.addresses.length}</span></div>`;
    
    if (state.heatmapEnabled) {
        const worstLabel = getEnergyLabelFromRank(building.worstEnergyRank);
        html += `<div class="summary-stat"><strong>Worst Label</strong><span>${worstLabel}</span></div>`;
        html += `<div class="summary-stat"><strong>Oldest</strong><span>${building.oldestYear}</span></div>`;
        html += `<div class="summary-stat"><strong>Busy Road</strong><span>${building.onBusyRoad ? 'Yes' : 'No'}</span></div>`;
    }
    html += '</div>';
    
    html += '<div class="addresses-list">';
    building.addresses.forEach(addr => {
        html += `
        <div class="address-card">
            <div class="address-title">${addr.address}</div>
            <div class="address-detail">
                <span class="label">Energy Label</span>
                <span class="value">${addr.energyLabel}</span>
            </div>
            <div class="address-detail">
                <span class="label">Building Year</span>
                <span class="value">${addr.buildingYear}</span>
            </div>
            <div class="address-detail">
                <span class="label">Busy Road</span>
                <span class="value">${addr.busyRoad ? 'Yes' : 'No'}</span>
            </div>
        </div>`;
    });
    html += '</div></div>';
    
    content.innerHTML = html;
}

// ============================================================================
// REGIONAL HEATMAP BY NEIGHBORHOOD
// ============================================================================

/**
 * Toggle regional heatmap overlay showing mean scores by neighborhood
 */
function toggleRegionalHeatmap(e) {
    const checked = e.target.checked;
    
    if (checked) {
        // Show regional heatmap
        createRegionalHeatmap();
        state.regionalHeatmapEnabled = true;
    } else {
        // Remove regional heatmap
        if (state.regionalHeatmapLayer) {
            state.map.removeLayer(state.regionalHeatmapLayer);
            state.regionalHeatmapLayer = null;
        }
        state.regionalHeatmapEnabled = false;
    }
}

/**
 * Create regional heatmap showing mean scores by neighborhood
 */
async function createRegionalHeatmap() {
    if (!state.heatmapEnabled) {
        alert('Please apply building heatmap weights first');
        document.getElementById('show-regional-heatmap').checked = false;
        return;
    }
    
    // Load neighborhood boundaries if not already loaded
    if (!neighborhoodsGeoJSON) {
        console.log('Loading neighborhood boundaries...');
        await loadNeighborhoodsGeoJSON();
        if (!neighborhoodsGeoJSON) {
            alert('Failed to load neighborhood boundaries');
            document.getElementById('show-regional-heatmap').checked = false;
            return;
        }
    }
    
    // Group buildings by neighborhood and calculate average score
    const neighborhoodScores = new Map();
    
    state.buildingLayers.forEach(({ building }) => {
        const neighborhood = building.neighborhood || 'Unknown';
        const score = calculateBuildingScore(building);
        
        if (!neighborhoodScores.has(neighborhood)) {
            neighborhoodScores.set(neighborhood, {
                scores: [],
                count: 0
            });
        }
        
        neighborhoodScores.get(neighborhood).scores.push(score);
        neighborhoodScores.get(neighborhood).count++;
    });
    
    // Calculate mean scores
    const meanScores = new Map();
    neighborhoodScores.forEach((data, neighborhood) => {
        const meanScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        meanScores.set(neighborhood, meanScore);
        console.log(`${neighborhood}: mean score ${meanScore.toFixed(3)} (${data.count} buildings)`);
    });
    
    console.log(`\nRegional heatmap: ${neighborhoodScores.size} neighborhoods with data`);
    
    // Calculate score for each GeoJSON neighborhood by spatial aggregation
    const geoJSONScores = new Map();
    
    neighborhoodsGeoJSON.features.forEach(feature => {
        const buurtcode = feature.properties.Buurtcode;
        const buurtnaam = feature.properties.Buurtnaam;
        
        // Find all buildings within this GeoJSON neighborhood's bounds
        const bounds = L.geoJSON(feature).getBounds();
        const buildingsInNeighborhood = [];
        
        state.buildingLayers.forEach(({ building }) => {
            // Simple bounding box check
            if (building.latitude >= bounds.getSouth() && 
                building.latitude <= bounds.getNorth() &&
                building.longitude >= bounds.getWest() && 
                building.longitude <= bounds.getEast()) {
                buildingsInNeighborhood.push(building);
            }
        });
        
        if (buildingsInNeighborhood.length > 0) {
            const scores = buildingsInNeighborhood.map(calculateBuildingScore);
            const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            geoJSONScores.set(buurtcode, {
                score: meanScore,
                count: buildingsInNeighborhood.length,
                name: buurtnaam
            });
        }
    });
    
    console.log(`Matched ${geoJSONScores.size} GeoJSON neighborhoods with building data`);
    
    // Create neighborhood polygon layer
    state.regionalHeatmapLayer = L.geoJSON(neighborhoodsGeoJSON, {
        style: (feature) => {
            const buurtcode = feature.properties.Buurtcode;
            const data = geoJSONScores.get(buurtcode);
            
            if (data) {
                // Has buildings - solid color by mean score (hides buildings)
                const color = getHeatColor(data.score);
                
                return {
                    fillColor: color,
                    fillOpacity: 1.0,  // Solid fill
                    color: '#333',
                    weight: 2
                };
            } else {
                // No buildings - light gray fill
                return {
                    fillColor: '#e0e0e0',
                    fillOpacity: 0.4,
                    color: '#999',
                    weight: 1
                };
            }
        },
        onEachFeature: (feature, layer) => {
            const buurtcode = feature.properties.Buurtcode;
            const buurtnaam = feature.properties.Buurtnaam;
            const data = geoJSONScores.get(buurtcode);
            
            if (data) {
                layer.bindPopup(`
                    <div style="font-family: Courier New; padding: 10px;">
                        <strong style="color: #FFD700; text-transform: uppercase;">${buurtnaam}</strong><br>
                        <span style="color: #666;">Mean Score:</span> <strong style="color: #FF8C00;">${data.score.toFixed(3)}</strong><br>
                        <span style="color: #666;">Buildings:</span> <strong style="color: #FF8C00;">${data.count}</strong>
                    </div>
                `);
            } else {
                layer.bindPopup(`
                    <div style="font-family: Courier New; padding: 10px;">
                        <strong style="color: #999; text-transform: uppercase;">${buurtnaam}</strong><br>
                        <span style="color: #666;">No building data</span>
                    </div>
                `);
            }
        }
    }).addTo(state.map);
    
    // Bring building polygons to front so they remain clickable
    state.buildingLayers.forEach(({ layer }) => {
        if (layer && layer.bringToFront) {
            layer.bringToFront();
        }
    });
}

/**
 * Calculate weighted score for a building (used in regional heatmap)
 */
function calculateBuildingScore(building) {
    const { minYear, maxYear, minEnergy, maxEnergy } = state.normalization;
    
    const yearScore = maxYear > minYear ? 
        1 - (building.oldestYear - minYear) / (maxYear - minYear) : 0.5;
    
    const energyScore = maxEnergy > minEnergy ?
        1 - (building.worstEnergyRank - minEnergy) / (maxEnergy - minEnergy) : 0.5;
    
    const busyRoadScore = building.onBusyRoad ? 1.0 : 0.0;
    
    return (energyScore * state.energyWeight) + 
           (yearScore * state.yearWeight) + 
           (busyRoadScore * state.busyRoadWeight);
}

// ============================================================================
// WKT GEOMETRY PARSING
// ============================================================================

function wktToGeoJSON(wkt) {
    try {
        if (wkt.startsWith('MULTIPOLYGON')) {
            return {
                type: 'Feature',
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: parseMultiPolygon(wkt)
                },
                properties: {}
            };
        }
        
        if (wkt.startsWith('POLYGON')) {
            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: parsePolygon(wkt)
                },
                properties: {}
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing WKT:', error);
        return null;
    }
}

function parseMultiPolygon(wkt) {
    const coordStr = wkt.replace('MULTIPOLYGON (((', '').replace(')))', '').trim();
    const rings = coordStr.split(')),((');
    
    return [rings.map(ring => parseCoordinateString(ring))];
}

function parsePolygon(wkt) {
    const coordStr = wkt.replace('POLYGON ((', '').replace('))', '').trim();
    const rings = coordStr.split('),(');
    
    return rings.map(ring => parseCoordinateString(ring));
}

function parseCoordinateString(str) {
    return str.split(',').map(coord => {
        const [lon, lat] = coord.trim().split(' ');
        return [parseFloat(lon), parseFloat(lat)];
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', initMap);

/**
 * HEATMAP // AMSTERDAM
 * Interactive building heatmap visualization
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
    map: null,
    buildingsData: [],
    buildingLayers: [],
    selectedBuilding: null,
    currentHighlightedLayer: null,
    heatmapEnabled: false,
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

const AMSTERDAM_BOUNDS = {
    southwest: [52.2784, 4.7283],
    northeast: [52.4311, 5.0641]
};

const AMSTERDAM_CENTER = [52.3676, 4.9041];
const DEFAULT_ZOOM = 13;
const MIN_LOAD_TIME = 3000;

// ============================================================================
// MAP INITIALIZATION
// ============================================================================

function initMap() {
    state.map = L.map('map', {
        maxBounds: [AMSTERDAM_BOUNDS.southwest, AMSTERDAM_BOUNDS.northeast],
        maxBoundsViscosity: 1.0,
        minZoom: 13,
        maxZoom: 20
    }).setView(AMSTERDAM_CENTER, DEFAULT_ZOOM);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(state.map);
    
    setupPanel();
    loadBuildings();
}

// ============================================================================
// PANEL MANAGEMENT
// ============================================================================

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

async function loadBuildings() {
    const startTime = Date.now();
    createPixelText();
    
    try {
        // Try API first (local server), fallback to direct CSV (GitHub Pages)
        let buildingsData;
        try {
            const response = await fetch('/api/buildings');
            if (response.ok) {
                buildingsData = await response.json();
            } else {
                throw new Error('API not available');
            }
        } catch (apiError) {
            console.log('Loading CSV directly for static deployment...');
            const records = await loadCSV('enriched_with_busy_roads.csv');
            buildingsData = processBuildingsData(records);
        }
        
        state.buildingsData = buildingsData;
        console.log(`Loaded ${state.buildingsData.length} buildings`);
        addBuildingsToMap();
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOAD_TIME - elapsed);
        
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, remaining);
    } catch (error) {
        console.error('Error loading buildings:', error);
        setTimeout(() => {
            document.getElementById('loading').innerHTML = 
                '<div style="color: #CD5C5C; text-align: center;"><h2>Error</h2><p>Please refresh</p></div>';
        }, MIN_LOAD_TIME);
    }
}

// ============================================================================
// BUILDING RENDERING
// ============================================================================

function addBuildingsToMap() {
    let successCount = 0;
    
    state.buildingsData.forEach((building) => {
        try {
            const geoJSON = wktToGeoJSON(building.polygon);
            if (!geoJSON) return;
            
            building.worstEnergyLabel = getWorstEnergyLabel(building.addresses);
            building.oldestYear = getOldestYear(building.addresses);
            building.onBusyRoad = isOnBusyRoad(building.addresses);
            
            const polygon = L.geoJSON(geoJSON, {
                style: getDefaultBuildingStyle(),
                onEachFeature: (feature, layer) => {
                    setupBuildingInteractions(layer, building);
                }
            });
            
            polygon.addTo(state.map);
            state.buildingLayers.push({ building, layer: polygon });
            successCount++;
        } catch (error) {
            console.error('Error adding building:', error);
        }
    });
    
    console.log(`✓ Added ${successCount} buildings to map`);
}

function getDefaultBuildingStyle() {
    return {
        fillColor: '#ff0000',
        fillOpacity: 0.6,
        color: '#cc0000',
        weight: 2
    };
}

function setupBuildingInteractions(layer, building) {
    layer.bindTooltip(`${building.addresses.length} address(es) - Click for details`, {
        sticky: true
    });
    
    layer.on('mouseover', () => handleBuildingHover(layer, true));
    layer.on('mouseout', () => handleBuildingHover(layer, false));
    layer.on('click', (e) => selectBuilding(building, layer, e.latlng));
    
    layer.buildingData = building;
}

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
// ENERGY & YEAR ANALYSIS
// ============================================================================

const ENERGY_LABEL_RANKING = {
    'A++++': 8, 'A+++': 7, 'A++': 6, 'A+': 5, 'A': 4,
    'B': 3, 'C': 2, 'D': 1, 'E': 0, 'F': -1, 'G': -2
};

function getWorstEnergyLabel(addresses) {
    let worstLabel = 'A++++';
    let worstRank = 8;
    
    addresses.forEach(addr => {
        const rank = ENERGY_LABEL_RANKING[addr.energyLabel] ?? 0;
        if (rank < worstRank) {
            worstRank = rank;
            worstLabel = addr.energyLabel;
        }
    });
    
    return { label: worstLabel, score: worstRank };
}

function getOldestYear(addresses) {
    let oldest = Infinity;
    
    addresses.forEach(addr => {
        const year = parseInt(addr.buildingYear);
        if (!isNaN(year) && year < oldest) {
            oldest = year;
        }
    });
    
    return oldest === Infinity ? 2000 : oldest;
}

function isOnBusyRoad(addresses) {
    return addresses.some(addr => addr.busyRoad === true);
}

// ============================================================================
// HEATMAP APPLICATION
// ============================================================================

function applyHeatmap() {
    state.heatmapEnabled = true;
    
    calculateNormalization();
    
    state.buildingLayers.forEach(({ building, layer }) => {
        layer.setStyle(getHeatmapStyle(building));
    });
    
    console.log(`Heatmap applied: Energy=${state.energyWeight}, Year=${state.yearWeight}, BusyRoad=${state.busyRoadWeight}`);
}

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
        state.normalization.minEnergy = Math.min(state.normalization.minEnergy, building.worstEnergyLabel.score);
        state.normalization.maxEnergy = Math.max(state.normalization.maxEnergy, building.worstEnergyLabel.score);
    });
}

function getHeatmapStyle(building) {
    const { minYear, maxYear, minEnergy, maxEnergy } = state.normalization;
    
    const yearScore = maxYear > minYear ? 
        1 - (building.oldestYear - minYear) / (maxYear - minYear) : 0.5;
    
    const energyScore = maxEnergy > minEnergy ?
        1 - (building.worstEnergyLabel.score - minEnergy) / (maxEnergy - minEnergy) : 0.5;
    
    // Binary score: 1.0 if on busy road, 0.0 if not
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

function selectBuilding(building, layer, latlng) {
    state.selectedBuilding = building;
    
    if (state.currentHighlightedLayer && state.currentHighlightedLayer !== layer) {
        const baseStyle = state.heatmapEnabled ? 
            getHeatmapStyle(state.currentHighlightedLayer.buildingData) : 
            getDefaultBuildingStyle();
        state.currentHighlightedLayer.setStyle(baseStyle);
    }
    
    layer.setStyle({
        fillColor: '#0066ff',
        fillOpacity: 0.7,
        color: '#0044cc',
        weight: 3
    });
    state.currentHighlightedLayer = layer;
    
    state.map.setView(latlng, 18, { animate: true, duration: 0.5 });
    
    showBuildingView();
    showBuildingInfo(building);
}

function showBuildingInfo(building) {
    const content = document.getElementById('building-content');
    
    let html = '<div class="building-info">';
    html += '<div class="building-summary">';
    html += '<h3>Overview</h3>';
    html += `<div class="summary-stat"><strong>Addresses</strong><span>${building.addresses.length}</span></div>`;
    
    if (state.heatmapEnabled) {
        html += `<div class="summary-stat"><strong>Worst Label</strong><span>${building.worstEnergyLabel.label}</span></div>`;
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

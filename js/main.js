/**
 * Main application script for the mapping project.
 * Initializes the Leaflet map and displays POI markers.
 */

/**
 * Loads tile layers from the settings.json file and converts them to Leaflet tile layer objects.
 * @param {string} settingsPath - Path to the settings JSON file
 * @returns {Promise<Object>} Promise that resolves to an object with tile layer names as keys and L.tileLayer instances as values
 */
async function loadTileLayers(settingsPath = "./assets/settings.json") {
  try {
    const response = await fetch(settingsPath);
    const settings = await response.json();

    // Extract tileLayers section from settings
    const tileLayerData = settings.tileLayers;

    if (!tileLayerData) {
      console.warn("No tileLayers section found in settings.json");
      return {};
    }

    const tileLayers = {};
    const tileLayersLabels = {};

    // Convert each JSON definition into a Leaflet tile layer
    for (const [name, config] of Object.entries(tileLayerData)) {
      tileLayers[name] = L.tileLayer(config.url, config.options || {});
      tileLayersLabels[name] = config.label || name; // Use label if available, otherwise use name
    }

    return { tileLayers, tileLayersLabels };
  } catch (error) {
    console.error("Error loading tile layers:", error);
    throw error;
  }
}

// Function to create popup content from POI data
function createPopupContent(poi) {
  const coordinateWarning = poi.properties.needsCoordinateUpdate
    ? '<p><small style="color: red;">Coordinates need to be updated</small></p>'
    : "";

  const fullAddress = poi.properties.address.zipCode
    ? `${poi.properties.address.street}<br>${poi.properties.address.city}, ${poi.properties.address.state} ${poi.properties.address.zipCode}`
    : `${poi.properties.address.street}<br>${poi.properties.address.city}, ${poi.properties.address.state}`;

  return `
                  <div style="text-align: center;">
                      <h3>${poi.properties.emoji} ${poi.properties.name}</h3>
                      <p><strong>${fullAddress}</strong></p>
                      <p>${poi.properties.category}</p>
                      <p><em>${poi.properties.area}</em></p>
                      ${coordinateWarning}
                  </div>
              `;
}

// Create custom emoji markers function
function createEmojiMarker(emoji, size = 30) {
  return L.divIcon({
    html: `<div style="font-size: ${size}px; text-align: center; line-height: 1;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: "emoji-marker",
  });
}

/**
 * Initializes the map with tile layers and POI markers
 */
async function initializeMap() {
  try {
    // Load tile layers and POI data in parallel
    const [tileLayersData, poisResponse, settingsResponse] = await Promise.all([
      loadTileLayers(),
      fetch("./assets/pois.json"),
      fetch("./assets/settings.json"),
    ]);

    const poisData = await poisResponse.json();
    const settings = await settingsResponse.json();
    const mapConfig = settings.map || {};

    const tileLayers = tileLayersData.tileLayers;
    const tileLayersLabels = tileLayersData.tileLayersLabels;

    // Bounds for the map:
    const bounds = mapConfig.bounds
      ? L.latLngBounds(
          L.latLng(
            mapConfig.bounds.southwest[0],
            mapConfig.bounds.southwest[1],
          ),
          L.latLng(
            mapConfig.bounds.northeast[0],
            mapConfig.bounds.northeast[1],
          ),
        )
      : L.latLngBounds(
          L.latLng(33.46041, -81.95071),
          L.latLng(33.48457, -81.98371),
        );

    // Initialize map with settings
    const center = mapConfig.center || [33.47373, -81.96762];
    const zoom = mapConfig.zoom || 15;

    const map = L.map("map", {
      maxBounds: bounds,
      maxBoundsViscosity: mapConfig.maxBoundsViscosity || 1.0, // Prevents panning outside bounds
      zoomControl: mapConfig.zoomControl || false, // Removes zoom buttons for cleaner look
      // dragging: false // This doesn't adjust with zoom, so folks can't see whole map at zoom
    }).setView(center, zoom);

    // Add default tile layer
    const defaultLayerName = mapConfig.defaultTileLayer || "osm";
    if (tileLayers[defaultLayerName]) {
      tileLayers[defaultLayerName].addTo(map);
    } else if (Object.keys(tileLayers).length > 0) {
      // Fallback to first available tile layer
      const firstLayer = Object.values(tileLayers)[0];
      firstLayer.addTo(map);
      console.warn(
        `Default tile layer "${defaultLayerName}" not found, using first available layer`,
      );
    } else {
      throw new Error("No tile layers available");
    }

    // Add layer control if enabled and multiple layers exist, allows
    // users to switch between tile layers
    if (mapConfig.showLayerControl && Object.keys(tileLayers).length > 1) {
      // Build layer control object with custom labels
      const layerControlLayers = {};

      // Use labels from settings for each tile layer
      for (const [name, layer] of Object.entries(tileLayers)) {
        if (tileLayersLabels[name]) {
          layerControlLayers[tileLayersLabels[name]] = layer;
        }
      }

      L.control.layers(layerControlLayers).addTo(map);
    }

    // Add markers for all POIs from JSON data
    poisData.features.forEach((poi) => {
      const emoji = poi.properties.emoji || "📍";
      const markerSize = poi.properties.markerSize || 30;

      L.marker([poi.geometry.coordinates[1], poi.geometry.coordinates[0]], {
        icon: createEmojiMarker(emoji, markerSize),
      })
        .addTo(map)
        .bindPopup(createPopupContent(poi));
    });
  } catch (error) {
    console.error("Error initializing map:", error);
  }
}

// Initialize the map when script loads
initializeMap();

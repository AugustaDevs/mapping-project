/**
 * Main application script for the mapping project.
 * Initializes the Leaflet map and displays POI markers.
 */

import { createPopupContent, createEmojiMarker } from './utils.js';

/**
 * Builds tile layers from settings object and returns them with labels.
 * @param {Object} settings - Settings object containing tileLayers configuration
 * @returns {Object} Object with tileLayers and tileLayersLabels properties
 */
export function loadTileLayers(settings) {
  const tileLayerData = settings.tileLayers ?? {};
  const tileLayers = {};
  const tileLayersLabels = {};

  for (const [name, config] of Object.entries(tileLayerData)) {
    tileLayers[name] = L.tileLayer(config.url, config.options ?? {});
    tileLayersLabels[name] = config.label ?? name;
  }

  return { tileLayers, tileLayersLabels };
}

/**
 * Initializes the map with tile layers and POI markers
 */
export async function initializeMap() {
  try {
    // Load POIs and settings in parallel
    const [poisResponse, settingsResponse] = await Promise.all([
      fetch('./assets/pois.json'),
      fetch('./assets/settings.json'),
    ]);

    if (!poisResponse.ok) {
      throw new Error(`Failed to load POIs: ${poisResponse.status} ${poisResponse.statusText}`);
    }
    if (!settingsResponse.ok) {
      throw new Error(`Failed to load settings: ${settingsResponse.status} ${settingsResponse.statusText}`);
    }

    const poisData = await poisResponse.json();
    const settings = await settingsResponse.json();
    const mapConfig = settings.map ?? {};

    // Build tile layers from settings
    const { tileLayers, tileLayersLabels } = loadTileLayers(settings);

    // Bounds for the map:
    const bounds = mapConfig.bounds
      ? L.latLngBounds(
          L.latLng(
            mapConfig.bounds.southwest[0],
            mapConfig.bounds.southwest[1]
          ),
          L.latLng(mapConfig.bounds.northeast[0], mapConfig.bounds.northeast[1])
        )
      : L.latLngBounds(
          L.latLng(33.46041, -81.95071),
          L.latLng(33.48457, -81.98371)
        );

    // Initialize map with settings
    const center = mapConfig.center ?? [33.47373, -81.96762];
    const zoom = mapConfig.zoom ?? 15;

    const map = L.map('map', {
      maxBounds: bounds,
      maxBoundsViscosity: mapConfig.maxBoundsViscosity ?? 1.0, // Prevents panning outside bounds
      zoomControl: mapConfig.zoomControl ?? false, // Removes zoom buttons for cleaner look
      dragging: mapConfig.dragging ?? true,
    }).setView(center, zoom);

    // Add default tile layer
    const defaultLayerName = mapConfig.defaultTileLayer ?? 'osm';
    if (tileLayers[defaultLayerName]) {
      tileLayers[defaultLayerName].addTo(map);
    } else if (Object.keys(tileLayers).length > 0) {
      // Fallback to first available tile layer
      const firstLayer = Object.values(tileLayers)[0];
      firstLayer.addTo(map);
      console.warn(
        `Default tile layer "${defaultLayerName}" not found, using first available layer`
      );
    } else {
      throw new Error('No tile layers available');
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
      const emoji = poi.properties.emoji ?? '📍';
      const markerSize = poi.properties.markerSize ?? 30;

      L.marker([poi.geometry.coordinates[1], poi.geometry.coordinates[0]], {
        icon: createEmojiMarker(emoji, markerSize),
      })
        .addTo(map)
        .bindPopup(createPopupContent(poi));
    });

    // Expose references and emit ready event for admin tools if present
    try {
      window.__leafletMap = map;
      window.__poisData = poisData;
      window.__settings = settings;
      document.dispatchEvent(
        new CustomEvent('map:ready', { detail: { map, poisData, settings } })
      );
    } catch (error) {
      console.error('Error exposing map references:', error);
    }
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Initialize the map when script loads (only in browser environment)
if (typeof window !== 'undefined') {
  initializeMap();
}

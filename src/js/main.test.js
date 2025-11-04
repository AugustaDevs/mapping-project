import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadTileLayers, initializeMap } from './main.js';
import { createEmojiMarker, createPopupContent } from './utils.js';

/**
 * Tests for main.js functionality.
 * Tests the map initialization logic including tile layer loading, POI marker creation,
 * and error handling for the Leaflet map initialization.
 */

// Mock utils
vi.mock('./utils.js', () => ({
  createEmojiMarker: vi.fn((emoji, size) => ({
    iconSize: [size, size],
    className: 'emoji-marker',
    html: emoji,
  })),
  createPopupContent: vi.fn((poi) => `<div>${poi.properties.name}</div>`),
}));

/**
 * Tests for loadTileLayers function.
 * Verifies tile layer creation from settings, label handling, and edge cases.
 */
describe('loadTileLayers', () => {
  let mockTileLayer;

  beforeEach(() => {
    mockTileLayer = {
      addTo: vi.fn().mockReturnThis(),
    };

    global.L = {
      tileLayer: vi.fn().mockReturnValue(mockTileLayer),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should build tile layers from settings', () => {
    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
          options: { attribution: '© OSM' },
        },
        satellite: {
          url: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}',
          label: 'Satellite',
        },
      },
    };

    const result = loadTileLayers(settings);

    expect(result.tileLayers).toHaveProperty('osm');
    expect(result.tileLayers).toHaveProperty('satellite');
    expect(result.tileLayersLabels.osm).toBe('OpenStreetMap');
    expect(result.tileLayersLabels.satellite).toBe('Satellite');
    expect(L.tileLayer).toHaveBeenCalledTimes(2);
  });

  it('should use name as label when label is not provided', () => {
    const settings = {
      tileLayers: {
        customLayer: {
          url: 'https://example.com/{z}/{x}/{y}.png',
        },
      },
    };

    const result = loadTileLayers(settings);

    expect(result.tileLayersLabels.customLayer).toBe('customLayer');
  });

  it('should handle empty tileLayers object', () => {
    const settings = {
      tileLayers: {},
    };

    const result = loadTileLayers(settings);

    expect(Object.keys(result.tileLayers)).toHaveLength(0);
    expect(Object.keys(result.tileLayersLabels)).toHaveLength(0);
  });

  it('should handle missing tileLayers property', () => {
    const settings = {};

    const result = loadTileLayers(settings);

    expect(Object.keys(result.tileLayers)).toHaveLength(0);
    expect(Object.keys(result.tileLayersLabels)).toHaveLength(0);
  });

  it('should use empty options object when options are not provided', () => {
    const settings = {
      tileLayers: {
        simpleLayer: {
          url: 'https://example.com/{z}/{x}/{y}.png',
        },
      },
    };

    loadTileLayers(settings);

    expect(L.tileLayer).toHaveBeenCalledWith(
      'https://example.com/{z}/{x}/{y}.png',
      {}
    );
  });
});

/**
 * Tests for initializeMap function.
 * Verifies map initialization, POI marker creation, layer controls, error handling,
 * and the integration of map configuration with Leaflet.
 */
describe('initializeMap', () => {
  let mockMap;
  let mockMarker;
  let mockTileLayer;
  let mockLayerControl;
  let mockBounds;
  let mockLatLng;
  let eventListeners;

  beforeEach(() => {
    // Mock console methods
    global.console = {
      ...console,
      error: vi.fn(),
      warn: vi.fn(),
    };

    // Mock fetch
    global.fetch = vi.fn();

    // Mock Leaflet components
    mockMarker = {
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
    };

    mockTileLayer = {
      addTo: vi.fn().mockReturnThis(),
    };

    mockLayerControl = {
      addTo: vi.fn().mockReturnThis(),
    };

    mockBounds = {};
    mockLatLng = {};

    mockMap = {
      setView: vi.fn().mockReturnThis(),
    };

    global.L = {
      map: vi.fn().mockReturnValue(mockMap),
      marker: vi.fn().mockReturnValue(mockMarker),
      tileLayer: vi.fn().mockReturnValue(mockTileLayer),
      latLng: vi.fn().mockReturnValue(mockLatLng),
      latLngBounds: vi.fn().mockReturnValue(mockBounds),
      control: {
        layers: vi.fn().mockReturnValue(mockLayerControl),
      },
    };

    // Mock DOM
    global.document = {
      getElementById: vi.fn(() => ({ id: 'map' })),
      dispatchEvent: vi.fn(),
    };

    global.window = {
      __leafletMap: null,
      __poisData: null,
      __settings: null,
    };

    eventListeners = [];
    global.document.addEventListener = vi.fn((event, handler) => {
      eventListeners.push({ event, handler });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize map with default settings when config is minimal', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {},
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(L.map).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        maxBounds: mockBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        dragging: true,
      })
    );
    expect(mockMap.setView).toHaveBeenCalledWith([33.47373, -81.96762], 15);
  });

  it('should use custom map configuration from settings', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {
        center: [40.7128, -74.006],
        zoom: 12,
        maxBoundsViscosity: 0.5,
        zoomControl: true,
        dragging: false,
        defaultTileLayer: 'osm',
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(L.map).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        maxBoundsViscosity: 0.5,
        zoomControl: true,
        dragging: false,
      })
    );
    expect(mockMap.setView).toHaveBeenCalledWith([40.7128, -74.006], 12);
  });

  it('should load and display POI markers', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-81.97, 33.47], // [lng, lat]
          },
          properties: {
            name: 'Test POI',
            emoji: '🍕',
            markerSize: 35,
          },
        },
      ],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {
        defaultTileLayer: 'osm',
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(L.marker).toHaveBeenCalledWith(
      [33.47, -81.97], // [lat, lng] - coordinates are swapped
      expect.objectContaining({
        icon: expect.any(Object),
      })
    );
    expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
    expect(mockMarker.bindPopup).toHaveBeenCalled();
  });

  it('should use default emoji and marker size when not provided', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-81.97, 33.47],
          },
          properties: {
            name: 'Test POI',
          },
        },
      ],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {
        defaultTileLayer: 'osm',
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(createEmojiMarker).toHaveBeenCalledWith('📍', 30);
  });

  it('should add layer control when enabled and multiple layers exist', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
        satellite: {
          url: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}',
          label: 'Satellite View',
        },
      },
      map: {
        defaultTileLayer: 'osm',
        showLayerControl: true,
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(L.control.layers).toHaveBeenCalled();
    expect(mockLayerControl.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should not add layer control when only one layer exists', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {
        defaultTileLayer: 'osm',
        showLayerControl: true,
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(L.control.layers).not.toHaveBeenCalled();
  });

  it('should use fallback tile layer when default is not found', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        custom: {
          url: 'https://example.com/{z}/{x}/{y}.png',
          label: 'Custom Layer',
        },
      },
      map: {
        defaultTileLayer: 'nonexistent',
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Default tile layer "nonexistent" not found')
    );
    expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should throw error when no tile layers are available', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {},
      map: {},
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(console.error).toHaveBeenCalledWith(
      'Error initializing map:',
      expect.any(Error)
    );
  });

  it('should handle POI fetch failure', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tileLayers: {}, map: {} }),
      });

    await initializeMap();

    expect(console.error).toHaveBeenCalledWith(
      'Error initializing map:',
      expect.any(Error)
    );
  });

  it('should handle settings fetch failure', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'FeatureCollection', features: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

    await initializeMap();

    expect(console.error).toHaveBeenCalledWith(
      'Error initializing map:',
      expect.any(Error)
    );
  });

  it('should expose map references and dispatch ready event', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {
        defaultTileLayer: 'osm',
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(window.__leafletMap).toBe(mockMap);
    expect(window.__poisData).toBe(poisData);
    expect(window.__settings).toBe(settings);
    expect(document.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'map:ready',
        detail: {
          map: mockMap,
          poisData,
          settings,
        },
      })
    );
  });

  it('should handle custom bounds from settings', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {
        defaultTileLayer: 'osm',
        bounds: {
          southwest: [33.46, -81.95],
          northeast: [33.48, -81.98],
        },
      },
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(L.latLng).toHaveBeenCalledWith(33.46, -81.95);
    expect(L.latLng).toHaveBeenCalledWith(33.48, -81.98);
    expect(L.latLngBounds).toHaveBeenCalled();
  });

  it('should use default bounds when not provided in settings', async () => {
    const poisData = {
      type: 'FeatureCollection',
      features: [],
    };

    const settings = {
      tileLayers: {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          label: 'OpenStreetMap',
        },
      },
      map: {},
    };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => poisData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => settings,
      });

    await initializeMap();

    expect(L.latLng).toHaveBeenCalledWith(33.46041, -81.95071);
    expect(L.latLng).toHaveBeenCalledWith(33.48457, -81.98371);
  });
});


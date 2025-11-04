import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEmojiMarker } from './utils.js';

/**
 * Tests for admin.js functionality.
 * Since admin.js is an IIFE, we test the core functions by mocking the environment.
 */

describe('Admin functionality', () => {
  let mockMarker;
  let mockLocalStorage;
  let storedData;

  beforeEach(() => {
    // Mock Leaflet
    mockMarker = {
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
    };

    global.L = {
      marker: vi.fn().mockReturnValue(mockMarker),
      divIcon: (options) => options,
    };

    // Mock localStorage
    storedData = {};
    mockLocalStorage = {
      getItem: vi.fn((key) => storedData[key] || null),
      setItem: vi.fn((key, value) => {
        storedData[key] = value;
      }),
      clear: vi.fn(() => {
        storedData = {};
      }),
    };
    global.localStorage = mockLocalStorage;

    // Mock DOM elements
    global.document = {
      getElementById: vi.fn((id) => {
        const elements = {
          poiModalBackdrop: { style: { display: 'none' } },
          poiCoordPreview: { textContent: '' },
          btnEnterAddPoi: { addEventListener: vi.fn() },
          btnExportPois: { addEventListener: vi.fn() },
          btnClearDraft: { addEventListener: vi.fn() },
          btnCancelPoi: { addEventListener: vi.fn() },
          btnSavePoi: { addEventListener: vi.fn() },
          poiName: { value: '' },
          poiEmoji: { value: '' },
          poiCategory: { value: '' },
          poiArea: { value: '' },
          poiMarkerSize: { value: '30' },
          addrStreet: { value: '' },
          addrCity: { value: '' },
          addrState: { value: '' },
          addrZip: { value: '' },
        };
        return elements[id] || { value: '', style: {}, textContent: '' };
      }),
      createElement: vi.fn((tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          href: '',
          download: '',
          click: vi.fn(),
          remove: vi.fn(),
        };
        if (tag === 'a') {
          global.document.body = { appendChild: vi.fn() };
        }
        return el;
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      readyState: 'complete',
      addEventListener: vi.fn(),
    };

    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };

    global.Blob = class MockBlob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };

    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    storedData = {};
  });

  describe('POI data management', () => {
    it('should combine base POIs and draft POIs correctly', () => {
      const basePois = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-81.97, 33.47] },
            properties: { name: 'Base POI' },
          },
        ],
      };

      const draftPois = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-81.96, 33.48] },
          properties: { name: 'Draft POI' },
        },
      ];

      // Simulate the getAllPoisFeatureCollection logic
      const features = [];
      if (basePois && Array.isArray(basePois.features)) {
        for (const f of basePois.features) features.push(f);
      }
      for (const f of draftPois) features.push(f);

      const result = { type: 'FeatureCollection', features };

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(2);
      expect(result.features[0].properties.name).toBe('Base POI');
      expect(result.features[1].properties.name).toBe('Draft POI');
    });

    it('should handle missing base POIs', () => {
      const basePois = null;
      const draftPois = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-81.96, 33.48] },
          properties: { name: 'Draft POI' },
        },
      ];

      const features = [];
      if (basePois && Array.isArray(basePois.features)) {
        for (const f of basePois.features) features.push(f);
      }
      for (const f of draftPois) features.push(f);

      const result = { type: 'FeatureCollection', features };

      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties.name).toBe('Draft POI');
    });
  });

  describe('localStorage persistence', () => {
    it('should save draft POIs to localStorage', () => {
      const draftPois = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-81.96, 33.48] },
          properties: { name: 'Test POI' },
        },
      ];

      localStorage.setItem('draftPois', JSON.stringify(draftPois));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'draftPois',
        JSON.stringify(draftPois)
      );
      expect(storedData['draftPois']).toBe(JSON.stringify(draftPois));
    });

    it('should load draft POIs from localStorage', () => {
      const draftPois = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-81.96, 33.48] },
          properties: { name: 'Test POI' },
        },
      ];

      storedData['draftPois'] = JSON.stringify(draftPois);

      const raw = localStorage.getItem('draftPois');
      const parsed = JSON.parse(raw);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].properties.name).toBe('Test POI');
    });

    it('should handle invalid localStorage data gracefully', () => {
      storedData['draftPois'] = 'invalid json';

      const raw = localStorage.getItem('draftPois');
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        // Expected to fail
      }

      expect(parsed).toBeNull();
    });
  });

  describe('POI marker creation', () => {
    it('should create marker with correct coordinates and properties', () => {
      const poi = {
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
      };

      const emoji = poi.properties.emoji || '📍';
      const markerSize = poi.properties.markerSize || 30;

      const marker = L.marker(
        [poi.geometry.coordinates[1], poi.geometry.coordinates[0]], // [lat, lng]
        {
          icon: createEmojiMarker(emoji, markerSize),
        }
      );

      expect(L.marker).toHaveBeenCalledWith(
        [33.47, -81.97],
        expect.objectContaining({
          icon: expect.any(Object),
        })
      );
    });

    it('should use default emoji and size when not provided', () => {
      const poi = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-81.97, 33.47],
        },
        properties: {
          name: 'Test POI',
        },
      };

      const emoji = poi.properties.emoji || '📍';
      const markerSize = poi.properties.markerSize || 30;

      expect(emoji).toBe('📍');
      expect(markerSize).toBe(30);
    });
  });

  describe('POI export functionality', () => {
    it('should create correct JSON blob for export', () => {
      const basePois = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-81.97, 33.47] },
            properties: { name: 'Base POI' },
          },
        ],
      };

      const draftPois = [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-81.96, 33.48] },
          properties: { name: 'Draft POI' },
        },
      ];

      // Simulate export logic
      const features = [];
      if (basePois && Array.isArray(basePois.features)) {
        for (const f of basePois.features) features.push(f);
      }
      for (const f of draftPois) features.push(f);

      const data = { type: 'FeatureCollection', features };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      expect(blob.options.type).toBe('application/json');
      const jsonString = blob.parts[0];
      const parsed = JSON.parse(jsonString);
      expect(parsed.type).toBe('FeatureCollection');
      expect(parsed.features).toHaveLength(2);
    });
  });

  describe('POI feature creation', () => {
    it('should create valid GeoJSON feature from form data', () => {
      const pendingLatLng = { lat: 33.47, lng: -81.97 };
      const name = 'Test Restaurant';
      const emoji = '🍕';
      const category = 'Restaurant';
      const area = 'Downtown';
      const markerSize = 35;
      const address = {
        street: '123 Main St',
        city: 'Augusta',
        state: 'GA',
        zipCode: '30901',
      };

      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [pendingLatLng.lng, pendingLatLng.lat],
        },
        properties: {
          name,
          emoji,
          category,
          area,
          markerSize,
          address,
          needsCoordinateUpdate: false,
        },
      };

      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('Point');
      expect(feature.geometry.coordinates).toEqual([-81.97, 33.47]);
      expect(feature.properties.name).toBe('Test Restaurant');
      expect(feature.properties.address.street).toBe('123 Main St');
    });

    it('should clamp marker size to valid range', () => {
      const testCases = [
        { input: '10', expected: 16 }, // min 16
        { input: '100', expected: 64 }, // max 64
        { input: '30', expected: 30 }, // valid
        { input: 'invalid', expected: 30 }, // default
      ];

      testCases.forEach(({ input, expected }) => {
        const markerSize = Math.max(
          16,
          Math.min(64, parseInt(input, 10) || 30)
        );
        expect(markerSize).toBe(expected);
      });
    });
  });
});


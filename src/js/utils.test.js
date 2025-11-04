import { describe, it, expect, beforeEach } from 'vitest';
import { createPopupContent, createEmojiMarker } from './utils.js';

/**
 * Tests for utils.js functionality.
 * Tests utility functions for creating POI popup content and emoji markers.
 */

// Mock Leaflet since it's loaded via CDN in the browser
beforeEach(() => {
  global.L = {
    divIcon: (options) => options,
  };
});

/**
 * Tests for createPopupContent function.
 * Verifies HTML generation for POI popups, including address formatting,
 * missing field handling, and coordinate update warnings.
 */
describe('createPopupContent', () => {
  it('should create popup content with basic POI data', () => {
    const poi = {
      properties: {
        name: 'Test Restaurant',
        emoji: '🍕',
        category: 'Restaurant',
        area: 'Downtown',
        address: {
          street: '123 Main St',
          city: 'Augusta',
          state: 'GA',
          zipCode: '30901',
        },
      },
    };

    const result = createPopupContent(poi);

    expect(result).toContain('Test Restaurant');
    expect(result).toContain('🍕');
    expect(result).toContain('123 Main St');
    expect(result).toContain('Augusta, GA 30901');
    expect(result).toContain('Restaurant');
    expect(result).toContain('Downtown');
  });

  it('should handle missing address fields', () => {
    const poi = {
      properties: {
        name: 'Test POI',
      },
    };

    const result = createPopupContent(poi);

    expect(result).toContain('Test POI');
    expect(result).toContain('📍'); // default emoji
  });

  it('should show coordinate warning when needed', () => {
    const poi = {
      properties: {
        name: 'Test POI',
        needsCoordinateUpdate: true,
      },
    };

    const result = createPopupContent(poi);
    expect(result).toContain('Coordinates need to be updated');
  });

  it('should handle address without zip code', () => {
    const poi = {
      properties: {
        name: 'Test POI',
        address: {
          street: '123 Main St',
          city: 'Augusta',
          state: 'GA',
        },
      },
    };

    const result = createPopupContent(poi);
    expect(result).toContain('123 Main St');
    expect(result).toContain('Augusta, GA');
    expect(result).not.toContain('30901');
  });

  it('should handle empty address object', () => {
    const poi = {
      properties: {
        name: 'Test POI',
        address: {},
      },
    };

    const result = createPopupContent(poi);
    expect(result).toContain('Test POI');
    // Should not crash with empty address
  });

  it('should handle missing category and area', () => {
    const poi = {
      properties: {
        name: 'Test POI',
        emoji: '📍',
      },
    };

    const result = createPopupContent(poi);
    expect(result).toContain('Test POI');
    // Empty category and area should still render (as empty strings)
  });
});

/**
 * Tests for createEmojiMarker function.
 * Verifies Leaflet DivIcon creation with emoji markers, including default
 * and custom size configurations.
 */
describe('createEmojiMarker', () => {
  it('should create a marker with default size', () => {
    const marker = createEmojiMarker('🍕');

    expect(marker.iconSize).toEqual([30, 30]);
    expect(marker.className).toBe('emoji-marker');
    expect(marker.html).toContain('🍕');
  });

  it('should create a marker with custom size', () => {
    const marker = createEmojiMarker('📍', 50);

    expect(marker.iconSize).toEqual([50, 50]);
    expect(marker.iconAnchor).toEqual([25, 25]);
    expect(marker.popupAnchor).toEqual([0, -25]);
  });
});

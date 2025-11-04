// Shared helpers for map UI
/**
 * The POI object is for a single point of interest. It has properties which
 * determine what is shown on the map for the given POI both positionally and informationally.
 * @typedef {Object} POI
 * @property {Object} geometry - GeoJSON geometry object
 * @property {number[]} geometry.coordinates - Array of [longitude, latitude]
 * @property {Object} properties - POI properties
 * @property {string} properties.name - Name of the POI
 * @property {string} [properties.emoji] - Emoji to display (defaults to '📍')
 * @property {string} [properties.category] - Category of the POI
 * @property {string} [properties.area] - Area/region of the POI
 * @property {boolean} [properties.needsCoordinateUpdate] - Whether coordinates need updating
 * @property {Object} [properties.address] - Address object
 * @property {string} [properties.address.street] - Street address
 * @property {string} [properties.address.city] - City name
 * @property {string} [properties.address.state] - State name
 * @property {string} [properties.address.zipCode] - ZIP code
 */

/**
 * Creates HTML content for a POI popup marker.
 * @param {Object} poi - GeoJSON Feature object representing a POI
 * @returns {string} HTML string for the popup content
 */
export function createPopupContent(poi) {
  const coordinateWarning = poi.properties.needsCoordinateUpdate
    ? '<p><small style="color: red;">Coordinates need to be updated</small></p>'
    : '';

  const addr = poi.properties.address || {};
  const street = addr.street || '';
  const city = addr.city || '';
  const state = addr.state || '';
  const zip = addr.zipCode || '';

  const fullAddress = zip
    ? `${street}<br>${city}, ${state} ${zip}`
    : `${street}<br>${city}, ${state}`;

  return `
    <div style="text-align: center;">
      <h3>${poi.properties.emoji || '📍'} ${poi.properties.name}</h3>
      <p><strong>${fullAddress}</strong></p>
      <p>${poi.properties.category || ''}</p>
      <p><em>${poi.properties.area || ''}</em></p>
      ${coordinateWarning}
    </div>
  `;
}

/**
 * Creates a Leaflet DivIcon configured as an emoji marker.
 * @param {string} emoji - Emoji character(s) to display as the marker
 * @param {number} [size=30] - Size of the marker in pixels (defaults to 30)
 * @returns {L.DivIcon} Leaflet DivIcon instance configured for the emoji marker
 */
export function createEmojiMarker(emoji, size = 30) {
  return L.divIcon({
    html: `<div style="font-size: ${size}px; text-align: center; line-height: 1;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: 'emoji-marker',
  });
}

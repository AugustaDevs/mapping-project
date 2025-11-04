// Shared helpers for map UI

export function createPopupContent(poi) {
  const coordinateWarning = poi.properties.needsCoordinateUpdate
    ? '<p><small style="color: red;">Coordinates need to be updated</small></p>'
    : "";

  const addr = poi.properties.address || {};
  const street = addr.street || "";
  const city = addr.city || "";
  const state = addr.state || "";
  const zip = addr.zipCode || "";

  const fullAddress = zip
    ? `${street}<br>${city}, ${state} ${zip}`
    : `${street}<br>${city}, ${state}`;

  return `
    <div style="text-align: center;">
      <h3>${poi.properties.emoji || "📍"} ${poi.properties.name}</h3>
      <p><strong>${fullAddress}</strong></p>
      <p>${poi.properties.category || ""}</p>
      <p><em>${poi.properties.area || ""}</em></p>
      ${coordinateWarning}
    </div>
  `;
}

export function createEmojiMarker(emoji, size = 30) {
  return L.divIcon({
    html: `<div style="font-size: ${size}px; text-align: center; line-height: 1;">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: "emoji-marker",
  });
}



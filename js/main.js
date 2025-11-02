/**
 * Main application script for the mapping project.
 * Initializes the Leaflet map and displays POI markers.
 */

// Load POI data
fetch("./assets/pois.json")
  .then((response) => response.json())
  .then((poisData) => {
    // Bounds for the map:
    const bounds = L.latLngBounds(
      L.latLng(33.46041, -81.95071), // Southwest corner
      L.latLng(33.48457, -81.98371) // Northeast corner
    );

    let map = L.map("map", {
      center: [33.47373, -81.96762],
      zoom: 15,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0, // Prevents panning outside bounds
      // dragging: false // This doesn't adjust with zoom, so folks can't see whole map at zoom
    }).setView([33.47718, -81.97114], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

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

    // Add markers for all POIs from JSON data
    poisData.features.forEach((poi) => {
      L.marker([poi.geometry.coordinates[1], poi.geometry.coordinates[0]])
        .addTo(map)
        .bindPopup(createPopupContent(poi));
    });
  })
  .catch((error) => {
    console.error("Error loading POI data:", error);
  });

import { createPopupContent, createEmojiMarker } from './utils.js';
/**
 * Admin tools for adding POIs and exporting updated POIs JSON.
 * This module provides functionality to add new POIs to the map interactively
 * and export the combined base and draft POIs as a GeoJSON FeatureCollection.
 */
(function () {
  const modalBackdrop = document.getElementById('poiModalBackdrop');
  const coordPreviewEl = document.getElementById('poiCoordPreview');
  const btnEnterAddPoi = document.getElementById('btnEnterAddPoi');
  const btnExportPois = document.getElementById('btnExportPois');
  const btnClearDraft = document.getElementById('btnClearDraft');
  const btnCancelPoi = document.getElementById('btnCancelPoi');
  const btnSavePoi = document.getElementById('btnSavePoi');

  const inputName = document.getElementById('poiName');
  const inputEmoji = document.getElementById('poiEmoji');
  const inputCategory = document.getElementById('poiCategory');
  const inputArea = document.getElementById('poiArea');
  const inputMarkerSize = document.getElementById('poiMarkerSize');
  const inputStreet = document.getElementById('addrStreet');
  const inputCity = document.getElementById('addrCity');
  const inputState = document.getElementById('addrState');
  const inputZip = document.getElementById('addrZip');

  let map = null;
  let basePois = null; // from assets/pois.json
  let draftPois = []; // added in this session or from localStorage
  let addModeActive = false;
  let pendingLatLng = null;
  let tempMarker = null;
  let draftMarkerLayers = [];

  /**
   * Displays the POI entry modal.
   */
  function showModal() {
    modalBackdrop.style.display = 'flex';
  }

  /**
   * Hides the POI entry modal and clears the form.
   */
  function hideModal() {
    modalBackdrop.style.display = 'none';
    clearForm();
  }

  /**
   * Clears all form input fields for the POI entry modal and resets them to default values.
   */
  function clearForm() {
    inputName.value = '';
    inputEmoji.value = '';
    inputCategory.value = '';
    inputArea.value = '';
    inputMarkerSize.value = '30';
    inputStreet.value = '';
    inputCity.value = '';
    inputState.value = '';
    inputZip.value = '';
    coordPreviewEl.textContent = '';
  }

  /**
   * Activates or deactivates add mode for placing new POIs on the map.
   * @param {boolean} active - Whether to activate add mode (true) or deactivate it (false)
   */
  function setAddMode(active) {
    addModeActive = active;
    if (!map) return;
    map.getContainer().style.cursor = active ? 'crosshair' : '';
    if (!active && tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
      pendingLatLng = null;
    }
  }

  /**
   * Combines base POIs (from assets/pois.json) and draft POIs into a single GeoJSON FeatureCollection.
   * @returns {Object} GeoJSON FeatureCollection containing all base and draft POIs
   * @returns {string} returns.type - Always "FeatureCollection"
   * @returns {Object[]} returns.features - Array of GeoJSON Feature objects
   */
  function getAllPoisFeatureCollection() {
    const features = [];
    if (basePois && Array.isArray(basePois.features)) {
      for (const feature of basePois.features) features.push(feature);
    }
    for (const feature of draftPois) features.push(feature);
    return { type: 'FeatureCollection', features };
  }

  /**
   * Saves draft POIs to browser localStorage for persistence across sessions.
   * Errors are logged but do not throw to prevent breaking the user experience.
   */
  function persistDraftToLocalStorage() {
    try {
      localStorage.setItem('draftPois', JSON.stringify(draftPois));
    } catch (error) {
      console.error('Error persisting draft POIs to localStorage:', error);
    }
  }

  /**
   * Loads draft POIs from browser localStorage if they exist.
   * Errors are logged but do not throw to prevent breaking the user experience.
   */
  function loadDraftFromLocalStorage() {
    try {
      const raw = localStorage.getItem('draftPois');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          draftPois = parsed;
        }
      }
    } catch (error) {
      console.error('Error loading draft POIs from localStorage:', error);
    }
  }

  /**
   * Adds a Leaflet marker to the map for the given POI.
   * @param {Object} poi - GeoJSON Feature object representing a POI
   * @param {Object} poi.geometry - GeoJSON geometry object
   * @param {number[]} poi.geometry.coordinates - Array of [longitude, latitude]
   * @param {Object} poi.properties - POI properties
   * @param {string} [poi.properties.emoji] - Emoji for the marker (defaults to '📍')
   * @param {number} [poi.properties.markerSize] - Size of the marker in pixels (defaults to 30)
   * @returns {L.Marker} The Leaflet marker instance that was added to the map
   */
  function addMarkerForPOI(poi) {
    const emoji = poi.properties.emoji || '📍';
    const markerSize = poi.properties.markerSize || 30;
    const marker = L.marker(
      [poi.geometry.coordinates[1], poi.geometry.coordinates[0]],
      {
        icon: createEmojiMarker(emoji, markerSize),
      }
    ).addTo(map);
    marker.bindPopup(createPopupContent(poi));
    draftMarkerLayers.push(marker);
    return marker;
  }

  /**
   * Exports all POIs (base + draft) as a JSON file download.
   * Creates a GeoJSON FeatureCollection and triggers a browser download.
   */
  function exportUpdatedPois() {
    const data = getAllPoisFeatureCollection();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pois.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Wires up all event listeners for admin UI interactions.
   * Sets up handlers for buttons and map click events.
   */
  function wireEvents() {
    btnEnterAddPoi.addEventListener('click', () => {
      setAddMode(true);
    });

    btnExportPois.addEventListener('click', () => {
      exportUpdatedPois();
    });

    btnClearDraft.addEventListener('click', () => {
      draftPois = [];
      persistDraftToLocalStorage();
      try {
        map.closePopup();
      } catch (error) {
        console.error('Error closing popup:', error);
      }
      // Remove draft markers currently shown on the map
      if (draftMarkerLayers && draftMarkerLayers.length) {
        for (const layer of draftMarkerLayers) {
          try {
            map.removeLayer(layer);
          } catch (error) {
            console.error('Error removing layer:', error);
          }
        }
      }
      draftMarkerLayers = [];
      // Remove any temporary marker from add-mode
      if (tempMarker) {
        try {
          map.removeLayer(tempMarker);
        } catch (error) {
          console.error('Error removing temp marker:', error);
        }
        tempMarker = null;
      }
      pendingLatLng = null;
      alert(
        'Draft POIs cleared. Previously exported pois.json files are unaffected.'
      );
    });

    btnCancelPoi.addEventListener('click', () => {
      setAddMode(false);
      hideModal();
    });

    btnSavePoi.addEventListener('click', () => {
      if (!pendingLatLng) return;
      const name = inputName.value.trim();
      if (!name) {
        alert('Please provide a name.');
        return;
      }
      const emoji = inputEmoji.value.trim() || '📍';
      const category = inputCategory.value.trim();
      const area = inputArea.value.trim();
      const markerSize = Math.max(
        16,
        Math.min(64, parseInt(inputMarkerSize.value, 10) || 30)
      );
      const address = {
        street: inputStreet.value.trim(),
        city: inputCity.value.trim(),
        state: inputState.value.trim(),
        zipCode: inputZip.value.trim(),
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

      // Append to draft list and render
      draftPois.push(feature);
      persistDraftToLocalStorage();
      addMarkerForPOI(feature);

      // Reset add mode and close modal
      setAddMode(false);
      hideModal();
      alert(
        'POI added to draft. Use Export JSON to download updated pois.json.'
      );
    });

    // map click handler for add mode
    map.on('click', (ev) => {
      if (!addModeActive) return;
      pendingLatLng = ev.latlng;
      if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
      }
      tempMarker = L.marker(pendingLatLng).addTo(map);
      coordPreviewEl.textContent = `Selected: ${pendingLatLng.lat.toFixed(6)}, ${pendingLatLng.lng.toFixed(6)}`;
      showModal();
    });
  }

  /**
   * Initializes the admin module when the map and POI data are ready.
   * Polls for window.__leafletMap and window.__poisData to be available,
   * then loads draft POIs from localStorage and wires up event handlers.
   */
  function bootstrapWhenReady() {
    if (window.__leafletMap && window.__poisData) {
      map = window.__leafletMap;
      basePois = window.__poisData;

      // Render any existing draft POIs on load
      loadDraftFromLocalStorage();
      for (const f of draftPois) addMarkerForPOI(f);

      wireEvents();
      return;
    }
    setTimeout(bootstrapWhenReady, 50);
  }

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapWhenReady);
  } else {
    bootstrapWhenReady();
  }
})();

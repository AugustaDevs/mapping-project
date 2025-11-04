import { createPopupContent, createEmojiMarker } from "./utils.js";
// Admin tools for adding POIs and exporting updated JSON
(function () {
  const modalBackdrop = document.getElementById("poiModalBackdrop");
  const coordPreviewEl = document.getElementById("poiCoordPreview");
  const btnEnterAddPoi = document.getElementById("btnEnterAddPoi");
  const btnExportPois = document.getElementById("btnExportPois");
  const btnClearDraft = document.getElementById("btnClearDraft");
  const btnCancelPoi = document.getElementById("btnCancelPoi");
  const btnSavePoi = document.getElementById("btnSavePoi");

  const inputName = document.getElementById("poiName");
  const inputEmoji = document.getElementById("poiEmoji");
  const inputCategory = document.getElementById("poiCategory");
  const inputArea = document.getElementById("poiArea");
  const inputMarkerSize = document.getElementById("poiMarkerSize");
  const inputStreet = document.getElementById("addrStreet");
  const inputCity = document.getElementById("addrCity");
  const inputState = document.getElementById("addrState");
  const inputZip = document.getElementById("addrZip");

  let map = null;
  let basePois = null; // from assets/pois.json
  let draftPois = []; // added in this session or from localStorage
  let addModeActive = false;
  let pendingLatLng = null;
  let tempMarker = null;
  let draftMarkerLayers = [];

  function showModal() {
    modalBackdrop.style.display = "flex";
  }

  function hideModal() {
    modalBackdrop.style.display = "none";
    clearForm();
  }

  function clearForm() {
    inputName.value = "";
    inputEmoji.value = "";
    inputCategory.value = "";
    inputArea.value = "";
    inputMarkerSize.value = "30";
    inputStreet.value = "";
    inputCity.value = "";
    inputState.value = "";
    inputZip.value = "";
    coordPreviewEl.textContent = "";
  }

  function setAddMode(active) {
    addModeActive = active;
    if (!map) return;
    map.getContainer().style.cursor = active ? "crosshair" : "";
    if (!active && tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
      pendingLatLng = null;
    }
  }

  function getAllPoisFeatureCollection() {
    const features = [];
    if (basePois && Array.isArray(basePois.features)) {
      for (const f of basePois.features) features.push(f);
    }
    for (const f of draftPois) features.push(f);
    return { type: "FeatureCollection", features };
  }

  function persistDraftToLocalStorage() {
    try {
      localStorage.setItem("draftPois", JSON.stringify(draftPois));
    } catch (error) {
      console.error("Error persisting draft POIs to localStorage:", error);
    }
  }

  function loadDraftFromLocalStorage() {
    try {
      const raw = localStorage.getItem("draftPois");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          draftPois = parsed;
        }
      }
    } catch (error) {
      console.error("Error loading draft POIs from localStorage:", error);
    }
  }

  function addMarkerForPOI(poi) {
    const emoji = poi.properties.emoji || "📍";
    const markerSize = poi.properties.markerSize || 30;
    const marker = L.marker([poi.geometry.coordinates[1], poi.geometry.coordinates[0]], {
      icon: createEmojiMarker(emoji, markerSize),
    }).addTo(map);
    marker.bindPopup(createPopupContent(poi));
    draftMarkerLayers.push(marker);
    return marker;
  }

  function exportUpdatedPois() {
    const data = getAllPoisFeatureCollection();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pois.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function wireEvents() {
    btnEnterAddPoi.addEventListener("click", () => {
      setAddMode(true);
    });

    btnExportPois.addEventListener("click", () => {
      exportUpdatedPois();
    });

    btnClearDraft.addEventListener("click", () => {
      draftPois = [];
      persistDraftToLocalStorage();
      try {
        map.closePopup();
      } catch (error) {
        console.error("Error closing popup:", error);
      }
      // Remove draft markers currently shown on the map
      if (draftMarkerLayers && draftMarkerLayers.length) {
        for (const layer of draftMarkerLayers) {
          try {
            map.removeLayer(layer);
          } catch (error) {
            console.error("Error removing layer:", error);
          }
        }
      }
      draftMarkerLayers = [];
      // Remove any temporary marker from add-mode
      if (tempMarker) {
        try {
          map.removeLayer(tempMarker);
        } catch (error) {
          console.error("Error removing temp marker:", error);
        }
        tempMarker = null;
      }
      pendingLatLng = null;
      alert("Draft POIs cleared. Previously exported pois.json files are unaffected.");
    });

    btnCancelPoi.addEventListener("click", () => {
      setAddMode(false);
      hideModal();
    });

    btnSavePoi.addEventListener("click", () => {
      if (!pendingLatLng) return;
      const name = inputName.value.trim();
      if (!name) {
        alert("Please provide a name.");
        return;
      }
      const emoji = inputEmoji.value.trim() || "📍";
      const category = inputCategory.value.trim();
      const area = inputArea.value.trim();
      const markerSize = Math.max(16, Math.min(64, parseInt(inputMarkerSize.value, 10) || 30));
      const address = {
        street: inputStreet.value.trim(),
        city: inputCity.value.trim(),
        state: inputState.value.trim(),
        zipCode: inputZip.value.trim(),
      };

      const feature = {
        type: "Feature",
        geometry: {
          type: "Point",
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
      alert("POI added to draft. Use Export JSON to download updated pois.json.");
    });

    // map click handler for add mode
    map.on("click", (ev) => {
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapWhenReady);
  } else {
    bootstrapWhenReady();
  }
})();



<script lang="ts">
	import { onMount } from 'svelte';
	import type { POI, POICollection } from './types/poi.js';
	import poisData from './assets/pois.json';

	let mapContainer: HTMLDivElement;
	let map: any;

	// Cast the imported JSON data to our POI type
	const pois: POICollection = poisData as POICollection;

	onMount(async () => {
		// Load Leaflet from CDN if not already loaded
		if (typeof (window as any).L === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
			script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
			script.crossOrigin = '';
			document.head.appendChild(script);

			// Wait for script to load
			await new Promise((resolve) => {
				script.onload = resolve;
			});
		}

		const L = (window as any).L;

		// Bounds for the map:
		const bounds = L.latLngBounds(
			L.latLng(33.46041, -81.95071), // Southwest corner
			L.latLng(33.48457, -81.98371) // Northeast corner
		);

		map = L.map(mapContainer, {
			center: [33.47373, -81.96762],
			zoom: 15,
			maxBounds: bounds,
			maxBoundsViscosity: 1.0, // Prevents panning outside bounds
			zoomControl: false // Removes zoom buttons for cleaner look
		}).setView([33.47718, -81.97114], 15);

		// Define multiple artistic tile layers (all free, no API key required)
		const tileLayers = {
			// CartoDB styles - free and artistic
			dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
				maxZoom: 19,
				attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
				subdomains: 'abcd'
			}),

			voyager: L.tileLayer(
				'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
				{
					maxZoom: 19,
					attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
					subdomains: 'abcd'
				}
			),

			positron: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				maxZoom: 19,
				attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
				subdomains: 'abcd'
			}),

			// OpenStreetMap variants
			osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; OpenStreetMap contributors'
			}),

			// Esri satellite imagery - very artistic!
			satellite: L.tileLayer(
				'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 19,
					attribution:
						'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
				}
			)
		};

		// Start with voyager theme - chill and artistic without being too dark
		tileLayers.voyager.addTo(map);

		// Add layer control for easy switching
		L.control
			.layers({
				'🗺️ Voyager': tileLayers.voyager,
				'☀️ Light Theme': tileLayers.positron,
				'🛰️ Satellite': tileLayers.satellite,
				'🌙 Dark Theme': tileLayers.dark,
				'📍 Standard': tileLayers.osm
			})
			.addTo(map);

		// Create custom emoji markers function
		function createEmojiMarker(emoji: string, size = 30) {
			return L.divIcon({
				html: `<div style="font-size: ${size}px; text-align: center; line-height: 1;">${emoji}</div>`,
				iconSize: [size, size],
				iconAnchor: [size / 2, size / 2],
				popupAnchor: [0, -size / 2],
				className: 'emoji-marker'
			});
		}

		// Function to create popup content from POI data
		function createPopupContent(poi: POI): string {
			const coordinateWarning = poi.needsCoordinateUpdate
				? '<p><small style="color: red;">Coordinates need to be updated</small></p>'
				: '';

			const fullAddress = poi.address.zipCode
				? `${poi.address.street}<br>${poi.address.city}, ${poi.address.state} ${poi.address.zipCode}`
				: `${poi.address.street}<br>${poi.address.city}, ${poi.address.state}`;

			return `
				<div style="text-align: center;">
					<h3>${poi.emoji} ${poi.name}</h3>
					<p><strong>${fullAddress}</strong></p>
					<p>${poi.category}</p>
					<p><em>${poi.area}</em></p>
					${coordinateWarning}
				</div>
			`;
		}

		// Note: Click-to-copy coordinates functionality moved to admin page

		// Add markers for all POIs from JSON data
		pois.forEach((poi) => {
			const marker = L.marker([poi.coordinates.lat, poi.coordinates.lng], {
				icon: createEmojiMarker(poi.emoji, poi.markerSize || 30)
			}).addTo(map);

			marker.bindPopup(createPopupContent(poi));
		});
	});
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
	.map-container {
		height: 100vh;
		width: 100vw;
		margin: 0;
		padding: 0;
	}

	/* Style the layer control for a more artistic look */
	:global(.leaflet-control-layers) {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	:global(.leaflet-control-layers-expanded) {
		padding: 16px;
		min-width: 200px;
	}

	:global(.leaflet-control-layers label) {
		font-size: 14px;
		margin: 8px 0;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.leaflet-control-layers label:hover) {
		color: #2196f3;
		transform: translateX(2px);
	}

	:global(.leaflet-control-layers-separator) {
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		margin: 8px 0;
	}

	/* Emoji marker styling */
	:global(.emoji-marker) {
		background: none !important;
		border: none !important;
		filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
		transition: all 0.2s ease;
		cursor: pointer;
	}

	:global(.emoji-marker:hover) {
		transform: scale(1.2);
		filter: drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.4));
	}

	/* Popup styling to match the artistic theme */
	:global(.leaflet-popup-content-wrapper) {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	:global(.leaflet-popup-tip) {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
	}
</style>

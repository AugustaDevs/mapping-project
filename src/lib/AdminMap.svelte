<script lang="ts">
	import { onMount } from 'svelte';

	let mapContainer: HTMLDivElement;
	let map: any;
	let tempMarker: any = null;

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
			zoomControl: true // Keep zoom controls for admin
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

		// Function to copy coordinates to clipboard
		(window as any).copyCoordinates = function (coords: string) {
			navigator.clipboard
				.writeText(coords)
				.then(function () {
					// Show success notification
					showNotification('✅ Coordinates copied to clipboard: ' + coords, 'success');
				})
				.catch(function () {
					// Fallback for older browsers
					const textArea = document.createElement('textarea');
					textArea.value = coords;
					document.body.appendChild(textArea);
					textArea.select();
					document.execCommand('copy');
					document.body.removeChild(textArea);
					showNotification('✅ Coordinates copied to clipboard: ' + coords, 'success');
				});
		};

		// Enhanced notification function
		function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
			const notification = document.createElement('div');
			notification.textContent = message;
			notification.style.cssText = `
				position: fixed;
				top: 20px;
				right: 20px;
				background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
				color: white;
				padding: 12px 20px;
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0,0,0,0.2);
				z-index: 10000;
				font-family: inherit;
				font-size: 14px;
				transition: all 0.3s ease;
				transform: translateX(100%);
			`;

			document.body.appendChild(notification);

			// Animate in
			setTimeout(() => {
				notification.style.transform = 'translateX(0)';
			}, 10);

			// Remove after 3 seconds
			setTimeout(() => {
				notification.style.transform = 'translateX(100%)';
				setTimeout(() => {
					document.body.removeChild(notification);
				}, 300);
			}, 3000);
		}

		// Click event to place temporary marker and show coordinates
		map.on('click', function (e: any) {
			const lat = e.latlng.lat.toFixed(6);
			const lng = e.latlng.lng.toFixed(6);

			// Remove previous temporary marker if it exists
			if (tempMarker) {
				map.removeLayer(tempMarker);
			}

			// Add new temporary marker with emoji
			tempMarker = L.marker([lat, lng], {
				icon: createEmojiMarker('📍', 30)
			})
				.addTo(map)
				.bindPopup(
					`
					<div style="text-align: center; font-family: inherit;">
						<h3 style="margin: 0 0 15px 0; color: #333;">📍 Coordinates</h3>
						<div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin: 10px 0;">
							<p style="margin: 5px 0; font-weight: 600;"><strong>Latitude:</strong> <code style="background: white; padding: 2px 4px; border-radius: 3px;">${lat}</code></p>
							<p style="margin: 5px 0; font-weight: 600;"><strong>Longitude:</strong> <code style="background: white; padding: 2px 4px; border-radius: 3px;">${lng}</code></p>
						</div>
						<p style="margin: 10px 0; font-size: 12px; color: #666;"><small>Click anywhere else to place a new pin</small></p>
						<div style="display: flex; gap: 8px; justify-content: center; margin-top: 15px;">
							<button onclick="copyCoordinates('${lat}, ${lng}')" style="
								background: #2196F3; 
								color: white; 
								border: none; 
								padding: 8px 16px; 
								border-radius: 6px; 
								cursor: pointer; 
								font-size: 13px;
								font-weight: 500;
								transition: background 0.2s;
							" onmouseover="this.style.background='#1976D2'" onmouseout="this.style.background='#2196F3'">
								📋 Copy Coordinates
							</button>
							<button onclick="copyCoordinates('${lat}')" style="
								background: #4CAF50; 
								color: white; 
								border: none; 
								padding: 8px 12px; 
								border-radius: 6px; 
								cursor: pointer; 
								font-size: 12px;
								font-weight: 500;
								transition: background 0.2s;
							" onmouseover="this.style.background='#388E3C'" onmouseout="this.style.background='#4CAF50'">
								Lat
							</button>
							<button onclick="copyCoordinates('${lng}')" style="
								background: #FF9800; 
								color: white; 
								border: none; 
								padding: 8px 12px; 
								border-radius: 6px; 
								cursor: pointer; 
								font-size: 12px;
								font-weight: 500;
								transition: background 0.2s;
							" onmouseover="this.style.background='#F57C00'" onmouseout="this.style.background='#FF9800'">
								Lng
							</button>
						</div>
					</div>
				`
				)
				.openPopup();

			// Also log to console for easy copying
			console.log(`🗺️ Admin Coordinates: ${lat}, ${lng}`);
		});

		// Add marker for Book Tavern (temporary - will be updated with correct coordinates)
		const bookTavernMarker = L.marker([33.476753, -81.970893], {
			icon: createEmojiMarker('📚', 35)
		}).addTo(map).bindPopup(`
				<div style="text-align: center;">
					<h3>📚The Book Tavern</h3>
					<p><strong>978 Broad Street</strong></p>
					<p>Augusta, GA 30901</p>
					<p>Bookstore</p>
					<p><em>Downtown Augusta</em></p>
					<p><small style="color: red;">Coordinates need to be updated</small></p>
				</div>
			`);

		// Add marker for Boll Weevil
		const bollWeevilMarker = L.marker([33.478082, -81.966172], {
			icon: createEmojiMarker('🐛', 35)
		}).addTo(map).bindPopup(`
				<div style="text-align: center;">
					<h3>🐛 Boll Weevil Cafe & Sweetery</h3>
					<p><strong>Broad Street</strong></p>
					<p>Augusta, GA</p>
					<p>Restaurant & Cafe</p>
					<p><em>Downtown Augusta</em></p>
					<p><small style="color: red;">Coordinates need to be updated with exact location</small></p>
				</div>
			`);
	});
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
	.map-container {
		height: 100%;
		width: 100%;
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
		min-width: 280px;
	}

	:global(.leaflet-popup-tip) {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
	}

	/* Zoom control positioning for admin */
	:global(.leaflet-control-zoom) {
		margin-left: 10px;
		margin-top: 10px;
	}

	:global(.leaflet-control-zoom a) {
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
</style>

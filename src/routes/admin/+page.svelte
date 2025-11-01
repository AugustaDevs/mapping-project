<script>
	import AdminMap from '$lib/AdminMap.svelte';
</script>

<svelte:head>
	<title>Admin - Mapping Project</title>
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""
	/>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<div class="header-line"></div>
		<nav class="back-nav">
			<a href="/" class="back-link">← Back to Map</a>
		</nav>
		<div class="admin-title">
			<h1>🗺️ Admin Panel</h1>
			<p>Click anywhere on the map to get coordinates</p>
		</div>
	</header>

	<main class="admin-main">
		<AdminMap />
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.admin-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.admin-header {
		position: relative;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		padding: 1rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.header-line {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
		z-index: 1001;
	}

	.admin-title {
		margin-top: 8px;
	}

	.admin-title h1 {
		margin: 0;
		font-size: 1.8rem;
		color: #333;
		font-weight: 600;
	}

	.admin-title p {
		margin: 0.5rem 0 0 0;
		color: #666;
		font-size: 0.9rem;
	}

	.back-nav {
		position: absolute;
		top: 15px;
		left: 15px;
		z-index: 1002;
	}

	.back-link {
		display: inline-block;
		padding: 8px 16px;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		text-decoration: none;
		color: #333;
		font-size: 14px;
		font-weight: 500;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		transition: all 0.2s ease;
	}

	.back-link:hover {
		background: rgba(255, 255, 255, 1);
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
	}

	.admin-main {
		flex: 1;
		overflow: hidden;
	}
</style>

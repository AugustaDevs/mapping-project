<script>
	import Map from '$lib/Map.svelte';
</script>

<div class="header-line"></div>
<nav class="admin-nav">
	<a href="/admin" class="admin-link">🔧 Admin</a>
</nav>
<Map />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.header-line {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
		z-index: 1000;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.admin-nav {
		position: absolute;
		top: 15px;
		right: 15px;
		z-index: 1001;
	}

	.admin-link {
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

	.admin-link:hover {
		background: rgba(255, 255, 255, 1);
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
	}
</style>

<script lang="ts" module>
	export type IconName =
		| 'journal'
		| 'bean'
		| 'grinder'
		| 'cup'
		| 'v60'
		| 'espresso'
		| 'aeropress'
		| 'timer'
		| 'plus'
		| 'chevron'
		| 'chevronLeft'
		| 'search'
		| 'camera'
		| 'star'
		| 'check'
		| 'close'
		| 'compare'
		| 'dots'
		| 'droplet'
		| 'scale'
		| 'leaf'
		| 'play'
		| 'pause'
		| 'reset'
		| 'milk'
		| 'coffee';
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		size?: number;
		stroke?: string;
		strokeWidth?: number;
		filled?: boolean;
	}

	let { name, size = 20, stroke = 'currentColor', strokeWidth = 1.6, filled = false }: Props = $props();
</script>

{#if name === 'star'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? stroke : 'none'} {stroke} stroke-width="1.6" stroke-linejoin="round">
		<path d="M12 3l2.6 5.5 6 .8-4.3 4.2 1.1 6L12 16.8 6.6 19.5l1.1-6L3.4 9.3l6-.8z" />
	</svg>
{:else}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		{stroke}
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{#if name === 'journal'}
			<path d="M5 4h12a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V4z" />
			<path d="M5 4v15" />
			<path d="M9 8h6M9 12h6M9 16h4" />
		{:else if name === 'bean'}
			<path d="M16.5 4.5c2.5 2.5 2 8-2 12s-9.5 4.5-12 2-2-8 2-12 9.5-4.5 12-2z" />
			<path d="M14 6c-3 1.5-7 5.5-8.5 8.5" />
		{:else if name === 'grinder'}
			<path d="M7 3h10v5H7z" />
			<path d="M9 8v3h6V8" />
			<path d="M8 11h8l-1 4H9z" />
			<path d="M10 15v3a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-3" />
			<circle cx="12" cy="5.5" r="0.8" fill={stroke} stroke="none" />
		{:else if name === 'cup'}
			<path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
			<path d="M17 10h2a2 2 0 0 1 0 4h-2" />
			<path d="M9 5c.5-1 1.5-1 2 0M13 5c.5-1 1.5-1 2 0" />
		{:else if name === 'v60'}
			<path d="M5 6h14l-5 9h-4z" />
			<path d="M10 15v3M14 15v3" />
			<path d="M9 18h6" />
			<path d="M5 6l-1-1M19 6l1-1" />
		{:else if name === 'espresso'}
			<rect x="6" y="9" width="12" height="8" rx="1" />
			<path d="M8 9V7h8v2" />
			<path d="M10 17v3M14 17v3" />
			<path d="M11 4v2M13 3v3" />
		{:else if name === 'aeropress'}
			<path d="M8 4h8v12H8z" />
			<path d="M8 16l-1 4h10l-1-4" />
			<path d="M10 4V3a2 2 0 0 1 4 0v1" />
			<path d="M9 9h6M9 12h6" />
		{:else if name === 'timer'}
			<circle cx="12" cy="13" r="8" />
			<path d="M12 13V9" />
			<path d="M9 3h6" />
			<path d="M19 6l1.5-1.5" />
		{:else if name === 'plus'}
			<path d="M12 5v14M5 12h14" />
		{:else if name === 'chevron'}
			<path d="M9 6l6 6-6 6" />
		{:else if name === 'chevronLeft'}
			<path d="M15 6l-6 6 6 6" />
		{:else if name === 'search'}
			<circle cx="11" cy="11" r="6" />
			<path d="M16 16l4 4" />
		{:else if name === 'camera'}
			<path d="M3 8h4l2-3h6l2 3h4v11H3z" />
			<circle cx="12" cy="13" r="3.5" />
		{:else if name === 'check'}
			<path d="M5 12l5 5L20 6" stroke-width={strokeWidth + 0.6} />
		{:else if name === 'close'}
			<path d="M6 6l12 12M18 6l-6 12" />
		{:else if name === 'compare'}
			<path d="M8 4v16M16 4v16" />
			<path d="M4 8l4-4 4 4M20 16l-4 4-4-4" />
		{:else if name === 'dots'}
			<circle cx="5" cy="12" r="1.2" fill={stroke} stroke="none" />
			<circle cx="12" cy="12" r="1.2" fill={stroke} stroke="none" />
			<circle cx="19" cy="12" r="1.2" fill={stroke} stroke="none" />
		{:else if name === 'droplet'}
			<path d="M12 3l5 7a6 6 0 1 1-10 0z" />
		{:else if name === 'scale'}
			<rect x="3" y="6" width="18" height="14" rx="2" />
			<path d="M7 6V4h10v2" />
			<circle cx="12" cy="13" r="3" />
			<path d="M12 11v2l1.5 1" />
		{:else if name === 'leaf'}
			<path d="M5 19c0-7 5-12 14-13-1 9-6 14-13 14" />
			<path d="M5 19c2-5 6-9 11-11" />
		{:else if name === 'play'}
			<path d="M7 4l13 8-13 8z" fill={stroke} stroke="none" />
		{:else if name === 'pause'}
			<rect x="6" y="4" width="4" height="16" fill={stroke} stroke="none" />
			<rect x="14" y="4" width="4" height="16" fill={stroke} stroke="none" />
		{:else if name === 'reset'}
			<path d="M3 12a9 9 0 1 0 3-6.7" />
			<path d="M3 4v5h5" />
		{:else if name === 'milk'}
			<path d="M9 2h6v3l2 4v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-4z" />
			<path d="M7 12h10" />
		{:else if name === 'coffee'}
			<path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
			<path d="M17 10h2a2 2 0 0 1 0 4h-2" />
			<path d="M9 2c0 1 1 2 1 3s-1 2-1 3M13 2c0 1 1 2 1 3s-1 2-1 3" />
		{/if}
	</svg>
{/if}

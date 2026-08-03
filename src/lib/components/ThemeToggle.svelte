<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';

	interface Props {
		size?: number;
	}

	let { size = 16 }: Props = $props();

	// When no explicit theme is set we follow the system preference, so track it
	// reactively to keep the icon/label correct (including live OS theme changes).
	let systemDark = $state(false);

	$effect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		systemDark = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (systemDark = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const isDark = $derived(themeStore.value ? themeStore.value === 'dark' : systemDark);
	const label = $derived(isDark ? 'Switch to light theme' : 'Switch to dark theme');
</script>

<button class="theme-toggle" type="button" onclick={() => themeStore.toggle()} aria-label={label} title={label}>
	<Icon name={isDark ? 'sun' : 'moon'} {size} />
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid var(--line-soft);
		background: var(--card-2);
		color: var(--ink-2);
		cursor: pointer;
		flex-shrink: 0;
	}
	.theme-toggle:hover {
		color: var(--ink);
		border-color: var(--line);
	}
</style>

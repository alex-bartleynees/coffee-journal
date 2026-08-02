<script lang="ts">
	interface Props {
		value: number;
		onChange: (v: number) => void;
		accent?: boolean;
	}

	let { value, onChange, accent = false }: Props = $props();

	const color = $derived(accent ? 'var(--accent)' : 'var(--ink)');

	const feedback = $derived(
		value >= 9
			? 'Exceptional — buy more now'
			: value >= 7
				? 'Good. Worth keeping'
				: value >= 5
					? 'Fine. Could be better'
					: value >= 3
						? 'Off. Re-dial?'
						: 'Pour it out'
	);
</script>

<div class="dial">
	<div class="dial-value" style="color:{color}">
		{value}<span class="dial-denom">/ 10</span>
	</div>
	<div class="dial-bars">
		{#each Array.from({ length: 10 }) as _, i (i)}
			<button
				class="dial-bar"
				style="background:{value >= i + 1 ? color : 'var(--paper-2)'}"
				onclick={() => onChange(i + 1)}
				aria-label="Rate {i + 1}"
			></button>
		{/each}
	</div>
	<div class="dial-feedback">{feedback}</div>
</div>

<style>
	.dial {
		padding: 18px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	.dial-value {
		display: flex;
		align-items: baseline;
		gap: 4px;
		font-family: var(--serif);
		font-size: 56px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -2px;
	}
	.dial-denom {
		font-size: 18px;
		color: var(--ink-3);
		font-style: italic;
	}
	.dial-bars {
		display: flex;
		gap: 4px;
		padding: 0 12px;
		width: 100%;
	}
	.dial-bar {
		flex: 1;
		height: 36px;
		border-radius: 8px;
		transition: background 0.15s;
	}
	.dial-feedback {
		font-size: 11px;
		color: var(--ink-3);
		font-style: italic;
		font-family: var(--serif);
		text-align: center;
	}
</style>

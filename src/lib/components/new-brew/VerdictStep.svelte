<script lang="ts">
	import RatingDial from './RatingDial.svelte';
	import type { DraftBrew } from './DraftBrew';

	interface Props {
		draft: DraftBrew;
	}

	let { draft }: Props = $props();

	const buyOptions = ['Yes', 'Maybe', 'No'] as const;
	const bestForOptions = ['Daily driver', 'Occasional', 'Skip'] as const;
</script>

<div class="step">
	<div class="section-label" style="padding-top: 4px">
		{draft.withMilk ? 'Straight espresso' : 'Overall rating'}
	</div>
	<RatingDial value={draft.rating} onChange={(v) => (draft.rating = v)} />

	{#if draft.withMilk}
		<div class="section-label">In milk (flat white)</div>
		<RatingDial value={draft.rating2 ?? 7} onChange={(v) => (draft.rating2 = v)} accent />

		<div class="milk-row">
			<div>
				<div class="milk-title">Cuts through milk</div>
				<div class="milk-sub">Flavor stands up</div>
			</div>
			<button
				class="toggle"
				class:on={draft.cutsThruMilk}
				onclick={() => (draft.cutsThruMilk = !draft.cutsThruMilk)}
				aria-label="Cuts through milk"
				aria-pressed={draft.cutsThruMilk}
			>
				<span class="toggle-thumb"></span>
			</button>
		</div>
	{/if}

	<div class="section-label">Would buy again?</div>
	<div class="option-row">
		{#each buyOptions as o (o)}
			<button class="chip" class:active={draft.buyAgain === o} onclick={() => (draft.buyAgain = o)}>{o}</button>
		{/each}
	</div>

	<div class="section-label">Best for</div>
	<div class="option-row">
		{#each bestForOptions as o (o)}
			<button class="chip" class:active={draft.bestFor === o} onclick={() => (draft.bestFor = o)}>{o}</button>
		{/each}
	</div>
</div>

<style>
	.step {
		padding: 8px 16px;
	}
	.milk-row {
		margin-top: 12px;
		padding: 12px 14px;
		background: var(--card);
		border-radius: var(--r-md);
		border: 1px solid var(--line-soft);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.milk-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--ink);
	}
	.milk-sub {
		font-size: 11px;
		color: var(--ink-3);
	}
	.toggle {
		width: 44px;
		height: 26px;
		border-radius: 100px;
		background: var(--line);
		position: relative;
		transition: background 0.2s;
	}
	.toggle.on {
		background: var(--ink);
	}
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #fff;
		transition: left 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.toggle.on .toggle-thumb {
		left: 20px;
	}
	.option-row {
		display: flex;
		gap: 6px;
		padding-bottom: 8px;
	}
	.option-row .chip {
		flex: 1;
		justify-content: center;
		padding: 10px;
		font-size: 13px;
	}
</style>

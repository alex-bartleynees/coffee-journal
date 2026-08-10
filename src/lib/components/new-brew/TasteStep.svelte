<script lang="ts">
	import { TASTE_DESCRIPTORS } from '$lib/data/sample';
	import type { DraftBrew } from './DraftBrew';

	interface Props {
		draft: DraftBrew;
	}

	let { draft }: Props = $props();

	function toggleDesc(d: string) {
		draft.descriptors = draft.descriptors.includes(d)
			? draft.descriptors.filter((x) => x !== d)
			: [...draft.descriptors, d];
	}

	const noteFields: { key: 'aroma' | 'flavor' | 'body' | 'finish'; label: string; placeholder: string }[] = [
		{ key: 'aroma', label: 'Aroma · nose', placeholder: 'Bright florals, fresh berries…' },
		{ key: 'flavor', label: 'Flavor', placeholder: 'What hits first, mid, last…' },
		{ key: 'body', label: 'Body / mouthfeel', placeholder: 'Light, syrupy, juicy…' },
		{ key: 'finish', label: 'Finish / aftertaste', placeholder: 'Long, clean, lingering…' }
	];
</script>

<div class="step">
	<div class="col-left">
		<div class="section-label" style="padding-top: 4px">Tasting notes</div>
		{#each Object.entries(TASTE_DESCRIPTORS) as [cat, items] (cat)}
			<div class="cat-block">
				<div class="cat-label">{cat}</div>
				<div class="chip-group">
					{#each items as item (item)}
						<button class="chip" class:active={draft.descriptors.includes(item)} onclick={() => toggleDesc(item)}>
							{item}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="col-right">
		<div class="section-label">Notes</div>
		<div class="notes">
			{#each noteFields as f (f.key)}
				<div class="field">
					<div class="field-label">{f.label}</div>
					<textarea class="field-input" rows="2" placeholder={f.placeholder} bind:value={draft[f.key]}></textarea>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.step {
		padding: 8px 16px;
	}
	.col-left,
	.col-right {
		display: contents;
	}
	.cat-block {
		margin-bottom: 14px;
	}
	.cat-label {
		font-size: 11px;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: var(--ink-3);
		font-weight: 500;
		margin-bottom: 6px;
	}
	.notes {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	@media (min-width: 860px) {
		.step {
			padding: 0;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 32px;
		}
		.col-left,
		.col-right {
			display: block;
		}
	}
</style>

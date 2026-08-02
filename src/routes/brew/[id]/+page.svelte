<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import StarRow from '$lib/components/StarRow.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { METHOD_LABELS, beanById, formatExtractionTime } from '$lib/data/sample';

	const brew = $derived(journal.brews.find((b) => b.id === page.params.id));
	const beans = $derived(beanById(journal.beans));
	const bean = $derived(brew ? beans[brew.beanId] : undefined);

	const prevBrew = $derived.by(() => {
		if (!brew) return undefined;
		return journal.brews
			.filter((b) => b.beanId === brew.beanId && b.id !== brew.id && b.date <= brew.date)
			.sort((a, b) => b.date.localeCompare(a.date))[0];
	});

	function dateStr(d: string) {
		return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
	}
</script>

{#if brew && bean}
	<div class="screen">
		<BackHeader onBack={() => history.back()}>
			{#snippet action()}
				<div style="display:flex; gap:8px">
					{#if prevBrew}
						<a class="icon-btn" href="/brew/{brew.id}/compare" title="Compare to last">
							<Icon name="compare" size={16} />
						</a>
					{/if}
					<button class="icon-btn"><Icon name="dots" size={18} /></button>
				</div>
			{/snippet}
		</BackHeader>

		<div class="hero">
			<div class="hero-sub">
				{dateStr(brew.date)} · {brew.time} · {METHOD_LABELS[brew.method]}{brew.withMilk ? ' + milk' : ''}
			</div>
			<h1 class="hero-title">{bean.name}</h1>
			<div class="hero-meta">
				<span>{bean.roaster}</span>
				<span class="dim">·</span>
				<span>{bean.origin}</span>
			</div>

			<div class="rating-block">
				<div class="rating-col">
					<div class="rating-label">{brew.withMilk ? 'Straight' : 'Rating'}</div>
					<div class="rating-value">
						{brew.rating}<span class="rating-denom">/ 10</span>
					</div>
					<div style="margin-top:4px"><StarRow value={brew.rating} /></div>
				</div>
				{#if brew.rating2 != null}
					<div class="rating-sep"></div>
					<div class="rating-col">
						<div class="rating-label"><Icon name="milk" size={11} /> In milk</div>
						<div class="rating-value">
							{brew.rating2}<span class="rating-denom">/ 10</span>
						</div>
						<div style="margin-top:4px"><StarRow value={brew.rating2} /></div>
					</div>
				{/if}
			</div>
		</div>

		<div class="section-label">Recipe</div>
		<div class="recipe-grid">
			<div class="recipe-cell">
				<div class="recipe-label">Dose</div>
				<div class="recipe-value">{brew.doseIn}<span class="recipe-unit">g</span></div>
			</div>
			<div class="recipe-cell">
				<div class="recipe-label">Yield</div>
				<div class="recipe-value">{brew.yieldOut}<span class="recipe-unit">g</span></div>
			</div>
			<div class="recipe-cell">
				<div class="recipe-label">Ratio</div>
				<div class="recipe-value mono">{brew.ratio}</div>
			</div>
			<div class="recipe-cell">
				<div class="recipe-label">Time</div>
				<div class="recipe-value mono">{formatExtractionTime(brew.extractionTime)}</div>
			</div>
			<div class="recipe-cell">
				<div class="recipe-label">Temp</div>
				<div class="recipe-value">{brew.temperature}<span class="recipe-unit">°C</span></div>
			</div>
			<div class="recipe-cell">
				<div class="recipe-label">Grind</div>
				<div class="recipe-value">
					{brew.grindSetting}<span class="recipe-unit"
						>{journal.grinders.find((g) => g.id === brew.grinder)?.name.split(' ')[0]}</span
					>
				</div>
			</div>
		</div>

		<div class="section-label">Tasting</div>
		<div class="tasting-card">
			{#if brew.descriptors?.length}
				<div class="descriptors">
					{#each brew.descriptors as d (d)}
						<span class="descriptor-chip">{d}</span>
					{/each}
				</div>
			{/if}
			{#each [['Aroma', brew.aroma], ['Flavor', brew.flavor], ['Body', brew.body], ['Finish', brew.finish]] as [label, text], i (label)}
				{#if text}
					<div class="note-row" class:last={i === 3}>
						<div class="note-label">{label}</div>
						<div class="note-text">{text}</div>
					</div>
				{/if}
			{/each}
		</div>

		{#if prevBrew}
			<a class="compare-hint" href="/brew/{brew.id}/compare">
				<div>
					<div class="compare-hint-label">Compare to last brew</div>
					<div class="compare-hint-value">{beans[prevBrew.beanId]?.name} · {prevBrew.rating}/10</div>
				</div>
				<Icon name="chevron" size={16} />
			</a>
		{/if}
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Brew not found</h1></div>
	</div>
{/if}

<style>
	.hero {
		padding: 24px 24px 8px;
	}
	.hero-sub {
		font-size: 11px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 8px;
	}
	.hero-title {
		font-family: var(--serif);
		font-size: 36px;
		font-weight: 400;
		font-style: italic;
		margin: 0;
		color: var(--ink);
		letter-spacing: -0.8px;
		line-height: 1.05;
		font-variation-settings: 'opsz' 144, 'SOFT' 50;
	}
	.hero-meta {
		font-size: 13px;
		color: var(--ink-3);
		margin-top: 6px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.hero-meta .dim {
		color: var(--ink-4);
	}
	.rating-block {
		margin-top: 20px;
		padding: 16px 18px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.rating-col {
		flex: 1;
	}
	.rating-label {
		font-size: 10px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.rating-value {
		font-family: var(--serif);
		font-size: 38px;
		font-weight: 500;
		color: var(--ink);
		line-height: 1;
		font-variation-settings: 'opsz' 144;
	}
	.rating-denom {
		font-size: 14px;
		color: var(--ink-3);
		font-style: italic;
		font-family: var(--serif);
	}
	.rating-sep {
		width: 1px;
		height: 50px;
		background: var(--line);
	}
	.recipe-grid {
		margin: 0 16px;
		padding: 18px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 16px;
	}
	.recipe-label {
		font-size: 9.5px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 4px;
	}
	.recipe-value {
		font-size: 18px;
		font-weight: 600;
		color: var(--ink);
		letter-spacing: -0.2px;
		display: flex;
		align-items: baseline;
		gap: 3px;
	}
	.recipe-value.mono {
		font-family: var(--mono);
	}
	.recipe-unit {
		font-size: 11px;
		color: var(--ink-3);
		font-weight: 400;
	}
	.tasting-card {
		margin: 0 16px 12px;
		padding: 18px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
	}
	.descriptors {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 18px;
	}
	.descriptor-chip {
		font-size: 11px;
		font-weight: 500;
		padding: 4px 10px;
		border-radius: 100px;
		background: rgba(196, 90, 58, 0.1);
		color: var(--accent-2);
	}
	.note-row {
		padding-bottom: 12px;
		margin-bottom: 12px;
		border-bottom: 1px solid var(--line-soft);
	}
	.note-row.last {
		padding-bottom: 0;
		margin-bottom: 0;
		border-bottom: none;
	}
	.note-label {
		font-size: 10px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 4px;
	}
	.note-text {
		font-family: var(--serif);
		font-size: 15px;
		font-style: italic;
		color: var(--ink-2);
		line-height: 1.5;
		font-variation-settings: 'opsz' 14;
	}
	.compare-hint {
		margin: 8px 16px 24px;
		padding: 14px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: transparent;
		border: 1px dashed var(--line);
		border-radius: var(--r-md);
		color: var(--ink-2);
	}
	.compare-hint-label {
		font-size: 11px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 2px;
	}
	.compare-hint-value {
		font-size: 13px;
		color: var(--ink-2);
	}
</style>

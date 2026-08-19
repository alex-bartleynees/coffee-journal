<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { formatDecimal, formatRatio } from '$lib/data/numbers';
	import { beanById, formatExtractionTime } from '$lib/data/sample';
	import { methodLabel } from '$lib/data/methods';
	import { ratingLabel } from '$lib/data/ratings';

	const beans = $derived(beanById(journal.beans));
	const a = $derived(journal.brews.find((b) => b.id === page.params.id));
	const b = $derived.by(() => {
		if (!a) return undefined;
		return journal.brews
			.filter((br) => br.beanId === a.beanId && br.id !== a.id)
			.sort((x, y) => y.date.localeCompare(x.date))[0];
	});

	const rows = $derived(
		a && b
			? [
					{ label: 'Bean', a: beans[a.beanId]?.name, b: beans[b.beanId]?.name },
					{ label: 'Method', a: methodLabel(journal.methods, a.method), b: methodLabel(journal.methods, b.method) },
					{ label: 'Dose', a: `${formatDecimal(a.doseIn)}g`, b: `${formatDecimal(b.doseIn)}g` },
					{ label: 'Yield', a: `${formatDecimal(a.yieldOut)}g`, b: `${formatDecimal(b.yieldOut)}g` },
					{ label: 'Ratio', a: formatRatio(a.ratio), b: formatRatio(b.ratio) },
					{ label: 'Time', a: formatExtractionTime(a.extractionTime), b: formatExtractionTime(b.extractionTime) },
					{ label: 'Temp', a: `${formatDecimal(a.temperature)}°C`, b: `${formatDecimal(b.temperature)}°C` },
					{ label: 'Rating', a: ratingLabel(a.rating), b: ratingLabel(b.rating), highlight: true }
				]
			: []
	);
</script>

{#if a && b}
	<div class="screen">
		<BackHeader onBack={() => history.back()} label="Compare" />

		<div class="intro">
			<h1>This brew vs. last</h1>
			<div class="intro-dates">{a.date} → {b.date}</div>
		</div>

		<div class="compare-table">
			<div class="compare-row header">
				<div></div>
				<div class="col-a">
					<div class="col-title">This</div>
					<div class="col-date">{a.date}</div>
				</div>
				<div class="col-b">
					<div class="col-title">Last</div>
					<div class="col-date">{b.date}</div>
				</div>
			</div>
			{#each rows as row (row.label)}
				<div class="compare-row" class:highlight={row.highlight}>
					<div class="row-label">{row.label}</div>
					<div class="col-a cell">{row.a}</div>
					<div class="col-b cell dim">{row.b}</div>
				</div>
			{/each}
		</div>

		<div class="section-label">Notes</div>
		<div class="notes-grid">
			<div class="note-card this">
				<div class="note-tag">This</div>
				<div class="note-text">{a.flavor}</div>
			</div>
			<div class="note-card">
				<div class="note-tag dim">Last</div>
				<div class="note-text">{b.flavor}</div>
			</div>
		</div>
	</div>
{:else}
	<div class="screen">
		<BackHeader onBack={() => history.back()} label="Compare" />
		<div style="padding: 24px; color: var(--ink-3)">No previous brew of this bean to compare.</div>
	</div>
{/if}

<style>
	.intro {
		padding: 20px 20px;
	}
	.intro h1 {
		font-family: var(--serif);
		font-size: 30px;
		font-weight: 400;
		font-style: italic;
		margin: 0;
		color: var(--ink);
		letter-spacing: -0.6px;
		line-height: 1.1;
		font-variation-settings: 'opsz' 144, 'SOFT' 50;
	}
	.intro-dates {
		font-size: 12px;
		color: var(--ink-3);
		margin-top: 6px;
	}
	.compare-table {
		margin: 0 16px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		overflow: hidden;
	}
	.compare-row {
		display: grid;
		grid-template-columns: 60px 1fr 1fr;
		border-bottom: 1px solid var(--line-soft);
	}
	.compare-row:last-child {
		border-bottom: none;
	}
	.compare-row.header .col-a {
		background: rgba(196, 90, 58, 0.06);
	}
	.compare-row.highlight .col-a {
		background: rgba(196, 90, 58, 0.06);
	}
	.col-a,
	.col-b {
		padding: 10px 12px;
		border-right: 1px solid var(--line-soft);
	}
	.col-b {
		border-right: none;
	}
	.col-title {
		font-size: 10px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		font-weight: 600;
	}
	.compare-row.header .col-a .col-title {
		color: var(--accent);
	}
	.compare-row.header .col-b .col-title {
		color: var(--ink-3);
	}
	.col-date {
		font-size: 11px;
		color: var(--ink-3);
		margin-top: 2px;
	}
	.row-label {
		padding: 12px 0 12px 16px;
		font-size: 10px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
		align-self: center;
	}
	.cell {
		font-size: 15px;
		font-weight: 500;
		color: var(--ink);
		align-self: center;
	}
	.cell.dim {
		color: var(--ink-3);
	}
	.notes-grid {
		margin: 0 16px 30px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.note-card {
		padding: 14px;
		background: var(--card-2);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
	}
	.note-card.this {
		background: var(--card);
	}
	.note-tag {
		font-size: 9.5px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 6px;
	}
	.note-tag.dim {
		color: var(--ink-3);
	}
	.note-text {
		font-family: var(--serif);
		font-size: 13px;
		font-style: italic;
		line-height: 1.5;
		color: var(--ink-2);
	}
</style>

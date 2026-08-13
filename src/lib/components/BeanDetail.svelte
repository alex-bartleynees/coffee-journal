<script lang="ts">
	import MethodIcon from '$lib/components/MethodIcon.svelte';
	import { todayIso, daysBetween } from '$lib/data/date';
	import type { CalendarDate } from '$lib/data/date';
	import type { Bean, Brew } from '$lib/data/types';
	import { beanInventory } from '$lib/data/bean-inventory';

	let { bean, beanBrews }: { bean: Bean; beanBrews: Brew[] } = $props();

	const avg = $derived(
		beanBrews.length ? (beanBrews.reduce((s, b) => s + b.rating, 0) / beanBrews.length).toFixed(1) : '—'
	);
	const totalGrams = $derived(beanBrews.reduce((s, b) => s + b.doseIn, 0));
	const cost = $derived(bean.pricePerKg * (bean.bagWeight / 1000));
	const inventory = $derived(beanInventory(bean.bagWeight, beanBrews.map((brew) => brew.doseIn)));
	const remaining = $derived(inventory.remainingGrams);
	const pctUsed = $derived(inventory.percentUsed);
	const avgGramsPerBrew = $derived(beanBrews.length ? totalGrams / beanBrews.length : 0);

	function daysAgo(d: CalendarDate) {
		return daysBetween(todayIso(), d);
	}
</script>

<div class="bean-detail">
	<div class="hero">
		{#if bean.photoUrl}
			<img class="bean-photo" src={bean.photoUrl} alt={`${bean.name} coffee bag`} />
		{/if}
		<div class="hero-sub">{bean.roaster}</div>
		<h1 class="hero-title">{bean.name}</h1>
		<div class="tasting-row">
			{#each bean.tasting as t (t)}
				<span class="tasting-chip">{t}</span>
			{/each}
		</div>
	</div>

	<div class="kv-grid">
		<div class="kv"><div class="kv-label">Origin</div><div class="kv-value">{bean.origin}</div></div>
		<div class="kv"><div class="kv-label">Process</div><div class="kv-value">{bean.process}</div></div>
		<div class="kv"><div class="kv-label">Varietal</div><div class="kv-value">{bean.varietal}</div></div>
		<div class="kv"><div class="kv-label">Altitude</div><div class="kv-value">{bean.altitude}</div></div>
		<div class="kv"><div class="kv-label">Roast date</div><div class="kv-value">{daysAgo(bean.roastDate)}d ago</div></div>
		<div class="kv"><div class="kv-label">Opened</div><div class="kv-value">{daysAgo(bean.dateOpened)}d ago</div></div>
	</div>

	<div class="section-label">Bag</div>
	<div class="bag-card">
		<div class="bag-top">
			<div class="bag-remaining mono">{remaining}<span class="bag-unit">g left</span></div>
			<div class="bag-of">of {bean.bagWeight}g · {Math.round(pctUsed)}% used</div>
		</div>
		<div class="bag-track">
			<div class="bag-fill {bean.roast}" style="width:{100 - pctUsed}%"></div>
		</div>
		<div class="bag-stats">
			<div class="mini-stat">
				<div class="mini-label">Bag price</div>
				<div class="mini-value">${cost.toFixed(0)}</div>
			</div>
			<div class="mini-stat">
				<div class="mini-label">Per brew</div>
				<div class="mini-value">{beanBrews.length ? `$${((cost * avgGramsPerBrew) / bean.bagWeight).toFixed(2)}` : '—'}</div>
			</div>
			<div class="mini-stat">
				<div class="mini-label">Brews left</div>
				<div class="mini-value">{beanBrews.length ? Math.floor(remaining / avgGramsPerBrew) : '—'}</div>
			</div>
		</div>
	</div>

	<div class="section-label">Performance</div>
	<div class="perf-card">
		<div class="mini-stat">
			<div class="mini-label">Brews</div>
			<div class="mini-value serif">{beanBrews.length}</div>
		</div>
		<div class="mini-stat">
			<div class="mini-label">Avg score</div>
			<div class="mini-value serif">{avg}</div>
		</div>
		<div class="mini-stat">
			<div class="mini-label">Best</div>
			<div class="mini-value serif">{beanBrews.length ? Math.max(...beanBrews.map((b) => b.rating)) : '—'}</div>
		</div>
	</div>

	<div class="section-label">All brews</div>
	<div class="brew-history">
		{#each beanBrews as brew (brew.id)}
			<a class="history-row" href="/brew/{brew.id}">
				<MethodIcon method={brew.method} size={16} stroke="var(--ink-2)" />
				<div class="history-meta">
					<div class="history-date">{brew.date} · {brew.time}</div>
					<div class="history-recipe mono">{brew.doseIn}g → {brew.yieldOut}g · {brew.ratio}</div>
				</div>
				<div class="history-rating">
					<span class="history-rating-num">{brew.rating}</span>
					<span class="history-rating-denom">/10</span>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.hero {
		padding: 20px 24px 8px;
	}
	.bean-photo {
		width: 100%;
		max-height: 320px;
		object-fit: cover;
		border-radius: var(--r-lg);
		margin-bottom: 18px;
		background: var(--card-2);
	}
	.hero-sub {
		font-size: 11px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 6px;
	}
	.hero-title {
		font-family: var(--serif);
		font-size: 32px;
		font-weight: 400;
		font-style: italic;
		margin: 0;
		color: var(--ink);
		letter-spacing: -0.6px;
		line-height: 1.05;
		font-variation-settings: 'opsz' 144, 'SOFT' 50;
	}
	.tasting-row {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 12px;
	}
	.tasting-chip {
		font-size: 11px;
		font-weight: 500;
		padding: 4px 10px;
		background: rgba(196, 90, 58, 0.1);
		color: var(--accent-2);
		border-radius: 100px;
	}
	.kv-grid {
		margin: 20px 16px 0;
		padding: 16px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}
	.kv-label {
		font-size: 9.5px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 2px;
	}
	.kv-value {
		font-size: 14px;
		color: var(--ink);
		font-weight: 500;
	}
	.bag-card,
	.perf-card {
		margin: 0 16px;
		padding: 16px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
	}
	.perf-card {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 14px;
	}
	.bag-top {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 8px;
	}
	.bag-remaining {
		font-size: 22px;
		font-weight: 500;
		color: var(--ink);
	}
	.bag-unit {
		font-size: 12px;
		color: var(--ink-3);
		margin-left: 4px;
	}
	.bag-of {
		font-size: 11px;
		color: var(--ink-3);
	}
	.bag-track {
		height: 8px;
		background: var(--paper-2);
		border-radius: 100px;
		overflow: hidden;
	}
	.bag-fill {
		height: 100%;
		border-radius: 100px;
	}
	.bag-fill.light {
		background: linear-gradient(90deg, #c9a57b, #b58659);
	}
	.bag-fill.medium {
		background: linear-gradient(90deg, #a06a42, #6b3f26);
	}
	.bag-fill.dark {
		background: linear-gradient(90deg, #4a2c1f, #2a1810);
	}
	.bag-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid var(--line-soft);
	}
	.mini-label {
		font-size: 9.5px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 4px;
	}
	.mini-value {
		font-size: 22px;
		font-weight: 600;
		color: var(--ink);
		letter-spacing: -0.4px;
	}
	.mini-value.serif {
		font-family: var(--serif);
		font-weight: 500;
		font-variation-settings: 'opsz' 24;
	}
	.brew-history {
		padding: 0 16px 24px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.history-row {
		padding: 12px 14px;
		background: var(--card-2);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.history-meta {
		flex: 1;
		min-width: 0;
	}
	.history-date {
		font-size: 13px;
		color: var(--ink);
		font-weight: 500;
	}
	.history-recipe {
		font-size: 11px;
		color: var(--ink-3);
	}
	.history-rating {
		display: flex;
		align-items: baseline;
		gap: 2px;
		font-family: var(--serif);
		color: var(--ink);
	}
	.history-rating-num {
		font-size: 18px;
		font-weight: 500;
	}
	.history-rating-denom {
		font-size: 10px;
		color: var(--ink-3);
		font-style: italic;
	}
</style>

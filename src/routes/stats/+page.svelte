<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import MethodIcon from '$lib/components/MethodIcon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { methodLabel } from '$lib/data/methods';
	import { averageRating } from '$lib/data/ratings';
	import { formatDecimal } from '$lib/data/numbers';

	const brews = $derived(journal.brews);
	const beans = $derived(journal.beans);

	const total = $derived(brews.length);
	const avgRating = $derived(averageRating(brews));
	const totalGrams = $derived(brews.reduce((s, b) => s + b.doseIn, 0));

	const byMethod = $derived.by(() => {
		const m: Record<string, number> = {};
		brews.forEach((b) => (m[b.method] = (m[b.method] || 0) + 1));
		return m;
	});

	const totalCost = $derived(
		beans.reduce((s, bean) => {
			const beanBrews = brews.filter((br) => br.beanId === bean.id);
			const grams = beanBrews.reduce((g, b) => g + b.doseIn, 0);
			return s + (bean.pricePerKg * grams) / 1000;
		}, 0)
	);

	const topBean = $derived.by(() => {
		const counts: Record<string, number> = {};
		brews.forEach((b) => (counts[b.beanId] = (counts[b.beanId] || 0) + 1));
		const id = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
		return beans.find((b) => b.id === id);
	});
	const topBeanCount = $derived(topBean ? brews.filter((b) => b.beanId === topBean.id).length : 0);

	const swatchGradient: Record<string, string> = {
		light: 'linear-gradient(155deg, #E8D2B0, #C9A57B)',
		medium: 'linear-gradient(155deg, #A06A42, #6B3F26)',
		dark: 'linear-gradient(155deg, #4A2C1F, #2A1810)'
	};
</script>

<div class="screen">
	<TopBar sub="Last 30 days" title="Stats" />

	<div class="kpi-grid">
		<div class="kpi-tile">
			<div class="mini-label">Total brews</div>
			<div class="kpi-value">{total}</div>
		</div>
		<div class="kpi-tile">
			<div class="mini-label">Avg rating</div>
			<div class="kpi-value">{avgRating == null ? '—' : avgRating.toFixed(2)}{#if avgRating != null}<span class="kpi-suffix">/10</span>{/if}</div>
		</div>
		<div class="kpi-tile">
			<div class="mini-label">Spent on beans</div>
			<div class="kpi-value">${totalCost.toFixed(0)}</div>
		</div>
		<div class="kpi-tile">
			<div class="mini-label">Cost per brew</div>
			<div class="kpi-value">${(totalCost / total).toFixed(2)}</div>
		</div>
	</div>

	<div class="big-number">
		<div class="big-value">{total}</div>
		<div class="big-caption">brews logged · <span class="mono">{formatDecimal(totalGrams)}g</span> through the grinder</div>
	</div>

	<div class="stats-columns">
		<div class="stats-column">
			<div class="section-label">By method</div>
			<div class="method-card">
				{#each Object.entries(byMethod) as [m, c] (m)}
					<div class="method-row">
						<MethodIcon method={m as any} size={18} stroke="var(--ink-2)" />
						<div class="method-label">{methodLabel(journal.methods, m)}</div>
						<div class="method-bar-track">
							<div class="method-bar-fill" style="width:{(c / total) * 100}%"></div>
						</div>
						<div class="method-count mono">{c}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="stats-column">
			{#if topBean}
				<div class="section-label">Most brewed</div>
				<div class="top-bean-card">
					<div class="top-bean-swatch" style="background:{swatchGradient[topBean.roast]}"></div>
					<div class="top-bean-meta">
						<div class="top-bean-name">{topBean.name}</div>
						<div class="top-bean-roaster">{topBean.roaster}</div>
					</div>
					<div class="top-bean-count">
						<div class="top-bean-count-num mono">{topBeanCount}</div>
						<div class="top-bean-count-label">brews</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="spending-section">
		<div class="section-label">Spending</div>
		<div class="spend-card">
			<div class="mini-stat">
				<div class="mini-label">Total</div>
				<div class="mini-value serif">${totalCost.toFixed(0)}</div>
			</div>
			<div class="mini-stat">
				<div class="mini-label">Per brew</div>
				<div class="mini-value serif">${(totalCost / total).toFixed(2)}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.big-number {
		padding: 12px 24px 0;
	}
	.big-value {
		font-family: var(--serif);
		font-size: 80px;
		font-weight: 500;
		line-height: 1;
		color: var(--ink);
		letter-spacing: -3px;
		font-variation-settings: 'opsz' 144;
	}
	.big-caption {
		font-size: 13px;
		color: var(--ink-3);
		margin-top: 4px;
	}
	.method-card {
		margin: 0 16px;
		padding: 18px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.method-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
	}
	.method-label {
		flex: 1;
		font-size: 14px;
		color: var(--ink);
		font-weight: 500;
	}
	.method-bar-track {
		flex: 2;
		height: 6px;
		background: var(--paper-2);
		border-radius: 100px;
	}
	.method-bar-fill {
		height: 100%;
		background: var(--ink);
		border-radius: 100px;
	}
	.method-count {
		font-size: 13px;
		color: var(--ink);
		min-width: 24px;
		text-align: right;
	}
	.spend-card {
		margin: 0 16px;
		padding: 18px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}
	.mini-label {
		font-size: 9.5px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 4px;
	}
	.mini-value.serif {
		font-family: var(--serif);
		font-size: 22px;
		font-weight: 500;
	}
	.top-bean-card {
		margin: 0 16px 30px;
		padding: 16px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.top-bean-swatch {
		width: 48px;
		height: 56px;
		border-radius: 4px;
		flex-shrink: 0;
	}
	.top-bean-meta {
		flex: 1;
		min-width: 0;
	}
	.top-bean-name {
		font-family: var(--serif);
		font-size: 17px;
		font-weight: 500;
	}
	.top-bean-roaster {
		font-size: 11px;
		color: var(--ink-3);
		letter-spacing: 0.5px;
		text-transform: uppercase;
		margin-top: 2px;
	}
	.top-bean-count-num {
		font-size: 18px;
		font-weight: 600;
		color: var(--ink);
		text-align: right;
	}
	.top-bean-count-label {
		font-size: 10px;
		color: var(--ink-3);
		letter-spacing: 1px;
		text-transform: uppercase;
		text-align: right;
	}

	.kpi-grid {
		display: none;
	}

	@media (min-width: 860px) {
		.kpi-grid {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 14px;
			margin: 0 16px 20px;
		}
		.kpi-tile {
			padding: 18px 20px;
			background: var(--card);
			border: 1px solid var(--line-soft);
			border-radius: var(--r-lg);
		}
		.kpi-value {
			font-family: var(--serif);
			font-style: italic;
			font-size: 32px;
			font-weight: 500;
			margin-top: 4px;
			line-height: 1.1;
			font-variation-settings: 'opsz' 144;
		}
		.kpi-suffix {
			font-size: 14px;
			color: var(--ink-3);
			margin-left: 4px;
			font-style: normal;
		}
		.big-number,
		.spending-section {
			display: none;
		}
		.stats-columns {
			margin: 0 16px;
			display: grid;
			grid-template-columns: 1.2fr 1fr;
			gap: 20px;
		}
		.stats-columns .method-card,
		.stats-columns .top-bean-card {
			margin: 0;
		}
	}
</style>

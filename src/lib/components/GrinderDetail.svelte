<script lang="ts">
	import BurrIllustration from '$lib/components/BurrIllustration.svelte';
	import type { Bean, Brew, Grinder } from '$lib/data/types';
	import { methodLabel } from '$lib/data/methods';
	import { journal } from '$lib/stores/journal.svelte';
	import { formatDecimal } from '$lib/data/numbers';

	let { grinder, myBrews, beanById: beans }: { grinder: Grinder; myBrews: Brew[]; beanById: Record<string, Bean> } =
		$props();

	const byMethod = $derived.by(() => {
		const agg: Record<string, { count: number; settings: number[]; ratings: number[] }> = {};
		myBrews.forEach((b) => {
			(agg[b.method] ??= { count: 0, settings: [], ratings: [] });
			agg[b.method].count++;
			agg[b.method].settings.push(b.grindSetting);
			if (b.rating != null) agg[b.method].ratings.push(b.rating);
		});
		return agg;
	});
</script>

<div class="grinder-detail">
	<div class="hero">
		<div class="hero-illustration">
			<div
				class="hero-burr-wrap"
				style="background:{grinder.type === 'espresso'
					? 'linear-gradient(135deg, #4A4036, #1F1815)'
					: 'linear-gradient(135deg, #6E6657, #2C2520)'};"
			>
				<BurrIllustration type={grinder.type} size={64} />
			</div>
		</div>
		<div class="hero-maker">{grinder.maker}</div>
		<h2 class="hero-name">{grinder.name}</h2>
		<div class="hero-sub">{grinder.burr} {grinder.rpm ? `· ${grinder.rpm} rpm` : ''}</div>
	</div>

	<div class="range-card">
		<div class="range-top">
			<div class="range-label">Range</div>
			<div class="range-value mono">{grinder.range[0]}–{grinder.range[1]} · step {grinder.step}</div>
		</div>
		<div class="range-track-wrap">
			<div class="range-track"></div>
			{#each Array.from({ length: 11 }) as _, i (i)}
				<div class="tick" style="left:{i * 10}%"></div>
			{/each}
			{#each grinder.presets as p (p.method)}
				{@const pct = (p.setting / grinder.range[1]) * 100}
				<div class="preset-marker" style="left:{pct}%">
					<div class="preset-marker-label">{methodLabel(journal.methods, p.method)}</div>
				<div class="preset-marker-dot mono">{formatDecimal(p.setting)}</div>
				</div>
			{/each}
		</div>
	</div>

	{#if grinder.notes}
		<div class="notes-card">{grinder.notes}</div>
	{/if}

	{#if Object.keys(byMethod).length > 0}
		<div class="section-label">By method</div>
		<div class="method-card">
			{#each Object.entries(byMethod) as [m, agg], i (m)}
				{@const avgSetting = agg.settings.reduce((a, b) => a + b, 0) / agg.settings.length}
				{@const avgRating = agg.ratings.length ? agg.ratings.reduce((a, b) => a + b, 0) / agg.ratings.length : null}
				<div class="method-row" class:last={i === Object.keys(byMethod).length - 1}>
					<div class="method-name">{methodLabel(journal.methods, m)}</div>
					<div>
						<div class="method-sublabel">avg setting</div>
						<div class="method-setting mono">{avgSetting.toFixed(1)}</div>
					</div>
					<div class="method-right">
						<div class="method-sublabel">{agg.count} {agg.count === 1 ? 'brew' : 'brews'}</div>
						<div class="method-rating">{avgRating == null ? 'Not rated' : `★ ${avgRating.toFixed(1)}`}</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="section-label">Brews on this grinder</div>
	<div class="brew-log">
		{#each myBrews as br (br.id)}
			{@const bean = beans[br.beanId]}
			<a class="log-row" href="/brew/{br.id}">
				<div class="log-setting mono">{formatDecimal(br.grindSetting)}</div>
				<div class="log-meta">
					<div class="log-name">{bean?.name}</div>
					<div class="log-sub">{methodLabel(journal.methods, br.method)} · {br.date}</div>
				</div>
				<div class="log-rating">{br.rating == null ? 'Not rated' : `★ ${br.rating}`}</div>
			</a>
		{:else}
			<div class="log-empty">No brews logged yet</div>
		{/each}
	</div>
</div>

<style>
	.hero {
		padding: 8px 24px 20px;
		text-align: center;
	}
	.hero-illustration {
		display: flex;
		justify-content: center;
		margin-bottom: 14px;
	}
	.hero-burr-wrap {
		width: 90px;
		height: 90px;
		border-radius: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		margin: 0 auto;
	}
	.hero-maker {
		font-size: 11px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.hero-name {
		font-family: var(--serif);
		font-weight: 500;
		font-style: italic;
		font-size: 30px;
		margin: 4px 0 6px;
		color: var(--ink);
		font-variation-settings: 'opsz' 144;
	}
	.hero-sub {
		font-size: 12px;
		color: var(--ink-3);
	}
	.range-card {
		margin: 0 16px 16px;
		padding: 18px 18px 14px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
	}
	.range-top {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
	}
	.range-label {
		font-size: 10px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.range-value {
		font-size: 11px;
		color: var(--ink-3);
	}
	.range-track-wrap {
		position: relative;
		height: 50px;
		margin-top: 6px;
	}
	.range-track {
		position: absolute;
		top: 22px;
		left: 0;
		right: 0;
		height: 6px;
		background: var(--paper-2);
		border-radius: 3px;
		border: 1px solid var(--line-soft);
	}
	.tick {
		position: absolute;
		top: 14px;
		width: 1px;
		height: 8px;
		background: var(--line);
	}
	.preset-marker {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	.preset-marker-label {
		font-size: 9px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--ink-2);
		font-weight: 600;
		white-space: nowrap;
	}
	.preset-marker-dot {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--ink);
		color: var(--paper);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 600;
		border: 2px solid var(--paper);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}
	.notes-card {
		margin: 0 16px 16px;
		padding: 14px 18px;
		background: var(--card-2);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		font-family: var(--serif);
		font-style: italic;
		font-size: 14px;
		line-height: 1.5;
		color: var(--ink-2);
	}
	.method-card {
		margin: 0 16px;
		padding: 18px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
	}
	.method-row {
		display: grid;
		grid-template-columns: 70px 1fr auto;
		align-items: center;
		gap: 14px;
		padding: 10px 0;
		border-bottom: 1px solid var(--line-soft);
	}
	.method-row.last {
		border-bottom: none;
	}
	.method-name {
		font-size: 12px;
		font-weight: 600;
		color: var(--ink);
	}
	.method-sublabel {
		font-size: 10px;
		color: var(--ink-3);
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}
	.method-setting {
		font-size: 16px;
		font-weight: 600;
		color: var(--ink);
	}
	.method-right {
		text-align: right;
	}
	.method-rating {
		font-family: var(--serif);
		font-size: 14px;
		font-style: italic;
		color: var(--ink-2);
	}
	.brew-log {
		padding: 0 16px 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.log-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
	}
	.log-setting {
		font-size: 16px;
		font-weight: 700;
		width: 44px;
		text-align: center;
		color: var(--ink);
		padding: 6px 0;
		background: var(--paper-2);
		border-radius: 8px;
	}
	.log-meta {
		flex: 1;
		min-width: 0;
	}
	.log-name {
		font-family: var(--serif);
		font-weight: 500;
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.log-sub {
		font-size: 10.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.6px;
		margin-top: 2px;
	}
	.log-rating {
		font-family: var(--serif);
		font-size: 14px;
		font-style: italic;
		color: var(--ink-2);
	}
	.log-empty {
		padding: 24px;
		text-align: center;
		color: var(--ink-3);
		font-size: 13px;
	}
</style>

<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import type { Bean, Brew, WaterProfile } from '$lib/data/types';
	import { methodLabel } from '$lib/data/methods';
	import { journal } from '$lib/stores/journal.svelte';
	import RetiredBadge from '$lib/components/RetiredBadge.svelte';
	import { averageRating } from '$lib/data/ratings';
	import { formatDose, stageLabel, waterMeasurements } from '$lib/data/water';

	let { profile, myBrews, beanById: beans }: { profile: WaterProfile; myBrews: Brew[]; beanById: Record<string, Bean> } =
		$props();

	const avgRating = $derived(averageRating(myBrews));
	const measurements = $derived(waterMeasurements(profile));
</script>

<div class="water-detail">
	<div class="hero">
		<div class="hero-illustration">
			<div class="hero-water-wrap">
				<Icon name="droplet" size={44} stroke="rgba(220,240,255,0.9)" strokeWidth={1.3} />
			</div>
		</div>
		{#if profile.base}<div class="hero-maker">{profile.base}</div>{/if}
		<h2 class="hero-name">{profile.name}</h2>
		{#if profile.retired}<RetiredBadge variant="hero" />{/if}
		<div class="hero-sub">{avgRating == null ? `${myBrews.length} brews` : `★ ${avgRating.toFixed(1)} avg · ${myBrews.length} brews`}</div>
		{#if measurements}<div class="hero-measurements mono">{measurements}</div>{/if}
	</div>

	{#if profile.notes}
		<div class="notes-card">{profile.notes}</div>
	{/if}

	{#if profile.additions.length}
		<div class="section-label">Mineral additions</div>
		<div class="options-card">
			{#each profile.additions as addition (addition.id)}
				<div class="option-row">
					<span>{addition.product} <span class="option-stage">· {stageLabel(addition.stage)}</span></span>
					<span class="option-range">
						{addition.min}–{formatDose({ amount: addition.max, unit: addition.unit })}
						· default {addition.default}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<div class="section-label">Brews with this water</div>
	<div class="brew-log">
		{#each myBrews as br (br.id)}
			{@const bean = beans[br.beanId]}
			<a class="log-row" href="/brew/{br.id}">
				<div class="log-meta">
					<div class="log-name">{bean?.name}</div>
					<div class="log-sub">
						{methodLabel(journal.methods, br.method)} · {br.date}
						{#each br.mineralDoses ?? [] as dose (dose.additionId)} · {formatDose(dose)}{/each}
					</div>
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
	.hero-water-wrap {
		width: 90px;
		height: 90px;
		border-radius: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		margin: 0 auto;
		background: linear-gradient(135deg, #3d5566, #1a2630);
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
		font-family: var(--serif);
		font-size: 14px;
		font-style: italic;
		color: var(--ink-2);
	}
	.hero-measurements {
		margin-top: 6px;
		font-size: 11px;
		color: var(--ink-3);
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
	.options-card {
		margin: 0 16px 16px;
		padding: 4px 14px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
	}
	.option-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 0;
		font-size: 13px;
	}
	.option-row + .option-row {
		border-top: 1px solid var(--line-soft);
	}
	.option-stage,
	.option-range {
		color: var(--ink-3);
		font-size: 12px;
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

<script lang="ts">
	import { onMount } from 'svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import BeanBag from '$lib/components/BeanBag.svelte';
	import RoastDot from '$lib/components/RoastDot.svelte';
	import BeanDetail from '$lib/components/BeanDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { search } from '$lib/stores/search.svelte';
	import { todayIso, daysBetween } from '$lib/data/date';
	import { storedBeanFilter, type BeanFilter } from '$lib/data/bean-filter';
	import { averageRating } from '$lib/data/ratings';
	import type { CalendarDate } from '$lib/data/date';

	const FILTER_STORAGE_KEY = 'bloom:beans-filter';
	let filter = $state<BeanFilter>('all');

	onMount(() => {
		filter = storedBeanFilter(localStorage.getItem(FILTER_STORAGE_KEY));
	});

	function selectFilter(next: BeanFilter) {
		filter = next;
		localStorage.setItem(FILTER_STORAGE_KEY, next);
	}

	const beans = $derived(journal.beans);
	const brews = $derived(journal.brews);

	const counts = $derived({
		all: beans.length,
		active: beans.filter((b) => !b.finished).length,
		finished: beans.filter((b) => b.finished).length
	});

	const list = $derived(
		filter === 'all' ? beans : filter === 'active' ? beans.filter((b) => !b.finished) : beans.filter((b) => b.finished)
	);

	function daysSince(d: CalendarDate) {
		return daysBetween(todayIso(), d);
	}

	// Desktop split-pane: grid stays on the left, detail rail renders on the
	// right instead of navigating. Mobile ignores this and navigates normally.
	let selectedBeanId = $state<string | undefined>(undefined);
	const effectiveSelectedId = $derived(selectedBeanId ?? list[0]?.id);
	const selectedBean = $derived(beans.find((b) => b.id === effectiveSelectedId));
	const selectedBeanBrews = $derived(
		selectedBean ? brews.filter((br) => br.beanId === selectedBean.id) : []
	);

	function onBeanCardClick(e: MouseEvent, id: string) {
		if (window.matchMedia('(min-width: 860px)').matches) {
			e.preventDefault();
			selectedBeanId = id;
		}
	}
</script>

<div class="beans-shell">
	<div class="screen">
		<TopBar sub="{beans.length} beans logged" title="Beans">
			{#snippet action()}
				<button class="icon-btn" type="button" aria-label="Search beans and brews" onclick={search.open}>
					<Icon name="search" size={18} />
				</button>
				<a class="icon-btn" href="/beans/new" aria-label="Add bean"><Icon name="plus" size={18} /></a>
			{/snippet}
		</TopBar>

		<div class="filter-row">
			{#each ['all', 'active', 'finished'] as const as f (f)}
				<button class="chip" class:active={filter === f} onclick={() => selectFilter(f)}>
					{f}
					<span class="filter-count">{counts[f]}</span>
				</button>
			{/each}
		</div>

		<div class="bean-list">
			{#each list as bean (bean.id)}
				{@const beanBrews = brews.filter((br) => br.beanId === bean.id)}
				{@const avg = averageRating(beanBrews)}
				<a
					class="bean-card"
					class:finished={bean.finished}
					class:selected={bean.id === effectiveSelectedId}
					href="/beans/{bean.id}"
					onclick={(e) => onBeanCardClick(e, bean.id)}
				>
					<BeanBag roast={bean.roast} roaster={bean.roaster} photoUrl={bean.photoUrl} />
					<div class="bean-info">
						<div>
							<div class="bean-name">{bean.name}</div>
							<div class="bean-roaster">{bean.roaster}</div>
						</div>
						<div class="bean-tasting">
							{#each bean.tasting.slice(0, 3) as t (t)}
								<span class="tasting-chip">{t}</span>
							{/each}
						</div>
						<div class="bean-meta mono">
							<RoastDot roast={bean.roast} />
							<span>{bean.brews}× brewed</span>
							{#if avg != null}
								<span class="dim">·</span>
								<span class="avg">★ {avg.toFixed(1)}</span>
							{/if}
							<span class="dim">·</span>
							<span>{daysSince(bean.dateOpened)}d</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>

	{#if selectedBean}
		<div class="beans-detail-pane">
			<div class="desktop-detail-actions">
				<DetailActionMenu editHref={`/beans/new?edit=${selectedBean.id}`} label="Bean actions" />
			</div>
			<BeanDetail bean={selectedBean} beanBrews={selectedBeanBrews} />
		</div>
	{/if}
</div>

<style>
	.filter-row {
		padding: 4px 16px 16px;
		display: flex;
		gap: 6px;
		overflow-x: auto;
	}
	.filter-row .chip {
		text-transform: capitalize;
		flex-shrink: 0;
	}
	.filter-count {
		opacity: 0.7;
		font-weight: 400;
		margin-left: 2px;
		font-family: var(--mono);
		font-size: 11px;
	}
	.bean-list {
		padding: 0 16px 24px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.bean-card {
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		padding: 16px;
		display: flex;
		gap: 14px;
		text-align: left;
	}
	.bean-card.finished {
		opacity: 0.65;
	}
	.bean-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.bean-name {
		font-family: var(--serif);
		font-size: 18px;
		font-weight: 500;
		font-variation-settings: 'opsz' 24;
		color: var(--ink);
		letter-spacing: -0.2px;
		line-height: 1.15;
	}
	.bean-roaster {
		font-size: 11px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-top: 2px;
	}
	.bean-tasting {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.tasting-chip {
		font-size: 10.5px;
		padding: 2px 7px;
		background: rgba(196, 90, 58, 0.08);
		color: var(--accent-2);
		border-radius: 100px;
		font-weight: 500;
		white-space: nowrap;
	}
	.bean-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		color: var(--ink-3);
		margin-top: 2px;
	}
	.bean-meta .dim {
		color: var(--ink-4);
	}
	.bean-meta .avg {
		color: var(--ink);
		font-weight: 500;
	}

	:global(.beans-shell) {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.beans-detail-pane {
		display: none;
	}
	.desktop-detail-actions {
		display: flex;
		justify-content: flex-end;
		padding: 32px 16px 0;
	}

	@media (min-width: 860px) {
		:global(.beans-shell .screen) {
			max-width: none;
			margin: 0;
			flex: 1;
			min-width: 0;
		}
		:global(.bean-card.selected) {
			border-color: var(--accent);
			border-width: 1.5px;
		}
		.beans-detail-pane {
			display: block;
			width: 360px;
			flex-shrink: 0;
			border-left: 1px solid var(--line-soft);
			overflow-y: auto;
		}
	}
</style>

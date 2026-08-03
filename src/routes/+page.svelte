<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import MethodIcon from '$lib/components/MethodIcon.svelte';
	import BrewDetail from '$lib/components/BrewDetail.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { sync } from '$lib/sync/engine.svelte';
	import { METHOD_LABELS, beanById } from '$lib/data/sample';

	const beans = $derived(beanById(journal.beans));
	const brews = $derived(journal.brews);

	const referenceDate = $derived(
		brews.reduce((max, b) => (b.date > max ? b.date : max), brews[0]?.date ?? '')
	);

	const groups = $derived(
		brews.reduce<Record<string, typeof brews>>((acc, b) => {
			(acc[b.date] ??= []).push(b);
			return acc;
		}, {})
	);
	const sortedDates = $derived(Object.keys(groups).sort((a, b) => b.localeCompare(a)));

	// Desktop split-pane: list stays on the left, detail renders inline on the
	// right instead of navigating. Mobile ignores this and navigates normally.
	let selectedBrewId = $state<string | undefined>(undefined);
	const effectiveSelectedId = $derived(
		selectedBrewId ?? (sortedDates.length ? groups[sortedDates[0]][0].id : undefined)
	);
	const selectedBrew = $derived(brews.find((b) => b.id === effectiveSelectedId));
	const selectedBean = $derived(selectedBrew ? beans[selectedBrew.beanId] : undefined);
	const selectedGrinder = $derived(
		selectedBrew ? journal.grinders.find((g) => g.id === selectedBrew.grinder) : undefined
	);
	const selectedPrevBrew = $derived.by(() => {
		if (!selectedBrew) return undefined;
		return brews
			.filter((b) => b.beanId === selectedBrew.beanId && b.id !== selectedBrew.id && b.date <= selectedBrew.date)
			.sort((a, b) => b.date.localeCompare(a.date))[0];
	});
	const selectedPrevBean = $derived(selectedPrevBrew ? beans[selectedPrevBrew.beanId] : undefined);

	function onBrewCardClick(e: MouseEvent, id: string) {
		if (window.matchMedia('(min-width: 860px)').matches) {
			e.preventDefault();
			selectedBrewId = id;
		}
	}

	const avgRating = $derived((brews.reduce((s, b) => s + b.rating, 0) / brews.length).toFixed(1));
	const favMethod = $derived.by(() => {
		const c: Record<string, number> = {};
		brews.forEach((b) => (c[b.method] = (c[b.method] || 0) + 1));
		return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'espresso';
	});

	function formatDate(d: string) {
		const date = new Date(d);
		const today = new Date(referenceDate);
		const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Yesterday';
		return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
	}

	function todaySub() {
		return new Date(referenceDate).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="journal-shell">
	<div class="screen">
		<TopBar sub={todaySub()} title="The Journal">
			{#snippet action()}
				<button class="icon-btn" aria-label="Search"><Icon name="search" size={18} /></button>
			{/snippet}
		</TopBar>

		{#if !auth.signedIn}
			<a class="sync-banner" href="/login">
				<span>Not signed in — this journal lives only on this device.</span>
				<span class="sync-banner-cta">Sign in to sync <Icon name="chevron" size={12} /></span>
			</a>
		{:else if sync.subscriptionRequired}
			<a class="sync-banner" href="/pricing">
				<span>Signed in — this journal still lives only on this device.</span>
				<span class="sync-banner-cta">Enable sync <Icon name="chevron" size={12} /></span>
			</a>
		{/if}

		<div class="stats-strip">
			<div class="stat-item">
				<div class="stat-label">Brews</div>
				<div class="stat-value">
					{brews.length}<span class="stat-unit">this wk</span>
				</div>
			</div>
			<div class="stat-divider"></div>
			<div class="stat-item">
				<div class="stat-label">Avg</div>
				<div class="stat-value serif">
					{avgRating}<span class="stat-unit">/ 10</span>
				</div>
			</div>
			<div class="stat-divider"></div>
			<div class="stat-item">
				<div class="stat-label">Top</div>
				<div class="stat-value small">{METHOD_LABELS[favMethod as keyof typeof METHOD_LABELS]}</div>
			</div>
		</div>

		<div class="section-label">Recent brews</div>

		<div class="brew-list">
			{#each sortedDates as date (date)}
				<div class="date-group">
					<div class="date-label">
						<span>{formatDate(date)}</span>
						<span class="date-sep">·</span>
						<span class="date-count">{groups[date].length} brew{groups[date].length > 1 ? 's' : ''}</span>
					</div>
					{#each groups[date] as brew (brew.id)}
						{@const bean = beans[brew.beanId]}
						<a
							class="brew-card"
							class:selected={brew.id === effectiveSelectedId}
							href="/brew/{brew.id}"
							onclick={(e) => onBrewCardClick(e, brew.id)}
						>
							<div class="swatch {bean.roast}">
								<MethodIcon method={brew.method} size={26} stroke="rgba(255,255,255,0.85)" strokeWidth={1.4} />
							</div>
							<div class="meta">
								<div>
									<div class="row1">
										<div class="bean-name">{bean.name}</div>
										<div class="rating">
											<span class="num">{brew.rating}</span>
											<span class="denom">/10</span>
										</div>
									</div>
									<div class="roaster">{bean.roaster} · {METHOD_LABELS[brew.method]}</div>
								</div>
								<div class="stats">
									{#if brew.method === 'espresso'}
										<span class="stat">{brew.doseIn}g → {brew.yieldOut}g</span>
										<span class="dot"></span>
										<span class="stat">{brew.extractionTime}s</span>
										{#if brew.withMilk}
											<span class="dot"></span>
											<Icon name="milk" size={12} />
										{/if}
									{:else}
										<span class="stat">{brew.doseIn}g · {brew.ratio}</span>
										<span class="dot"></span>
										<span class="stat"
											>{Math.floor(brew.extractionTime / 60)}:{String(brew.extractionTime % 60).padStart(2, '0')}</span
										>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/each}
		</div>
	</div>

	{#if selectedBrew && selectedBean}
		<div class="journal-detail-pane">
			<BrewDetail
				brew={selectedBrew}
				bean={selectedBean}
				grinder={selectedGrinder}
				prevBrew={selectedPrevBrew}
				prevBean={selectedPrevBean}
			/>
		</div>
	{/if}
</div>

<style>
	.sync-banner {
		margin: 0 16px 14px;
		padding: 10px 14px;
		background: var(--card-2);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		font-size: 11.5px;
		color: var(--ink-3);
	}
	.sync-banner-cta {
		display: flex;
		align-items: center;
		gap: 3px;
		color: var(--accent-2);
		font-weight: 600;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.stats-strip {
		margin: 4px 16px 18px;
		padding: 14px 18px;
		background: linear-gradient(135deg, var(--card), var(--paper-2));
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: flex;
		align-items: stretch;
	}
	.stat-item {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.stat-label {
		font-size: 9.5px;
		letter-spacing: 1.3px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.stat-value {
		display: flex;
		align-items: baseline;
		gap: 3px;
		font-size: 22px;
		font-weight: 600;
		color: var(--ink);
		letter-spacing: -0.2px;
	}
	.stat-value.serif {
		font-family: var(--serif);
		font-weight: 500;
		letter-spacing: -0.3px;
	}
	.stat-value.small {
		font-size: 16px;
	}
	.stat-unit {
		font-size: 10px;
		color: var(--ink-3);
		font-weight: 400;
	}
	.stat-divider {
		width: 1px;
		background: var(--line);
		margin: 4px 12px;
		flex-shrink: 0;
	}
	.brew-list {
		padding-bottom: 20px;
	}
	.date-label {
		padding: 10px 24px 6px;
		font-size: 11px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
	}
	.date-sep {
		color: var(--ink-4);
	}
	.date-count {
		color: var(--ink-4);
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
	}

	:global(.journal-shell) {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.journal-detail-pane {
		display: none;
	}

	@media (min-width: 860px) {
		:global(.journal-shell .screen) {
			max-width: none;
			margin: 0;
			width: 400px;
			flex-shrink: 0;
			border-right: 1px solid var(--line-soft);
		}
		:global(.brew-card.selected) {
			background: var(--card);
			border-radius: var(--r-md);
		}
		.journal-detail-pane {
			display: block;
			flex: 1;
			min-width: 0;
			overflow-y: auto;
		}
		.journal-detail-pane :global(.brew-detail) {
			max-width: 720px;
			margin: 0 auto;
		}
	}
</style>

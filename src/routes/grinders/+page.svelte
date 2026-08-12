<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import EquipSwitch from '$lib/components/EquipSwitch.svelte';
	import BurrIllustration from '$lib/components/BurrIllustration.svelte';
	import GrinderDetail from '$lib/components/GrinderDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';
	import { methodLabel } from '$lib/data/methods';

	const grinders = $derived(journal.grinders);
	const brews = $derived(journal.brews);
	const beans = $derived(beanById(journal.beans));

	const counts = $derived.by(() => {
		const c: Record<string, number> = {};
		brews.forEach((b) => (c[b.grinder] = (c[b.grinder] || 0) + 1));
		return c;
	});

	// Desktop split-pane: rail stays on the left, detail renders on the right
	// instead of navigating. Mobile ignores this and navigates normally.
	let selectedGrinderId = $state<string | undefined>(undefined);
	const effectiveSelectedId = $derived(selectedGrinderId ?? grinders[0]?.id);
	const selectedGrinder = $derived(grinders.find((g) => g.id === effectiveSelectedId));
	const selectedGrinderBrews = $derived(
		selectedGrinder ? brews.filter((b) => b.grinder === selectedGrinder.id) : []
	);

	function onGrinderCardClick(e: MouseEvent, id: string) {
		if (window.matchMedia('(min-width: 860px)').matches) {
			e.preventDefault();
			selectedGrinderId = id;
		}
	}
</script>

<div class="grinders-shell">
	<div class="screen">
		<TopBar sub="Grinders" title="Burrs & clicks">
			{#snippet action()}
				<a class="icon-btn" href="/grinders/new" aria-label="Add grinder"><Icon name="plus" size={18} /></a>
			{/snippet}
		</TopBar>

		<EquipSwitch />

		<div class="stats-strip">
			<div class="stat"><div class="stat-n">{grinders.length}</div><div class="stat-l">grinders</div></div>
			<div class="divider"></div>
			<div class="stat"><div class="stat-n">{brews.length}</div><div class="stat-l">brews tracked</div></div>
			<div class="divider"></div>
			<div class="stat"><div class="stat-n">{Object.keys(counts).length}</div><div class="stat-l">in rotation</div></div>
		</div>

		<div class="section-label">Library</div>
		<div class="grinder-list">
			{#each grinders as g (g.id)}
				<a
					class="grinder-card"
					class:selected={g.id === effectiveSelectedId}
					href="/grinders/{g.id}"
					onclick={(e) => onGrinderCardClick(e, g.id)}
				>
					<BurrIllustration type={g.type} size={64} />
					<div class="grinder-info">
						<div class="grinder-top">
							<div class="grinder-name">{g.name}</div>
							<div class="grinder-count mono">{counts[g.id] || 0} brews</div>
						</div>
						<div class="grinder-burr">{g.burr}</div>
						<div class="preset-row">
							{#each g.presets as p (p.method)}
								<div class="preset-chip">
									<span class="preset-method">{methodLabel(journal.methods, p.method)}</span>
									<span class="preset-value">{p.setting}</span>
								</div>
							{/each}
						</div>
					</div>
				</a>
			{/each}
		</div>

		<div class="section-label">Recent settings</div>
		<div class="recent-list">
			{#each brews.slice(0, 5) as br (br.id)}
				{@const g = grinders.find((x) => x.id === br.grinder)}
				{@const bean = beans[br.beanId]}
				{#if g}
					{@const pct = Math.min(1, br.grindSetting / g.range[1])}
					{@const c = 2 * Math.PI * 14}
					<div class="recent-row">
						<svg width="36" height="36" viewBox="0 0 36 36" class="click-dial">
							<circle cx="18" cy="18" r="14" fill="none" stroke="var(--line)" stroke-width="2" />
							<circle
								cx="18"
								cy="18"
								r="14"
								fill="none"
								stroke="var(--accent)"
								stroke-width="2"
								stroke-dasharray={c}
								stroke-dashoffset={c * (1 - pct)}
								stroke-linecap="round"
							/>
						</svg>
						<div class="recent-meta">
							<div class="recent-name">{g.name}</div>
							<div class="recent-sub">{methodLabel(journal.methods, br.method)} · {bean?.name}</div>
						</div>
						<div class="recent-setting mono">{br.grindSetting}</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	{#if selectedGrinder}
		<div class="grinders-detail-pane">
			<div class="desktop-detail-actions">
				<DetailActionMenu editHref={`/grinders/new?edit=${selectedGrinder.id}`} label="Grinder actions" />
			</div>
			<GrinderDetail grinder={selectedGrinder} myBrews={selectedGrinderBrews} beanById={beans} />
		</div>
	{/if}
</div>

<style>
	.stats-strip {
		margin: 4px 16px 18px;
		padding: 14px 18px;
		background: linear-gradient(135deg, var(--card), var(--paper-2));
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: center;
		flex: 1;
	}
	.stat-n {
		font-family: var(--serif);
		font-size: 22px;
		font-weight: 500;
		font-style: italic;
		font-variation-settings: 'opsz' 24;
	}
	.stat-l {
		font-size: 9.5px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.divider {
		width: 1px;
		height: 28px;
		background: var(--line);
	}
	.grinder-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0 16px;
	}
	.grinder-card {
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		padding: 16px;
		display: flex;
		gap: 14px;
		text-align: left;
	}
	.grinder-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.grinder-top {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
	}
	.grinder-name {
		font-family: var(--serif);
		font-weight: 500;
		font-size: 17px;
		font-variation-settings: 'opsz' 24;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.grinder-count {
		font-size: 11px;
		color: var(--ink-3);
		white-space: nowrap;
	}
	.grinder-burr {
		font-size: 11px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.preset-row {
		display: flex;
		gap: 6px;
		margin-top: 4px;
		flex-wrap: wrap;
	}
	.preset-chip {
		font-size: 11px;
		padding: 3px 8px;
		border-radius: 100px;
		background: var(--paper-2);
		color: var(--ink-2);
		font-family: var(--mono);
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.preset-method {
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--ink-3);
	}
	.preset-value {
		font-weight: 600;
	}
	.recent-list {
		padding: 0 16px 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.recent-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: var(--card-2);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
	}
	.click-dial {
		flex-shrink: 0;
		transform: rotate(-90deg);
	}
	.recent-meta {
		flex: 1;
		min-width: 0;
	}
	.recent-name {
		font-family: var(--serif);
		font-size: 14px;
		font-weight: 500;
	}
	.recent-sub {
		font-size: 11px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.6px;
		margin-top: 2px;
	}
	.recent-setting {
		font-size: 15px;
		font-weight: 600;
		color: var(--ink);
	}

	:global(.grinders-shell) {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.grinders-detail-pane {
		display: none;
	}
	.desktop-detail-actions {
		display: flex;
		justify-content: flex-end;
		padding: 32px 16px 0;
	}

	@media (min-width: 860px) {
		:global(.grinders-shell .screen) {
			max-width: none;
			margin: 0;
			width: 360px;
			flex-shrink: 0;
			border-right: 1px solid var(--line-soft);
			overflow-y: auto;
		}
		:global(.grinders-shell .grinder-list) {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		:global(.grinder-card.selected) {
			border-color: var(--accent);
			border-width: 1.5px;
		}
		.grinders-detail-pane {
			display: block;
			flex: 1;
			min-width: 0;
			overflow-y: auto;
		}
	}
</style>

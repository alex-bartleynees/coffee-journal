<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import EquipSwitch from '$lib/components/EquipSwitch.svelte';
	import WaterDetail from '$lib/components/WaterDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import RetiredBadge from '$lib/components/RetiredBadge.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const profiles = $derived(journal.waterProfiles);
	const brews = $derived(journal.brews);
	const beans = $derived(beanById(journal.beans));

	const counts = $derived.by(() => {
		const c: Record<string, number> = {};
		brews.forEach((b) => { if (b.waterProfile) c[b.waterProfile] = (c[b.waterProfile] || 0) + 1; });
		return c;
	});

	// Desktop split-pane: rail stays on the left, detail renders on the right
	// instead of navigating. Mobile ignores this and navigates normally.
	let selectedProfileId = $state<string | undefined>(undefined);
	const effectiveSelectedId = $derived(selectedProfileId ?? profiles[0]?.id);
	const selectedProfile = $derived(profiles.find((w) => w.id === effectiveSelectedId));
	const selectedProfileBrews = $derived(
		selectedProfile ? brews.filter((b) => b.waterProfile === selectedProfile.id) : []
	);

	function onCardClick(e: MouseEvent, id: string) {
		if (window.matchMedia('(min-width: 860px)').matches) {
			e.preventDefault();
			selectedProfileId = id;
		}
	}

	function deleteSelectedProfile() {
		if (!selectedProfile) return;
		journal.deleteWaterProfile(selectedProfile.id);
		selectedProfileId = undefined;
	}
</script>

<div class="water-shell">
	<div class="screen">
		<TopBar sub="Equipment" title="Water">
			{#snippet action()}
				<a class="icon-btn" href="/water/new" aria-label="Add water profile"><Icon name="plus" size={18} /></a>
			{/snippet}
		</TopBar>

		<EquipSwitch />

		<div class="section-label">Library</div>
		<div class="water-list">
			{#each profiles as w (w.id)}
				<a
					class="water-card"
					class:selected={w.id === effectiveSelectedId}
					href="/water/{w.id}"
					onclick={(e) => onCardClick(e, w.id)}
				>
					<div class="water-icon"><Icon name="droplet" size={24} stroke="rgba(220,240,255,0.9)" /></div>
					<div class="water-info">
						<div class="water-name">
							{w.name}
							{#if w.retired}<RetiredBadge />{/if}
						</div>
						<div class="water-sub">
							{w.base ?? 'Base not set'}{#each w.additions as addition (addition.id)} · {addition.product}{/each}
						</div>
					</div>
					<div class="water-count mono">{counts[w.id] || 0} brews</div>
				</a>
			{/each}
			<a class="add-water" href="/water/new">
				<Icon name="plus" size={14} /> Add water profile
			</a>
		</div>
	</div>

	{#if selectedProfile}
		<div class="water-detail-pane">
			<div class="desktop-detail-actions">
				<DetailActionMenu
					editHref={`/water/new?edit=${selectedProfile.id}`}
					label="Water actions"
					onRetire={() => journal.toggleWaterProfileRetired(selectedProfile.id)}
					retired={selectedProfile.retired}
					onDelete={deleteSelectedProfile}
				/>
			</div>
			<WaterDetail profile={selectedProfile} myBrews={selectedProfileBrews} beanById={beans} />
		</div>
	{/if}
</div>

<style>
	.water-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0 16px 24px;
	}
	.water-card {
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		padding: 16px;
		display: flex;
		gap: 14px;
		align-items: center;
		text-align: left;
	}
	.water-card.selected {
		border-color: var(--accent);
		border-width: 1.5px;
	}
	.water-icon {
		width: 56px;
		height: 56px;
		flex-shrink: 0;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #3d5566, #1a2630);
	}
	.water-info {
		flex: 1;
		min-width: 0;
	}
	.water-name {
		font-family: var(--serif);
		font-weight: 500;
		font-size: 17px;
		font-variation-settings: 'opsz' 24;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.water-sub {
		font-size: 11px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.water-count {
		font-size: 11px;
		color: var(--ink-3);
		flex-shrink: 0;
	}
	.add-water {
		padding: 14px;
		border-radius: var(--r-lg);
		border: 1px dashed var(--line);
		color: var(--ink-3);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
	}

	:global(.water-shell) {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.water-detail-pane {
		display: none;
	}
	.desktop-detail-actions {
		display: flex;
		justify-content: flex-end;
		padding: 32px 16px 0;
	}

	@media (min-width: 860px) {
		:global(.water-shell .screen) {
			max-width: none;
			margin: 0;
			width: 360px;
			flex-shrink: 0;
			border-right: 1px solid var(--line-soft);
			overflow-y: auto;
		}
		.water-detail-pane {
			display: block;
			flex: 1;
			min-width: 0;
			overflow-y: auto;
		}
	}
</style>

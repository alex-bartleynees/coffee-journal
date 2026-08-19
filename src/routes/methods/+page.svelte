<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import EquipSwitch from '$lib/components/EquipSwitch.svelte';
	import MethodDetail from '$lib/components/MethodDetail.svelte';
	import MethodIcon from '$lib/components/MethodIcon.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const methods = $derived(journal.methods);
	const machines = $derived(journal.machines);
	const brews = $derived(journal.brews);
	const beans = $derived(beanById(journal.beans));

	// Desktop split-pane: rail stays on the left, detail renders on the right
	// instead of navigating. Mobile ignores this and navigates normally.
	let selectedMethodId = $state<string | undefined>(undefined);
	const effectiveSelectedId = $derived(selectedMethodId ?? methods[0]?.id);
	const selectedMethod = $derived(methods.find((m) => m.id === effectiveSelectedId));
	const selectedMethodMachines = $derived(
		selectedMethod ? machines.filter((m) => m.method === selectedMethod.id) : []
	);
	const selectedMethodBrews = $derived(
		selectedMethod ? brews.filter((b) => b.method === selectedMethod.id) : []
	);
	const selectedMethodRecipes = $derived(
		selectedMethod ? journal.recipes.filter((recipe) => recipe.methodId === selectedMethod.id) : []
	);

	function deleteRecipe(id: string) {
		if (confirm('Delete this recipe? Saved brews will keep their recorded measurements.')) journal.deleteRecipe(id);
	}

	function onMethodCardClick(e: MouseEvent, id: string) {
		if (window.matchMedia('(min-width: 860px)').matches) {
			e.preventDefault();
			selectedMethodId = id;
		}
	}
</script>

<div class="methods-shell">
	<div class="screen">
		<TopBar sub="Equipment" title="Methods">
			{#snippet action()}
				<a class="icon-btn" href="/methods/new" aria-label="Add method"><Icon name="plus" size={18} /></a>
			{/snippet}
		</TopBar>

		<EquipSwitch />

		<div class="section-label">Brewing methods</div>
		<div class="method-list">
			{#each methods as m (m.id)}
				{@const machineCount = machines.filter((x) => x.method === m.id).length}
				{@const brewCount = brews.filter((b) => b.method === m.id).length}
				<a
					class="method-card"
					class:selected={m.id === effectiveSelectedId}
					href="/methods/{m.id}"
					onclick={(e) => onMethodCardClick(e, m.id)}
				>
					<div class="method-illustration">
						<MethodIcon method={m.id} size={26} stroke="rgba(255,235,200,0.85)" strokeWidth={1.4} />
					</div>
					<div class="method-info">
						<div class="method-name">{m.label}</div>
						<div class="method-sub">{machineCount} tool{machineCount !== 1 ? 's' : ''}</div>
					</div>
					<div class="method-count mono">{brewCount} brews</div>
				</a>
			{/each}
			<a class="add-method" href="/methods/new">
				<Icon name="plus" size={14} /> Add method
			</a>
		</div>
	</div>

	{#if selectedMethod}
		<div class="methods-detail-pane">
			<div class="desktop-detail-actions">
				<DetailActionMenu editHref={`/methods/new?edit=${selectedMethod.id}`} label="Method actions" />
			</div>
			<MethodDetail
				method={selectedMethod}
				machines={selectedMethodMachines}
				myBrews={selectedMethodBrews}
				recipes={selectedMethodRecipes}
				onDeleteRecipe={deleteRecipe}
				beanById={beans}
			/>
		</div>
	{/if}
</div>

<style>
	.method-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0 16px 24px;
	}
	.method-card {
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		padding: 16px;
		display: flex;
		gap: 14px;
		align-items: center;
		text-align: left;
	}
	.method-card.selected {
		border-color: var(--accent);
		border-width: 1.5px;
	}
	.method-illustration {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		flex-shrink: 0;
		background: linear-gradient(135deg, #4a4036, #201a16);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.method-info {
		flex: 1;
		min-width: 0;
	}
	.method-name {
		font-family: var(--serif);
		font-weight: 500;
		font-size: 17px;
		font-variation-settings: 'opsz' 24;
		color: var(--ink);
	}
	.method-sub {
		font-size: 11px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-top: 2px;
	}
	.method-count {
		font-size: 11px;
		color: var(--ink-3);
		flex-shrink: 0;
	}
	.add-method {
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
	:global(.methods-shell) {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.methods-detail-pane {
		display: none;
	}
	.desktop-detail-actions {
		display: flex;
		justify-content: flex-end;
		padding: 0 16px;
	}

	@media (min-width: 860px) {
		:global(.methods-shell .screen) {
			max-width: none;
			margin: 0;
			width: 360px;
			flex-shrink: 0;
			border-right: 1px solid var(--line-soft);
			overflow-y: auto;
		}
		.methods-detail-pane {
			display: block;
			flex: 1;
			min-width: 0;
			overflow-y: auto;
			padding-top: 32px;
		}
	}
</style>

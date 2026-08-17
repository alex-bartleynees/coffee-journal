<script lang="ts">
	import MethodIcon from '$lib/components/MethodIcon.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { MILK_DRINKS, type Bean, type Machine, type MethodDef, type MilkDrink } from '$lib/data/types';
	import type { DraftBrew } from './DraftBrew';

	interface Props {
		draft: DraftBrew;
		beans: Bean[];
		methods: MethodDef[];
		machines: Machine[];
		includeBeanId?: string;
	}

	let { draft, beans, methods, machines, includeBeanId }: Props = $props();

	const roastColor: Record<string, string> = { light: '#C9A57B', medium: '#8E5A3B', dark: '#4A2C1F' };

	const selectedBean = $derived(beans.find((b) => b.id === draft.beanId));
	const methodMachines = $derived(machines.filter((m) => m.method === draft.method));

	function selectMilkDrink(drink: MilkDrink) {
		const selected = draft.withMilk && draft.milkDrink === drink;
		draft.withMilk = !selected;
		draft.milkDrink = selected ? null : drink;
	}

	// Reset/preselect the machine whenever the method changes (including on
	// first mount) so a stale machine from a different method never lingers.
	$effect(() => {
		if (draft.machine && methodMachines.some((m) => m.id === draft.machine)) return;
		draft.machine = methodMachines[0]?.id ?? null;
	});
</script>

<div class="step">
	<div class="col-left">
		<div class="section-label desktop-only">Choose a bean</div>
		<div class="hint">Pick a bean from your library.</div>
		<div class="bean-picker">
			{#each beans.filter((b) => !b.finished || b.id === includeBeanId) as bean (bean.id)}
				<button class="bean-option" class:selected={draft.beanId === bean.id} onclick={() => (draft.beanId = bean.id)}>
					<span class="bean-bar" style="background:{roastColor[bean.roast]}"></span>
					<span class="bean-option-info">
						<span class="bean-option-name">{bean.name}</span>
						<span class="bean-option-roaster">{bean.roaster}</span>
					</span>
					{#if draft.beanId === bean.id}
						<span class="bean-check"><Icon name="check" size={14} strokeWidth={2.4} /></span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="col-right">
		<div class="quick-card">
			<div>
				<div class="quick-title">Quick brew</div>
				<div class="quick-sub">Save after the recipe — skip tasting notes and verdict.</div>
			</div>
			<button
				class="toggle"
				class:on={draft.quickBrew}
				onclick={() => (draft.quickBrew = !draft.quickBrew)}
				aria-label="Quick brew"
				aria-pressed={draft.quickBrew}
			>
				<span class="toggle-thumb"></span>
			</button>
		</div>

		<div class="section-label">Method</div>
		<div class="method-grid">
			{#each methods as m (m.id)}
				<button class="method-option" class:selected={draft.method === m.id} onclick={() => (draft.method = m.id)}>
					<MethodIcon method={m.id} size={26} strokeWidth={1.4} />
					<span>{m.label}</span>
				</button>
			{/each}
		</div>

		{#if draft.method === 'espresso'}
			<div class="milk-card">
				<div class="milk-left">
					<Icon name="milk" size={18} stroke="var(--ink-2)" />
					<div>
						<div class="milk-title">With milk</div>
						<div class="milk-sub">Adds a second rating for the milk drink</div>
					</div>
				</div>
				<div class="milk-options" aria-label="Milk drink">
					{#each MILK_DRINKS as drink (drink)}
						<button class="milk-chip" class:active={draft.withMilk && draft.milkDrink === drink} onclick={() => selectMilkDrink(drink)} aria-pressed={draft.withMilk && draft.milkDrink === drink}>
							{drink}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if methodMachines.length > 0}
			<div class="section-label">Machine</div>
			<div class="chip-group">
				{#each methodMachines as m (m.id)}
					<button class="chip" class:active={draft.machine === m.id} onclick={() => (draft.machine = m.id)}>
						{m.name}
					</button>
				{/each}
			</div>
		{/if}

		{#if selectedBean}
			<div class="selected-bean-card">
				<div class="selected-label">Selected</div>
				<div class="selected-name">{selectedBean.name}</div>
				<div class="selected-meta">{selectedBean.origin} · {selectedBean.process}</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.step {
		padding: 8px 16px;
	}
	.col-left,
	.col-right {
		display: contents;
	}
	.desktop-only {
		display: none;
	}
	.selected-bean-card {
		display: none;
	}
	.quick-card {
		margin: 16px 0;
		padding: 14px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.quick-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}
	.quick-sub {
		margin-top: 2px;
		font-size: 11px;
		line-height: 1.4;
		color: var(--ink-3);
	}
	.toggle {
		width: 44px;
		height: 26px;
		border-radius: 100px;
		background: var(--line);
		position: relative;
		flex-shrink: 0;
		transition: background 0.2s;
	}
	.toggle.on { background: var(--ink); }
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: left 0.2s;
	}
	.toggle.on .toggle-thumb { left: 20px; }
	.hint {
		font-size: 12px;
		color: var(--ink-3);
		margin-bottom: 12px;
		line-height: 1.4;
	}
	.bean-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.bean-option {
		padding: 14px;
		border-radius: var(--r-md);
		border: 1px solid var(--line);
		background: var(--card-2);
		display: flex;
		gap: 12px;
		align-items: center;
		text-align: left;
	}
	.bean-option.selected {
		border: 1.5px solid var(--ink);
		background: var(--card);
	}
	.bean-bar {
		width: 8px;
		height: 40px;
		border-radius: 4px;
		flex-shrink: 0;
	}
	.bean-option-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.bean-option-name {
		font-family: var(--serif);
		font-size: 16px;
		font-weight: 500;
		color: var(--ink);
		letter-spacing: -0.2px;
	}
	.bean-option-roaster {
		font-size: 11px;
		color: var(--ink-3);
		letter-spacing: 0.4px;
		text-transform: uppercase;
		margin-top: 2px;
	}
	.bean-check {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--ink);
		color: var(--paper);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.method-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		padding-bottom: 8px;
	}
	.method-option {
		padding: 14px 8px;
		border-radius: var(--r-md);
		border: 1px solid var(--line);
		background: var(--card-2);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		color: var(--ink-3);
	}
	.method-option.selected {
		border: 1.5px solid var(--ink);
		background: var(--card);
		color: var(--ink);
	}
	.method-option span {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.3px;
	}
	.milk-card {
		margin-top: 8px;
		padding: 16px 14px;
		background: var(--card);
		border-radius: var(--r-md);
		border: 1px solid var(--line-soft);
	}
	.milk-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.milk-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--ink);
	}
	.milk-sub {
		font-size: 11px;
		color: var(--ink-3);
	}
	.milk-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
	}
	.milk-chip {
		padding: 8px 14px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--card-2);
		color: var(--ink-2);
		font-size: 13px;
	}
	.milk-chip.active {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}

	@media (min-width: 860px) {
		.quick-card {
			margin: 0;
		}
		.step {
			padding: 0;
			display: grid;
			grid-template-columns: 1.15fr 0.85fr;
			gap: 32px;
		}
		.col-left,
		.col-right {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}
		.desktop-only {
			display: flex;
		}
		.hint {
			display: none;
		}
		.bean-picker {
			max-height: 340px;
			overflow-y: auto;
			padding-right: 4px;
		}
		.selected-bean-card {
			display: block;
			padding: 14px 16px;
			background: var(--card-2);
			border: 1px solid var(--line-soft);
			border-radius: 12px;
		}
		.selected-label {
			font-size: 9.5px;
			letter-spacing: 1.4px;
			text-transform: uppercase;
			color: var(--ink-3);
			margin-bottom: 6px;
		}
		.selected-name {
			font-family: var(--serif);
			font-size: 15px;
			font-weight: 500;
			color: var(--ink);
		}
		.selected-meta {
			font-size: 11.5px;
			color: var(--ink-3);
			margin-top: 2px;
		}
	}
</style>

<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import type { Bean, Method } from '$lib/data/types';
	import type { DraftBrew } from './DraftBrew';

	interface Props {
		draft: DraftBrew;
		beans: Bean[];
		includeBeanId?: string;
	}

	let { draft, beans, includeBeanId }: Props = $props();

	const methods: { id: Method; label: string }[] = [
		{ id: 'espresso', label: 'Espresso' },
		{ id: 'v60', label: 'V60' },
		{ id: 'aeropress', label: 'AeroPress' }
	];

	const roastColor: Record<string, string> = { light: '#C9A57B', medium: '#8E5A3B', dark: '#4A2C1F' };

	const selectedBean = $derived(beans.find((b) => b.id === draft.beanId));
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
		<div class="section-label">Method</div>
		<div class="method-grid">
			{#each methods as m (m.id)}
				<button class="method-option" class:selected={draft.method === m.id} onclick={() => (draft.method = m.id)}>
					<Icon name={m.id} size={26} strokeWidth={1.4} />
					<span>{m.label}</span>
				</button>
			{/each}
		</div>

		{#if draft.method === 'espresso'}
			<div class="milk-row">
				<div class="milk-left">
					<Icon name="milk" size={18} stroke="var(--ink-2)" />
					<div>
						<div class="milk-title">With milk</div>
						<div class="milk-sub">Adds flat white rating</div>
					</div>
				</div>
				<button
					class="toggle"
					class:on={draft.withMilk}
					onclick={() => (draft.withMilk = !draft.withMilk)}
					aria-label="With milk"
					aria-pressed={draft.withMilk}
				>
					<span class="toggle-thumb"></span>
				</button>
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
	.milk-row {
		margin-top: 8px;
		padding: 12px 14px;
		background: var(--card);
		border-radius: var(--r-md);
		border: 1px solid var(--line-soft);
		display: flex;
		align-items: center;
		justify-content: space-between;
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
	.toggle {
		width: 44px;
		height: 26px;
		border-radius: 100px;
		background: var(--line);
		position: relative;
		transition: background 0.2s;
	}
	.toggle.on {
		background: var(--ink);
	}
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #fff;
		transition: left 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.toggle.on .toggle-thumb {
		left: 20px;
	}

	@media (min-width: 860px) {
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

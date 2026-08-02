<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { createDraft } from '$lib/components/new-brew/DraftBrew';
	import BeanStep from '$lib/components/new-brew/BeanStep.svelte';
	import BrewStep from '$lib/components/new-brew/BrewStep.svelte';
	import TasteStep from '$lib/components/new-brew/TasteStep.svelte';
	import VerdictStep from '$lib/components/new-brew/VerdictStep.svelte';
	import type { Brew } from '$lib/data/types';

	const TABS = ['Bean', 'Brew', 'Taste', 'Verdict'];
	const TITLES = ['What bean?', 'Recipe', 'How was it?', 'The verdict'];

	let tab = $state(0);
	const draft = $state(createDraft(journal.beans[0]?.id ?? ''));

	function close() {
		history.length > 1 ? history.back() : goto('/');
	}

	function save() {
		const referenceDate = journal.brews.reduce(
			(max, b) => (b.date > max ? b.date : max),
			journal.brews[0]?.date ?? new Date().toISOString().slice(0, 10)
		);
		const brew: Brew = {
			...draft,
			id: 'br' + (journal.brews.length + 1) + '-' + Date.now(),
			date: referenceDate,
			time: new Date().toTimeString().slice(0, 5),
			ratio: draft.yieldOut && draft.doseIn ? `1:${(draft.yieldOut / draft.doseIn).toFixed(1)}` : '—',
			rating2: draft.withMilk ? draft.rating2 : null
		};
		journal.addBrew(brew);
		goto(`/brew/${brew.id}`);
	}
</script>

<div class="new-brew">
	<div class="nb-header">
		<button class="icon-btn" onclick={close} aria-label="Close"><Icon name="close" size={18} /></button>
		<div class="nb-step-count">Step {tab + 1} / 4</div>
		<button class="nb-save" onclick={save}>Save</button>
	</div>

	<div class="nb-title">
		<h1>{TITLES[tab]}</h1>
	</div>

	<div class="tabs">
		{#each TABS as t, i (t)}
			<button class="tab" class:active={tab === i} onclick={() => (tab = i)}>{t}</button>
		{/each}
	</div>

	<div class="screen nb-content">
		{#if tab === 0}
			<BeanStep {draft} beans={journal.beans} />
		{:else if tab === 1}
			<BrewStep {draft} grinders={journal.grinders} />
		{:else if tab === 2}
			<TasteStep {draft} />
		{:else if tab === 3}
			<VerdictStep {draft} />
		{/if}
	</div>

	<div class="nb-footer">
		{#if tab > 0}
			<button class="btn btn-ghost" style="flex: 1" onclick={() => (tab -= 1)}>Back</button>
		{/if}
		{#if tab < 3}
			<button class="btn btn-primary" style="flex: 2" onclick={() => (tab += 1)}>
				Continue
				<Icon name="chevron" size={16} />
			</button>
		{:else}
			<button class="btn btn-accent" style="flex: 2" onclick={save}>
				<Icon name="check" size={16} /> Save brew
			</button>
		{/if}
	</div>
</div>

<style>
	.new-brew {
		position: absolute;
		inset: 0;
		background: var(--paper);
		z-index: 100;
		display: flex;
		flex-direction: column;
	}
	.nb-header {
		padding: 56px 16px 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.nb-step-count {
		flex: 1;
		min-width: 0;
		font-size: 11px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
		text-align: center;
		white-space: nowrap;
	}
	.nb-save {
		font-size: 13px;
		font-weight: 600;
		color: var(--accent);
		padding: 8px 12px;
		letter-spacing: 0.3px;
		flex-shrink: 0;
	}
	.nb-title {
		padding: 16px 20px 0;
	}
	.nb-title h1 {
		font-family: var(--serif);
		font-size: 30px;
		font-weight: 400;
		font-style: italic;
		margin: 0;
		letter-spacing: -0.6px;
		line-height: 1.1;
		font-variation-settings: 'opsz' 144, 'SOFT' 50;
		color: var(--ink);
	}
	.nb-content {
		padding-top: 12px;
		padding-bottom: 24px;
	}
	.nb-footer {
		padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 16px));
		background: var(--paper);
		border-top: 1px solid var(--line-soft);
		display: flex;
		gap: 10px;
	}
</style>

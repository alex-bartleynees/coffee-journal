<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { createDraft, draftFromBrew, loadDraft, saveDraft, clearDraft } from '$lib/components/new-brew/DraftBrew';
	import { newId } from '$lib/data/id';
	import { todayIso } from '$lib/data/date';
	import BeanStep from '$lib/components/new-brew/BeanStep.svelte';
	import BrewStep from '$lib/components/new-brew/BrewStep.svelte';
	import TasteStep from '$lib/components/new-brew/TasteStep.svelte';
	import VerdictStep from '$lib/components/new-brew/VerdictStep.svelte';
	import type { Brew } from '$lib/data/types';

	const TABS = ['Bean', 'Brew', 'Taste', 'Verdict'];
	const TITLES = ['What bean?', 'Recipe', 'How was it?', 'The verdict'];
	const editId = $derived(page.url.searchParams.get('edit'));
	const existingBrew = $derived(editId ? journal.brews.find((brew) => brew.id === editId) : undefined);

	let tab = $state(0);
	const draft = $state(createDraft(journal.beans[0]?.id ?? ''));
	let initializedEditId: string | null = null;

	// Restore an in-progress draft (if any) only after mount, so server/client
	// initial render agree; start autosaving once restored.
	let persisting = false;
	onMount(() => {
		if (editId) return;
		const restored = loadDraft();
		if (restored) {
			Object.assign(draft, restored.draft);
			tab = restored.tab;
		}
		persisting = true;
	});

	$effect(() => {
		if (!editId || !existingBrew || initializedEditId === editId) return;
		Object.assign(draft, draftFromBrew(existingBrew));
		tab = 0;
		initializedEditId = editId;
	});

	$effect(() => {
		// Read every field + tab so this re-runs on any edit, then mirror to storage.
		const snapshot = $state.snapshot(draft);
		const currentTab = tab;
		if (persisting) saveDraft(snapshot, currentTab);
	});

	function endDraft() {
		persisting = false;
		clearDraft();
	}

	function close() {
		if (editId) {
			goto(`/brew/${editId}`, { replaceState: true });
			return;
		}
		endDraft();
		history.length > 1 ? history.back() : goto('/');
	}

	function save() {
		if (editId && !existingBrew) return;
		const brew: Brew = {
			...draft,
			id: existingBrew?.id ?? newId('br'),
			date: existingBrew?.date ?? todayIso(),
			time: existingBrew?.time ?? new Date().toTimeString().slice(0, 5),
			ratio: draft.yieldOut && draft.doseIn ? `1:${(draft.yieldOut / draft.doseIn).toFixed(1)}` : '—',
			recipeNotes: draft.recipeNotes.trim() || undefined,
			machine: draft.machine ?? undefined,
			rating2: draft.withMilk ? draft.rating2 : null,
			milkDrink: draft.withMilk ? draft.milkDrink : null
		};
		if (existingBrew) journal.updateBrew(brew);
		else {
			journal.addBrew(brew);
			endDraft();
		}
		goto(`/brew/${brew.id}`, { replaceState: true });
	}
</script>

{#if editId && journal.ready && !existingBrew}
	<div class="nb-overlay">
		<div class="new-brew">
			<div class="nb-header">
				<button class="icon-btn" onclick={() => goto('/')} aria-label="Close"><Icon name="close" size={18} /></button>
				<div class="nb-step-count">Edit brew</div>
				<div style="width: 62px"></div>
			</div>
			<div class="not-found">
				<h1>Brew not found</h1>
				<a class="btn btn-primary" href="/">Back to journal</a>
			</div>
		</div>
	</div>
{:else}
<div class="nb-overlay">
<div class="new-brew">
	<div class="nb-header">
		<button class="icon-btn" onclick={close} aria-label="Close"><Icon name="close" size={18} /></button>
		<div class="nb-step-count">{editId ? 'Edit brew · ' : ''}Step {tab + 1} / 4</div>
		<button class="nb-save" onclick={save}>Save</button>
	</div>

	<div class="nb-title">
		<h1>{TITLES[tab]}</h1>
	</div>

	<div class="tabs">
		{#each TABS as t, i (t)}
			<button class="tab" class:active={tab === i} class:done={tab > i} onclick={() => (tab = i)}>
				<span class="tab-badge">
					{#if tab > i}
						<Icon name="check" size={10} strokeWidth={2.6} />
					{:else}
						{i + 1}
					{/if}
				</span>
				<span class="tab-label">{t}</span>
			</button>
		{/each}
	</div>

	<div class="screen nb-content">
		{#if tab === 0}
			<BeanStep
				{draft}
				beans={journal.beans}
				methods={journal.methods}
				machines={journal.machines}
				includeBeanId={existingBrew?.beanId}
			/>
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
			<button class="btn btn-ghost nb-back" onclick={() => (tab -= 1)}>Back</button>
		{:else}
			<div class="nb-back-spacer" aria-hidden="true"></div>
		{/if}
		<div class="nb-footer-right">
			<button class="btn btn-ghost nb-cancel" onclick={close}>Cancel</button>
			{#if tab < 3}
				<button class="btn btn-primary nb-continue" onclick={() => (tab += 1)}>
					Continue
					<Icon name="chevron" size={16} />
				</button>
			{:else}
				<button class="btn btn-accent nb-save-btn" onclick={save}>
					<Icon name="check" size={16} /> {editId ? 'Save changes' : 'Save brew'}
				</button>
			{/if}
		</div>
	</div>
</div>
</div>
{/if}

<style>
	.nb-overlay {
		display: contents;
	}
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
	.tab-badge {
		display: none;
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
	.nb-back {
		flex: 1;
	}
	.nb-footer-right {
		display: contents;
	}
	.nb-cancel {
		display: none;
	}
	.nb-back-spacer {
		display: none;
	}
	.nb-continue,
	.nb-save-btn {
		flex: 2;
	}
	.not-found {
		padding: 64px 20px;
		text-align: center;
	}
	.not-found h1 {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 500;
	}

	@media (min-width: 860px) {
		.nb-overlay {
			display: flex;
			position: fixed;
			inset: 0;
			z-index: 100;
			background: rgba(20, 16, 12, 0.55);
			align-items: center;
			justify-content: center;
			padding: 24px;
		}
		.new-brew {
			position: static;
			width: 940px;
			max-width: 100%;
			max-height: 88vh;
			border-radius: 18px;
			border: 1px solid var(--line-soft);
			box-shadow: 0 40px 90px rgba(0, 0, 0, 0.35);
			overflow: hidden;
		}
		.nb-header {
			position: relative;
			padding: 22px 28px 0;
			align-items: flex-start;
		}
		.nb-header .icon-btn {
			position: absolute;
			top: 22px;
			right: 28px;
		}
		.nb-step-count {
			flex: none;
			text-align: left;
			margin-bottom: 4px;
		}
		.nb-save {
			display: none;
		}
		.nb-title {
			padding: 4px 28px 0;
		}
		.nb-title h1 {
			font-size: 28px;
		}
		.tabs {
			margin: 18px 28px 0;
			background: transparent;
			border-radius: 0;
			padding: 0;
			gap: 6px;
		}
		.tab {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 9px 4px;
			border-radius: 0;
			background: transparent;
			box-shadow: none;
			border-bottom: 2px solid var(--line-soft);
			color: var(--ink-4);
			font-size: 12.5px;
			font-weight: 600;
			letter-spacing: 0.2px;
		}
		.tab.active {
			border-bottom-color: var(--ink);
			color: var(--ink);
		}
		.tab.done {
			border-bottom-color: var(--ink);
			color: var(--ink-2);
		}
		.tab-badge {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			border-radius: 50%;
			flex-shrink: 0;
			font-size: 10px;
			font-family: var(--mono);
			border: 1px solid var(--line);
			color: var(--ink-4);
		}
		.tab.active .tab-badge {
			border: 1.5px solid var(--ink);
			color: var(--ink);
			background: var(--card);
		}
		.tab.done .tab-badge {
			background: var(--ink);
			color: var(--paper);
			border: none;
		}
		.nb-content {
			padding: 26px 28px 8px;
		}
		.nb-footer {
			padding: 18px 28px;
			justify-content: space-between;
			align-items: center;
		}
		.nb-back {
			flex: none;
			width: 110px;
		}
		.nb-back-spacer {
			display: block;
		}
		.nb-footer-right {
			display: flex;
			gap: 10px;
		}
		.nb-cancel {
			display: flex;
			width: 90px;
			justify-content: center;
		}
		.nb-continue,
		.nb-save-btn {
			flex: none;
		}
		.nb-continue {
			width: 140px;
		}
		.nb-save-btn {
			width: 150px;
		}
	}
</style>

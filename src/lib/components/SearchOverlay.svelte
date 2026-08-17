<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import BeanBag from '$lib/components/BeanBag.svelte';
	import MethodIcon from '$lib/components/MethodIcon.svelte';
	import RoastDot from '$lib/components/RoastDot.svelte';
	import { beanById } from '$lib/data/sample';
	import { methodLabel } from '$lib/data/methods';
	import { searchJournal } from '$lib/data/search';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { search } from '$lib/stores/search.svelte';

	let query = $state('');
	let input = $state<HTMLInputElement>();
	const results = $derived(searchJournal(query, journal));
	const beans = $derived(beanById(journal.beans));
	const hasResults = $derived(results.beans.length > 0 || results.brews.length > 0);

	$effect(() => {
		if (search.isOpen) {
			void tick().then(() => input?.focus());
		}
	});

	function close(): void {
		query = '';
		search.close();
	}

	async function select(path: string): Promise<void> {
		close();
		await goto(path);
	}

	function onKeydown(event: KeyboardEvent): void {
		if (search.isOpen && event.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if search.isOpen}
	<div class="search-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && close()}>
		<div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title">
			<div class="search-header">
				<div class="search-input-wrap">
					<Icon name="search" size={18} />
					<input
						bind:this={input}
						bind:value={query}
						aria-label="Search your journal"
						placeholder="Search beans, brews…"
					/>
				</div>
				<button class="close-button" type="button" aria-label="Close search" onclick={close}>
					<Icon name="close" size={18} />
				</button>
			</div>

			<div class="search-content">
				<h2 id="search-title" class="sr-title">Search your journal</h2>
				{#if !query.trim()}
					<div class="search-empty">Search by bean, roaster, origin, tasting note, or brew method.</div>
				{:else if !hasResults}
					<div class="search-empty">No beans or brews found for “{query.trim()}”.</div>
				{:else}
					{#if results.beans.length}
						<div class="result-group">
							<div class="group-label">Beans</div>
							{#each results.beans as bean (bean.id)}
								<button class="result-row" type="button" onclick={() => select(`/beans/${bean.id}`)}>
									<BeanBag roast={bean.roast} roaster={bean.roaster} width={36} height={44} />
									<span class="result-copy">
										<span class="result-title">{bean.name}</span>
										<span class="result-meta"><RoastDot roast={bean.roast} size={6} /> {bean.roaster} · {bean.origin}</span>
									</span>
									<Icon name="chevron" size={14} />
								</button>
							{/each}
						</div>
					{/if}

					{#if results.brews.length}
						<div class="result-group">
							<div class="group-label">Brews</div>
							{#each results.brews as brew (brew.id)}
								{@const bean = beans[brew.beanId]}
								<button class="result-row" type="button" onclick={() => select(`/brew/${brew.id}`)}>
									<span class="method-mark"><MethodIcon method={brew.method} size={22} /></span>
									<span class="result-copy">
										<span class="result-title">{bean?.name ?? 'Unknown bean'}</span>
										<span class="result-meta">{bean?.roaster ?? 'Unknown roaster'} · {methodLabel(journal.methods, brew.method)} · {brew.rating == null ? 'Not rated' : `${brew.rating}/10`}</span>
									</span>
									<Icon name="chevron" size={14} />
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.search-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(28, 22, 17, 0.42); display: flex; align-items: stretch; justify-content: center; }
	.search-dialog { width: 100%; min-height: 100%; background: var(--paper); display: flex; flex-direction: column; color: var(--ink); }
	.search-header { display: flex; gap: 10px; align-items: center; padding: max(16px, env(safe-area-inset-top)) 16px 12px; border-bottom: 1px solid var(--line-soft); }
	.search-input-wrap { flex: 1; display: flex; align-items: center; gap: 10px; padding: 11px 13px; background: var(--card-2); border: 1px solid var(--line-soft); border-radius: 10px; color: var(--ink-3); }
	.search-input-wrap:focus-within { border-color: var(--ink-3); }
	input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; font-size: 16px; }
	input::placeholder { color: var(--ink-4); }
	.close-button { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 9px; color: var(--ink-2); }
	.search-content { flex: 1; overflow-y: auto; padding: 14px 16px calc(24px + env(safe-area-inset-bottom)); }
	.sr-title { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
	.search-empty { padding: 44px 20px; color: var(--ink-3); font-size: 13px; line-height: 1.6; text-align: center; }
	.result-group + .result-group { margin-top: 22px; }
	.group-label { margin: 0 4px 7px; color: var(--ink-3); font-size: 10px; font-weight: 600; letter-spacing: 1.3px; text-transform: uppercase; }
	.result-row { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-bottom: 1px solid var(--line-soft); color: var(--ink); text-align: left; }
	.result-row:hover, .result-row:focus-visible { background: var(--card-2); outline: none; }
	.result-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
	.result-title { overflow: hidden; font-family: var(--serif); font-size: 16px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.result-meta { display: flex; align-items: center; gap: 5px; overflow: hidden; color: var(--ink-3); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
	.method-mark { width: 42px; height: 42px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 10px; background: var(--card-2); color: var(--ink-2); }

	@media (min-width: 860px) {
		.search-backdrop { align-items: flex-start; padding: 10vh 24px 24px; }
		.search-dialog { width: min(620px, 100%); min-height: 0; max-height: 72vh; border: 1px solid var(--line-soft); border-radius: 14px; box-shadow: 0 24px 70px rgba(28, 22, 17, 0.24); overflow: hidden; }
		.search-header { padding: 14px; }
		.search-content { padding: 14px 18px 22px; }
	}
</style>

<script lang="ts">
	import MachineCard from '$lib/components/MachineCard.svelte';
	import MethodIcon from '$lib/components/MethodIcon.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import type { Bean, Brew, Machine, MethodDef, Recipe } from '$lib/data/types';
	import { recipeRatio } from '$lib/data/recipes';
	import { averageRating } from '$lib/data/ratings';

	let {
		method,
		machines,
		myBrews,
		beanById: beans,
		onOpenMachine,
		recipes = [],
		onDeleteRecipe
	}: {
		method: MethodDef;
		machines: Machine[];
		myBrews: Brew[];
		beanById: Record<string, Bean>;
		onOpenMachine?: (e: MouseEvent, id: string) => void;
		recipes?: Recipe[];
		onDeleteRecipe?: (id: string) => void;
	} = $props();

	const brewCountByMachine = $derived.by(() => {
		const counts: Record<string, number> = {};
		myBrews.forEach((b) => { if (b.machine) counts[b.machine] = (counts[b.machine] || 0) + 1; });
		return counts;
	});

	const avgRating = $derived(averageRating(myBrews));
</script>

<div class="method-detail">
	<div class="hero">
		<div class="hero-illustration">
			<div class="hero-method-wrap">
				<MethodIcon method={method.id} size={44} stroke="rgba(255,235,200,0.85)" strokeWidth={1.3} />
		</div>
	</div>

		<h2 class="hero-name">{method.label}</h2>
		<div class="hero-sub">{avgRating == null ? `${myBrews.length} brews` : `★ ${avgRating.toFixed(1)} avg · ${myBrews.length} brews`}</div>
	</div>

	{#if method.notes}
		<div class="notes-card">{method.notes}</div>
	{/if}

	<div class="section-label">Tools for this method</div>
	<div class="machine-list">
		{#each machines as m (m.id)}
			<MachineCard
				machine={m}
				brewCount={brewCountByMachine[m.id] || 0}
				onclick={onOpenMachine ? (e) => onOpenMachine(e, m.id) : undefined}
			/>
		{:else}
			<div class="machine-empty">No tools added for this method yet</div>
		{/each}
			<a class="add-machine" href={`/machines/new?method=${method.id}`}>
				<Icon name="plus" size={14} /> Add machine to this method
			</a>
	</div>

	<div class="section-label">Recipes for this method</div>
	<div class="recipe-list">
		{#each recipes as recipe (recipe.id)}
			<div class="recipe-card">
				<a class="recipe-main" href={`/methods/${method.id}/recipes/new?edit=${recipe.id}`}>
					<div>
						<div class="recipe-name">{recipe.name}</div>
						<div class="recipe-meta">{recipe.beanId ? (beans[recipe.beanId]?.name ?? 'Bean unavailable') : 'Any bean'} · {recipe.steps.length} steps · {recipe.temperature}°C</div>
					</div>
					<div class="recipe-ratio mono">{recipeRatio(recipe)}</div>
				</a>
				{#if onDeleteRecipe}
					<button class="recipe-delete" type="button" aria-label={`Delete ${recipe.name}`} onclick={() => onDeleteRecipe(recipe.id)}><Icon name="close" size={14} /></button>
				{/if}
			</div>
		{:else}
			<div class="recipe-empty">No recipes added for this method yet</div>
		{/each}
		<a class="add-machine" href={`/methods/${method.id}/recipes/new`}><Icon name="plus" size={14} /> Add recipe</a>
	</div>

	<div class="section-label">Brews using this method</div>
	<div class="brew-log">
		{#each myBrews as br (br.id)}
			{@const bean = beans[br.beanId]}
			<a class="log-row" href="/brew/{br.id}">
				<div class="log-meta">
					<div class="log-name">{bean?.name}</div>
					<div class="log-sub">{br.date}</div>
				</div>
				<div class="log-rating">{br.rating == null ? 'Not rated' : `★ ${br.rating}`}</div>
			</a>
		{:else}
			<div class="log-empty">No brews logged yet</div>
		{/each}
	</div>
</div>

<style>
	.hero {
		padding: 8px 24px 20px;
		text-align: center;
	}
	.hero-illustration {
		display: flex;
		justify-content: center;
		margin-bottom: 14px;
	}
	.hero-method-wrap {
		width: 90px;
		height: 90px;
		border-radius: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		margin: 0 auto;
		background: linear-gradient(135deg, #4a4036, #1f1815);
	}
	.hero-name {
		font-family: var(--serif);
		font-weight: 500;
		font-style: italic;
		font-size: 30px;
		margin: 4px 0 6px;
		color: var(--ink);
		font-variation-settings: 'opsz' 144;
	}
	.hero-sub {
		font-family: var(--serif);
		font-size: 14px;
		font-style: italic;
		color: var(--ink-2);
	}
	.notes-card {
		margin: 0 16px 16px;
		padding: 14px 18px;
		background: var(--card-2);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		font-family: var(--serif);
		font-style: italic;
		font-size: 14px;
		line-height: 1.5;
		color: var(--ink-2);
	}
	.machine-list {
		padding: 0 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.machine-empty {
		padding: 20px;
		text-align: center;
		color: var(--ink-3);
		font-size: 13px;
		border: 1px dashed var(--line);
		border-radius: var(--r-lg);
	}
	.add-machine {
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
	.recipe-list { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }
	.recipe-card { display: flex; align-items: center; background: var(--card); border: 1px solid var(--line-soft); border-radius: var(--r-lg); overflow: hidden; }
	.recipe-main { flex: 1; min-width: 0; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
	.recipe-main > div:first-child { flex: 1; min-width: 0; }
	.recipe-name { font-family: var(--serif); font-weight: 600; font-size: 16px; }
	.recipe-meta { margin-top: 3px; color: var(--ink-3); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.recipe-ratio { color: var(--ink-3); font-size: 12px; }
	.recipe-delete { align-self: stretch; width: 42px; display: grid; place-items: center; color: var(--ink-3); border-left: 1px solid var(--line-soft); }
	.recipe-empty { padding: 20px; text-align: center; color: var(--ink-3); font-size: 13px; border: 1px dashed var(--line); border-radius: var(--r-lg); }
	.brew-log {
		padding: 16px 16px 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.log-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
	}
	.log-meta {
		flex: 1;
		min-width: 0;
	}
	.log-name {
		font-family: var(--serif);
		font-weight: 500;
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.log-sub {
		font-size: 10.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.6px;
		margin-top: 2px;
	}
	.log-rating {
		font-family: var(--serif);
		font-size: 14px;
		font-style: italic;
		color: var(--ink-2);
	}
	.log-empty {
		padding: 24px;
		text-align: center;
		color: var(--ink-3);
		font-size: 13px;
	}
</style>

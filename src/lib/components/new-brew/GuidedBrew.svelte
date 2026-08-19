<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import type { Recipe } from '$lib/data/types';
	import { guidedMilestones } from '$lib/data/recipes';

	interface Props {
		recipe: Recipe;
		seconds: number;
		onChange: (value: number) => void;
		onClose: () => void;
	}

	let { recipe, seconds, onChange, onClose }: Props = $props();
	let running = $state(false);

	const orderedSteps = $derived(guidedMilestones(recipe));
	const currentIndex = $derived(Math.max(0, orderedSteps.findLastIndex((step) => step.time <= seconds)));
	const current = $derived(orderedSteps[currentIndex]);
	const next = $derived(orderedSteps.find((step) => step.time > seconds));

	$effect(() => {
		if (!running) return;
		let last = Date.now();
		const interval = setInterval(() => {
			const now = Date.now();
			onChange(+(seconds + (now - last) / 1000).toFixed(1));
			last = now;
		}, 100);
		return () => clearInterval(interval);
	});

	function formatTime(value: number) {
		const whole = Math.floor(value);
		return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
	}

	function reset() {
		running = false;
		onChange(0);
	}
</script>

<div class="guided-backdrop" role="presentation">
	<div class="guided" role="dialog" aria-modal="true" aria-label={`Guided brew: ${recipe.name}`}>
		<header><span>{recipe.name}</span><button type="button" aria-label="Close guided brew" onclick={onClose}><Icon name="close" size={20} /></button></header>
		<div class="guided-main">
			<div class="clock mono">{formatTime(seconds)}</div>
			<div class="now">Now</div>
			<div class="current" aria-live="polite">{current?.label ?? 'Ready'}</div>
			<div class="next">{next ? `Next: ${next.label} at ${formatTime(next.time)}` : 'Brew complete'}</div>
			<div class="controls">
				<button class="reset" type="button" aria-label="Reset" onclick={reset}><Icon name="reset" size={18} /></button>
				<button class="run" type="button" aria-label={running ? 'Pause' : 'Start'} onclick={() => (running = !running)}><Icon name={running ? 'pause' : 'play'} size={20} /></button>
			</div>
		</div>
		<div class="milestones">
			{#each orderedSteps as step, index (step.id)}
				<div class="milestone" class:active={index === currentIndex} class:done={step.time <= seconds}>
					<span class="badge">{#if step.time <= seconds}<Icon name="check" size={11} />{:else}{index + 1}{/if}</span>
					<span class="label">{step.label}</span>
					<span class="target mono">{formatTime(step.time)}{step.water != null ? ` · ${step.water}g` : ''}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.guided-backdrop { position: fixed; inset: 0; z-index: 300; background: rgba(20, 17, 14, .92); display: flex; justify-content: center; }
	.guided { width: 100%; min-height: 100%; background: var(--paper); display: flex; flex-direction: column; padding: env(safe-area-inset-top, 0) 0 env(safe-area-inset-bottom, 0); }
	header { padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; color: var(--ink-3); font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase; }
	header button { width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 50%; display: grid; place-items: center; color: var(--ink); }
	.guided-main { flex: 1; min-height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
	.clock { font-size: clamp(58px, 18vw, 84px); line-height: 1; letter-spacing: -4px; font-variant-numeric: tabular-nums; }
	.now { margin-top: 30px; color: var(--ink-3); font-size: 10px; letter-spacing: 1.7px; text-transform: uppercase; }
	.current { margin-top: 6px; font-family: var(--serif); font-size: 26px; font-weight: 600; }
	.next { margin-top: 5px; color: var(--ink-3); font-size: 13px; }
	.controls { margin-top: 32px; display: flex; align-items: center; gap: 14px; }
	.controls button { border-radius: 50%; display: grid; place-items: center; }
	.reset { width: 48px; height: 48px; border: 1px solid var(--line); }
	.run { width: 72px; height: 72px; background: var(--ink); color: var(--paper); }
	.milestones { padding: 12px 16px 24px; display: flex; flex-direction: column; gap: 5px; }
	.milestone { min-height: 48px; padding: 9px 11px; border: 1px solid transparent; border-radius: var(--r-md); display: flex; align-items: center; gap: 11px; color: var(--ink-2); }
	.milestone.active { background: var(--card); border-color: var(--line); color: var(--ink); }
	.badge { width: 25px; height: 25px; flex: 0 0 25px; border-radius: 50%; background: var(--line); display: grid; place-items: center; font-size: 11px; }
	.done .badge { background: var(--ink); color: var(--paper); }
	.label { flex: 1; }
	.target { color: var(--ink-3); font-size: 12px; }
	@media (min-width: 860px) {
		.guided-backdrop { padding: 32px; align-items: center; }
		.guided { width: min(620px, 100%); min-height: 0; height: min(820px, calc(100vh - 64px)); border-radius: 34px; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
		.guided-main { min-height: 390px; }
		.clock { font-size: 78px; }
	}
</style>

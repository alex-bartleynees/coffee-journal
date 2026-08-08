<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import type { Method } from '$lib/data/types';

	interface Props {
		seconds: number;
		method: Method;
		onChange: (v: number) => void;
	}

	let { seconds, method, onChange }: Props = $props();

	let running = $state(false);

	$effect(() => {
		if (!running) return;
		let last = Date.now();
		const id = setInterval(() => {
			const now = Date.now();
			const delta = (now - last) / 1000;
			last = now;
			onChange(+(seconds + delta).toFixed(1));
		}, 100);
		return () => clearInterval(id);
	});

	function fmt(s: number) {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		const ms = Math.floor((s % 1) * 10);
		return method === 'espresso' ? `${Math.floor(s)}.${ms}` : `${m}:${String(sec).padStart(2, '0')}`;
	}

	const target = $derived(method === 'espresso' ? 30 : method === 'v60' ? 180 : 90);
	const pct = $derived(Math.min(seconds / target, 1));
	const circumference = 2 * Math.PI * 92;
</script>

<div class="timer">
	<div class="dial-wrap">
		<svg width="220" height="220" viewBox="0 0 220 220" class="dial-svg">
			<circle cx="110" cy="110" r="92" fill="none" stroke="var(--line)" stroke-width="2" />
			<circle
				cx="110"
				cy="110"
				r="92"
				fill="none"
				stroke={pct >= 1 ? 'var(--accent)' : 'var(--ink)'}
				stroke-width="3"
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={circumference * (1 - pct)}
				transform="rotate(-90 110 110)"
			/>
			{#each Array.from({ length: 12 }) as _, i (i)}
				{@const a = ((i * 30 - 90) * Math.PI) / 180}
				<line
					x1={110 + Math.cos(a) * 100}
					y1={110 + Math.sin(a) * 100}
					x2={110 + Math.cos(a) * 105}
					y2={110 + Math.sin(a) * 105}
					stroke="var(--ink-4)"
					stroke-width="1"
				/>
			{/each}
		</svg>
		<div class="dial-center">
			<div class="dial-time mono">{fmt(seconds)}</div>
			<div class="dial-label">
				{method === 'espresso' ? 'seconds · target 28-32' : method === 'v60' ? 'min:sec · target 3:00' : 'min:sec'}
			</div>
		</div>
	</div>

	<div class="timer-controls">
		<button
			class="control-btn"
			onclick={() => {
				onChange(0);
				running = false;
			}}
			aria-label="Reset"
		>
			<Icon name="reset" size={16} />
		</button>
		<button class="start-btn" class:running onclick={() => (running = !running)}>
			{#if running}
				<Icon name="pause" size={14} /> Pause
			{:else}
				<Icon name="play" size={14} /> {seconds > 0 ? 'Resume' : 'Start'}
			{/if}
		</button>
	</div>
</div>

<style>
	.timer {
		padding: 20px 16px 24px;
		background: linear-gradient(180deg, var(--card), var(--paper-2));
		border: 1px solid var(--line-soft);
		border-radius: var(--r-xl);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}
	.dial-wrap {
		position: relative;
		width: 220px;
		height: 220px;
	}
	.dial-svg {
		position: absolute;
		inset: 0;
	}
	.dial-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.dial-time {
		font-size: 52px;
		font-weight: 500;
		color: var(--ink);
		letter-spacing: -2px;
		font-variant-numeric: tabular-nums;
	}
	.dial-label {
		font-size: 10px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-top: -4px;
	}
	.timer-controls {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.control-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1px solid var(--line);
		background: var(--card-2);
		color: var(--ink-2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.start-btn {
		padding: 14px 30px;
		border-radius: 100px;
		background: var(--ink);
		color: var(--paper);
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		font-size: 14px;
		letter-spacing: 0.3px;
	}
	.start-btn.running {
		background: var(--accent);
	}
</style>

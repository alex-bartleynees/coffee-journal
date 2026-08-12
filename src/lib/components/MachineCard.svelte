<script lang="ts">
	import MachineIllustration from '$lib/components/MachineIllustration.svelte';
	import { methodLabel } from '$lib/data/methods';
	import { journal } from '$lib/stores/journal.svelte';
	import type { Machine } from '$lib/data/types';

	interface Props {
		machine: Machine;
		brewCount: number;
		selected?: boolean;
		onclick?: (e: MouseEvent) => void;
	}

	let { machine, brewCount, selected = false, onclick }: Props = $props();
</script>

<a class="machine-card" class:selected href="/machines/{machine.id}" {onclick}>
	<MachineIllustration size={56} />
	<div class="machine-info">
		<div class="machine-name">{machine.name}</div>
		<div class="machine-sub">
			{machine.maker} · {machine.method ? methodLabel(journal.methods, machine.method) : 'No method'}
		</div>
	</div>
	<div class="machine-count mono">{brewCount} brews</div>
</a>

<style>
	.machine-card {
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-lg);
		padding: 16px;
		display: flex;
		gap: 14px;
		align-items: center;
		text-align: left;
	}
	.machine-info {
		flex: 1;
		min-width: 0;
	}
	.machine-name {
		font-family: var(--serif);
		font-weight: 500;
		font-size: 17px;
		font-variation-settings: 'opsz' 24;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.machine-sub {
		font-size: 11px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-top: 2px;
	}
	.machine-count {
		font-size: 11px;
		color: var(--ink-3);
		flex-shrink: 0;
	}
	.machine-card.selected {
		border-color: var(--accent);
		border-width: 1.5px;
	}
</style>

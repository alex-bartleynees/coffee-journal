<script lang="ts">
	interface Props {
		retired: boolean;
		/** What is being retired, e.g. "grinder" or "machine". */
		noun: string;
	}

	let { retired = $bindable(), noun }: Props = $props();
</script>

<label class="retirement-card">
	<input type="checkbox" bind:checked={retired} />
	<span>
		<strong>Retired</strong>
		<small>Keep this {noun} and its brew history, but hide it when logging a brew.</small>
	</span>
</label>

<style>
	.retirement-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 14px;
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		background: var(--card-2);
		cursor: pointer;
	}
	.retirement-card input { margin-top: 3px; accent-color: var(--accent); }
	.retirement-card span { display: flex; flex-direction: column; gap: 3px; }
	.retirement-card strong { font-size: 14px; color: var(--ink); }
	.retirement-card small { font-size: 11px; line-height: 1.4; color: var(--ink-3); }
</style>

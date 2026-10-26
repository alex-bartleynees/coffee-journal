<script lang="ts">
	interface Props {
		/** `inline` sits beside a name in a list row; `hero` sits under a detail heading. */
		variant?: 'inline' | 'hero';
	}

	let { variant = 'inline' }: Props = $props();
</script>

<span class="retired-badge {variant}">Retired</span>

<style>
	.retired-badge {
		display: inline-block;
		border-radius: 100px;
		background: var(--paper-2);
		font-family: var(--sans);
		font-style: normal;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.inline {
		margin-left: 6px;
		padding: 2px 6px;
		font-size: 8px;
		letter-spacing: 0.7px;
		vertical-align: middle;
	}
	.hero {
		margin: 0 0 8px;
		padding: 4px 9px;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 1px;
	}
</style>

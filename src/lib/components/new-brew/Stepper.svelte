<script lang="ts">
	interface Props {
		label: string;
		value: number;
		unit?: string;
		step?: number;
		min: number;
		max: number;
		decimals?: number;
		onChange: (v: number) => void;
	}

	let { label, value, unit = '', step = 1, min, max, decimals = 0, onChange }: Props = $props();

	function clamp(v: number) {
		return +Math.min(max, Math.max(min, v)).toFixed(decimals);
	}
	function dec() {
		onChange(clamp(value - step));
	}
	function inc() {
		onChange(clamp(value + step));
	}
	function commit(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const parsed = parseFloat(el.value);
		if (Number.isNaN(parsed)) {
			el.value = String(decimals > 0 ? value.toFixed(decimals) : value);
			return;
		}
		const next = clamp(parsed);
		onChange(next);
		el.value = String(decimals > 0 ? next.toFixed(decimals) : next);
	}
</script>

<div class="field">
	<div class="field-label">{label}</div>
	<div class="stepper">
		<button onclick={dec} aria-label="decrease">−</button>
		<div class="val">
			<input
				class="val-input mono"
				type="number"
				inputmode="decimal"
				{step}
				{min}
				{max}
				value={decimals > 0 ? value.toFixed(decimals) : value}
				onchange={commit}
				onblur={commit}
				aria-label={label}
			/>
			{#if unit}<span class="unit">{unit}</span>{/if}
		</div>
		<button onclick={inc} aria-label="increase">+</button>
	</div>
</div>

<style>
	.val-input {
		width: 100%;
		min-width: 0;
		border: none;
		background: transparent;
		text-align: center;
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		padding: 12px 0;
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.val-input:focus {
		outline: none;
	}
	.val-input::-webkit-outer-spin-button,
	.val-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.stepper .val {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 2px;
	}
</style>

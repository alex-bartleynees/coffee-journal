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

	function dec() {
		onChange(+Math.max(min, value - step).toFixed(decimals));
	}
	function inc() {
		onChange(+Math.min(max, value + step).toFixed(decimals));
	}
</script>

<div class="field">
	<div class="field-label">{label}</div>
	<div class="stepper">
		<button onclick={dec} aria-label="decrease">−</button>
		<div class="val">
			{decimals > 0 ? value.toFixed(decimals) : value}
			<span class="unit">{unit}</span>
		</div>
		<button onclick={inc} aria-label="increase">+</button>
	</div>
</div>

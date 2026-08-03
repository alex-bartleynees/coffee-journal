<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { BFF_MODE } from '$lib/bff';

	function signIn() {
		auth.signIn();
		// In BFF mode signIn() navigates the whole page into the Keycloak flow;
		// only the dev stand-in needs the client-side redirect home.
		if (!BFF_MODE) goto('/');
	}
</script>

<div class="login-screen">
	<div class="bloom-swirl" aria-hidden="true">
		<div class="ring ring-1"></div>
		<div class="ring ring-2"></div>
		<div class="ring ring-3"></div>
	</div>

	<div class="login-content">
		<a class="brand" href="/">
			<div class="brand-mark">c</div>
			<div>
				<div class="brand-name">Bloom</div>
				<div class="brand-sub">Coffee Journal</div>
			</div>
		</a>

		<div class="hero">
			<div class="eyebrow">Welcome back</div>
			<h1>Pour yourself<br /><span class="accent-text">back in.</span></h1>
			<p>Sign in to keep your tasting notes and recipes in sync across devices.</p>
		</div>

		<div class="login-form">
			<button type="button" class="btn btn-primary" onclick={signIn}>
				Sign in
				<span class="arrow">→</span>
			</button>
		</div>

		<a class="skip" href="/">Skip — keep using it locally</a>
	</div>
</div>

<style>
	.login-screen {
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow-y: auto;
		background: var(--paper);
	}
	.bloom-swirl {
		position: absolute;
		top: -120px;
		right: -90px;
		width: 280px;
		height: 280px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, var(--crema) 0%, var(--roast-medium) 42%, var(--roast-dark) 82%);
		opacity: 0.32;
		pointer-events: none;
	}
	.ring {
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(255, 235, 200, 0.15);
	}
	.ring-1 {
		inset: 50px;
	}
	.ring-2 {
		inset: 90px;
		border-color: rgba(255, 235, 200, 0.1);
	}
	.ring-3 {
		inset: 130px;
		border-color: rgba(255, 235, 200, 0.08);
	}
	.login-content {
		position: relative;
		z-index: 1;
		padding: 60px 24px 40px;
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.brand-mark {
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: linear-gradient(135deg, var(--roast-medium), var(--roast-dark));
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--paper);
		font-family: var(--serif);
		font-style: italic;
		font-size: 16px;
		font-weight: 600;
	}
	.brand-name {
		font-family: var(--serif);
		font-style: italic;
		font-size: 18px;
		font-weight: 500;
		line-height: 1;
		font-variation-settings: 'opsz' 144;
		color: var(--ink);
	}
	.brand-sub {
		font-size: 9px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-top: 3px;
	}
	.hero {
		margin-top: 48px;
	}
	.eyebrow {
		font-size: 10px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--ink-3);
		font-weight: 600;
		margin-bottom: 12px;
	}
	.hero h1 {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 500;
		font-size: 38px;
		line-height: 1.04;
		margin: 0 0 12px;
		letter-spacing: -0.4px;
		color: var(--ink);
		font-variation-settings: 'opsz' 144;
	}
	.accent-text {
		color: var(--accent);
	}
	.hero p {
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--ink-3);
		margin: 0;
		max-width: 300px;
	}
	.login-form {
		margin-top: 28px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.arrow {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 400;
	}
	.skip {
		display: block;
		margin-top: auto;
		padding-top: 28px;
		text-align: center;
		font-size: 12px;
		color: var(--ink-3);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>

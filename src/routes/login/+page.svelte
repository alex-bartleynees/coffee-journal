<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	let mode = $state<'signin' | 'signup'>('signin');
	let email = $state('');
	let password = $state('');
	let showPw = $state(false);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!email) return;
		auth.signIn(email);
		goto('/');
	}
</script>

<div class="login-screen">
	<div class="crema-swirl" aria-hidden="true">
		<div class="ring ring-1"></div>
		<div class="ring ring-2"></div>
		<div class="ring ring-3"></div>
	</div>

	<div class="login-content">
		<a class="brand" href="/">
			<div class="brand-mark">c</div>
			<div>
				<div class="brand-name">Crema</div>
				<div class="brand-sub">Coffee Journal</div>
			</div>
		</a>

		<div class="hero">
			<div class="eyebrow">{mode === 'signin' ? 'Welcome back' : 'New here'}</div>
			<h1>
				{#if mode === 'signin'}
					Pour yourself<br /><span class="accent-text">back in.</span>
				{:else}
					Start your<br /><span class="accent-text">brew journal.</span>
				{/if}
			</h1>
			<p>
				{mode === 'signin'
					? 'Sign in to keep your tasting notes and recipes in sync across devices.'
					: 'Everything you\'ve logged so far stays on this device — signing up starts syncing it.'}
			</p>
		</div>

		<form onsubmit={submit} class="login-form">
			<label class="field">
				<span class="field-label">Email</span>
				<input class="field-input" type="email" bind:value={email} placeholder="you@roastery.com" required />
			</label>
			<label class="field">
				<span class="field-label-row">
					<span class="field-label">Password</span>
				</span>
				<div class="pw-wrap">
					<input
						class="field-input"
						type={showPw ? 'text' : 'password'}
						bind:value={password}
						placeholder={mode === 'signup' ? 'Choose a password' : '••••••••'}
					/>
					<button type="button" class="pw-toggle" onclick={() => (showPw = !showPw)}>
						{showPw ? 'Hide' : 'Show'}
					</button>
				</div>
			</label>

			<button type="submit" class="btn btn-primary">
				{mode === 'signin' ? 'Sign in' : 'Create account'}
				<span class="arrow">→</span>
			</button>
		</form>

		<div class="divider"><span>or continue with</span></div>
		<div class="sso-row">
			<button type="button" class="sso-btn">Apple</button>
			<button type="button" class="sso-btn">Google</button>
		</div>

		<div class="switch">
			{#if mode === 'signin'}
				Don't have an account?
				<button type="button" class="link" onclick={() => (mode = 'signup')}>Create one</button>
			{:else}
				Already brewing with us?
				<button type="button" class="link" onclick={() => (mode = 'signin')}>Sign in</button>
			{/if}
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
	.crema-swirl {
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
	.field-label-row {
		display: flex;
		justify-content: space-between;
	}
	.pw-wrap {
		position: relative;
	}
	.pw-wrap .field-input {
		padding-right: 60px;
	}
	.pw-toggle {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: var(--ink-3);
		font-family: var(--mono);
	}
	.login-form .btn {
		margin-top: 4px;
	}
	.arrow {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 400;
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 20px 0 14px;
		font-size: 10px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--ink-4);
		font-weight: 600;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--line-soft);
	}
	.sso-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.sso-btn {
		padding: 13px 12px;
		border-radius: 12px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		color: var(--ink);
		font-size: 13.5px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.switch {
		margin-top: auto;
		padding-top: 28px;
		text-align: center;
		font-size: 13px;
		color: var(--ink-3);
	}
	.link {
		color: var(--ink);
		font-weight: 600;
		font-size: 13px;
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: var(--line);
	}
	.skip {
		display: block;
		margin-top: 14px;
		text-align: center;
		font-size: 12px;
		color: var(--ink-3);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>

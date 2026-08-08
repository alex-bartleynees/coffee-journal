<script lang="ts">
	import { createUser, type CreateUserResult } from '$lib/users';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let error = $state('');
	let accountMayExist = $state(false);

	function validate(): string {
		if (!name.trim()) return 'Enter your name.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
		if (password.length < 8) return 'Password must be at least 8 characters.';
		if (password !== confirmPassword) return 'Passwords do not match.';
		return '';
	}

	function messageFor(result: CreateUserResult): string {
		if (result === 'too_many_requests') return 'Too many attempts. Please wait and try again.';
		return 'We could not create your account right now. Please try again.';
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = validate();
		accountMayExist = false;
		if (error) return;

		submitting = true;
		const result = await createUser({ name: name.trim(), email: email.trim().toLowerCase(), password });
		submitting = false;
		if (result === 'created') {
			window.location.href = '/bff/login';
			return;
		}
		password = '';
		confirmPassword = '';
		if (result === 'account_may_exist') {
			accountMayExist = true;
			error = 'An account with this email may already exist. Sign in instead.';
			return;
		}
		error = messageFor(result);
	}
</script>

<svelte:head><title>Create account · Bloom</title></svelte:head>

<div class="signup-screen">
	<div class="bloom-swirl" aria-hidden="true"></div>
	<main class="signup-content">
		<a class="brand" href="/" aria-label="Bloom home">
			<div class="brand-mark">c</div>
			<div><div class="brand-name">Bloom</div><div class="brand-sub">Coffee Journal</div></div>
		</a>

		<header>
			<div class="eyebrow">Start your journal</div>
			<h1>Create your<br /><span>account.</span></h1>
			<p>Keep brewing locally for free. Sign up when you want your journal available across devices.</p>
		</header>

		<form onsubmit={submit} novalidate>
			<label>Your name<input bind:value={name} name="name" autocomplete="name" maxlength="100" required /></label>
			<label>Email address<input bind:value={email} name="email" type="email" autocomplete="email" maxlength="254" required /></label>
			<label>Password
				<div class="password-field">
					<input bind:value={password} name="password" type={showPassword ? 'text' : 'password'} autocomplete="new-password" minlength="8" maxlength="128" required />
					<button type="button" class="show-password" onclick={() => (showPassword = !showPassword)} aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}>{showPassword ? 'Hide' : 'Show'}</button>
				</div>
			</label>
			<label>Confirm password<input bind:value={confirmPassword} name="confirmPassword" type={showPassword ? 'text' : 'password'} autocomplete="new-password" minlength="8" maxlength="128" required /></label>
			<p class="hint">Use at least 8 characters.</p>

			{#if error}<div class="form-error" role="alert">{error}</div>{/if}
			<button class="btn btn-primary" type="submit" disabled={submitting}>
				{submitting ? 'Creating account…' : 'Create account'} <span aria-hidden="true">→</span>
			</button>
			{#if accountMayExist}<a class="signin-action" href="/bff/login">Sign in</a>{/if}
		</form>

		<p class="existing">Already have an account? <a href="/bff/login">Sign in</a></p>
		<a class="skip" href="/">Skip — keep using it locally</a>
	</main>
</div>

<style>
	.signup-screen { min-height: 100%; overflow-y: auto; position: relative; background: var(--paper); }
	.bloom-swirl { position: absolute; top: -130px; right: -100px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, var(--crema), var(--roast-medium) 42%, var(--roast-dark) 82%); opacity: .28; pointer-events: none; }
	.signup-content { position: relative; z-index: 1; width: min(100%, 430px); margin: 0 auto; padding: 44px 24px 36px; }
	.brand { display: flex; align-items: center; gap: 10px; width: fit-content; }
	.brand-mark { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, var(--roast-medium), var(--roast-dark)); display: grid; place-items: center; color: var(--paper); font: italic 600 16px var(--serif); }
	.brand-name { font: italic 500 18px/1 var(--serif); color: var(--ink); }
	.brand-sub { margin-top: 3px; font-size: 9px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-3); }
	header { margin-top: 38px; }
	.eyebrow { margin-bottom: 10px; font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-3); }
	h1 { margin: 0 0 10px; font: italic 500 38px/1.04 var(--serif); color: var(--ink); }
	h1 span { color: var(--accent); }
	header p { max-width: 350px; margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--ink-3); }
	form { display: grid; gap: 14px; margin-top: 26px; }
	label { display: grid; gap: 7px; font-size: 11px; font-weight: 600; letter-spacing: .4px; color: var(--ink-2); }
	input { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 12px 13px; background: var(--paper-card); color: var(--ink); font: 14px var(--sans); outline: none; }
	input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
	.password-field { position: relative; }
	.password-field input { padding-right: 60px; }
	.show-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); border: 0; background: none; color: var(--accent); font: 600 11px var(--sans); cursor: pointer; }
	.hint { margin: -7px 0 0; font-size: 11px; color: var(--ink-3); }
	.form-error { border: 1px solid color-mix(in srgb, #a43b32 28%, transparent); border-radius: 9px; padding: 10px 12px; background: color-mix(in srgb, #a43b32 8%, transparent); color: #8b3029; font-size: 12px; line-height: 1.4; }
	.btn:disabled { opacity: .65; cursor: wait; }
	.signin-action { text-align: center; font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
	.existing { margin: 22px 0 0; text-align: center; font-size: 12px; color: var(--ink-3); }
	.existing a { color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
	.skip { display: block; margin-top: 22px; text-align: center; font-size: 12px; color: var(--ink-3); text-decoration: underline; text-underline-offset: 3px; }
	@media (min-width: 700px) { .signup-content { padding-top: 64px; } }
</style>

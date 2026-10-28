<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import WaterDetail from '$lib/components/WaterDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const profile = $derived(journal.waterProfiles.find((w) => w.id === page.params.id));
	const beans = $derived(beanById(journal.beans));
	const myBrews = $derived(profile ? journal.brews.filter((b) => b.waterProfile === profile.id) : []);

	function deleteProfile() {
		if (!profile) return;
		journal.deleteWaterProfile(profile.id);
		void goto('/water', { replaceState: true });
	}
</script>

{#if profile}
	<BackHeader onBack={() => history.back()} label="Water">
		{#snippet action()}
			<DetailActionMenu
				editHref={`/water/new?edit=${profile.id}`}
				label="Water actions"
				onRetire={() => journal.toggleWaterProfileRetired(profile.id)}
				retired={profile.retired}
				onDelete={deleteProfile}
			/>
		{/snippet}
	</BackHeader>

	<div class="screen">
		<WaterDetail {profile} {myBrews} beanById={beans} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Water profile not found</h1></div>
	</div>
{/if}

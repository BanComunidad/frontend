<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Confirmar correo · BanComunidad</title></svelte:head>

<div class="grid min-h-screen place-items-center px-4">
	<div class="w-full max-w-sm">
		<div class="mb-6 flex flex-col items-center gap-3 text-center">
			<span class="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-black text-white">B</span>
			<h1 class="text-xl font-bold text-ink-900">Confirmar correo</h1>
		</div>

		<div class="card space-y-4 p-6 text-center">
			{#if data.status === 'ok'}
				<div class="rounded-xl bg-positive/12 px-3 py-3 text-sm text-positive">
					¡Listo! Tu correo fue actualizado correctamente.
				</div>
				<a href="/perfil" class="btn-primary w-full">Ir a mi perfil</a>
			{:else}
				<div class="rounded-xl bg-negative/12 px-3 py-3 text-sm text-negative">
					{data.message}
				</div>
				<a href="/perfil" class="btn-ghost w-full">Volver a mi perfil</a>
			{/if}
		</div>
	</div>
</div>

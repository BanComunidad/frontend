<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head><title>Ingresar · BanComunidad</title></svelte:head>

<div class="grid min-h-screen place-items-center px-4">
	<div class="w-full max-w-sm">
		<div class="mb-6 flex flex-col items-center gap-3 text-center">
			<span class="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-black text-white">B</span>
			<div>
				<h1 class="text-xl font-bold text-ink-900">BanComunidad</h1>
				<p class="text-sm text-ink-500">Ingresa para ver tus comunidades</p>
			</div>
		</div>

		<form
			method="POST"
			class="card space-y-4 p-6"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			{#if form?.message}
				<div class="badge w-full justify-start rounded-xl bg-negative/12 px-3 py-2 text-negative" role="alert">
					{form.message}
				</div>
			{/if}

			<div>
				<label class="label" for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					class="input"
					placeholder="tu@correo.cl"
					autocomplete="username"
					required
					value={form?.email ?? ''}
				/>
			</div>

			<div>
				<label class="label" for="password">Contraseña</label>
				<input
					id="password"
					name="password"
					type="password"
					class="input"
					placeholder="••••••••"
					autocomplete="current-password"
					required
				/>
			</div>

			<button class="btn-primary w-full" type="submit" disabled={loading}>
				{loading ? 'Ingresando…' : 'Ingresar'}
			</button>
		</form>

		<p class="mt-6 text-center text-xs text-ink-400">BanComunidad · acceso seguro</p>
	</div>
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head><title>Nueva contraseña · BanComunidad</title></svelte:head>

<div class="grid min-h-screen place-items-center px-4">
	<div class="w-full max-w-sm">
		<div class="mb-6 flex flex-col items-center gap-3 text-center">
			<span class="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-black text-white">B</span>
			<div>
				<h1 class="text-xl font-bold text-ink-900">Nueva contraseña</h1>
				<p class="text-sm text-ink-500">Crea una contraseña para tu cuenta.</p>
			</div>
		</div>

		{#if !data.token}
			<div class="card space-y-4 p-6 text-center">
				<div class="rounded-xl bg-negative/12 px-3 py-3 text-sm text-negative">
					El enlace no es válido o está incompleto.
				</div>
				<a href="/recuperar-clave" class="btn-primary w-full">Solicitar un nuevo enlace</a>
			</div>
		{:else}
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
				<input type="hidden" name="token" value={data.token} />

				{#if form?.message}
					<div class="badge w-full justify-start rounded-xl bg-negative/12 px-3 py-2 text-negative" role="alert">
						{form.message}
					</div>
				{/if}

				<div>
					<label class="label" for="new_password">Nueva contraseña</label>
					<input
						id="new_password"
						name="new_password"
						type="password"
						class="input"
						placeholder="••••••••"
						autocomplete="new-password"
						minlength="8"
						required
					/>
				</div>
				<div>
					<label class="label" for="confirm_password">Repetir contraseña</label>
					<input
						id="confirm_password"
						name="confirm_password"
						type="password"
						class="input"
						placeholder="••••••••"
						autocomplete="new-password"
						minlength="8"
						required
					/>
				</div>

				<button class="btn-primary w-full" type="submit" disabled={loading}>
					{loading ? 'Guardando…' : 'Cambiar contraseña'}
				</button>
			</form>
		{/if}
	</div>
</div>

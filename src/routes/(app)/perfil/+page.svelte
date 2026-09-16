<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const p = $derived(data.profile);
	const initials = $derived(
		`${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
	);

	// Correo pendiente: el más reciente entre lo que ya sabía el backend y lo recién solicitado.
	const pendingEmail = $derived(
		(form?.section === 'email' && form?.ok ? form.pending : '') || p.pending_email || ''
	);

	let savingName = $state(false);
	let savingPass = $state(false);
	let savingEmail = $state(false);

	function ok(section: string): boolean {
		return form?.section === section && !!form?.ok;
	}
	function err(section: string): string | null {
		return form?.section === section && !form?.ok ? (form?.message ?? 'Ocurrió un error.') : null;
	}
</script>

<svelte:head><title>Mi perfil · BanComunidad</title></svelte:head>

<div class="mb-6 flex items-center gap-4">
	<span class="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
		{initials}
	</span>
	<div>
		<h1 class="text-2xl font-bold text-ink-900">{p.first_name} {p.last_name}</h1>
		<p class="text-sm text-ink-400">{p.email}</p>
	</div>
</div>

<div class="grid gap-6 lg:grid-cols-2">
	<!-- Datos personales -->
	<section class="card p-6">
		<h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-400">Datos personales</h2>
		<p class="mb-4 text-xs text-ink-400">El RUT no se puede modificar.</p>

		<form
			method="POST"
			action="?/updateProfile"
			class="space-y-4"
			use:enhance={() => {
				savingName = true;
				return async ({ update }) => {
					await update({ reset: false });
					savingName = false;
				};
			}}
		>
			<div>
				<label class="label" for="rut">RUT</label>
				<input id="rut" class="input opacity-60" value={p.rut} disabled readonly />
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="first_name">Nombre</label>
					<input id="first_name" name="first_name" class="input" value={p.first_name} required />
				</div>
				<div>
					<label class="label" for="last_name">Apellido</label>
					<input id="last_name" name="last_name" class="input" value={p.last_name} required />
				</div>
			</div>

			{#if err('name')}
				<p class="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('name')}</p>
			{:else if ok('name')}
				<p class="rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">Datos actualizados.</p>
			{/if}

			<button class="btn-primary" type="submit" disabled={savingName}>
				{savingName ? 'Guardando…' : 'Guardar cambios'}
			</button>
		</form>
	</section>

	<!-- Correo -->
	<section class="card p-6">
		<h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-400">Correo electrónico</h2>
		<p class="mb-4 text-xs text-ink-400">
			Actual: <span class="font-medium text-ink-700">{p.email}</span>
		</p>

		{#if pendingEmail}
			<div class="mb-4 rounded-lg bg-warning/12 px-3 py-2 text-sm text-warning">
				Verificación pendiente para <span class="font-semibold">{pendingEmail}</span>. Revisa ese correo y abre el
				enlace para confirmar el cambio.
			</div>
		{/if}

		<form
			method="POST"
			action="?/requestEmailChange"
			class="space-y-4"
			use:enhance={() => {
				savingEmail = true;
				return async ({ update }) => {
					await update({ reset: false });
					savingEmail = false;
				};
			}}
		>
			<div>
				<label class="label" for="new_email">Nuevo correo</label>
				<input id="new_email" name="new_email" type="email" class="input" placeholder="nuevo@correo.cl" required />
			</div>
			<div>
				<label class="label" for="current_password_email">Contraseña actual</label>
				<input
					id="current_password_email"
					name="current_password_email"
					type="password"
					class="input"
					autocomplete="current-password"
					required
				/>
			</div>

			{#if err('email')}
				<p class="rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('email')}</p>
			{:else if ok('email')}
				<p class="rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">
					Te enviamos un enlace de verificación al nuevo correo.
				</p>
			{/if}

			<button class="btn-primary" type="submit" disabled={savingEmail}>
				{savingEmail ? 'Enviando…' : 'Cambiar correo'}
			</button>
		</form>
	</section>

	<!-- Contraseña -->
	<section class="card p-6 lg:col-span-2">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Contraseña</h2>

		<form
			method="POST"
			action="?/changePassword"
			class="grid gap-4 sm:grid-cols-3"
			use:enhance={() => {
				savingPass = true;
				return async ({ update }) => {
					await update({ reset: true });
					savingPass = false;
				};
			}}
		>
			<div>
				<label class="label" for="current_password">Contraseña actual</label>
				<input
					id="current_password"
					name="current_password"
					type="password"
					class="input"
					autocomplete="current-password"
					required
				/>
			</div>
			<div>
				<label class="label" for="new_password">Nueva contraseña</label>
				<input
					id="new_password"
					name="new_password"
					type="password"
					class="input"
					autocomplete="new-password"
					minlength="8"
					required
				/>
			</div>
			<div>
				<label class="label" for="confirm_password">Repetir nueva</label>
				<input
					id="confirm_password"
					name="confirm_password"
					type="password"
					class="input"
					autocomplete="new-password"
					minlength="8"
					required
				/>
			</div>

			<div class="sm:col-span-3">
				{#if err('password')}
					<p class="mb-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('password')}</p>
				{:else if ok('password')}
					<p class="mb-3 rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">
						Contraseña actualizada. Cerramos las sesiones de otros dispositivos.
					</p>
				{/if}
				<button class="btn-primary" type="submit" disabled={savingPass}>
					{savingPass ? 'Actualizando…' : 'Cambiar contraseña'}
				</button>
			</div>
		</form>
	</section>
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.role === 'ADMINISTRATOR');

	function ok(section: string): boolean {
		return form?.section === section && !!form?.ok;
	}
	function err(section: string): string | null {
		return form?.section === section && !form?.ok ? (form?.message ?? 'Ocurrió un error.') : null;
	}

	let showInvite = $state(false);
	let saving = $state(false);

	function initials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? '')
			.join('');
	}
</script>

<svelte:head><title>Apoderados · BanComunidad</title></svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-ink-900">Apoderados</h1>
	<p class="mt-1 text-sm text-ink-400">{data.current?.legal_name ?? ''}</p>
</div>

<section class="mb-8">
	<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Registrados en el banco</h2>
	<p class="mb-4 text-sm text-ink-400">
		Espejo de sólo lectura de los firmantes registrados directamente en el banco.
	</p>
	{#if data.attorneys.length === 0}
		<div class="card p-10 text-center text-ink-500">Esta comunidad aún no tiene apoderados registrados.</div>
	{:else}
		<section class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead class="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-400">
						<tr>
							<th class="px-5 py-3 font-medium">Nombre</th>
							<th class="px-5 py-3 font-medium">RUT</th>
							<th class="px-5 py-3 font-medium">Tipo</th>
							<th class="px-5 py-3 font-medium">Estado</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-border">
						{#each data.attorneys as a (a.id)}
							<tr class="hover:bg-surface-muted/60">
								<td class="px-5 py-3">
									<div class="flex items-center gap-3">
										<span
											class="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand"
										>
											{initials(a.name)}
										</span>
										<span class="font-medium text-ink-900">{a.name}</span>
									</div>
								</td>
								<td class="whitespace-nowrap px-5 py-3 font-mono text-ink-600">{a.identification}</td>
								<td class="px-5 py-3">
									<span class="badge bg-brand/10 text-brand">{a.type === 'ATTORNEY' ? 'Apoderado' : a.type}</span>
								</td>
								<td class="px-5 py-3">
									<span
										class="badge {a.status === 'ACTIVE' ? 'bg-positive/10 text-positive' : 'bg-ink-400/15 text-ink-500'}"
									>
										{a.status === 'ACTIVE' ? 'Activo' : a.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</section>

{#if isAdmin}
	<section>
		<div class="mb-2 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">Apoderados con acceso a BanComunidad</h2>
				<p class="text-sm text-ink-400">Pueden loguearse y firmar transferencias (2 firmas por transferencia).</p>
			</div>
			<button class="btn-primary" type="button" onclick={() => (showInvite = !showInvite)}>
				+ Invitar apoderado
			</button>
		</div>

		{#if showInvite}
			<section class="card mb-4 p-6">
				<form
					method="POST"
					action="?/inviteSigner"
					class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
					use:enhance={() => {
						saving = true;
						return async ({ update }) => {
							await update({ reset: true });
							saving = false;
						};
					}}
				>
					<div>
						<label class="label" for="inv-rut">RUT</label>
						<input id="inv-rut" name="rut" class="input" placeholder="12.345.678-9" required />
					</div>
					<div>
						<label class="label" for="inv-first_name">Nombre</label>
						<input id="inv-first_name" name="first_name" class="input" required />
					</div>
					<div>
						<label class="label" for="inv-last_name">Apellido</label>
						<input id="inv-last_name" name="last_name" class="input" required />
					</div>
					<div>
						<label class="label" for="inv-email">Correo</label>
						<input id="inv-email" name="email" type="email" class="input" required />
					</div>
					<div class="sm:col-span-2 lg:col-span-4">
						{#if err('invite')}
							<p class="mb-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('invite')}</p>
						{:else if ok('invite')}
							<p class="mb-3 rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">
								Invitación enviada por correo.
							</p>
						{/if}
						<button class="btn-primary" type="submit" disabled={saving}>
							{saving ? 'Invitando…' : 'Enviar invitación'}
						</button>
					</div>
				</form>
			</section>
		{/if}

		{#if data.signers.length === 0}
			<div class="card p-10 text-center text-ink-500">
				Todavía no hay apoderados con acceso a BanComunidad. Invita al primero.
			</div>
		{:else}
			<section class="card overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full text-sm">
						<thead class="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-400">
							<tr>
								<th class="px-5 py-3 font-medium">Nombre</th>
								<th class="px-5 py-3 font-medium">Correo</th>
								<th class="px-5 py-3 font-medium">Estado</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-surface-border">
							{#each data.signers as s (s.user_id)}
								<tr class="hover:bg-surface-muted/60">
									<td class="px-5 py-3 font-medium text-ink-900">{s.name}</td>
									<td class="px-5 py-3 text-ink-600">{s.email}</td>
									<td class="px-5 py-3">
										<span
											class="badge {s.status === 'ACTIVE' ? 'bg-positive/10 text-positive' : 'bg-ink-400/15 text-ink-500'}"
										>
											{s.status === 'ACTIVE' ? 'Activo' : s.status}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}
	</section>
{/if}

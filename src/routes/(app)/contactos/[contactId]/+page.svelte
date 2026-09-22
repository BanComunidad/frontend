<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.role === 'ADMINISTRATOR');
	const c = $derived(data.contact);

	let tab = $state<'datos' | 'cuentas'>('datos');
	let savingDatos = $state(false);
	let savingAccount = $state(false);

	function ok(section: string): boolean {
		return form?.section === section && !!form?.ok;
	}
	function err(section: string): string | null {
		return form?.section === section && !form?.ok ? (form?.message ?? 'Ocurrió un error.') : null;
	}

	const accountTypeLabel: Record<string, string> = {
		CTA_CORRIENTE: 'Cuenta corriente',
		CTA_VISTA: 'Cuenta vista',
		CUENTA_RUT: 'CuentaRUT',
		CTA_AHORRO: 'Cuenta de ahorro'
	};
</script>

<svelte:head><title>{c.name} · Contactos · BanComunidad</title></svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<a href="/contactos" class="mb-1 inline-block text-sm text-ink-400 hover:text-brand">&larr; Contactos</a>
		<h1 class="text-2xl font-bold text-ink-900">{c.name}</h1>
		<p class="mt-1 flex items-center gap-2 text-sm text-ink-400">
			<span class="font-mono">{c.rut}</span>
			<span class="badge bg-brand/10 text-brand">{c.category_name}</span>
			<span class="badge {c.status === 'ACTIVE' ? 'bg-positive/10 text-positive' : 'bg-ink-400/15 text-ink-500'}">
				{c.status === 'ACTIVE' ? 'Vigente' : 'No vigente'}
			</span>
		</p>
	</div>
	{#if isAdmin}
		<form method="POST" action={c.status === 'ACTIVE' ? '?/deactivateContact' : '?/reactivateContact'} use:enhance>
			<button class="btn-ghost" type="submit">{c.status === 'ACTIVE' ? 'Dar de baja' : 'Reactivar'}</button>
		</form>
	{/if}
</div>

<div class="card p-0">
	<div class="flex gap-1 border-b border-surface-border p-2">
		<button
			class="rounded-xl px-4 py-2 text-sm font-semibold {tab === 'datos'
				? 'bg-brand/10 text-brand'
				: 'text-ink-500 hover:bg-surface-border/50'}"
			type="button"
			onclick={() => (tab = 'datos')}
		>
			Datos
		</button>
		<button
			class="rounded-xl px-4 py-2 text-sm font-semibold {tab === 'cuentas'
				? 'bg-brand/10 text-brand'
				: 'text-ink-500 hover:bg-surface-border/50'}"
			type="button"
			onclick={() => (tab = 'cuentas')}
		>
			Cuentas bancarias {c.accounts?.length ? `(${c.accounts.length})` : ''}
		</button>
	</div>

	{#if tab === 'datos'}
		<div class="p-6">
			{#if isAdmin}
				<form
					method="POST"
					action="?/updateContact"
					class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
					use:enhance={() => {
						savingDatos = true;
						return async ({ update }) => {
							await update({ reset: false });
							savingDatos = false;
						};
					}}
				>
					<div>
						<label class="label" for="category_id">Categoría</label>
						<select id="category_id" name="category_id" class="input" required>
							{#each data.categories as cat (cat.id)}
								<option value={cat.id} selected={cat.id === c.category_id}>{cat.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label" for="rut">RUT</label>
						<input id="rut" name="rut" class="input" value={c.rut} required />
					</div>
					<div>
						<label class="label" for="name">Nombre</label>
						<input id="name" name="name" class="input" value={c.name} required />
					</div>
					<div>
						<label class="label" for="email">Correo</label>
						<input id="email" name="email" type="email" class="input" value={c.email ?? ''} />
					</div>
					<div>
						<label class="label" for="phone">Teléfono</label>
						<input id="phone" name="phone" class="input" value={c.phone ?? ''} />
					</div>
					<div>
						<label class="label" for="role_note">Rol / rubro</label>
						<input id="role_note" name="role_note" class="input" value={c.role_note ?? ''} />
					</div>
					<div>
						<label class="label" for="unit_label">Depto / unidad</label>
						<input id="unit_label" name="unit_label" class="input" value={c.unit_label ?? ''} />
					</div>

					<div class="sm:col-span-2 lg:col-span-3">
						{#if err('datos')}
							<p class="mb-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('datos')}</p>
						{:else if ok('datos')}
							<p class="mb-3 rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">Datos actualizados.</p>
						{/if}
						<button class="btn-primary" type="submit" disabled={savingDatos}>
							{savingDatos ? 'Guardando…' : 'Guardar cambios'}
						</button>
					</div>
				</form>
			{:else}
				<dl class="grid gap-4 sm:grid-cols-2">
					<div><dt class="label">RUT</dt><dd class="text-ink-900">{c.rut}</dd></div>
					<div><dt class="label">Correo</dt><dd class="text-ink-900">{c.email || '—'}</dd></div>
					<div><dt class="label">Teléfono</dt><dd class="text-ink-900">{c.phone || '—'}</dd></div>
					<div><dt class="label">Rol / rubro</dt><dd class="text-ink-900">{c.role_note || '—'}</dd></div>
					<div><dt class="label">Depto / unidad</dt><dd class="text-ink-900">{c.unit_label || '—'}</dd></div>
				</dl>
			{/if}
		</div>
	{:else}
		<div class="p-6">
			{#if err('accounts')}
				<p class="mb-4 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('accounts')}</p>
			{:else if ok('accounts')}
				<p class="mb-4 rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">Listo.</p>
			{/if}

			{#if !c.accounts || c.accounts.length === 0}
				<p class="mb-5 text-sm text-ink-400">Este contacto aún no tiene cuentas bancarias.</p>
			{:else}
				<div class="mb-5 flex flex-col gap-3">
					{#each c.accounts as a (a.id)}
						<div
							class="flex flex-wrap items-center gap-3 rounded-2xl border p-4 {a.is_default
								? 'border-positive/40 bg-positive/5'
								: 'border-surface-border'}"
						>
							<div class="flex-1">
								<p class="font-medium text-ink-900">{a.bank_name}</p>
								<p class="text-sm text-ink-400">{accountTypeLabel[a.account_type] ?? a.account_type} · {a.account_num}</p>
							</div>
							{#if isAdmin}
								<div class="flex gap-2">
									{#if a.is_default}
										<span class="badge bg-positive/10 text-positive">En uso</span>
									{:else}
										<form method="POST" action="?/setDefaultAccount" use:enhance>
											<input type="hidden" name="account_id" value={a.id} />
											<button class="btn-ghost !px-3 !py-1.5 text-xs" type="submit">Usar esta cuenta</button>
										</form>
									{/if}
									<form
										method="POST"
										action="?/deleteAccount"
										use:enhance
										onsubmit={(e) => {
											if (!confirm('¿Eliminar esta cuenta bancaria?')) e.preventDefault();
										}}
									>
										<input type="hidden" name="account_id" value={a.id} />
										<button class="btn-ghost !px-3 !py-1.5 text-xs text-negative" type="submit">Eliminar</button>
									</form>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			{#if isAdmin}
				<form
					method="POST"
					action="?/addAccount"
					class="grid gap-4 border-t border-surface-border pt-5 sm:grid-cols-3"
					use:enhance={() => {
						savingAccount = true;
						return async ({ update }) => {
							await update({ reset: true });
							savingAccount = false;
						};
					}}
				>
					<div>
						<label class="label" for="bank_name">Banco</label>
						<input id="bank_name" name="bank_name" class="input" placeholder="Ej. BancoEstado" required />
					</div>
					<div>
						<label class="label" for="account_type">Tipo</label>
						<select id="account_type" name="account_type" class="input" required>
							<option value="CTA_CORRIENTE">Cuenta corriente</option>
							<option value="CTA_VISTA">Cuenta vista</option>
							<option value="CUENTA_RUT">CuentaRUT</option>
							<option value="CTA_AHORRO">Cuenta de ahorro</option>
						</select>
					</div>
					<div>
						<label class="label" for="account_num">Número</label>
						<input id="account_num" name="account_num" class="input" required />
					</div>
					<div class="sm:col-span-3">
						<button class="btn-primary" type="submit" disabled={savingAccount}>
							{savingAccount ? 'Agregando…' : 'Agregar cuenta'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	{/if}
</div>

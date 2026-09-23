<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.role === 'ADMINISTRATOR');
	// Cualquiera con rol ATTORNEY (o superior, como ADMINISTRATOR) puede firmar, igual que
	// permite el backend (RequireCommunity(RoleAttorney) usa jerarquía "AtLeast").
	const canSign = $derived(data.role === 'ATTORNEY' || data.role === 'ADMINISTRATOR');

	function withParam(name: string, value: string | null): string {
		const params = new URLSearchParams($page.url.searchParams);
		if (value === null) params.delete(name);
		else params.set(name, value);
		return `?${params.toString()}`;
	}

	function ok(section: string): boolean {
		return form?.section === section && !!form?.ok;
	}
	function err(section: string): string | null {
		return form?.section === section && !form?.ok ? (form?.message ?? 'Ocurrió un error.') : null;
	}

	let showNewTransfer = $state(false);
	let showNewContact = $state(false);
	let savingTransfer = $state(false);
	let savingContact = $state(false);
	let selectedContactId = $state('');

	const contactsWithAccounts = $derived(data.contacts.filter((c) => (c.accounts?.length ?? 0) > 0));
	const selectedContact = $derived(data.contacts.find((c) => c.id === selectedContactId) ?? null);
	const activeCategories = $derived(data.categories.filter((c) => c.status === 'ACTIVE'));

	$effect(() => {
		const newContactId = (form as { newContactId?: string } | undefined)?.newContactId;
		if (form?.section === 'new-contact' && form.ok && newContactId) {
			selectedContactId = newContactId;
			showNewContact = false;
		}
	});

	const statusLabel: Record<string, string> = {
		PENDING_SIGNATURES: 'Pendiente de firmas',
		APPROVED: 'Aprobada',
		CANCELLED: 'Cancelada'
	};
	const statusClass: Record<string, string> = {
		PENDING_SIGNATURES: 'bg-warning/10 text-warning',
		APPROVED: 'bg-positive/10 text-positive',
		CANCELLED: 'bg-ink-400/15 text-ink-500'
	};

	function formatCLP(n: number): string {
		return '$' + n.toLocaleString('es-CL');
	}

	function hasSigned(t: PageData['transfers'][number]): boolean {
		return (t.signatures ?? []).some((s) => s.user_id === data.userId);
	}
</script>

<svelte:head><title>Transferencias · BanComunidad</title></svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-ink-900">Transferencias</h1>
		<p class="mt-1 text-sm text-ink-400">
			{data.transfers.length} transferencia{data.transfers.length === 1 ? '' : 's'}. Requieren 2 firmas de
			apoderados para quedar aprobadas.
		</p>
	</div>
	{#if isAdmin}
		<button class="btn-primary" type="button" onclick={() => (showNewTransfer = !showNewTransfer)}>
			+ Nueva transferencia
		</button>
	{/if}
</div>

{#if isAdmin && showNewTransfer}
	{#if showNewContact}
		<section class="card mb-6 p-6">
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Nuevo contacto</h2>
			<form
				method="POST"
				action="?/createContact"
				class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
				use:enhance={() => {
					savingContact = true;
					return async ({ update }) => {
						await update({ reset: true });
						savingContact = false;
					};
				}}
			>
				<div>
					<label class="label" for="nc-category_id">Categoría</label>
					<select id="nc-category_id" name="category_id" class="input" required>
						<option value="" disabled selected>Selecciona una categoría</option>
						{#each activeCategories as c (c.id)}
							<option value={c.id}>{c.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label" for="nc-rut">RUT</label>
					<input id="nc-rut" name="rut" class="input" placeholder="12.345.678-9" required />
				</div>
				<div>
					<label class="label" for="nc-name">Nombre</label>
					<input id="nc-name" name="name" class="input" required />
				</div>
				<div>
					<label class="label" for="nc-email">Correo</label>
					<input id="nc-email" name="email" type="email" class="input" />
				</div>
				<div>
					<label class="label" for="nc-phone">Teléfono</label>
					<input id="nc-phone" name="phone" class="input" placeholder="+56 9 1234 5678" />
				</div>
				<div></div>
				<div>
					<label class="label" for="nc-bank_name">Banco</label>
					<input id="nc-bank_name" name="bank_name" class="input" required />
				</div>
				<div>
					<label class="label" for="nc-account_type">Tipo de cuenta</label>
					<select id="nc-account_type" name="account_type" class="input" required>
						<option value="CTA_CORRIENTE">Cuenta corriente</option>
						<option value="CTA_VISTA">Cuenta vista</option>
						<option value="CUENTA_RUT">CuentaRUT</option>
						<option value="CTA_AHORRO">Cuenta ahorro</option>
					</select>
				</div>
				<div>
					<label class="label" for="nc-account_num">Número de cuenta</label>
					<input id="nc-account_num" name="account_num" class="input" required />
				</div>

				<div class="sm:col-span-2 lg:col-span-3">
					{#if err('new-contact')}
						<p class="mb-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('new-contact')}</p>
					{/if}
					<button class="btn-primary" type="submit" disabled={savingContact}>
						{savingContact ? 'Guardando…' : 'Guardar contacto'}
					</button>
					<button class="btn-ghost" type="button" onclick={() => (showNewContact = false)}> Cancelar </button>
				</div>
			</form>
		</section>
	{/if}

	<section class="card mb-6 p-6">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Nueva transferencia</h2>

		{#if contactsWithAccounts.length === 0}
			<p class="mb-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
				No hay contactos con una cuenta bancaria registrada todavía. Crea uno con "+ Nuevo contacto".
			</p>
		{/if}

		<form
			method="POST"
			action="?/createTransfer"
			class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
			use:enhance={() => {
				savingTransfer = true;
				return async ({ update }) => {
					await update({ reset: true });
					selectedContactId = '';
					savingTransfer = false;
				};
			}}
		>
			<div>
				<label class="label" for="tr-contact">Contacto</label>
				<select id="tr-contact" name="contact_id" class="input" bind:value={selectedContactId} required>
					<option value="" disabled selected>Selecciona un contacto</option>
					{#each contactsWithAccounts as c (c.id)}
						<option value={c.id}>{c.name} · {c.rut}</option>
					{/each}
				</select>
			</div>

			{#if selectedContact && (selectedContact.accounts?.length ?? 0) > 1}
				<div>
					<label class="label" for="tr-account">Cuenta destino</label>
					<select id="tr-account" name="contact_bank_account_id" class="input" required>
						{#each selectedContact.accounts ?? [] as a (a.id)}
							<option value={a.id} selected={a.is_default}>
								{a.bank_name} · {a.account_num}{a.is_default ? ' (en uso)' : ''}
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<div>
				<label class="label" for="tr-category">Categoría</label>
				<select id="tr-category" name="category_id" class="input" required>
					<option value="" disabled selected>Selecciona una categoría</option>
					{#each activeCategories as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="label" for="tr-amount">Monto (CLP)</label>
				<input id="tr-amount" name="amount" type="number" min="1" step="1" class="input" required />
			</div>

			<div class="sm:col-span-2 lg:col-span-4">
				<button class="btn-ghost mb-3" type="button" onclick={() => (showNewContact = !showNewContact)}>
					+ Nuevo contacto
				</button>
			</div>

			<div class="sm:col-span-2 lg:col-span-4">
				{#if err('new-transfer')}
					<p class="mb-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('new-transfer')}</p>
				{:else if ok('new-transfer')}
					<p class="mb-3 rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">
						Transferencia creada. Queda pendiente de 2 firmas de apoderados.
					</p>
				{/if}
				<button class="btn-primary" type="submit" disabled={savingTransfer}>
					{savingTransfer ? 'Creando…' : 'Crear transferencia'}
				</button>
			</div>
		</form>
	</section>
{/if}

<div class="mb-4 flex flex-wrap items-center gap-2">
	<a
		href={withParam('status', null)}
		class="badge {data.statusFilter === '' ? 'bg-brand text-white' : 'bg-surface-border/60 text-ink-600'}"
	>
		Todas
	</a>
	<a
		href={withParam('status', 'PENDING_SIGNATURES')}
		class="badge {data.statusFilter === 'PENDING_SIGNATURES'
			? 'bg-brand text-white'
			: 'bg-surface-border/60 text-ink-600'}"
	>
		Pendientes
	</a>
	<a
		href={withParam('status', 'APPROVED')}
		class="badge {data.statusFilter === 'APPROVED' ? 'bg-brand text-white' : 'bg-surface-border/60 text-ink-600'}"
	>
		Aprobadas
	</a>
	<a
		href={withParam('status', 'CANCELLED')}
		class="badge {data.statusFilter === 'CANCELLED' ? 'bg-brand text-white' : 'bg-surface-border/60 text-ink-600'}"
	>
		Canceladas
	</a>
</div>

{#if err('list')}
	<p class="mb-4 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('list')}</p>
{/if}

{#if data.transfers.length === 0}
	<div class="card p-10 text-center text-ink-500">No hay transferencias que coincidan con este filtro.</div>
{:else}
	<section class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full text-sm">
				<thead class="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-400">
					<tr>
						<th class="px-5 py-3 font-medium">Contacto</th>
						<th class="px-5 py-3 font-medium">Cuenta destino</th>
						<th class="px-5 py-3 font-medium">Categoría</th>
						<th class="px-5 py-3 font-medium">Monto</th>
						<th class="px-5 py-3 font-medium">Estado</th>
						<th class="px-5 py-3 font-medium">Firmas</th>
						<th class="px-5 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-border">
					{#each data.transfers as t (t.id)}
						<tr class="hover:bg-surface-muted/60">
							<td class="px-5 py-3 font-medium text-ink-900">{t.contact_name}</td>
							<td class="px-5 py-3 text-ink-600">{t.bank_name} · {t.account_num}</td>
							<td class="px-5 py-3">
								<span class="badge bg-brand/10 text-brand">{t.category_name}</span>
							</td>
							<td class="whitespace-nowrap px-5 py-3 font-mono text-ink-900">{formatCLP(t.amount)}</td>
							<td class="px-5 py-3">
								<span class="badge {statusClass[t.status]}">{statusLabel[t.status] ?? t.status}</span>
							</td>
							<td class="px-5 py-3 text-ink-600" title={(t.signatures ?? []).map((s) => s.name).join(', ')}>
								{(t.signatures ?? []).length}/2
							</td>
							<td class="px-5 py-3 text-right">
								<div class="flex justify-end gap-2">
									{#if canSign && t.status === 'PENDING_SIGNATURES' && !hasSigned(t)}
										<form method="POST" action="?/sign" use:enhance>
											<input type="hidden" name="id" value={t.id} />
											<button class="btn-primary !px-3 !py-1.5 text-xs" type="submit">Firmar</button>
										</form>
									{/if}
									{#if isAdmin && t.status === 'PENDING_SIGNATURES'}
										<form method="POST" action="?/cancelTransfer" use:enhance>
											<input type="hidden" name="id" value={t.id} />
											<button class="btn-ghost !px-3 !py-1.5 text-xs" type="submit">Cancelar</button>
										</form>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

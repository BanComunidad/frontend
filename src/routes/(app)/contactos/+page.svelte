<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.role === 'ADMINISTRATOR');

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

	let showNewContact = $state(false);
	let showCategories = $state(false);
	let savingNewContact = $state(false);
	let savingNewCategory = $state(false);

	const kindLabel: Record<string, string> = {
		REMUNERACION: 'Remuneración',
		PROVEEDOR: 'Proveedor',
		GENERAL: 'General'
	};
</script>

<svelte:head><title>Contactos · BanComunidad</title></svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-ink-900">Contactos</h1>
		<p class="mt-1 text-sm text-ink-400">
			Libreta de la administradora, reutilizable en todas sus comunidades. {data.contacts.length} contacto{data
				.contacts.length === 1
				? ''
				: 's'}.
		</p>
	</div>
	{#if isAdmin}
		<div class="flex gap-2">
			<button class="btn-ghost" type="button" onclick={() => (showCategories = !showCategories)}>
				Gestionar categorías
			</button>
			<button class="btn-primary" type="button" onclick={() => (showNewContact = !showNewContact)}>
				+ Nuevo contacto
			</button>
		</div>
	{/if}
</div>

{#if isAdmin && showCategories}
	<section class="card mb-6 p-6">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Categorías</h2>

		{#if data.categories.length === 0}
			<p class="text-sm text-ink-400">Aún no hay categorías.</p>
		{:else}
			<div class="mb-5 divide-y divide-surface-border">
				{#each data.categories as c (c.id)}
					<div class="flex flex-wrap items-center gap-3 py-3">
						<span class="min-w-[10rem] flex-1 font-medium text-ink-900">{c.name}</span>
						<span class="badge bg-brand/10 text-brand">{kindLabel[c.kind] ?? c.kind}</span>
						<span
							class="badge {c.status === 'ACTIVE' ? 'bg-positive/10 text-positive' : 'bg-ink-400/15 text-ink-500'}"
						>
							{c.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
						</span>
						{#if c.status === 'ACTIVE'}
							<form method="POST" action="?/deactivateCategory" use:enhance>
								<input type="hidden" name="id" value={c.id} />
								<button class="btn-ghost !px-3 !py-1.5 text-xs" type="submit">Desactivar</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if err('categories')}
			<p class="mb-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('categories')}</p>
		{/if}

		<form
			method="POST"
			action="?/createCategory"
			class="flex flex-wrap items-end gap-3 border-t border-surface-border pt-4"
			use:enhance={() => {
				savingNewCategory = true;
				return async ({ update }) => {
					await update({ reset: true });
					savingNewCategory = false;
				};
			}}
		>
			<div class="flex-1">
				<label class="label" for="cat-name">Nueva categoría</label>
				<input id="cat-name" name="name" class="input" placeholder="Ej. Aseo" required />
			</div>
			<div>
				<label class="label" for="cat-kind">Tipo</label>
				<select id="cat-kind" name="kind" class="input">
					<option value="GENERAL">General</option>
					<option value="PROVEEDOR">Proveedor</option>
					<option value="REMUNERACION">Remuneración</option>
				</select>
			</div>
			<button class="btn-primary" type="submit" disabled={savingNewCategory}>
				{savingNewCategory ? 'Creando…' : 'Agregar'}
			</button>
		</form>
		{#if ok('new-category')}
			<p class="mt-3 rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">Categoría creada.</p>
		{:else if err('new-category')}
			<p class="mt-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('new-category')}</p>
		{/if}
	</section>
{/if}

{#if isAdmin && showNewContact}
	<section class="card mb-6 p-6">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Nuevo contacto</h2>
		<form
			method="POST"
			action="?/createContact"
			class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
			use:enhance={() => {
				savingNewContact = true;
				return async ({ update }) => {
					await update({ reset: true });
					savingNewContact = false;
				};
			}}
		>
			<div>
				<label class="label" for="new-category_id">Categoría</label>
				<select id="new-category_id" name="category_id" class="input" required>
					<option value="" disabled selected>Selecciona una categoría</option>
					{#each data.categories.filter((c) => c.status === 'ACTIVE') as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label" for="new-rut">RUT</label>
				<input id="new-rut" name="rut" class="input" placeholder="12.345.678-9" required />
			</div>
			<div>
				<label class="label" for="new-name">Nombre</label>
				<input id="new-name" name="name" class="input" required />
			</div>
			<div>
				<label class="label" for="new-email">Correo</label>
				<input id="new-email" name="email" type="email" class="input" />
			</div>
			<div>
				<label class="label" for="new-phone">Teléfono</label>
				<input id="new-phone" name="phone" class="input" placeholder="+56 9 1234 5678" />
			</div>
			<div>
				<label class="label" for="new-role_note">Rol / rubro</label>
				<input id="new-role_note" name="role_note" class="input" placeholder="Ej. Ascensores, Presidenta" />
			</div>
			<div>
				<label class="label" for="new-unit_label">Depto / unidad</label>
				<input id="new-unit_label" name="unit_label" class="input" placeholder="Opcional" />
			</div>

			<div class="sm:col-span-2 lg:col-span-3">
				{#if err('new-contact')}
					<p class="mb-3 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('new-contact')}</p>
				{:else if ok('new-contact')}
					<p class="mb-3 rounded-lg bg-positive/12 px-3 py-2 text-sm text-positive">Contacto creado.</p>
				{/if}
				<button class="btn-primary" type="submit" disabled={savingNewContact}>
					{savingNewContact ? 'Guardando…' : 'Crear contacto'}
				</button>
			</div>
		</form>
	</section>
{/if}

<div class="mb-4 flex flex-wrap items-center gap-2">
	<a
		href={withParam('category_id', null)}
		class="badge {data.filters.categoryId === '' ? 'bg-brand text-white' : 'bg-surface-border/60 text-ink-600'}"
	>
		Todos
	</a>
	{#each data.categories as c (c.id)}
		<a
			href={withParam('category_id', c.id)}
			class="badge {data.filters.categoryId === c.id ? 'bg-brand text-white' : 'bg-surface-border/60 text-ink-600'}"
		>
			{c.name}
		</a>
	{/each}
	<a
		href={withParam('only_active', data.filters.onlyActive ? 'false' : null)}
		class="badge ml-auto bg-surface-border/60 text-ink-600"
	>
		{data.filters.onlyActive ? 'Ver todos (incl. no vigentes)' : 'Ver sólo vigentes'}
	</a>
</div>

<form method="GET" class="mb-6">
	{#each [...$page.url.searchParams] as [k, v] (k)}
		{#if k !== 'q'}
			<input type="hidden" name={k} value={v} />
		{/if}
	{/each}
	<input
		class="input max-w-sm"
		type="search"
		name="q"
		value={data.filters.q}
		placeholder="Buscar por nombre, RUT o correo"
	/>
</form>

{#if err('list')}
	<p class="mb-4 rounded-lg bg-negative/12 px-3 py-2 text-sm text-negative">{err('list')}</p>
{/if}

{#if data.contacts.length === 0}
	<div class="card p-10 text-center text-ink-500">No hay contactos que coincidan con este filtro.</div>
{:else}
	<section class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full text-sm">
				<thead class="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-400">
					<tr>
						<th class="px-5 py-3 font-medium">Nombre</th>
						<th class="px-5 py-3 font-medium">RUT</th>
						<th class="px-5 py-3 font-medium">Categoría</th>
						<th class="px-5 py-3 font-medium">Rol / rubro</th>
						<th class="px-5 py-3 font-medium">Estado</th>
						<th class="px-5 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-border">
					{#each data.contacts as c (c.id)}
						<tr class="hover:bg-surface-muted/60">
							<td class="px-5 py-3">
								<a href="/contactos/{c.id}" class="font-medium text-ink-900 hover:text-brand">{c.name}</a>
							</td>
							<td class="whitespace-nowrap px-5 py-3 font-mono text-ink-600">{c.rut}</td>
							<td class="px-5 py-3">
								<span class="badge bg-brand/10 text-brand">{c.category_name}</span>
							</td>
							<td class="px-5 py-3 text-ink-600">{c.role_note ?? ''}</td>
							<td class="px-5 py-3">
								<span
									class="badge {c.status === 'ACTIVE' ? 'bg-positive/10 text-positive' : 'bg-ink-400/15 text-ink-500'}"
								>
									{c.status === 'ACTIVE' ? 'Vigente' : 'No vigente'}
								</span>
							</td>
							<td class="px-5 py-3 text-right">
								{#if isAdmin}
									<form
										method="POST"
										action={c.status === 'ACTIVE' ? '?/deactivateContact' : '?/reactivateContact'}
										use:enhance
									>
										<input type="hidden" name="id" value={c.id} />
										<button class="btn-ghost !px-3 !py-1.5 text-xs" type="submit">
											{c.status === 'ACTIVE' ? 'Dar de baja' : 'Reactivar'}
										</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

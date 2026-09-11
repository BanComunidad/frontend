<script lang="ts">
	import Money from '$lib/components/Money.svelte';
	import { shortDate } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const typeLabel = (t: string) => (t === 'SAVING' ? 'Ahorro' : 'Cuenta corriente');

	function pageHref(p: number): string {
		const q = new URLSearchParams({ from: data.filters.from, to: data.filters.to, page: String(p) });
		return `?${q.toString()}`;
	}
</script>

<svelte:head><title>Cuenta {data.account.provider_account_id} · BanComunidad</title></svelte:head>

<!-- Breadcrumb + encabezado -->
<div class="mb-5">
	<a href="/" class="text-sm text-ink-500 hover:text-brand">← Volver al panel</a>
</div>

<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
	<div>
		<span class="badge bg-brand/10 text-brand">{typeLabel(data.account.type)}</span>
		<h1 class="mt-2 font-mono text-2xl font-bold text-ink-900">N° {data.account.provider_account_id}</h1>
		<p class="mt-1 text-sm text-ink-400">{data.account.currency} · estado {data.account.status}</p>
	</div>
	<div class="flex items-center gap-3">
		<div class="card px-5 py-3 text-right">
			<p class="text-xs uppercase tracking-wide text-ink-400">Saldo disponible</p>
			<p class="text-2xl font-bold text-ink-900">
				{#if data.balance}<Money value={data.balance.available_balance} />{:else}—{/if}
			</p>
		</div>
		<a href={`/cuentas/${data.account.id}/cartolas`} class="btn-ghost">Cartolas</a>
	</div>
</div>

<!-- Filtros -->
<form method="GET" class="card mb-4 flex flex-wrap items-end gap-3 p-4">
	<div>
		<label class="label" for="from">Desde</label>
		<input id="from" name="from" type="date" class="input" value={data.filters.from} />
	</div>
	<div>
		<label class="label" for="to">Hasta</label>
		<input id="to" name="to" type="date" class="input" value={data.filters.to} />
	</div>
	<button class="btn-primary" type="submit">Filtrar</button>
</form>

<!-- Tabla de movimientos -->
<section class="card overflow-hidden">
	{#if data.movements.length === 0}
		<div class="p-10 text-center text-ink-500">No hay movimientos en este período.</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full text-sm">
				<thead class="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-400">
					<tr>
						<th class="px-5 py-3 font-medium">Fecha</th>
						<th class="px-5 py-3 font-medium">Glosa</th>
						<th class="px-5 py-3 font-medium">Tipo</th>
						<th class="px-5 py-3 text-right font-medium">Monto</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-border">
					{#each data.movements as m (m.id)}
						<tr class="hover:bg-surface-muted/60">
							<td class="whitespace-nowrap px-5 py-3 text-ink-600">{shortDate(m.date)}</td>
							<td class="px-5 py-3 text-ink-800">{m.description || '—'}</td>
							<td class="px-5 py-3">
								<span
									class="badge {m.type === 'CREDIT' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}"
								>
									{m.type === 'CREDIT' ? 'Abono' : 'Cargo'}
								</span>
							</td>
							<td class="whitespace-nowrap px-5 py-3 text-right"><Money value={m.amount} colored /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<!-- Paginación -->
<div class="mt-4 flex items-center justify-between text-sm">
	<span class="text-ink-400">Página {data.filters.page}</span>
	<div class="flex gap-2">
		{#if data.filters.page > 1}
			<a class="btn-ghost" href={pageHref(data.filters.page - 1)}>← Anteriores</a>
		{:else}
			<span class="btn-ghost pointer-events-none opacity-40">← Anteriores</span>
		{/if}
		{#if data.hasNext}
			<a class="btn-ghost" href={pageHref(data.filters.page + 1)}>Siguientes →</a>
		{:else}
			<span class="btn-ghost pointer-events-none opacity-40">Siguientes →</span>
		{/if}
	</div>
</div>

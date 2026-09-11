<script lang="ts">
	import Money from '$lib/components/Money.svelte';
	import { shortDate } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const roleLabel: Record<string, string> = {
		ADMINISTRATOR: 'Administrador',
		ATTORNEY: 'Apoderado',
		VIEWER: 'Lector'
	};
</script>

<svelte:head><title>Panel · BanComunidad</title></svelte:head>

<!-- Encabezado de la comunidad activa -->
<div class="mb-6">
	<p class="text-sm text-ink-500">Comunidad activa</p>
	<h1 class="text-2xl font-bold text-ink-900">{data.current?.legal_name ?? '—'}</h1>
	<p class="mt-1 text-sm text-ink-400">
		RUT {data.current?.rut ?? '—'} · rol {roleLabel[data.role] ?? data.role}
	</p>
</div>

<!-- Cuentas -->
<section>
	<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Cuentas</h2>
	{#if data.accounts.length === 0}
		<div class="card p-8 text-center text-ink-500">Esta comunidad aún no tiene cuentas.</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.accounts as a (a.id)}
				{@const bal = data.balances[a.id]}
				<a href={`/cuentas/${a.id}`} class="card block p-5 transition hover:shadow-pop hover:border-brand/40">
					<div class="mb-3 flex items-center justify-between">
						<span class="badge bg-brand/10 text-brand">
							{a.type === 'SAVING' ? 'Ahorro' : 'Cuenta corriente'}
						</span>
						<span class="text-xs text-ink-400">{a.currency}</span>
					</div>
					<p class="font-mono text-sm text-ink-500">N° {a.provider_account_id}</p>
					<p class="mt-3 text-2xl font-bold text-ink-900">
						{#if bal}<Money value={bal.available_balance} />{:else}<span class="text-ink-400">—</span>{/if}
					</p>
					<p class="mt-1 text-xs text-ink-400">
						{#if bal}Actualizado {shortDate(bal.captured_at)}{:else}Sin saldo registrado{/if}
					</p>
					<p class="mt-4 text-xs font-medium text-brand">Ver movimientos →</p>
				</a>
			{/each}
		</div>
	{/if}
</section>

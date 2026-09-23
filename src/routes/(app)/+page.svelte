<script lang="ts">
	import Money from '$lib/components/Money.svelte';
	import BalanceChart from '$lib/components/BalanceChart.svelte';
	import AccountMovementsCard from '$lib/components/AccountMovementsCard.svelte';
	import AccountStatementsCard from '$lib/components/AccountStatementsCard.svelte';
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

<!-- Cuentas: una fila por cuenta, tarjeta + gráfico de saldo (30 días) al lado -->
<section>
	<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Cuentas</h2>
	{#if data.accounts.length === 0}
		<div class="card p-8 text-center text-ink-500">Esta comunidad aún no tiene cuentas.</div>
	{:else}
		<div class="space-y-4">
			{#each data.accounts as a (a.id)}
				{@const bal = data.balances[a.id]}
				<div class="flex flex-col gap-4 lg:h-[28rem] lg:flex-row lg:items-stretch">
					<!-- Gráfico de evolución (últimos 30 días) -->
					<div class="min-w-0 flex-1 lg:flex">
						<BalanceChart points={data.charts[a.id] ?? []} subtitle="Últimos 30 días" />
					</div>

					<!-- Cuenta + últimos movimientos + cartolas (las dos últimas se revelan al hover) -->
					<div class="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
						<!-- Tarjeta de la cuenta: 1/3 del alto del gráfico -->
						<a
							href={`/cuentas/${a.id}`}
							class="card block overflow-hidden p-4 transition hover:border-brand/40 hover:shadow-pop lg:h-[calc(28rem/3)] lg:shrink-0"
						>
							<div class="mb-2 flex items-center justify-between">
								<span class="badge bg-brand/10 text-brand">
									{a.type === 'SAVING' ? 'Ahorro' : 'Cuenta corriente'}
								</span>
								<span class="text-xs text-ink-400">{a.currency}</span>
							</div>
							<p class="font-mono text-sm text-ink-500">N° {a.provider_account_id}</p>
							<p class="mt-2 text-xl font-bold text-ink-900">
								{#if bal}<Money value={bal.available_balance} />{:else}<span class="text-ink-400">—</span>{/if}
							</p>
							<p class="mt-1 text-xs font-medium text-brand">Ver movimientos →</p>
						</a>

						<AccountMovementsCard movements={data.recentMovements[a.id] ?? []} />
						<AccountStatementsCard statements={data.statements[a.id] ?? []} />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

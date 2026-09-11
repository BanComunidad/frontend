<script lang="ts">
	import Money from '$lib/components/Money.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function periodLabel(p: string): string {
		const [y, m] = p.split('-');
		const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
		const idx = Number.parseInt(m, 10) - 1;
		return months[idx] ? `${months[idx]} ${y}` : p;
	}
</script>

<svelte:head><title>Cartolas · BanComunidad</title></svelte:head>

<div class="mb-5">
	<a href={`/cuentas/${data.account.id}`} class="text-sm text-ink-500 hover:text-brand">← Volver a la cuenta</a>
</div>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-ink-900">Cartolas</h1>
	<p class="mt-1 text-sm text-ink-400">Cuenta N° {data.account.provider_account_id}</p>
</div>

{#if data.statements.length === 0}
	<div class="card p-10 text-center text-ink-500">Esta cuenta aún no tiene cartolas.</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.statements as s (s.id)}
			<div class="card p-5">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold capitalize text-ink-900">{periodLabel(s.period)}</h2>
					<span class="badge bg-brand/10 text-brand">{s.status}</span>
				</div>
				<dl class="space-y-2 text-sm">
					<div class="flex justify-between">
						<dt class="text-ink-500">Saldo inicial</dt>
						<dd class="font-medium text-ink-800"><Money value={s.summary.opening_balance} /></dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-ink-500">Abonos</dt>
						<dd class="font-medium text-positive"><Money value={s.summary.total_credits} /></dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-ink-500">Cargos</dt>
						<dd class="font-medium text-negative"><Money value={s.summary.total_debits} /></dd>
					</div>
					<div class="flex justify-between border-t border-surface-border pt-2">
						<dt class="text-ink-600">Saldo final</dt>
						<dd class="font-bold text-ink-900"><Money value={s.summary.closing_balance} /></dd>
					</div>
				</dl>
				<p class="mt-4 text-xs text-ink-400">
					{s.summary.movement_count} movimientos · PDF próximamente
				</p>
			</div>
		{/each}
	</div>
{/if}

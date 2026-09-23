<script lang="ts">
	import Money from './Money.svelte';
	import { shortDate } from '$lib/format';
	import type { Movement } from '$lib/types';

	let dialogEl: HTMLDialogElement;
	let selected = $state<Movement | null>(null);

	export function open(m: Movement) {
		selected = m;
		dialogEl.showModal();
	}
</script>

<dialog
	bind:this={dialogEl}
	class="card w-[calc(100%-2rem)] max-w-md p-0 backdrop:bg-ink-900/40"
	onclick={(e) => {
		if (e.target === dialogEl) dialogEl.close();
	}}
>
	{#if selected}
		<div class="p-6">
			<div class="mb-4 flex items-start justify-between">
				<h3 class="text-lg font-semibold text-ink-900">Detalle del movimiento</h3>
				<button
					type="button"
					class="text-ink-400 transition hover:text-ink-700"
					aria-label="Cerrar"
					onclick={() => dialogEl.close()}
				>
					✕
				</button>
			</div>
			<dl class="space-y-3 text-sm">
				<div class="flex justify-between gap-4">
					<dt class="text-ink-500">Fecha</dt>
					<dd class="text-right text-ink-900">{shortDate(selected.date)}</dd>
				</div>
				<div class="flex justify-between gap-4">
					<dt class="text-ink-500">Glosa</dt>
					<dd class="text-right text-ink-900">{selected.description || '—'}</dd>
				</div>
				<div class="flex justify-between gap-4">
					<dt class="text-ink-500">Tipo</dt>
					<dd>
						<span
							class="badge {selected.type === 'CREDIT'
								? 'bg-positive/10 text-positive'
								: 'bg-negative/10 text-negative'}"
						>
							{selected.type === 'CREDIT' ? 'Abono' : 'Cargo'}
						</span>
					</dd>
				</div>
				<div class="flex justify-between gap-4">
					<dt class="text-ink-500">Monto</dt>
					<dd><Money value={selected.amount} colored /></dd>
				</div>
				{#if selected.resulting_balance != null}
					<div class="flex justify-between gap-4 border-t border-surface-border pt-3">
						<dt class="text-ink-600">Saldo resultante</dt>
						<dd class="font-semibold text-ink-900"><Money value={selected.resulting_balance} /></dd>
					</div>
				{/if}
				<div class="flex justify-between gap-4">
					<dt class="text-ink-500">Referencia</dt>
					<dd class="font-mono text-xs text-ink-500">{selected.provider_transaction_ref}</dd>
				</div>
			</dl>
		</div>
	{/if}
</dialog>

<script lang="ts">
	import HoverRevealCard from './HoverRevealCard.svelte';
	import Money from './Money.svelte';
	import MovementDetailModal from './MovementDetailModal.svelte';
	import { shortDate } from '$lib/format';
	import type { Movement } from '$lib/types';

	let { movements }: { movements: Movement[] } = $props();

	let modal: MovementDetailModal;
</script>

<HoverRevealCard title="Últimos movimientos">
	{#if movements.length === 0}
		<p class="py-6 text-center text-sm text-ink-400">Sin movimientos recientes.</p>
	{:else}
		<ul class="divide-y divide-surface-border">
			{#each movements as m (m.id)}
				<li>
					<button
						type="button"
						class="flex w-full items-center gap-3 py-2 text-left transition hover:bg-surface-muted/60"
						onclick={() => modal.open(m)}
					>
						<span class="w-16 shrink-0 text-xs text-ink-500">{shortDate(m.date)}</span>
						<span class="min-w-0 flex-1 truncate text-sm text-ink-800">{m.description || '—'}</span>
						<Money value={m.amount} colored />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</HoverRevealCard>

<MovementDetailModal bind:this={modal} />

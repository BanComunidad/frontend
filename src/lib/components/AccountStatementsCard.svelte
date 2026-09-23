<script lang="ts">
	import HoverRevealCard from './HoverRevealCard.svelte';
	import type { Statement } from '$lib/types';

	let { statements }: { statements: Statement[] } = $props();

	function periodLabel(p: string): string {
		const [y, m] = p.split('-');
		const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
		const idx = Number.parseInt(m, 10) - 1;
		return months[idx] ? `${months[idx]} ${y}` : p;
	}
</script>

<HoverRevealCard title="Cartolas">
	{#if statements.length === 0}
		<p class="py-6 text-center text-sm text-ink-400">Sin cartolas disponibles.</p>
	{:else}
		<div class="grid grid-cols-2 gap-2">
			{#each statements as s (s.id)}
				<div class="rounded-xl border border-surface-border p-2.5 text-center">
					<p class="text-sm font-medium capitalize text-ink-800">{periodLabel(s.period)}</p>
					<span class="badge mt-1 bg-brand/10 text-brand">{s.status}</span>
				</div>
			{/each}
		</div>
	{/if}
</HoverRevealCard>

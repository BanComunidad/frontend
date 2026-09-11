<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function initials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? '')
			.join('');
	}
</script>

<svelte:head><title>Apoderados · BanComunidad</title></svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-ink-900">Apoderados</h1>
	<p class="mt-1 text-sm text-ink-400">{data.current?.legal_name ?? ''}</p>
</div>

{#if data.attorneys.length === 0}
	<div class="card p-10 text-center text-ink-500">Esta comunidad aún no tiene apoderados registrados.</div>
{:else}
	<section class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full text-sm">
				<thead class="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-400">
					<tr>
						<th class="px-5 py-3 font-medium">Nombre</th>
						<th class="px-5 py-3 font-medium">RUT</th>
						<th class="px-5 py-3 font-medium">Tipo</th>
						<th class="px-5 py-3 font-medium">Estado</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-border">
					{#each data.attorneys as a (a.id)}
						<tr class="hover:bg-surface-muted/60">
							<td class="px-5 py-3">
								<div class="flex items-center gap-3">
									<span class="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
										{initials(a.name)}
									</span>
									<span class="font-medium text-ink-900">{a.name}</span>
								</div>
							</td>
							<td class="whitespace-nowrap px-5 py-3 font-mono text-ink-600">{a.identification}</td>
							<td class="px-5 py-3">
								<span class="badge bg-brand/10 text-brand">{a.type === 'ATTORNEY' ? 'Apoderado' : a.type}</span>
							</td>
							<td class="px-5 py-3">
								<span
									class="badge {a.status === 'ACTIVE' ? 'bg-positive/10 text-positive' : 'bg-ink-400/15 text-ink-500'}"
								>
									{a.status === 'ACTIVE' ? 'Activo' : a.status}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

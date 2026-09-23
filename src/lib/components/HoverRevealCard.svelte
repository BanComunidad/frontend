<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, subtitle = '', children }: { title: string; subtitle?: string; children: Snippet } =
		$props();
</script>

<!--
	Al hover, esta tarjeta crece (flex-grow) dentro de la columna lateral (que ya tiene
	lg:h-full) hasta ocupar todo el espacio que deja la tarjeta vecina, la cual permanece a su
	alto natural (solo el título) porque nunca recibe flex-grow. Así la expandida llega justo
	hasta el borde de la que sigue cerrada, sin un tope fijo en píxeles.
-->
<div
	class="group card flex flex-col overflow-hidden transition-[flex-grow] duration-200 ease-out lg:hover:flex-1"
>
	<div class="shrink-0 p-4">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">
			{title}{#if subtitle}<span class="ml-2 font-normal normal-case tracking-normal text-ink-400"
					>· {subtitle}</span
				>{/if}
		</h2>
	</div>
	<div
		class="flex max-h-0 flex-1 flex-col overflow-hidden opacity-0 transition-[max-height,opacity] duration-200 ease-out group-hover:max-h-[28rem] group-hover:opacity-100"
	>
		<div class="min-h-0 flex-1 overflow-y-auto border-t border-surface-border px-4 pb-4 pt-3">
			{@render children()}
		</div>
	</div>
</div>

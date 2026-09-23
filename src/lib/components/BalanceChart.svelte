<script lang="ts">
	import { money, shortDate } from '$lib/format';
	import type { BalancePoint } from '$lib/types';

	let { points = [], subtitle = '' }: { points?: BalancePoint[]; subtitle?: string } = $props();

	// Formato compacto ("$27,5 M") para las etiquetas del eje Y: el monto completo no entra
	// en un margen angosto sin recortarse (el SVG raíz clipea todo lo que caiga fuera del
	// viewBox). El tooltip del punto activo sigue usando money() completo, que tiene más aire.
	const axisMoney = new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'CLP',
		notation: 'compact',
		maximumFractionDigits: 1
	}).format;

	// Lienzo en coordenadas internas; el SVG mantiene esta proporción (no se distorsiona) y
	// escala de forma responsiva por ancho. H más alto que el 720x240 original para que se
	// vea bien en la fila más alta del panel, sin estirar el trazo de forma no uniforme.
	const W = 720;
	const H = 320;
	const PAD = { top: 16, right: 10, bottom: 28, left: 52 };

	const plot = $derived.by(() => {
		const w = W - PAD.left - PAD.right;
		const h = H - PAD.top - PAD.bottom;

		const xs = points.map((p) => Date.parse(p.date));
		const ys = points.map((p) => p.balance);
		const xMin = Math.min(...xs);
		const xMax = Math.max(...xs);
		let yMin = Math.min(...ys);
		let yMax = Math.max(...ys);
		if (yMin === yMax) {
			// Serie plana: da aire para que la línea no quede pegada al borde.
			const pad = Math.abs(yMin) * 0.05 || 1000;
			yMin -= pad;
			yMax += pad;
		}

		const sx = (t: number) => (xMax === xMin ? PAD.left + w / 2 : PAD.left + ((t - xMin) / (xMax - xMin)) * w);
		const sy = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * h;

		const coords = points.map((p) => ({ ...p, cx: sx(Date.parse(p.date)), cy: sy(p.balance) }));
		const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`).join(' ');
		const area =
			coords.length > 0
				? `${line} L${coords[coords.length - 1].cx.toFixed(1)},${(PAD.top + h).toFixed(1)} L${coords[0].cx.toFixed(1)},${(PAD.top + h).toFixed(1)} Z`
				: '';

		// Líneas de referencia horizontales (incluye extremos).
		const ticks = [yMax, (yMax + yMin) / 2, yMin].map((v) => ({ v, y: sy(v) }));

		return { coords, line, area, ticks, yMin, yMax, baseY: PAD.top + h };
	});

	let hover = $state<number | null>(null);

	function onMove(e: MouseEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * W; // a coords internas
		let best = 0;
		let bestD = Infinity;
		plot.coords.forEach((c, i) => {
			const d = Math.abs(c.cx - x);
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		});
		hover = best;
	}

	const active = $derived(hover != null ? plot.coords[hover] : null);
</script>

{#if points.length < 2}
	<div class="card p-8 text-center text-sm text-ink-500 lg:flex lg:h-full lg:items-center lg:justify-center">
		No hay suficientes datos para graficar la evolución del saldo en este período.
	</div>
{:else}
	<div class="card flex w-full flex-col px-3 py-4 lg:h-full">
		<div class="mb-2 flex shrink-0 items-baseline justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-ink-400">
				Evolución del saldo{#if subtitle}<span class="ml-2 font-normal normal-case tracking-normal text-ink-400">· {subtitle}</span>{/if}
			</h2>
			{#if active}
				<span class="text-sm text-ink-500">
					{shortDate(active.date)} · <span class="font-semibold text-ink-900">{money(active.balance)}</span>
				</span>
			{/if}
		</div>
		<div class="flex min-h-0 flex-1 items-center">
			<svg
				viewBox="0 0 {W} {H}"
				class="h-auto w-full select-none"
				role="img"
				aria-label="Gráfico de evolución del saldo"
				onmousemove={onMove}
				onmouseleave={() => (hover = null)}
			>
			<defs>
				<linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#8B76F5" stop-opacity="0.28" />
					<stop offset="100%" stop-color="#8B76F5" stop-opacity="0" />
				</linearGradient>
			</defs>

			<!-- Grillas + etiquetas eje Y -->
			{#each plot.ticks as t (t.v)}
				<line
					x1={PAD.left}
					y1={t.y}
					x2={W - PAD.right}
					y2={t.y}
					class="stroke-surface-border"
					stroke-width="1"
					stroke-dasharray="3 4"
				/>
				<text x={PAD.left - 8} y={t.y + 4} text-anchor="end" class="fill-ink-400 text-[11px]">
					{axisMoney(t.v)}
				</text>
			{/each}

			<!-- Área + línea -->
			<path d={plot.area} fill="url(#balFill)" />
			<path d={plot.line} fill="none" stroke="#8B76F5" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />

			<!-- Etiquetas eje X (extremos) -->
			<text x={plot.coords[0].cx} y={H - 8} text-anchor="start" class="fill-ink-400 text-[11px]">
				{shortDate(plot.coords[0].date)}
			</text>
			<text x={plot.coords[plot.coords.length - 1].cx} y={H - 8} text-anchor="end" class="fill-ink-400 text-[11px]">
				{shortDate(plot.coords[plot.coords.length - 1].date)}
			</text>

			<!-- Punto activo -->
			{#if active}
				<line x1={active.cx} y1={PAD.top} x2={active.cx} y2={plot.baseY} class="stroke-brand/40" stroke-width="1" />
				<circle cx={active.cx} cy={active.cy} r="4.5" fill="#8B76F5" stroke="white" stroke-width="1.5" />
			{/if}
			</svg>
		</div>
	</div>
{/if}

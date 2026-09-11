const clpFmt = new Intl.NumberFormat('es-CL', {
	style: 'currency',
	currency: 'CLP',
	maximumFractionDigits: 0
});

/** Formatea un entero CLP como moneda chilena. */
export function money(n: number): string {
	return clpFmt.format(n ?? 0);
}

/** Fecha corta legible (dd MMM yyyy). */
export function shortDate(iso: string): string {
	try {
		return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(
			new Date(iso)
		);
	} catch {
		return iso;
	}
}

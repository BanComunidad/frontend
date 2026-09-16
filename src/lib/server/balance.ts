import type { Movement, BalancePoint } from '$lib/types';

export function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** Fecha ISO de hace `days` días (por defecto 30). */
export function daysAgo(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return isoDate(d);
}

/**
 * Reconstruye la evolución del saldo a partir del saldo disponible actual y los
 * movimientos del período. `amount` viene con signo (abono +, cargo −), así que
 * el saldo antes de un movimiento = saldo después − amount. Los movimientos llegan
 * ordenados por fecha DESC (más nuevo primero).
 */
export function buildBalanceSeries(
	movementsDesc: Movement[],
	currentBalance: number | null,
	from: string
): BalancePoint[] {
	if (currentBalance == null || movementsDesc.length === 0) return [];
	const pts: BalancePoint[] = [];
	let running = currentBalance; // saldo "después" del movimiento más reciente
	for (const m of movementsDesc) {
		pts.push({ date: m.date.slice(0, 10), balance: running });
		running -= m.amount; // saldo previo a este movimiento
	}
	// Ancla inicial: saldo antes del movimiento más antiguo, al inicio del período.
	pts.push({ date: from, balance: running });
	return pts.reverse(); // ascendente por fecha
}

import { redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { buildBalanceSeries, daysAgo, isoDate } from '$lib/server/balance';
import { clearSession } from '$lib/server/session';
import type { Account, Balance, BalancePoint, Movement, Statement } from '$lib/types';
import type { PageServerLoad } from './$types';

const CHART_LIMIT = 366;
const RECENT_MOVEMENTS_LIMIT = 10;

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	const from = daysAgo(30);
	const to = isoDate(new Date());

	try {
		const { accounts } = await api<{ accounts: Account[] }>(
			`/api/communities/${s.communityId}/accounts`,
			{ token: s.token, fetch }
		);
		const list = accounts ?? [];

		// Por cada cuenta: saldo actual, movimientos de los últimos 30 días para el mini-gráfico,
		// últimos 10 movimientos (sin from/to: el backend usa los últimos 3 meses por defecto,
		// así son de verdad los últimos 10, no solo los de la ventana de 30 días del gráfico) y
		// cartolas disponibles.
		const results = await Promise.all(
			list.map(async (a) => {
				const [balance, mv, recent, st] = await Promise.all([
					api<Balance>(`/api/accounts/${a.id}/balance`, { token: s.token, fetch }).catch(() => null),
					api<{ movements: Movement[] }>(
						`/api/accounts/${a.id}/movements?from=${from}&to=${to}&offset=0&limit=${CHART_LIMIT}`,
						{ token: s.token, fetch }
					).catch(() => ({ movements: [] as Movement[] })),
					api<{ movements: Movement[] }>(
						`/api/accounts/${a.id}/movements?offset=0&limit=${RECENT_MOVEMENTS_LIMIT}`,
						{ token: s.token, fetch }
					).catch(() => ({ movements: [] as Movement[] })),
					api<{ statements: Statement[] }>(`/api/accounts/${a.id}/statements`, {
						token: s.token,
						fetch
					}).catch(() => ({ statements: [] as Statement[] }))
				]);
				const chart = buildBalanceSeries(mv.movements ?? [], balance?.available_balance ?? null, from);
				return [
					a.id,
					{ balance, chart, recentMovements: recent.movements ?? [], statements: st.statements ?? [] }
				] as const;
			})
		);

		const balances: Record<string, Balance | null> = {};
		const charts: Record<string, BalancePoint[]> = {};
		const recentMovements: Record<string, Movement[]> = {};
		const statements: Record<string, Statement[]> = {};
		for (const [id, r] of results) {
			balances[id] = r.balance;
			charts[id] = r.chart;
			recentMovements[id] = r.recentMovements;
			statements[id] = r.statements;
		}
		return { accounts: list, balances, charts, recentMovements, statements };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

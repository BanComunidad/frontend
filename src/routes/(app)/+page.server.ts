import { redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { buildBalanceSeries, daysAgo, isoDate } from '$lib/server/balance';
import { clearSession } from '$lib/server/session';
import type { Account, Balance, BalancePoint, Movement } from '$lib/types';
import type { PageServerLoad } from './$types';

const CHART_LIMIT = 366;

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

		// Por cada cuenta: saldo actual + movimientos de los últimos 30 días para el mini-gráfico.
		const results = await Promise.all(
			list.map(async (a) => {
				const [balance, mv] = await Promise.all([
					api<Balance>(`/api/accounts/${a.id}/balance`, { token: s.token, fetch }).catch(() => null),
					api<{ movements: Movement[] }>(
						`/api/accounts/${a.id}/movements?from=${from}&to=${to}&offset=0&limit=${CHART_LIMIT}`,
						{ token: s.token, fetch }
					).catch(() => ({ movements: [] as Movement[] }))
				]);
				const chart = buildBalanceSeries(mv.movements ?? [], balance?.available_balance ?? null, from);
				return [a.id, { balance, chart }] as const;
			})
		);

		const balances: Record<string, Balance | null> = {};
		const charts: Record<string, BalancePoint[]> = {};
		for (const [id, { balance, chart }] of results) {
			balances[id] = balance;
			charts[id] = chart;
		}
		return { accounts: list, balances, charts };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

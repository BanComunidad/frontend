import { error, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { buildBalanceSeries, daysAgo, isoDate } from '$lib/server/balance';
import { clearSession } from '$lib/server/session';
import type { Account, Balance, Movement } from '$lib/types';
import type { PageServerLoad } from './$types';

const LIMIT = 50;
// Movimientos para el gráfico: período completo, independiente de la paginación de la tabla.
const CHART_LIMIT = 366;

export const load: PageServerLoad = async ({ params, url, locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	const accountId = params.accountId;

	const from = url.searchParams.get('from') || daysAgo(30);
	const to = url.searchParams.get('to') || isoDate(new Date());
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const offset = (page - 1) * LIMIT;

	try {
		// meta de la cuenta (nombre/tipo) desde el listado de la comunidad de la sesión
		const { accounts } = await api<{ accounts: Account[] }>(
			`/api/communities/${s.communityId}/accounts`,
			{ token: s.token, fetch }
		);
		const account = (accounts ?? []).find((a) => a.id === accountId) ?? null;
		if (!account) throw error(404, 'Cuenta no encontrada en esta comunidad.');

		const [balance, mv, chartMv] = await Promise.all([
			api<Balance>(`/api/accounts/${accountId}/balance`, { token: s.token, fetch }).catch(() => null),
			api<{ movements: Movement[] }>(
				`/api/accounts/${accountId}/movements?from=${from}&to=${to}&offset=${offset}&limit=${LIMIT}`,
				{ token: s.token, fetch }
			),
			api<{ movements: Movement[] }>(
				`/api/accounts/${accountId}/movements?from=${from}&to=${to}&offset=0&limit=${CHART_LIMIT}`,
				{ token: s.token, fetch }
			).catch(() => ({ movements: [] as Movement[] }))
		]);

		const movements = mv.movements ?? [];
		const chart = buildBalanceSeries(chartMv.movements ?? [], balance?.available_balance ?? null, from);
		return {
			account,
			balance,
			movements,
			chart,
			filters: { from, to, page, limit: LIMIT },
			hasNext: movements.length === LIMIT
		};
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
			throw error(404, 'Cuenta no encontrada.');
		}
		throw e;
	}
};

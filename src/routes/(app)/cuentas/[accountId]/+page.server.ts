import { error, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Account, Balance, Movement } from '$lib/types';
import type { PageServerLoad } from './$types';

const LIMIT = 50;

function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

export const load: PageServerLoad = async ({ params, url, locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	const accountId = params.accountId;

	const today = new Date();
	const threeMonthsAgo = new Date(today);
	threeMonthsAgo.setMonth(today.getMonth() - 3);
	const from = url.searchParams.get('from') || isoDate(threeMonthsAgo);
	const to = url.searchParams.get('to') || isoDate(today);
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

		const [balance, mv] = await Promise.all([
			api<Balance>(`/api/accounts/${accountId}/balance`, { token: s.token, fetch }).catch(() => null),
			api<{ movements: Movement[] }>(
				`/api/accounts/${accountId}/movements?from=${from}&to=${to}&offset=${offset}&limit=${LIMIT}`,
				{ token: s.token, fetch }
			)
		]);

		const movements = mv.movements ?? [];
		return {
			account,
			balance,
			movements,
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

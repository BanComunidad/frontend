import { error, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Account, Statement } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	const accountId = params.accountId;
	try {
		const { accounts } = await api<{ accounts: Account[] }>(
			`/api/communities/${s.communityId}/accounts`,
			{ token: s.token, fetch }
		);
		const account = (accounts ?? []).find((a) => a.id === accountId) ?? null;
		if (!account) throw error(404, 'Cuenta no encontrada en esta comunidad.');

		const { statements } = await api<{ statements: Statement[] }>(
			`/api/accounts/${accountId}/statements`,
			{ token: s.token, fetch }
		);
		return { account, statements: statements ?? [] };
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

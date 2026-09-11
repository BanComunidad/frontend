import { redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Account, Balance } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	try {
		const { accounts } = await api<{ accounts: Account[] }>(
			`/api/communities/${s.communityId}/accounts`,
			{ token: s.token, fetch }
		);
		const list = accounts ?? [];
		const entries = await Promise.all(
			list.map(async (a) => {
				try {
					return [a.id, await api<Balance>(`/api/accounts/${a.id}/balance`, { token: s.token, fetch })] as const;
				} catch {
					return [a.id, null] as const;
				}
			})
		);
		return { accounts: list, balances: Object.fromEntries(entries) as Record<string, Balance | null> };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

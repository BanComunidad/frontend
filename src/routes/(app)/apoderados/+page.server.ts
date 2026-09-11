import { redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Attorney } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	try {
		const { attorneys } = await api<{ attorneys: Attorney[] }>(
			`/api/communities/${s.communityId}/attorneys`,
			{ token: s.token, fetch }
		);
		return { attorneys: attorneys ?? [] };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

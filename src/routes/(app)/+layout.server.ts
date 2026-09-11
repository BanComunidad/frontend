import { redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Membership } from '$lib/types';
import type { LayoutServerLoad } from './$types';

/** Guard + carga común del área autenticada: comunidades del usuario para el AppShell. */
export const load: LayoutServerLoad = async ({ locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	try {
		const { communities } = await api<{ communities: Membership[] }>('/api/communities', {
			token: locals.session.token,
			fetch
		});
		const current = communities.find((c) => c.community_id === locals.session!.communityId) ?? null;
		return { communities, current, role: locals.session.role };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

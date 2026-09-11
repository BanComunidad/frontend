import { redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { setSession, setLastCommunity, clearSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const form = await request.formData();
	const cid = String(form.get('community_id') ?? '');
	if (cid && cid !== locals.session.communityId) {
		try {
			const r = await api<{ token: string }>('/api/auth/select-community', {
				token: locals.session.token,
				method: 'POST',
				body: { community_id: cid },
				fetch
			});
			setSession(cookies, r.token);
			setLastCommunity(cookies, cid);
		} catch (e) {
			if (e instanceof ApiError && e.status === 401) clearSession(cookies);
			// si falla (403 sin acceso), simplemente no cambia; se redirige igual
		}
	}
	throw redirect(303, '/');
};

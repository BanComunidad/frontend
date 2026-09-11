import { redirect } from '@sveltejs/kit';
import { api } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies, fetch }) => {
	if (locals.session) {
		try {
			await api('/api/auth/logout', { token: locals.session.token, method: 'POST', fetch });
		} catch {
			// best-effort; igual limpiamos la cookie local
		}
	}
	clearSession(cookies);
	throw redirect(303, '/login');
};

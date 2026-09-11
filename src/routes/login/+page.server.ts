import { fail, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { setSession, setLastCommunity, getLastCommunity } from '$lib/server/session';
import type { Membership } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) throw redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, message: 'Ingresa tu email y contraseña.' });
		}

		try {
			// 1) valida credenciales y obtiene las comunidades del usuario
			const r1 = await api<{ user_id: string; memberships: Membership[] }>('/api/auth/login', {
				method: 'POST',
				body: { email, password },
				fetch
			});
			if (!r1.memberships?.length) {
				return fail(403, { email, message: 'Tu usuario no tiene comunidades asignadas.' });
			}
			// 2) elige comunidad (última usada o la primera) y obtiene el token scopeado
			const last = getLastCommunity(cookies);
			const cid =
				last && r1.memberships.some((m) => m.community_id === last)
					? last
					: r1.memberships[0].community_id;
			const r2 = await api<{ token: string }>('/api/auth/login', {
				method: 'POST',
				body: { email, password, community_id: cid },
				fetch
			});
			setSession(cookies, r2.token);
			setLastCommunity(cookies, cid);
		} catch (e) {
			if (e instanceof ApiError && e.status === 401)
				return fail(401, { email, message: 'Email o contraseña incorrectos.' });
			if (e instanceof ApiError && e.status === 403)
				return fail(403, { email, message: 'Usuario inactivo o sin acceso.' });
			return fail(502, { email, message: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' });
		}
		throw redirect(303, '/');
	}
};

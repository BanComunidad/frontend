import { fail, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession, setSession } from '$lib/server/session';
import type { Profile } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	try {
		const profile = await api<Profile>('/api/me', { token: locals.session.token, fetch });
		return { profile };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

export const actions: Actions = {
	// Actualiza nombre/apellido.
	updateProfile: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const first_name = String(data.get('first_name') ?? '').trim();
		const last_name = String(data.get('last_name') ?? '').trim();
		if (!first_name || !last_name) {
			return fail(400, { section: 'name', message: 'Nombre y apellido son obligatorios.' });
		}
		try {
			await api('/api/me', {
				token: locals.session.token,
				method: 'PATCH',
				body: { first_name, last_name },
				fetch
			});
			return { section: 'name', ok: true };
		} catch (e) {
			return handle(e, cookies, 'name');
		}
	},

	// Cambia la contraseña (con la actual). El backend re-emite la sesión → refrescamos la cookie.
	changePassword: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const current_password = String(data.get('current_password') ?? '');
		const new_password = String(data.get('new_password') ?? '');
		const confirm = String(data.get('confirm_password') ?? '');
		if (new_password.length < 8) {
			return fail(400, { section: 'password', message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
		}
		if (new_password !== confirm) {
			return fail(400, { section: 'password', message: 'Las contraseñas no coinciden.' });
		}
		try {
			const res = await api<{ token: string }>('/api/me/password', {
				token: locals.session.token,
				method: 'POST',
				body: { current_password, new_password },
				fetch
			});
			if (res?.token) setSession(cookies, res.token);
			return { section: 'password', ok: true };
		} catch (e) {
			return handle(e, cookies, 'password');
		}
	},

	// Solicita cambio de correo: dispara el envío del link de verificación.
	requestEmailChange: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const new_email = String(data.get('new_email') ?? '').trim();
		const current_password = String(data.get('current_password_email') ?? '');
		if (!new_email) {
			return fail(400, { section: 'email', message: 'Ingresa el nuevo correo.' });
		}
		try {
			await api('/api/me/email/change-request', {
				token: locals.session.token,
				method: 'POST',
				body: { new_email, current_password },
				fetch
			});
			return { section: 'email', ok: true, pending: new_email };
		} catch (e) {
			return handle(e, cookies, 'email');
		}
	}
};

// handle mapea ApiError a fail() con mensaje amistoso; en 401 limpia la sesión y redirige.
function handle(e: unknown, cookies: Parameters<typeof clearSession>[0], section: string) {
	if (e instanceof ApiError) {
		if (e.status === 401 && e.code === 'unauthorized') {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		return fail(e.status || 400, { section, message: e.message });
	}
	throw e;
}

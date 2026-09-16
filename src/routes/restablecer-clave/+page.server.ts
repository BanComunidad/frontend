import { fail, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return { token: url.searchParams.get('token') ?? '' };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const token = String(data.get('token') ?? '');
		const new_password = String(data.get('new_password') ?? '');
		const confirm = String(data.get('confirm_password') ?? '');
		if (!token) return fail(400, { message: 'Enlace inválido. Solicita uno nuevo.' });
		if (new_password.length < 8) {
			return fail(400, { message: 'La contraseña debe tener al menos 8 caracteres.' });
		}
		if (new_password !== confirm) {
			return fail(400, { message: 'Las contraseñas no coinciden.' });
		}
		try {
			await api('/api/auth/reset-password', { method: 'POST', body: { token, new_password }, fetch });
		} catch (e) {
			const msg = e instanceof ApiError ? e.message : 'No se pudo restablecer la contraseña.';
			return fail(400, { message: msg });
		}
		throw redirect(303, '/login?reset=1');
	}
};

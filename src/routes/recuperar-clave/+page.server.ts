import { fail } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		if (!email) return fail(400, { email, message: 'Ingresa tu correo.' });
		try {
			// El backend responde 200 siempre (anti-enumeración); no revelamos si el correo existe.
			await api('/api/auth/forgot-password', { method: 'POST', body: { email }, fetch });
			return { sent: true };
		} catch (e) {
			const msg = e instanceof ApiError ? e.message : 'No se pudo procesar la solicitud.';
			return fail(500, { email, message: msg });
		}
	}
};

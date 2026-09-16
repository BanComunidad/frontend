import { api, ApiError } from '$lib/server/api';
import type { PageServerLoad } from './$types';

// Confirma el cambio de correo al abrir el link (el token es de un solo uso).
export const load: PageServerLoad = async ({ url, fetch }) => {
	const token = url.searchParams.get('token') ?? '';
	if (!token) return { status: 'error' as const, message: 'El enlace no es válido o está incompleto.' };
	try {
		await api('/api/email-changes/confirm', { method: 'POST', body: { token }, fetch });
		return { status: 'ok' as const };
	} catch (e) {
		const message =
			e instanceof ApiError ? e.message : 'No se pudo confirmar el correo. Intenta nuevamente.';
		return { status: 'error' as const, message };
	}
};

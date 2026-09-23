import { fail, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Attorney, Signer } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	const isAdmin = s.role === 'ADMINISTRATOR';
	try {
		const [{ attorneys }, signersData] = await Promise.all([
			api<{ attorneys: Attorney[] }>(`/api/communities/${s.communityId}/attorneys`, { token: s.token, fetch }),
			isAdmin
				? api<{ signers: Signer[] }>(`/api/communities/${s.communityId}/signers`, { token: s.token, fetch })
				: Promise.resolve({ signers: [] as Signer[] })
		]);
		return { attorneys: attorneys ?? [], signers: signersData.signers ?? [] };
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

export const actions: Actions = {
	inviteSigner: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const body = {
			rut: String(data.get('rut') ?? '').trim(),
			email: String(data.get('email') ?? '').trim(),
			first_name: String(data.get('first_name') ?? '').trim(),
			last_name: String(data.get('last_name') ?? '').trim()
		};
		if (!body.rut || !body.email || !body.first_name || !body.last_name) {
			return fail(400, { section: 'invite', message: 'RUT, correo, nombre y apellido son obligatorios.' });
		}
		try {
			await api(`/api/communities/${locals.session.communityId}/signers/invite`, {
				token: locals.session.token,
				method: 'POST',
				body,
				fetch
			});
			return { section: 'invite', ok: true };
		} catch (e) {
			if (e instanceof ApiError) {
				if (e.status === 401 && e.code === 'unauthorized') {
					clearSession(cookies);
					throw redirect(303, '/login');
				}
				return fail(e.status || 400, { section: 'invite', message: e.message });
			}
			throw e;
		}
	}
};

import { error, fail, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Contact, ContactCategory } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch, params }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	try {
		const [contact, { categories }] = await Promise.all([
			api<Contact>(`/api/communities/${s.communityId}/contacts/${params.contactId}`, {
				token: s.token,
				fetch
			}),
			api<{ categories: ContactCategory[] }>(`/api/communities/${s.communityId}/contact-categories`, {
				token: s.token,
				fetch
			})
		]);
		return { contact, categories: categories ?? [] };
	} catch (e) {
		if (e instanceof ApiError) {
			if (e.status === 401) {
				clearSession(cookies);
				throw redirect(303, '/login');
			}
			if (e.status === 404) throw error(404, 'Contacto no encontrado.');
		}
		throw e;
	}
};

export const actions: Actions = {
	updateContact: async ({ request, locals, cookies, fetch, params }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const body = {
			category_id: String(data.get('category_id') ?? ''),
			rut: String(data.get('rut') ?? '').trim(),
			name: String(data.get('name') ?? '').trim(),
			email: String(data.get('email') ?? '').trim(),
			phone: String(data.get('phone') ?? '').trim(),
			role_note: String(data.get('role_note') ?? '').trim(),
			unit_label: String(data.get('unit_label') ?? '').trim()
		};
		if (!body.category_id || !body.rut || !body.name) {
			return fail(400, { section: 'datos', message: 'Categoría, RUT y nombre son obligatorios.' });
		}
		try {
			await api(`/api/communities/${locals.session.communityId}/contacts/${params.contactId}`, {
				token: locals.session.token,
				method: 'PATCH',
				body,
				fetch
			});
			return { section: 'datos', ok: true };
		} catch (e) {
			return handle(e, cookies, 'datos');
		}
	},

	deactivateContact: async ({ locals, cookies, fetch, params }) => {
		if (!locals.session) throw redirect(303, '/login');
		try {
			await api(`/api/communities/${locals.session.communityId}/contacts/${params.contactId}/deactivate`, {
				token: locals.session.token,
				method: 'POST',
				fetch
			});
			return { section: 'datos', ok: true };
		} catch (e) {
			return handle(e, cookies, 'datos');
		}
	},

	reactivateContact: async ({ locals, cookies, fetch, params }) => {
		if (!locals.session) throw redirect(303, '/login');
		try {
			await api(`/api/communities/${locals.session.communityId}/contacts/${params.contactId}/reactivate`, {
				token: locals.session.token,
				method: 'POST',
				fetch
			});
			return { section: 'datos', ok: true };
		} catch (e) {
			return handle(e, cookies, 'datos');
		}
	},

	addAccount: async ({ request, locals, cookies, fetch, params }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const body = {
			bank_name: String(data.get('bank_name') ?? '').trim(),
			account_type: String(data.get('account_type') ?? ''),
			account_num: String(data.get('account_num') ?? '').trim()
		};
		if (!body.bank_name || !body.account_type || !body.account_num) {
			return fail(400, { section: 'accounts', message: 'Banco, tipo y número de cuenta son obligatorios.' });
		}
		try {
			await api(`/api/communities/${locals.session.communityId}/contacts/${params.contactId}/accounts`, {
				token: locals.session.token,
				method: 'POST',
				body,
				fetch
			});
			return { section: 'accounts', ok: true };
		} catch (e) {
			return handle(e, cookies, 'accounts');
		}
	},

	setDefaultAccount: async ({ request, locals, cookies, fetch, params }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const accountId = String(data.get('account_id') ?? '');
		try {
			await api(
				`/api/communities/${locals.session.communityId}/contacts/${params.contactId}/accounts/${accountId}/use`,
				{ token: locals.session.token, method: 'POST', fetch }
			);
			return { section: 'accounts', ok: true };
		} catch (e) {
			return handle(e, cookies, 'accounts');
		}
	},

	deleteAccount: async ({ request, locals, cookies, fetch, params }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const accountId = String(data.get('account_id') ?? '');
		try {
			await api(
				`/api/communities/${locals.session.communityId}/contacts/${params.contactId}/accounts/${accountId}`,
				{ token: locals.session.token, method: 'DELETE', fetch }
			);
			return { section: 'accounts', ok: true };
		} catch (e) {
			return handle(e, cookies, 'accounts');
		}
	}
};

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

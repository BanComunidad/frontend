import { fail, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Contact, ContactCategory, Transfer } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch, url }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	const status = url.searchParams.get('status') ?? '';
	const isAdmin = s.role === 'ADMINISTRATOR';

	try {
		const params = new URLSearchParams();
		if (status) params.set('status', status);
		const [{ transfers }, categoriesData, contactsData] = await Promise.all([
			api<{ transfers: Transfer[] }>(`/api/communities/${s.communityId}/transfers?${params.toString()}`, {
				token: s.token,
				fetch
			}),
			isAdmin
				? api<{ categories: ContactCategory[] }>(`/api/communities/${s.communityId}/contact-categories`, {
						token: s.token,
						fetch
					})
				: Promise.resolve({ categories: [] as ContactCategory[] }),
			isAdmin
				? api<{ contacts: Contact[] }>(`/api/communities/${s.communityId}/contacts?only_active=true`, {
						token: s.token,
						fetch
					})
				: Promise.resolve({ contacts: [] as Contact[] })
		]);
		return {
			transfers: transfers ?? [],
			categories: categoriesData.categories ?? [],
			contacts: contactsData.contacts ?? [],
			userId: s.userId,
			statusFilter: status
		};
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			clearSession(cookies);
			throw redirect(303, '/login');
		}
		throw e;
	}
};

export const actions: Actions = {
	createTransfer: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const contactBankAccountId = String(data.get('contact_bank_account_id') ?? '').trim();
		const amountRaw = String(data.get('amount') ?? '').trim();
		const amount = Number(amountRaw);
		const body: Record<string, unknown> = {
			contact_id: String(data.get('contact_id') ?? ''),
			category_id: String(data.get('category_id') ?? ''),
			amount
		};
		if (contactBankAccountId) body.contact_bank_account_id = contactBankAccountId;

		if (!body.contact_id || !body.category_id) {
			return fail(400, { section: 'new-transfer', message: 'Contacto y categoría son obligatorios.' });
		}
		if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
			return fail(400, { section: 'new-transfer', message: 'El monto debe ser mayor a 0.' });
		}
		try {
			await api(`/api/communities/${locals.session.communityId}/transfers`, {
				token: locals.session.token,
				method: 'POST',
				body,
				fetch
			});
			return { section: 'new-transfer', ok: true };
		} catch (e) {
			return handle(e, cookies, 'new-transfer');
		}
	},

	// Crea un contacto nuevo desde el propio formulario de transferencia (misma validación
	// que contactos/+page.server.ts:createContact), para no obligar a salir del flujo.
	createContact: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const body = {
			category_id: String(data.get('category_id') ?? ''),
			rut: String(data.get('rut') ?? '').trim(),
			name: String(data.get('name') ?? '').trim(),
			email: String(data.get('email') ?? '').trim(),
			phone: String(data.get('phone') ?? '').trim()
		};
		if (!body.category_id || !body.rut || !body.name) {
			return fail(400, { section: 'new-contact', message: 'Categoría, RUT y nombre son obligatorios.' });
		}
		const bankAccount = {
			bank_name: String(data.get('bank_name') ?? '').trim(),
			account_type: String(data.get('account_type') ?? ''),
			account_num: String(data.get('account_num') ?? '').trim()
		};
		if (!bankAccount.bank_name || !bankAccount.account_type || !bankAccount.account_num) {
			return fail(400, {
				section: 'new-contact',
				message: 'El nuevo contacto necesita banco, tipo y número de cuenta.'
			});
		}
		try {
			const created = await api<{ id: string }>(`/api/communities/${locals.session.communityId}/contacts`, {
				token: locals.session.token,
				method: 'POST',
				body,
				fetch
			});
			await api(`/api/communities/${locals.session.communityId}/contacts/${created.id}/accounts`, {
				token: locals.session.token,
				method: 'POST',
				body: bankAccount,
				fetch
			});
			return { section: 'new-contact', ok: true, newContactId: created.id };
		} catch (e) {
			return handle(e, cookies, 'new-contact');
		}
	},

	cancelTransfer: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		try {
			await api(`/api/communities/${locals.session.communityId}/transfers/${id}/cancel`, {
				token: locals.session.token,
				method: 'POST',
				fetch
			});
			return { section: 'list', ok: true };
		} catch (e) {
			return handle(e, cookies, 'list');
		}
	},

	sign: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		try {
			await api(`/api/communities/${locals.session.communityId}/transfers/${id}/sign`, {
				token: locals.session.token,
				method: 'POST',
				fetch
			});
			return { section: 'list', ok: true };
		} catch (e) {
			return handle(e, cookies, 'list');
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

import { fail, redirect } from '@sveltejs/kit';
import { api, ApiError } from '$lib/server/api';
import { clearSession } from '$lib/server/session';
import type { Contact, ContactCategory } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch, url }) => {
	if (!locals.session) throw redirect(303, '/login');
	const s = locals.session;
	const params = new URLSearchParams();
	const q = url.searchParams.get('q') ?? '';
	const categoryId = url.searchParams.get('category_id') ?? '';
	const onlyActive = url.searchParams.get('only_active') !== 'false'; // default: sólo vigentes
	if (q) params.set('q', q);
	if (categoryId) params.set('category_id', categoryId);
	if (onlyActive) params.set('only_active', 'true');

	try {
		const [{ categories }, { contacts }] = await Promise.all([
			api<{ categories: ContactCategory[] }>(`/api/communities/${s.communityId}/contact-categories`, {
				token: s.token,
				fetch
			}),
			api<{ contacts: Contact[] }>(
				`/api/communities/${s.communityId}/contacts?${params.toString()}`,
				{ token: s.token, fetch }
			)
		]);
		return {
			categories: categories ?? [],
			contacts: contacts ?? [],
			filters: { q, categoryId, onlyActive }
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
	createContact: async ({ request, locals, cookies, fetch }) => {
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
			return fail(400, { section: 'new-contact', message: 'Categoría, RUT y nombre son obligatorios.' });
		}
		try {
			await api(`/api/communities/${locals.session.communityId}/contacts`, {
				token: locals.session.token,
				method: 'POST',
				body,
				fetch
			});
			return { section: 'new-contact', ok: true };
		} catch (e) {
			return handle(e, cookies, 'new-contact');
		}
	},

	deactivateContact: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		try {
			await api(`/api/communities/${locals.session.communityId}/contacts/${id}/deactivate`, {
				token: locals.session.token,
				method: 'POST',
				fetch
			});
			return { section: 'list', ok: true };
		} catch (e) {
			return handle(e, cookies, 'list');
		}
	},

	reactivateContact: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		try {
			await api(`/api/communities/${locals.session.communityId}/contacts/${id}/reactivate`, {
				token: locals.session.token,
				method: 'POST',
				fetch
			});
			return { section: 'list', ok: true };
		} catch (e) {
			return handle(e, cookies, 'list');
		}
	},

	createCategory: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const kind = String(data.get('kind') ?? 'GENERAL');
		if (!name) {
			return fail(400, { section: 'new-category', message: 'El nombre es obligatorio.' });
		}
		try {
			await api(`/api/communities/${locals.session.communityId}/contact-categories`, {
				token: locals.session.token,
				method: 'POST',
				body: { name, kind },
				fetch
			});
			return { section: 'new-category', ok: true };
		} catch (e) {
			return handle(e, cookies, 'new-category');
		}
	},

	updateCategory: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const name = String(data.get('name') ?? '').trim();
		const kind = String(data.get('kind') ?? 'GENERAL');
		if (!name) {
			return fail(400, { section: 'categories', message: 'El nombre es obligatorio.' });
		}
		try {
			await api(`/api/communities/${locals.session.communityId}/contact-categories/${id}`, {
				token: locals.session.token,
				method: 'PATCH',
				body: { name, kind },
				fetch
			});
			return { section: 'categories', ok: true };
		} catch (e) {
			return handle(e, cookies, 'categories');
		}
	},

	deactivateCategory: async ({ request, locals, cookies, fetch }) => {
		if (!locals.session) throw redirect(303, '/login');
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		try {
			await api(`/api/communities/${locals.session.communityId}/contact-categories/${id}/deactivate`, {
				token: locals.session.token,
				method: 'POST',
				fetch
			});
			return { section: 'categories', ok: true };
		} catch (e) {
			return handle(e, cookies, 'categories');
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

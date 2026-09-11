import type { Handle } from '@sveltejs/kit';
import { getSession, clearSession, decodeClaims } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = getSession(event.cookies);
	if (token) {
		const claims = decodeClaims(token);
		if (claims && claims.exp * 1000 > Date.now()) {
			event.locals.session = {
				token,
				userId: claims.sub,
				communityId: claims.cid,
				role: claims.role,
				platformRole: claims.prole
			};
		} else {
			clearSession(event.cookies); // token vencido/ilegible
		}
	}
	return resolve(event);
};

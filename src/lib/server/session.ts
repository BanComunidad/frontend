import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

const SESSION = 'bc_session';
const LAST_COMMUNITY = 'bc_last_community';

const base = () => ({
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const
});

export function setSession(cookies: Cookies, token: string) {
	cookies.set(SESSION, token, { ...base(), maxAge: 60 * 60 * 12 }); // 12h (igual que el JWT del backend)
}
export function getSession(cookies: Cookies): string | undefined {
	return cookies.get(SESSION);
}
export function clearSession(cookies: Cookies) {
	cookies.delete(SESSION, { path: '/' });
}

export function setLastCommunity(cookies: Cookies, id: string) {
	cookies.set(LAST_COMMUNITY, id, { ...base(), maxAge: 60 * 60 * 24 * 30 });
}
export function getLastCommunity(cookies: Cookies): string | undefined {
	return cookies.get(LAST_COMMUNITY);
}

export type Claims = { sub: string; cid: string; role: string; prole: string; exp: number };

/** Decodifica el payload del JWT (sin verificar firma: el backend la verifica en cada llamada). */
export function decodeClaims(token: string): Claims | null {
	try {
		const part = token.split('.')[1];
		const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
		const c = JSON.parse(json);
		return { sub: c.sub, cid: c.cid, role: c.role, prole: c.prole, exp: c.exp };
	} catch {
		return null;
	}
}

import { env } from '$env/dynamic/private';

/** Base URL del backend Go (server-to-server). En dev por defecto localhost:8080. */
function baseURL(): string {
	return env.API_BASE_URL || 'http://localhost:8080';
}

/** Error normalizado de la API (envelope {error:{code,message}}). */
export class ApiError extends Error {
	constructor(
		public status: number,
		public code: string,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

type Options = {
	/** JWT de sesión (Bearer). Omitir en llamadas públicas (login). */
	token?: string;
	method?: string;
	body?: unknown;
	/** El fetch del evento SvelteKit (server). */
	fetch: typeof globalThis.fetch;
};

/**
 * Llama al backend Go. NO redirige en 401: lanza ApiError y el caller decide
 * (login → mostrar error; loader protegido → limpiar sesión y redirigir).
 */
export async function api<T>(path: string, opts: Options): Promise<T> {
	const headers: Record<string, string> = { 'content-type': 'application/json' };
	if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

	let res: Response;
	try {
		res = await opts.fetch(baseURL() + path, {
			method: opts.method ?? 'GET',
			headers,
			body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
		});
	} catch (e) {
		throw new ApiError(0, 'network', 'No se pudo conectar con el servidor.');
	}

	const text = await res.text();
	const data = text ? JSON.parse(text) : null;

	if (!res.ok) {
		const err = data?.error;
		throw new ApiError(res.status, err?.code ?? 'error', err?.message ?? res.statusText);
	}
	return data as T;
}

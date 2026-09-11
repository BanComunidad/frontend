import type { SessionInfo } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			session?: SessionInfo;
		}
	}
}

export {};

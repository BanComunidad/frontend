<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import type { Membership, Profile } from '$lib/types';

	let {
		communities = [],
		current = null,
		profile = null,
		children
	}: {
		communities?: Membership[];
		current?: Membership | null;
		profile?: Profile | null;
		children: Snippet;
	} = $props();

	const nav = [
		{ href: '/', label: 'Panel' },
		{ href: '/apoderados', label: 'Apoderados' },
		{ href: '/contactos', label: 'Contactos' },
		{ href: '/transferencias', label: 'Transferencias' }
	];

	const fullName = $derived(
		profile ? `${profile.first_name} ${profile.last_name}`.trim() : ''
	);
	const initials = $derived(
		profile
			? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
			: 'U'
	);

	let menuOpen = $state(false);

	function onWindowClick(e: MouseEvent) {
		if (!(e.target instanceof Element)) return;
		if (!e.target.closest('[data-profile-menu]')) menuOpen = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === 'Escape' && (menuOpen = false)} />

<div class="min-h-screen">
	<header class="sticky top-0 z-20 border-b border-surface-border bg-surface/85 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
			<a href="/" class="flex items-center gap-2 text-[15px] font-bold text-ink-900">
				<span class="grid h-8 w-8 place-items-center rounded-xl bg-brand font-black text-white">B</span>
				<span>BanComunidad</span>
			</a>

			<nav class="ml-4 hidden items-center gap-1 sm:flex">
				{#each nav as n (n.href)}
					<a
						href={n.href}
						class="rounded-lg px-3 py-1.5 text-sm font-medium {$page.url.pathname === n.href
							? 'bg-brand/10 text-brand'
							: 'text-ink-600 hover:bg-surface-border/50'}"
					>
						{n.label}
					</a>
				{/each}
			</nav>

			<div class="ml-auto flex items-center gap-2">
				{#if communities.length}
					<form method="POST" action="/switch" class="flex items-center gap-2">
						<select
							name="community_id"
							class="input max-w-[15rem] !py-2"
							aria-label="Comunidad activa"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							{#each communities as c (c.community_id)}
								<option value={c.community_id} selected={current?.community_id === c.community_id}>
									{c.legal_name}
								</option>
							{/each}
						</select>
						<button class="btn-ghost sm:hidden" type="submit">Ir</button>
					</form>
				{/if}

				<!-- Menú de perfil -->
				<div class="relative" data-profile-menu>
					<button
						type="button"
						class="flex items-center gap-2 rounded-full border border-surface-border py-1 pl-1 pr-2 text-sm hover:bg-surface-border/40"
						aria-haspopup="menu"
						aria-expanded={menuOpen}
						onclick={() => (menuOpen = !menuOpen)}
					>
						<span class="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
							{initials}
						</span>
						<span class="hidden max-w-[9rem] truncate text-ink-700 sm:inline">{profile?.first_name ?? 'Cuenta'}</span>
						<svg class="h-4 w-4 text-ink-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</button>

					{#if menuOpen}
						<div
							class="card absolute right-0 mt-2 w-64 overflow-hidden p-0 shadow-pop"
							role="menu"
						>
							<div class="border-b border-surface-border px-4 py-3">
								<p class="truncate text-sm font-semibold text-ink-900">{fullName || 'Mi cuenta'}</p>
								<p class="truncate text-xs text-ink-400">{profile?.email ?? ''}</p>
							</div>
							<a
								href="/perfil"
								class="block px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-border/40"
								role="menuitem"
								onclick={() => (menuOpen = false)}
							>
								Mi perfil
							</a>
							<form method="POST" action="/logout" class="border-t border-surface-border">
								<button
									class="block w-full px-4 py-2.5 text-left text-sm text-negative hover:bg-negative/10"
									type="submit"
									role="menuitem"
								>
									Salir
								</button>
							</form>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6">
		{@render children()}
	</main>
</div>

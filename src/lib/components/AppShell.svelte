<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import type { Membership } from '$lib/types';

	let {
		communities = [],
		current = null,
		children
	}: { communities?: Membership[]; current?: Membership | null; children: Snippet } = $props();

	const nav = [
		{ href: '/', label: 'Panel' },
		{ href: '/apoderados', label: 'Apoderados' }
	];
</script>

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
				<form method="POST" action="/logout">
					<button class="btn-ghost" type="submit">Salir</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6">
		{@render children()}
	</main>
</div>

<script lang="ts">
	import { money } from '$lib/format';
	let { value = 0, colored = false }: { value?: number; colored?: boolean } = $props();
</script>

<span class={colored ? (value < 0 ? 'font-semibold text-negative' : 'font-semibold text-positive') : ''}>
	{money(value)}
</span>

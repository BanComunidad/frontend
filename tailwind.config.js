/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Acentos de marca (heredados del mock) — constantes en ambos temas.
				brand: { DEFAULT: '#8B76F5', 600: '#6f57ef', 700: '#5a43d6', 50: '#f2f0ff', 100: '#e7e2ff', 200: '#dcd5ff' },
				magenta: '#CD46C7',
				info: '#6F9FE8',
				positive: { DEFAULT: '#12a56e', soft: '#3FC98C' },
				warning: { DEFAULT: '#b6791f', soft: '#DFA24E' },
				negative: '#E5484D',
				// Tokens semánticos ligados a variables CSS -> cambian con el tema (claro/oscuro).
				ink: {
					900: 'rgb(var(--text-strong) / <alpha-value>)',
					800: 'rgb(var(--text-strong) / <alpha-value>)',
					700: 'rgb(var(--text) / <alpha-value>)',
					600: 'rgb(var(--text) / <alpha-value>)',
					500: 'rgb(var(--text-muted) / <alpha-value>)',
					400: 'rgb(var(--text-faint) / <alpha-value>)'
				},
				surface: {
					DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
					muted: 'rgb(var(--bg) / <alpha-value>)',
					border: 'rgb(var(--border) / <alpha-value>)'
				}
			},
			fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
			borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
			boxShadow: {
				card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
				pop: '0 8px 24px rgba(16,24,40,.10)'
			}
		}
	},
	plugins: []
};

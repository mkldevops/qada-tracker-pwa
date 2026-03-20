import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
	plugins: [
		react(),
		tailwindcss(),
		{
			name: 'generate-version-json',
			apply: 'build',
			closeBundle() {
				writeFileSync(
					resolve(process.cwd(), 'dist/version.json'),
					JSON.stringify({ version: pkg.version, builtAt: new Date().toISOString() }),
				);
			},
		},
		VitePWA({
			registerType: 'prompt',
			includeAssets: ['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'],
			manifest: {
				name: 'Qada Tracker',
				short_name: 'Qada',
				description: 'Tracker de prières à rattraper — 100% offline',
				theme_color: '#1A1A1C',
				background_color: '#1A1A1C',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: 'icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
					{
						src: 'icon-512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
				shortcuts: [
					{
						name: 'Logger',
						short_name: 'Logger',
						description: 'Logger des prières',
						url: '/?tab=log',
						icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
					},
					{
						name: 'Stats',
						short_name: 'Stats',
						description: 'Voir les statistiques',
						url: '/?tab=stats',
						icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				cleanupOutdatedCaches: true,
				navigateFallbackDenylist: [/^\/version\.json$/],
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		environment: 'happy-dom',
		globals: false,
		setupFiles: ['./src/test/setup.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts', 'src/**/*.tsx'],
			exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/test/**'],
		},
	},
});

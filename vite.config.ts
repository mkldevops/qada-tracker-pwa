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
			includeAssets: [
				'icon-180.png',
				'icon-192.png',
				'icon-512.png',
				'icon-512-maskable.png',
				'og-image.png',
			],
			manifest: {
				name: 'Qada Tracker — Prières manquées',
				short_name: 'Qada',
				lang: 'fr',
				description:
					'Tracker de prières à rattraper — 100% offline | Missed Islamic prayer tracker',
				theme_color: '#1A1A1C',
				background_color: '#1A1A1C',
				display: 'standalone',
				display_override: ['standalone', 'minimal-ui'],
				orientation: 'portrait-primary',
				categories: ['lifestyle', 'productivity'],
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
				// Claim uncontrolled clients on first cold install so offline works
				// after a single online visit. Has no effect on the update path
				// (skipWaiting is still deferred to the prompt flow via registerType: 'prompt').
				clientsClaim: true,
				navigateFallback: '/index.html',
				navigateFallbackDenylist: [
					/^\/version\.json$/,
					/^\/robots\.txt$/,
					/^\/sitemap\.xml$/,
					/^\/privacy\.html$/,
					/^\/llms\.txt$/,
				],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
						handler: 'CacheFirst' as const,
						options: {
							cacheName: 'google-fonts',
							expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
							cacheableResponse: { statuses: [0, 200] },
						},
					},
				],
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (
						id.includes('node_modules/react') ||
						id.includes('node_modules/react-dom') ||
						id.includes('node_modules/scheduler')
					) {
						return 'vendor';
					}
					if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
						return 'motion';
					}
					if (id.includes('node_modules/dexie')) {
						return 'db';
					}
					if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
						return 'i18n';
					}
					if (id.includes('node_modules/@radix-ui')) {
						return 'ui';
					}
				},
			},
		},
	},
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

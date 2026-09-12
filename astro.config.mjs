import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { d1, r2 } from "@emdash-cms/cloudflare";
import emdash from "emdash/astro";

const siteUrl = process.env.EMDASH_SITE_URL ?? "https://recipes.gksander.com";
const localHttps =
	process.env.ASTRO_LOCAL_HTTPS === "1"
		? {
				key: readFileSync(".certs/localhost-key.pem"),
				cert: readFileSync(".certs/localhost.pem"),
			}
		: undefined;

export default defineConfig({
	site: siteUrl,
	output: "server",
	adapter: cloudflare({
		configPath: "./wrangler.jsonc",
		remoteBindings: true,
	}),
	cache: {
		provider: cacheCloudflare(),
	},
	routeRules: {
		// Media stays behind EmDash's access and backup safeguards, while repeat
		// requests are served from Cloudflare's edge cache.
		"/_emdash/api/media/file/[...key]": { maxAge: 24 * 60 * 60 },
	},
	vite: {
		server: { https: localHttps },
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			siteUrl,
			database: d1({ binding: "DB" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [
				cloudflareEmail({
					from: {
						email: "noreply@recipes.gksander.com",
						name: "Sander Recipes",
					},
				}),
			],
		}),
	],
	devToolbar: { enabled: false },
});

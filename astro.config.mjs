import cloudflare from "@astrojs/cloudflare";
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import { d1, r2 } from "@emdash-cms/cloudflare";
import emdash from "emdash/astro";

const siteUrl = process.env.EMDASH_SITE_URL ?? "https://recipes.gksander.com";
const localHttps = process.env.ASTRO_LOCAL_HTTPS === "1"
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
	vite: {
		server: { https: localHttps },
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

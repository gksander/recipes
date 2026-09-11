import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { d1, r2 } from "@emdash-cms/cloudflare";
import emdash from "emdash/astro";

export default defineConfig({
	site: "https://recipes.gksander.com",
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			siteUrl: "https://recipes.gksander.com",
			database: d1({ binding: "DB" }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
	devToolbar: { enabled: false },
});

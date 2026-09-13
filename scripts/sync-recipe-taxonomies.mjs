#!/usr/bin/env node

/**
 * Sync the generated dietary/ingredient taxonomy map onto migrated recipes.
 *
 * Dry run by default:
 *   node scripts/sync-recipe-taxonomies.mjs
 *   node scripts/sync-recipe-taxonomies.mjs --apply
 *   node scripts/sync-recipe-taxonomies.mjs --apply --limit 25
 */
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { EmDashClient } from "emdash/client";

const SITE_URL = process.env.EMDASH_URL ?? "https://recipes.gksander.com";
const ARTIFACT = "artifacts/recipe-pdf-tag-map.json";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const limitIndex = args.indexOf("--limit");
const limit = limitIndex === -1 ? undefined : Number(args[limitIndex + 1]);

if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
	throw new Error("--limit must be a positive whole number");
}

async function readToken() {
	if (process.env.EMDASH_TOKEN) return process.env.EMDASH_TOKEN;
	const configRoot = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
	const credentials = JSON.parse(
		await readFile(join(configRoot, "emdash", "auth.json"), "utf8"),
	);
	const saved = credentials[new URL(SITE_URL).origin];
	if (saved?.accessToken) return saved.accessToken;
	throw new Error(
		`Log in first with npx emdash login --url ${SITE_URL}, or set EMDASH_TOKEN.`,
	);
}

async function listAll(client, collection) {
	const entries = [];
	let cursor;
	do {
		const result = await client.list(collection, { limit: 100, cursor });
		entries.push(...result.items);
		cursor = result.nextCursor;
	} while (cursor);
	return entries;
}

async function putTaxonomies(token, id, revision, taxonomies) {
	const response = await fetch(
		`${SITE_URL.replace(/\/+$/, "")}/_emdash/api/content/recipes/${encodeURIComponent(id)}`,
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				Origin: new URL(SITE_URL).origin,
				"X-EmDash-Request": "1",
			},
			body: JSON.stringify({ _rev: revision, taxonomies }),
		},
	);
	if (!response.ok)
		throw new Error(
			`HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`,
		);
}

async function main() {
	const artifact = JSON.parse(await readFile(ARTIFACT, "utf8"));
	const records = (artifact.records ?? [])
		.filter((record) => record.dietary?.length || record.ingredient?.length)
		.slice(0, limit);
	const token = await readToken();
	const client = new EmDashClient({ baseUrl: SITE_URL, token });
	const recipes = await listAll(client, "recipes");
	const byFilename = new Map(
		recipes.map((entry) => [entry.data.source_filename, entry]),
	);

	console.log(
		`${apply ? "Syncing" : "Would sync"} ${records.length} taxonomy records`,
	);
	for (const record of records) {
		const recipe = byFilename.get(record.file);
		if (!recipe || recipe.data.source_type !== "hellofresh") {
			console.warn(`Missing migrated recipe: ${record.file}`);
			continue;
		}
		const taxonomies = {};
		if (record.dietary?.length) taxonomies.dietary = record.dietary;
		if (record.ingredient?.length) taxonomies.ingredient = record.ingredient;
		if (!apply) {
			console.log(`Would sync ${recipe.slug}: ${JSON.stringify(taxonomies)}`);
			continue;
		}

		const current = await client.get("recipes", recipe.id, { raw: true });
		await putTaxonomies(token, recipe.id, current._rev, taxonomies);
		const updated = await client.get("recipes", recipe.id, { raw: true });
		await client.publish("recipes", updated.id);
		console.log(`Synced and published: ${recipe.slug}`);
	}
}

await main();

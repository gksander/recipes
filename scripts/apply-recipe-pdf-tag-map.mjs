#!/usr/bin/env node
/**
 * Apply artifacts/recipe-pdf-tag-map.json to EmDash recipe_pdfs.
 *
 * Read-only by default:
 *   node scripts/apply-recipe-pdf-tag-map.mjs --limit 25
 *   node scripts/apply-recipe-pdf-tag-map.mjs --apply --concurrency 5
 */
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { EmDashClient } from "emdash/client";

const SITE_URL = process.env.EMDASH_URL ?? "https://recipes.gksander.com";
const COLLECTION = "recipe_pdfs";
const ARTIFACT = "artifacts/recipe-pdf-tag-map.json";
const STATE = "artifacts/recipe-pdf-tag-apply-state.json";
const LOG = "artifacts/recipe-pdf-tag-apply-log.jsonl";
const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const arg = (flag, fallback) => {
	const i = args.indexOf(flag);
	return i < 0 ? fallback : args[i + 1];
};
const apply = has("--apply");
const limit = positive("--limit", undefined);
const offset = nonNegative("--offset", 0);
const concurrency = positive("--concurrency", 5);

function positive(flag, fallback) {
	const value = arg(flag, undefined);
	if (value === undefined) return fallback;
	const n = Number(value);
	if (!Number.isInteger(n) || n < 1)
		throw new Error(flag + " must be a positive whole number");
	return n;
}
function nonNegative(flag, fallback) {
	const value = arg(flag, undefined);
	if (value === undefined) return fallback;
	const n = Number(value);
	if (!Number.isInteger(n) || n < 0)
		throw new Error(flag + " must be a non-negative whole number");
	return n;
}
async function token() {
	if (process.env.EMDASH_TOKEN) return process.env.EMDASH_TOKEN;
	const root = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
	try {
		const credentials = JSON.parse(
			await readFile(join(root, "emdash", "auth.json"), "utf8"),
		);
		const saved = credentials[new URL(SITE_URL).origin];
		if (saved?.accessToken && new Date(saved.expiresAt) > new Date())
			return saved.accessToken;
	} catch {}
	throw new Error(
		"Log in first with npx emdash login --url " +
			SITE_URL +
			", or set EMDASH_TOKEN.",
	);
}
async function jsonFile(file) {
	return JSON.parse(await readFile(file, "utf8"));
}
async function saveState(state) {
	await mkdir("artifacts", { recursive: true });
	await writeFile(STATE, JSON.stringify(state, null, 2) + "\n");
}
async function log(result) {
	await appendFile(LOG, JSON.stringify(result) + "\n");
}
function payload(record) {
	const taxonomies = {};
	if (record.dietary?.length) taxonomies.dietary = record.dietary;
	if (record.ingredient?.length) taxonomies.ingredient = record.ingredient;
	return taxonomies;
}
function validateTerms(record, terms) {
	for (const [taxonomy, values] of Object.entries(payload(record))) {
		for (const value of values) {
			if (!terms[taxonomy].has(value))
				throw new Error("Unknown " + taxonomy + " term: " + value);
		}
	}
}
async function put(tokenValue, record, current) {
	const base = SITE_URL.replace(/\/+$/, "");
	const url =
		base +
		"/_emdash/api/content/" +
		encodeURIComponent(COLLECTION) +
		"/" +
		encodeURIComponent(record.id);
	const response = await fetch(url, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			Authorization: "Bearer " + tokenValue,
			"Content-Type": "application/json",
			Origin: new URL(SITE_URL).origin,
			"X-EmDash-Request": "1",
		},
		body: JSON.stringify({
			_rev: current._rev,
			status: current.status === "published" ? "published" : current.status,
			taxonomies: payload(record),
		}),
	});
	if (response.ok) return response.json();
	const message = await response.text();
	const error = new Error(
		"HTTP " + response.status + ": " + message.slice(0, 500),
	);
	error.status = response.status;
	throw error;
}
async function processRecord(client, tokenValue, record, terms, dryRun) {
	validateTerms(record, terms);
	const taxonomies = payload(record);
	if (!Object.keys(taxonomies).length)
		return { id: record.id, status: "skipped" };
	if (dryRun) return { id: record.id, status: "would-update", taxonomies };
	const current = await client.get(COLLECTION, record.id, { raw: true });
	const currentFile =
		current.data?.source_filename || current.data?.pdf?.filename || "";
	if (currentFile !== record.file) {
		throw new Error(
			"Filename mismatch: CMS has " +
				currentFile +
				", artifact has " +
				record.file,
		);
	}
	try {
		await put(tokenValue, record, current);
	} catch (error) {
		if (error.status !== 409) throw error;
		const refreshed = await client.get(COLLECTION, record.id, { raw: true });
		const refreshedFile =
			refreshed.data?.source_filename || refreshed.data?.pdf?.filename || "";
		if (refreshedFile !== record.file)
			throw new Error("Filename changed while retrying conflict");
		await put(tokenValue, record, refreshed);
	}
	return { id: record.id, status: "updated", taxonomies };
}
async function concurrent(items, worker, width) {
	const results = [];
	let next = 0;
	async function consume() {
		while (next < items.length) results[next] = await worker(items[next++]);
	}
	await Promise.all(
		Array.from({ length: Math.min(width, items.length) }, consume),
	);
	return results;
}
async function main() {
	const artifact = await jsonFile(ARTIFACT);
	const all = artifact.records ?? [];
	const records = all.slice(offset, limit ? offset + limit : undefined);
	const dryRun = !apply;
	const tokenValue = dryRun ? null : await token();
	const client = dryRun
		? null
		: new EmDashClient({ baseUrl: SITE_URL, token: tokenValue });
	const terms = dryRun
		? {
				dietary: new Set(artifact.taxonomies?.dietary ?? []),
				ingredient: new Set(artifact.taxonomies?.ingredient ?? []),
			}
		: await (async () => {
				const [dietary, ingredient] = await Promise.all([
					client.terms("dietary", { limit: 100 }),
					client.terms("ingredient", { limit: 100 }),
				]);
				return {
					dietary: new Set(dietary.items.map((term) => term.slug)),
					ingredient: new Set(ingredient.items.map((term) => term.slug)),
				};
			})();
	let state = { completed: {} };
	if (!dryRun) {
		try {
			state = await jsonFile(STATE);
		} catch {}
	}
	const pending = dryRun
		? records
		: records.filter((record) => !state.completed[record.id]);
	console.log(
		(dryRun ? "Dry run: " : "Applying: ") + pending.length + " pending records",
	);
	const results = await concurrent(
		pending,
		async (record) => {
			try {
				const result = await processRecord(
					client,
					tokenValue,
					record,
					terms,
					dryRun,
				);
				console.log(result.status + ": " + record.file);
				if (!dryRun && result.status === "updated") {
					state.completed[record.id] = {
						at: new Date().toISOString(),
						taxonomies: result.taxonomies,
					};
					await saveState(state);
					await log({
						...result,
						file: record.file,
						at: new Date().toISOString(),
					});
				}
				return result;
			} catch (error) {
				const result = {
					id: record.id,
					file: record.file,
					status: "error",
					error: error instanceof Error ? error.message : String(error),
				};
				console.error("error: " + record.file + ": " + result.error);
				if (!dryRun) await log({ ...result, at: new Date().toISOString() });
				return result;
			}
		},
		concurrency,
	);
	const summary = {};
	for (const result of results)
		summary[result.status] = (summary[result.status] ?? 0) + 1;
	console.log(JSON.stringify({ summary, dryRun }, null, 2));
	if (summary.error) process.exitCode = 1;
}
await main();

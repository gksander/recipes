#!/usr/bin/env node

/**
 * Move the legacy recipe_pdfs entries into recipes and create page images.
 *
 * Dry run by default. Use --apply after the recipe schema has been deployed.
 * Add --delete-old only after verifying the migrated recipes.
 */
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { EmDashClient } from "emdash/client";

const SITE_URL = process.env.EMDASH_URL ?? "https://recipes.gksander.com";
const PDF_DIR = "/Volumes/GKSSD/Recipes";
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const deleteOld = args.has("--delete-old");
const run = promisify(execFile);

async function token() {
	if (process.env.EMDASH_TOKEN) return process.env.EMDASH_TOKEN;
	const root = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
	const credentials = JSON.parse(
		await readFile(join(root, "emdash", "auth.json"), "utf8"),
	);
	const saved = credentials[new URL(SITE_URL).origin];
	if (saved?.accessToken) return saved.accessToken;
	throw new Error(
		"Log in first with `npx emdash login --url " +
			SITE_URL +
			"`, or set EMDASH_TOKEN.",
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

async function ensureFields(client) {
	const existing = new Set(
		(await client.collection("recipes")).fields.map((field) => field.slug),
	);
	const fields = [
		{
			slug: "source_type",
			type: "select",
			label: "Source",
			required: true,
			validation: { options: ["original", "hellofresh"] },
			defaultValue: "original",
		},
		{ slug: "source_filename", type: "string", label: "Source filename" },
		{ slug: "recipe_date", type: "datetime", label: "Recipe date" },
		{
			slug: "source_pdf",
			type: "file",
			label: "Source PDF",
			validation: { allowedMimeTypes: ["application/pdf"] },
		},
		{
			slug: "document_pages",
			type: "repeater",
			label: "Document pages",
			validation: {
				minItems: 1,
				subFields: [
					{ slug: "image", label: "Page image", type: "image", required: true },
				],
			},
		},
	];
	for (const field of fields) {
		if (!existing.has(field.slug)) await client.createField("recipes", field);
	}
}

async function renderPages(client, entry, filename) {
	const directory = await mkdtemp(join(tmpdir(), "recipe-pages-"));
	try {
		await run("pdftoppm", [
			"-jpeg",
			"-r",
			"144",
			join(PDF_DIR, filename),
			join(directory, "page"),
		]);
		const files = (await readdir(directory))
			.filter((name) => /^page-\d+\.jpg$/.test(name))
			.sort(
				(a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]),
			);
		return Promise.all(
			files.map(async (page, index) => ({
				image: await client.mediaUpload(
					await readFile(join(directory, page)),
					`${entry.slug}-page-${index + 1}.jpg`,
					{
						alt: `${entry.data.title}, page ${index + 1}`,
						contentType: "image/jpeg",
					},
				),
			})),
		);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

async function attachTaxonomies(tokenValue, entryId, revision, taxonomies) {
	const response = await fetch(
		`${SITE_URL.replace(/\/+$/, "")}/_emdash/api/content/recipes/${encodeURIComponent(entryId)}`,
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${tokenValue}`,
				"Content-Type": "application/json",
				Origin: new URL(SITE_URL).origin,
				"X-EmDash-Request": "1",
			},
			body: JSON.stringify({ _rev: revision, taxonomies }),
		},
	);
	if (!response.ok)
		throw new Error(
			`Taxonomy update failed (${response.status}): ${(await response.text()).slice(0, 300)}`,
		);
}

async function main() {
	const tokenValue = apply ? await token() : null;
	const client = apply
		? new EmDashClient({ baseUrl: SITE_URL, token: tokenValue })
		: null;
	const oldEntries = client ? await listAll(client, "recipe_pdfs") : [];
	if (!apply) {
		const localFiles = (await readdir(PDF_DIR)).filter((name) =>
			name.toLowerCase().endsWith(".pdf"),
		);
		console.log(
			`Would migrate ${localFiles.length} local PDFs from ${PDF_DIR}`,
		);
		return;
	}
	console.log(
		`${apply ? "Migrating" : "Would migrate"} ${oldEntries.length} recipe PDFs`,
	);
	await ensureFields(client);
	const existing = new Map(
		(await listAll(client, "recipes")).map((entry) => [entry.slug, entry]),
	);
	const tagMap = JSON.parse(
		await readFile("artifacts/recipe-pdf-tag-map.json", "utf8"),
	);
	const taxonomies = new Map(
		(tagMap.records ?? []).map((record) => [
			record.recipe_pdf_id,
			{ dietary: record.dietary ?? [], ingredient: record.ingredient ?? [] },
		]),
	);
	for (const oldEntry of oldEntries) {
		if (existing.has(oldEntry.slug)) {
			console.log(`Skip existing recipe: ${oldEntry.slug}`);
			continue;
		}
		const filename =
			oldEntry.data.source_filename || oldEntry.data.pdf?.filename;
		if (!filename) throw new Error(`Missing filename for ${oldEntry.slug}`);
		const pages = await renderPages(client, oldEntry, filename);
		const { pdf, preview_image, ...legacyData } = oldEntry.data;
		const created = await client.create("recipes", {
			slug: oldEntry.slug,
			data: {
				...legacyData,
				// These fields are still required by the legacy recipe schema. The
				// HelloFresh renderer does not display them.
				servings: legacyData.servings ?? 0.25,
				ingredients: legacyData.ingredients ?? [
					{
						_type: "block",
						style: "normal",
						children: [
							{ _type: "span", text: "See the scanned recipe pages." },
						],
					},
				],
				review_status: legacyData.review_status ?? "experimental",
				source_type: "hellofresh",
				featured_image: pages[0]?.image,
				source_pdf: pdf,
				document_pages: pages,
			},
		});
		await client.publish("recipes", created.id);
		const mapped = taxonomies.get(oldEntry.id);
		if (mapped && (mapped.dietary.length || mapped.ingredient.length)) {
			await attachTaxonomies(tokenValue, created.id, created._rev, mapped);
			await client.publish("recipes", created.id);
		}
		console.log(`Migrated: ${oldEntry.slug}`);
	}
	if (deleteOld) {
		for (const oldEntry of oldEntries)
			await client.delete("recipe_pdfs", oldEntry.id);
		console.log(
			"Soft-deleted legacy recipe_pdfs entries. Remove the collection after verification.",
		);
	}
}

await main();

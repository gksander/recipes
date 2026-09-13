#!/usr/bin/env node

/**
 * Imports the PDF archive into the recipes collection as HelloFresh recipes.
 *
 * Usage:
 *   npx emdash login --url https://recipes.gksander.com
 *   node scripts/import-recipe-pdfs.mjs --apply
 *   node scripts/import-recipe-pdfs.mjs --apply --limit 25
 *
 * The default is a read-only dry run. Re-running with --apply is safe: entries
 * already present by slug are skipped, and EmDash deduplicates identical uploads.
 */
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { extname, join } from "node:path";
import { promisify } from "node:util";
import { EmDashClient } from "emdash/client";

const ARCHIVE_DIRECTORY = "/Volumes/GKSSD/Recipes";
const COLLECTION = "recipes";
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const limitIndex = process.argv.indexOf("--limit");
const limit =
	limitIndex === -1 ? undefined : Number(process.argv[limitIndex + 1]);
const siteUrl = process.env.EMDASH_URL ?? "https://recipes.gksander.com";
let token = process.env.EMDASH_TOKEN;
const run = promisify(execFile);

if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
	throw new Error("--limit must be a positive whole number");
}

async function readCliToken() {
	if (token) return token;
	const configRoot = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
	try {
		const credentials = JSON.parse(
			await readFile(join(configRoot, "emdash", "auth.json"), "utf8"),
		);
		const saved = credentials[new URL(siteUrl).origin];
		if (saved?.accessToken && new Date(saved.expiresAt) > new Date())
			return saved.accessToken;
	} catch {
		// A missing local CLI login is handled with a useful error below.
	}
	throw new Error(
		"Log in first with `npx emdash login --url https://recipes.gksander.com`, or set EMDASH_TOKEN to an API token.",
	);
}

function titleize(recipeSlug) {
	const smallWords = new Set([
		"and",
		"or",
		"the",
		"of",
		"with",
		"in",
		"on",
		"to",
		"for",
	]);
	return recipeSlug
		.split("-")
		.filter(Boolean)
		.map((word, index) => {
			if (index > 0 && smallWords.has(word)) return word;
			return word.length <= 3
				? word.toUpperCase()
				: `${word[0].toUpperCase()}${word.slice(1)}`;
		})
		.join(" ");
}

/** Parses YYYY-MM-DD_recipe-name_tag-one,tag-two.pdf. */
export function parseRecipeFilename(filename) {
	const match = /^(\d{4}-\d{2}-\d{2})_(.+)_([^_]+)\.pdf$/i.exec(filename);
	if (!match) return null;
	const [, date, recipeSlug, tagPart] = match;
	const tags =
		tagPart === "no-tags"
			? []
			: [
					...new Set(
						tagPart
							.split(",")
							.map((tag) => tag.trim())
							.filter(Boolean),
					),
				];
	return {
		filename,
		date,
		recipeSlug,
		slug: `${date}-${recipeSlug}`,
		title: titleize(recipeSlug),
		tags,
	};
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

async function createPages(client, recipe) {
	const previewDirectory = await mkdtemp(join(tmpdir(), "recipe-preview-"));
	const outputPrefix = join(previewDirectory, "page");
	try {
		await run("pdftoppm", [
			"-jpeg",
			"-r",
			"144",
			join(ARCHIVE_DIRECTORY, recipe.filename),
			outputPrefix,
		]);
		const pageFiles = (await readdir(previewDirectory))
			.filter((filename) => /^page-\d+\.jpg$/.test(filename))
			.sort(
				(a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]),
			);
		return Promise.all(
			pageFiles.map(async (filename, index) => ({
				image: await client.mediaUpload(
					await readFile(join(previewDirectory, filename)),
					`${recipe.slug}-page-${index + 1}.jpg`,
					{
						alt: `${recipe.title}, page ${index + 1}`,
						contentType: "image/jpeg",
					},
				),
			})),
		);
	} finally {
		await rm(previewDirectory, { recursive: true, force: true });
	}
}

async function main() {
	const filenames = (await readdir(ARCHIVE_DIRECTORY))
		.filter((filename) => extname(filename).toLowerCase() === ".pdf")
		.sort();
	const parsed = filenames.map(parseRecipeFilename);
	const invalid = filenames.filter((_, index) => !parsed[index]);
	const recipes = parsed.filter(Boolean).slice(0, limit);

	console.log(
		`${apply ? "Importing" : "Dry run:"} ${recipes.length} of ${filenames.length} PDFs from ${ARCHIVE_DIRECTORY}`,
	);
	if (invalid.length)
		console.warn(
			`Skipping ${invalid.length} filenames that do not match the expected convention.`,
		);
	console.table(
		recipes.slice(0, 10).map(({ title, date, tags }) => ({
			title,
			date,
			tags: tags.join(", ") || "—",
		})),
	);
	if (!apply) return;

	const client = new EmDashClient({
		baseUrl: siteUrl,
		token: await readCliToken(),
	});
	const existing = new Map(
		(await listAll(client, COLLECTION)).map((entry) => [entry.slug, entry]),
	);
	for (const recipe of recipes) {
		const existingEntry = existing.get(recipe.slug);
		if (existingEntry) {
			if (existingEntry.data?.document_pages?.length) {
				console.log(`Skip existing with pages: ${recipe.slug}`);
				continue;
			}
			const pages = await createPages(client, recipe);
			const current = await client.get(COLLECTION, existingEntry.id);
			const updated = await client.update(COLLECTION, existingEntry.id, {
				_rev: current._rev,
				data: {
					source_type: "hellofresh",
					document_pages: pages,
					featured_image: pages[0]?.image,
				},
			});
			if (updated.draftRevisionId) await client.publish(COLLECTION, updated.id);
			console.log(`Added preview: ${recipe.title}`);
			continue;
		}

		const pages = await createPages(client, recipe);
		const media = await client.mediaUpload(
			await readFile(join(ARCHIVE_DIRECTORY, recipe.filename)),
			recipe.filename,
			{
				contentType: "application/pdf",
			},
		);
		const entry = await client.create(COLLECTION, {
			slug: recipe.slug,
			data: {
				title: recipe.title,
				servings: 0.25,
				ingredients: [
					{
						_type: "block",
						style: "normal",
						children: [
							{ _type: "span", text: "See the scanned recipe pages." },
						],
					},
				],
				review_status: "experimental",
				source_type: "hellofresh",
				featured_image: pages[0]?.image,
				source_pdf: media,
				document_pages: pages,
				source_filename: recipe.filename,
				recipe_date: `${recipe.date}T00:00:00.000Z`,
			},
		});
		await client.publish(COLLECTION, entry.id);
		console.log(`Imported: ${recipe.title}`);
	}
}

await main();

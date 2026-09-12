import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const input = JSON.parse(await readStdin());
const toolInput = input.tool_input ?? {};
const files = new Set();

for (const value of [toolInput.file_path, toolInput.path, toolInput.filename]) {
	if (typeof value === "string") files.add(value);
}

for (const value of [toolInput.files]) {
	if (Array.isArray(value)) {
		for (const file of value) {
			if (typeof file === "string") files.add(file);
		}
	}
}

const patch = [toolInput.command, toolInput.patch].find(
	(value) => typeof value === "string" && value.includes("*** "),
);

if (patch) {
	for (const match of patch.matchAll(
		/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm,
	)) {
		files.add(match[1]);
	}
}

const formatableFiles = [...files]
	.map((file) => resolve(input.cwd, file))
	.filter((file, index, all) => all.indexOf(file) === index)
	.filter((file) => existsSync(file))
	.filter((file) => /\.(astro|css|js|jsx|json|jsonc|mjs|ts|tsx)$/.test(file));

if (formatableFiles.length === 0) process.exit(0);

const result = spawnSync(
	"pnpm",
	["exec", "biome", "format", "--write", "--", ...formatableFiles],
	{ cwd: input.cwd, stdio: "inherit" },
);

process.exit(result.status ?? 1);

async function readStdin() {
	let data = "";
	for await (const chunk of process.stdin) data += chunk;
	return data;
}

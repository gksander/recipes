import type { APIRoute } from "astro";
import { decodeSlug, getEmDashEntry } from "emdash";
import { hasRecipeLibraryAccess } from "../../../utils/recipe-library-auth";

export const prerender = false;

export const GET: APIRoute = async ({ locals, params }) => {
	if (!hasRecipeLibraryAccess(locals.user)) {
		return new Response("Sign in to view this recipe PDF.", { status: 401 });
	}

	const slug = decodeSlug(params.slug);
	if (!slug) return new Response("Recipe PDF not found.", { status: 404 });

	const { entry } = await getEmDashEntry("recipe_pdfs", slug);
	const storageKey = entry?.data.pdf?.meta?.storageKey;
	if (!entry || typeof storageKey !== "string" || !locals.emdash?.storage) {
		return new Response("Recipe PDF not found.", { status: 404 });
	}

	const file = await locals.emdash.storage.download(storageKey);
	const filename = entry.data.pdf.filename || `${entry.id}.pdf`;

	return new Response(file.body, {
		headers: {
			"Content-Type": file.contentType || "application/pdf",
			"Content-Length": String(file.size),
			"Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
			"Cache-Control": "private, no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});
};

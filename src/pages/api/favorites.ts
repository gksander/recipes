import type { APIRoute } from "astro";

function error(message: string, status: number) {
	return Response.json(
		{ error: message },
		{ status, headers: { "Cache-Control": "private, no-store" } },
	);
}

export const POST: APIRoute = async ({ request, locals }) => {
	if (!locals.user) return error("Sign in required", 401);
	if (request.headers.get("X-EmDash-Request") !== "1")
		return error("CSRF rejected", 403);
	const emdash = locals.emdash;
	if (
		!emdash?.handleContentGet ||
		!emdash.handleContentUpdate ||
		!emdash.handleContentPublish
	)
		return error("EmDash is not initialized", 500);
	let body: { slug?: unknown; favorited?: unknown };
	try {
		body = await request.json();
	} catch {
		return error("Invalid JSON", 400);
	}
	if (typeof body.slug !== "string" || typeof body.favorited !== "boolean")
		return error("slug and favorited are required", 400);
	const current = await emdash.handleContentGet("recipes", body.slug);
	if (
		!current.success ||
		!current.data?.item ||
		current.data.item.status !== "published"
	)
		return error("Recipe not found", 404);
	const item = current.data.item;
	if (item.favorited === body.favorited)
		return Response.json({ favorited: body.favorited });
	const updated = await emdash.handleContentUpdate("recipes", item.id, {
		data: { favorited: body.favorited },
		_rev: current.data._rev,
	});
	if (!updated.success)
		return error(
			updated.error?.message ?? "Favorite update failed",
			updated.error?.code === "CONFLICT" ? 409 : 400,
		);
	const published = await emdash.handleContentPublish("recipes", item.id);
	if (!published.success)
		return error(published.error?.message ?? "Favorite publish failed", 409);
	return Response.json(
		{ favorited: body.favorited },
		{ headers: { "Cache-Control": "private, no-store" } },
	);
};

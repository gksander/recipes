import type { APIRoute } from "astro";

export const GET: APIRoute = ({ locals }) => {
	const user = locals.user
		? {
				name: locals.user.name,
				email: locals.user.email,
				avatarUrl: locals.user.avatarUrl,
				isAdmin: locals.user.role >= 50,
			}
		: null;
	return Response.json(
		{ user },
		{ headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
	);
};

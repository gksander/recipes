import type { APIRoute } from "astro";

/**
 * Returns only the profile fields needed by the public account control.
 * This endpoint must never enter a shared cache: its response varies by
 * the EmDash session cookie.
 */
export const GET: APIRoute = ({ locals }) => {
	const user = locals.user
		? {
				name: locals.user.name,
				email: locals.user.email,
				avatarUrl: locals.user.avatarUrl,
			}
		: null;

	return Response.json(
		{ user },
		{
			headers: {
				"Cache-Control": "private, no-store",
				Vary: "Cookie",
			},
		},
	);
};

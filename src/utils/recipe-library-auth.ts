/** EmDash assigns subscribers role level 10; higher roles inherit access. */
export const SUBSCRIBER_ROLE = 10;

export function hasRecipeLibraryAccess(
	user: App.Locals["user"] | undefined,
): boolean {
	return (user?.role ?? 0) >= SUBSCRIBER_ROLE;
}

export function recipeLibraryLoginUrl(requestUrl: URL): string {
	const returnTo = `${requestUrl.pathname}${requestUrl.search}`;
	return `/_emdash/admin/login?redirect=${encodeURIComponent(returnTo)}`;
}

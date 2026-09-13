export interface AuthUser {
	name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
	isAdmin?: boolean;
}

let cachedUser: AuthUser | null | undefined;
let request: Promise<AuthUser | null> | undefined;
const listeners = new Set<(user: AuthUser | null) => void>();

export function getCachedUser() {
	return cachedUser;
}

export function subscribeToAuth(listener: (user: AuthUser | null) => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function loadCurrentUser() {
	if (cachedUser !== undefined) return Promise.resolve(cachedUser);
	if (!request) {
		request = fetch("/api/me", { credentials: "same-origin" })
			.then(async (response) => {
				if (!response.ok) return null;
				const data = (await response.json()) as { user?: AuthUser | null };
				return data.user ?? null;
			})
			.catch(() => null)
			.then((user) => {
				cachedUser = user;
				request = undefined;
				return user;
			});
	}
	return request;
}

export function setCurrentUser(user: AuthUser | null) {
	cachedUser = user;
	request = undefined;
	for (const listener of listeners) listener(user);
}

import { useEffect, useState } from "react";
import { Menu as MenuIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
	name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
	isAdmin?: boolean;
}

interface Props {
	loginUrl: string;
}

let cachedUser: User | null | undefined;
let sessionRequest: Promise<User | null> | undefined;

function getSession() {
	if (cachedUser !== undefined) return Promise.resolve(cachedUser);
	if (!sessionRequest) {
		sessionRequest = fetch("/api/session", { credentials: "same-origin" })
			.then(async (response) => {
				if (!response.ok) return null;
				const data = (await response.json()) as { user?: User | null };
				return data.user ?? null;
			})
			.catch(() => null)
			.then((user) => {
				cachedUser = user;
				return user;
			});
	}
	return sessionRequest;
}

export default function AccountNav({ loginUrl }: Props) {
	const [user, setUser] = useState<User | null | undefined>(cachedUser);

	useEffect(() => {
		void getSession().then(setUser);
	}, []);

	async function signOut() {
		const response = await fetch("/_emdash/api/auth/logout?redirect=/", {
			method: "POST",
			headers: { "X-EmDash-Request": "1" },
		});

		if (response.ok) {
			cachedUser = null;
			window.location.assign("/");
		}
	}

	if (user === undefined) {
		return (
			<div className="flex items-center" aria-label="Loading account">
				<span className="inline-flex items-center gap-2">
					<span>Menu</span>
					<MenuIcon aria-hidden="true" size={20} />
				</span>
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label="Open navigation menu"
				>
					<span>Menu</span>
					<MenuIcon aria-hidden="true" size={20} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<a href="/">Recipes</a>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<a href="/menu">Menu</a>
					</DropdownMenuItem>
					{user.isAdmin && (
						<DropdownMenuItem asChild>
							<a href="/_emdash/admin">Admin</a>
						</DropdownMenuItem>
					)}
					<DropdownMenuSeparator />
					{user ? (
						<DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
					) : (
						<DropdownMenuItem asChild>
							<a href={loginUrl}>Sign in</a>
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

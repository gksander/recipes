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
import {
	getCachedUser,
	loadCurrentUser,
	setCurrentUser,
	subscribeToAuth,
	type AuthUser,
} from "../lib/auth-client";

interface Props {
	loginUrl: string;
}

export default function AccountNav({ loginUrl }: Props) {
	const [user, setUser] = useState<AuthUser | null | undefined>(
		getCachedUser(),
	);

	useEffect(() => {
		const unsubscribe = subscribeToAuth(setUser);
		void loadCurrentUser().then(setUser);
		return unsubscribe;
	}, []);

	async function signOut() {
		const response = await fetch("/_emdash/api/auth/logout?redirect=/", {
			method: "POST",
			headers: { "X-EmDash-Request": "1" },
		});

		if (response.ok) {
			setCurrentUser(null);
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
					<DropdownMenuItem asChild>
						<a href="/favorites">Favorites</a>
					</DropdownMenuItem>
					{user?.isAdmin && (
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

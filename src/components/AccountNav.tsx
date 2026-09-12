import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
	name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
}

interface Props {
	loginUrl: string;
}

let cachedUser: User | null | undefined;
let sessionRequest: Promise<User | null> | undefined;

function getInitials(name: string) {
	return name
		.split(/[\s@._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

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
		return <span className="block size-10" aria-label="Loading account" />;
	}

	if (!user) {
		return (
			<a className="font-bold no-underline" href={loginUrl}>
				Sign in
			</a>
		);
	}

	const profileName = user.name || user.email || "Account";
	const initials = getInitials(profileName);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label={`Open ${profileName} profile menu`}
				>
					<Avatar
						size="lg"
						className="bg-foreground text-xs font-extrabold text-background"
					>
						{user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
						<AvatarFallback className="bg-foreground text-background">
							{initials}
						</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuLabel>{profileName}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<a href="/_emdash/admin">Admin dashboard</a>
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

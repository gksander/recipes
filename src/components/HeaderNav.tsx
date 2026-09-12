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

interface SiteLogo {
	url?: string;
	alt?: string;
}

interface User {
	name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
}

interface Props {
	siteTitle: string;
	siteLogo?: SiteLogo | null;
	user?: User | null;
	loginUrl: string;
}

function getInitials(name: string) {
	return name
		.split(/[\s@._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

export default function HeaderNav({
	siteTitle,
	siteLogo,
	user,
	loginUrl,
}: Props) {
	const profileName = user?.name || user?.email || "Account";
	const initials = getInitials(profileName);

	async function signOut() {
		const response = await fetch("/_emdash/api/auth/logout?redirect=/", {
			method: "POST",
			headers: { "X-EmDash-Request": "1" },
		});

		if (response.ok) window.location.assign("/");
	}

	return (
		<nav
			className="relative mx-auto flex min-h-18 max-w-7xl items-center gap-4 px-4 sm:px-6"
			aria-label="Primary navigation"
		>
			<a
				className="shrink-0 text-xl font-black tracking-[-.06em] no-underline"
				href="/"
			>
				{siteLogo?.url ? (
					<img
						src={siteLogo.url}
						alt={siteLogo.alt || siteTitle}
						style={{
							height: 48,
							width: "auto",
							margin: "-8px 0",
							display: "block",
						}}
					/>
				) : (
					siteTitle
				)}
			</a>

			<div className="ml-auto flex items-center gap-5 font-bold sm:gap-8 md:contents">
				<div className="flex items-center gap-5 sm:gap-8 md:absolute md:left-1/2 md:-translate-x-1/2">
					<a className="no-underline hover:text-recipe-orange" href="/">
						Recipes
					</a>
					<a className="no-underline hover:text-recipe-orange" href="/menu">
						Menu
					</a>
				</div>

				<div className="shrink-0 md:absolute md:right-0">
					{user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									aria-label={`Open ${profileName} profile menu`}
								>
									<Avatar
										size="lg"
										className="bg-recipe-ink text-xs font-extrabold text-white"
									>
										{user.avatarUrl && (
											<AvatarImage src={user.avatarUrl} alt="" />
										)}
										<AvatarFallback className="bg-recipe-ink text-white">
											{initials}
										</AvatarFallback>
									</Avatar>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-48 rounded-2xl">
								<DropdownMenuGroup>
									<DropdownMenuLabel>{profileName}</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<a href="/_emdash/admin">Admin dashboard</a>
									</DropdownMenuItem>
									<DropdownMenuItem onSelect={signOut}>
										Sign out
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<a className="font-bold no-underline" href={loginUrl}>
							Sign in
						</a>
					)}
				</div>
			</div>
		</nav>
	);
}
